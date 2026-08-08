import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { StorageService } from "../storage/storage";
import { nextApplicationReference } from "../util/next-reference";

const SERVICE_TYPES = new Set([
  "visa", "air_ticket", "hotel", "tour", "hajj", "umrah", "transport",
  "student", "medical", "immigration", "insurance", "corporate", "work",
]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD = 15 * 1024 * 1024;

@Injectable()
export class CustomerPortalService {
  constructor(
    private prisma: PrismaService,
    private notes: NotificationsService,
    private storage: StorageService,
  ) {}

  private async audit(customerId: string, action: string, entityType: string, entityId: string | null, after?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action,
        entityType,
        entityId,
        after: after == null ? undefined : ({ customerId, ...(after as object) } as any),
      },
    });
  }

  async me(customerId: string, customerUserId: string) {
    const [customer, user] = await Promise.all([
      this.prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true, code: true, fullName: true, email: true, phone: true, whatsapp: true,
          nationality: true, dob: true, gender: true, address: true, type: true,
        },
      }),
      this.prisma.customerUser.findUnique({
        where: { id: customerUserId },
        select: { email: true, phone: true, emailVerifiedAt: true, mustChangePassword: true, lastLoginAt: true },
      }),
    ]);
    return { customer, user };
  }

  async updateProfile(customerId: string, dto: any) {
    const data: any = {};
    for (const k of ["fullName", "phone", "whatsapp", "nationality", "gender", "address"]) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]).trim();
    }
    if (dto.dob !== undefined) data.dob = dto.dob ? new Date(dto.dob) : null;
    const row = await this.prisma.customer.update({ where: { id: customerId }, data });
    await this.audit(customerId, "portal.customer.profile_update", "Customer", customerId, data);
    return row;
  }

  async dashboard(customerId: string) {
    const [apps, openApps, invoices, outstanding, payments, communications, notifications, supportOpen] =
      await Promise.all([
        this.prisma.application.findMany({
          where: { customerId, deletedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true, referenceNo: true, serviceType: true, title: true, status: true,
            currentStage: true, totalStages: true, updatedAt: true,
          },
        }),
        this.prisma.application.count({
          where: {
            customerId,
            deletedAt: null,
            completedAt: null,
            status: { notIn: ["cancelled", "rejected", "completed"] },
          },
        }),
        this.prisma.invoice.findMany({
          where: { customerId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, invoiceNo: true, status: true, total: true, currency: true, dueAt: true, issuedAt: true },
        }),
        this.prisma.invoice.findMany({
          where: {
            customerId,
            deletedAt: null,
            status: { in: ["issued", "partially_paid"] },
          },
          select: { id: true, total: true, payments: { where: { deletedAt: null }, select: { amount: true, kind: true } } },
        }),
        this.prisma.payment.findMany({
          where: { customerId, deletedAt: null },
          orderBy: { receivedAt: "desc" },
          take: 5,
          select: { id: true, amount: true, method: true, kind: true, receivedAt: true, reference: true },
        }),
        this.prisma.communication.findMany({
          where: { relatedType: "customer", relatedId: customerId },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, channel: true, direction: true, subject: true, body: true, summary: true, createdAt: true },
        }),
        this.prisma.notification.findMany({
          where: { relatedType: "Customer", relatedId: customerId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, subject: true, body: true, status: true, createdAt: true, relatedType: true },
        }),
        this.prisma.customerSupportRequest.count({ where: { customerId, status: { in: ["open", "in_progress"] } } }),
      ]);

    let outstandingPoisha = 0;
    for (const inv of outstanding) {
      const paid = inv.payments.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
      outstandingPoisha += Math.max(0, inv.total - paid);
    }

    return {
      applications: { active: openApps, recent: apps },
      invoices: { recent: invoices, outstandingPoisha },
      payments: { recent: payments },
      communications: { recent: communications },
      notifications,
      supportOpen,
    };
  }

  listApplications(customerId: string, q: { serviceType?: string; status?: string; take?: number }) {
    return this.prisma.application.findMany({
      where: {
        customerId,
        deletedAt: null,
        ...(q.serviceType ? { serviceType: q.serviceType as any } : {}),
        ...(q.status ? { status: q.status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(q.take || 50, 100),
      select: {
        id: true, referenceNo: true, serviceType: true, title: true, status: true,
        currentStage: true, totalStages: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async getApplication(customerId: string, id: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, customerId, deletedAt: null },
      select: {
        id: true, referenceNo: true, serviceType: true, title: true, status: true,
        currentStage: true, totalStages: true, createdAt: true, updatedAt: true,
        stages: { select: { stageNo: true, name: true, status: true }, orderBy: { stageNo: "asc" } },
        events: { select: { type: true, message: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!app) throw new NotFoundException("Application not found");
    return app;
  }

  async createApplication(customerId: string, dto: any) {
    let serviceType = String(dto?.serviceType || "visa").trim();
    if (!SERVICE_TYPES.has(serviceType)) throw new BadRequestException("Invalid serviceType");
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    const referenceNo = await nextApplicationReference(this.prisma);
    const title = String(dto?.title || `Customer ${serviceType} request`).trim().slice(0, 200);
    const app = await this.prisma.application.create({
      data: {
        branchId: customer.branchId,
        referenceNo,
        serviceType: serviceType as any,
        customerId,
        title,
        status: "draft",
        source: "customer_portal",
        createdBy: `customer:${customerId}`,
      },
    });
    await this.prisma.applicationEvent.create({
      data: {
        applicationId: app.id,
        type: "created",
        message: `Customer portal submitted ${serviceType}${dto?.message ? ": " + String(dto.message).slice(0, 400) : ""}`,
      },
    });
    await this.audit(customerId, "portal.customer.application_create", "Application", app.id, { referenceNo, serviceType });
    const staff = await this.prisma.user.findMany({
      where: { status: "active", deletedAt: null, role: { name: { in: ["super_admin", "office_incharge", "visa_consultant"] } } },
      select: { id: true },
      take: 20,
    });
    await this.notes.enqueueMany(
      staff.map((u) => ({ channel: "inapp", recipient: u.id })),
      {
        subject: `Portal application ${referenceNo}`,
        body: `${customer.fullName} submitted ${serviceType}`,
        relatedType: "Application",
        relatedId: app.id,
      },
    );
    return { ok: true, id: app.id, referenceNo };
  }

  async listDocuments(customerId: string) {
    const apps = await this.prisma.application.findMany({
      where: { customerId, deletedAt: null },
      select: { id: true },
    });
    const appIds = apps.map((a) => a.id);
    return this.prisma.document.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerType: "customer", ownerId: customerId },
          ...(appIds.length ? [{ ownerType: "application", ownerId: { in: appIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, ownerType: true, ownerId: true, category: true, fileName: true,
        status: true, mimeType: true, sizeBytes: true, createdAt: true, isPassport: true,
      },
    });
  }

  async documentVersions(customerId: string, documentId: string) {
    await this.assertDocAccess(customerId, documentId);
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: "desc" },
      select: { id: true, version: true, fileName: true, mimeType: true, sizeBytes: true, uploadedBy: true, createdAt: true },
    });
  }

  private async assertDocAccess(customerId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, deletedAt: null } });
    if (!doc) throw new NotFoundException("Document not found");
    if (doc.ownerType === "customer" && doc.ownerId === customerId) return doc;
    if (doc.ownerType === "application") {
      const app = await this.prisma.application.findFirst({ where: { id: doc.ownerId, customerId, deletedAt: null } });
      if (app) return doc;
    }
    throw new ForbiddenException("Document access denied");
  }

  async uploadDocument(
    customerId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    body: any,
  ) {
    if (!file) throw new BadRequestException("file is required");
    if (!ALLOWED_MIME.has(file.mimetype)) throw new BadRequestException("Only JPG/PNG/WEBP/PDF allowed");
    if (file.size > MAX_UPLOAD) throw new BadRequestException("File too large (max 15MB)");
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException("Customer not found");

    let ownerType = String(body?.ownerType || "customer");
    let ownerId = customerId;
    if (body?.applicationId) {
      const app = await this.prisma.application.findFirst({
        where: { id: String(body.applicationId), customerId, deletedAt: null },
      });
      if (!app) throw new BadRequestException("Invalid applicationId");
      ownerType = "application";
      ownerId = app.id;
    }
    const category = String(body?.category || "other").trim().slice(0, 40) || "other";
    const existing = await this.prisma.document.findFirst({
      where: { ownerType, ownerId, category, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const id = randomUUID();
    const ext = (file.mimetype.split("/")[1] || "bin").replace("jpeg", "jpg");
    const storageKey = `portal/${customerId}/${id}.${ext}`;
    await this.storage.put(storageKey, file.buffer);

    if (existing) {
      const maxVer = await this.prisma.documentVersion.aggregate({
        where: { documentId: existing.id },
        _max: { version: true },
      });
      let base = maxVer._max.version || 0;
      if (base === 0) {
        await this.prisma.documentVersion.create({
          data: {
            documentId: existing.id,
            version: 1,
            fileName: existing.fileName,
            storageKey: existing.storageKey,
            mimeType: existing.mimeType,
            sizeBytes: existing.sizeBytes,
            uploadedBy: existing.uploadedBy,
          },
        });
        base = 1;
      }
      const nextVer = base + 1;
      await this.prisma.documentVersion.create({
        data: {
          documentId: existing.id,
          version: nextVer,
          fileName: file.originalname || `${id}.${ext}`,
          storageKey,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedBy: `customer:${customerId}`,
        },
      });
      const row = await this.prisma.document.update({
        where: { id: existing.id },
        data: {
          fileName: file.originalname || `${id}.${ext}`,
          storageKey,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          status: "pending",
          uploadedBy: `customer:${customerId}`,
        },
      });
      await this.audit(customerId, "portal.customer.document_upload", "Document", row.id, { category, version: nextVer });
      return { id: row.id, category, fileName: row.fileName, status: row.status, version: nextVer };
    }

    const doc = await this.prisma.document.create({
      data: {
        branchId: customer.branchId,
        ownerType,
        ownerId,
        category,
        isPassport: category === "passport",
        fileName: file.originalname || `${id}.${ext}`,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: `customer:${customerId}`,
        status: "pending",
      },
    });
    await this.prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        version: 1,
        fileName: doc.fileName,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: `customer:${customerId}`,
      },
    });
    if (ownerType === "application") {
      await this.prisma.applicationDocument.create({
        data: { applicationId: ownerId, documentId: doc.id, docType: category, status: "pending" },
      }).catch(() => null);
    }
    await this.audit(customerId, "portal.customer.document_upload", "Document", doc.id, { category });
    return { id: doc.id, category, fileName: doc.fileName, status: doc.status, version: 1 };
  }

  async downloadDocument(customerId: string, documentId: string) {
    const doc = await this.assertDocAccess(customerId, documentId);
    const buf = await this.storage.get(doc.storageKey);
    return { buf, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  async finance(customerId: string) {
    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, invoiceNo: true, status: true, subtotal: true, discount: true, tax: true,
          total: true, currency: true, issuedAt: true, dueAt: true, applicationId: true,
          payments: { where: { deletedAt: null }, select: { id: true, amount: true, kind: true, method: true, receivedAt: true, reference: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { receivedAt: "desc" },
        take: 100,
        select: {
          id: true, amount: true, kind: true, method: true, reference: true, receivedAt: true,
          invoiceId: true, note: true,
        },
      }),
    ]);
    let outstandingPoisha = 0;
    const receipts = payments.filter((p) => p.kind === "payment");
    for (const inv of invoices) {
      if (!["issued", "partially_paid", "paid"].includes(String(inv.status))) continue;
      const paid = inv.payments.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
      if (String(inv.status) !== "paid") outstandingPoisha += Math.max(0, inv.total - paid);
    }
    return { invoices, payments, receipts, outstandingPoisha };
  }

  async communications(customerId: string) {
    const [timeline, support] = await Promise.all([
      this.prisma.communication.findMany({
        where: { relatedType: "customer", relatedId: customerId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, channel: true, direction: true, subject: true, body: true, summary: true,
          status: true, createdAt: true, relatedType: true, relatedId: true,
        },
      }),
      this.prisma.customerSupportRequest.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    return { messages: timeline, support };
  }

  async createSupport(customerId: string, dto: any) {
    const subject = String(dto?.subject || "").trim().slice(0, 160);
    const body = String(dto?.body || "").trim().slice(0, 4000);
    if (subject.length < 3) throw new BadRequestException("subject required");
    if (body.length < 3) throw new BadRequestException("body required");
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    const row = await this.prisma.customerSupportRequest.create({
      data: {
        customerId,
        subject,
        body,
        priority: dto?.priority === "high" ? "high" : "normal",
        applicationId: dto?.applicationId || null,
      },
    });
    await this.prisma.communication.create({
      data: {
        branchId: customer?.branchId || null,
        relatedType: "customer",
        relatedId: customerId,
        partyKind: "customer",
        partyLabel: customer?.fullName || customerId,
        channel: "note",
        direction: "inbound",
        summary: subject,
        subject,
        body,
        status: "logged",
        byUser: `customer:${customerId}`,
      },
    });
    const staff = await this.prisma.user.findMany({
      where: { status: "active", deletedAt: null, role: { name: { in: ["super_admin", "office_incharge", "marketing_manager"] } } },
      select: { id: true },
      take: 20,
    });
    await this.notes.enqueueMany(
      staff.map((u) => ({ channel: "inapp", recipient: u.id })),
      { subject: `Support: ${subject}`, body, relatedType: "CustomerSupportRequest", relatedId: row.id },
    );
    await this.audit(customerId, "portal.customer.support_create", "CustomerSupportRequest", row.id, { subject });
    return row;
  }

  // ---- Profile sub-resources ----
  listPassports(customerId: string) {
    return this.prisma.passport.findMany({
      where: { customerId },
      orderBy: { expiryDate: "desc" },
      select: {
        id: true, passportNo: true, issuingCountry: true, issueDate: true,
        expiryDate: true, isPrimary: true,
      },
    });
  }

  async upsertPassport(customerId: string, dto: any) {
    if (!dto?.passportNo?.trim()) throw new BadRequestException("passportNo required");
    if (dto.id) {
      const existing = await this.prisma.passport.findFirst({ where: { id: dto.id, customerId } });
      if (!existing) throw new NotFoundException("Passport not found");
      return this.prisma.passport.update({
        where: { id: dto.id },
        data: {
          passportNo: String(dto.passportNo).trim(),
          issuingCountry: dto.issuingCountry || null,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          isPrimary: !!dto.isPrimary,
        },
      });
    }
    return this.prisma.passport.create({
      data: {
        customerId,
        passportNo: String(dto.passportNo).trim(),
        issuingCountry: dto.issuingCountry || null,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        isPrimary: !!dto.isPrimary,
      },
    });
  }

  listFamily(customerId: string) {
    return this.prisma.customerFamilyMember.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async addFamily(customerId: string, dto: any) {
    if (!dto?.fullName?.trim()) throw new BadRequestException("fullName required");
    return this.prisma.customerFamilyMember.create({
      data: {
        customerId,
        fullName: String(dto.fullName).trim(),
        relationship: dto.relationship || null,
        dob: dto.dob ? new Date(dto.dob) : null,
        passportNo: dto.passportNo || null,
        nationality: dto.nationality || null,
        phone: dto.phone || null,
      },
    });
  }

  listTravellers(customerId: string) {
    return this.prisma.customerSavedTraveller.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async addTraveller(customerId: string, dto: any) {
    if (!dto?.fullName?.trim()) throw new BadRequestException("fullName required");
    return this.prisma.customerSavedTraveller.create({
      data: {
        customerId,
        fullName: String(dto.fullName).trim(),
        passportNo: dto.passportNo || null,
        nationality: dto.nationality || null,
        dob: dto.dob ? new Date(dto.dob) : null,
        phone: dto.phone || null,
        email: dto.email || null,
        notes: dto.notes || null,
      },
    });
  }

  listEmergency(customerId: string) {
    return this.prisma.customerEmergencyContact.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async addEmergency(customerId: string, dto: any) {
    if (!dto?.fullName?.trim()) throw new BadRequestException("fullName required");
    if (!dto?.phone?.trim()) throw new BadRequestException("phone required");
    return this.prisma.customerEmergencyContact.create({
      data: {
        customerId,
        fullName: String(dto.fullName).trim(),
        relationship: dto.relationship || null,
        phone: String(dto.phone).trim(),
        email: dto.email || null,
        address: dto.address || null,
      },
    });
  }

  async reports(customerId: string) {
    const [bookings, payments, documents] = await Promise.all([
      this.prisma.application.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true, referenceNo: true, serviceType: true, title: true, status: true, createdAt: true, completedAt: true,
        },
      }),
      this.prisma.payment.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { receivedAt: "desc" },
        take: 200,
        select: { id: true, amount: true, kind: true, method: true, reference: true, receivedAt: true, invoiceId: true },
      }),
      this.listDocuments(customerId),
    ]);
    return { bookingHistory: bookings, paymentHistory: payments, downloadableDocuments: documents };
  }
}
