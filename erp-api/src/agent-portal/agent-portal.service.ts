import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { StorageService } from "../storage/storage";
import { WorkflowService } from "../workflow/workflow.service";
import { nextApplicationReference } from "../util/next-reference";

const SERVICE_TYPES = new Set([
  "visa", "air_ticket", "hotel", "tour", "hajj", "umrah", "transport",
  "student", "medical", "immigration", "insurance", "corporate", "work",
]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD = 15 * 1024 * 1024;

@Injectable()
export class AgentPortalService {
  constructor(
    private prisma: PrismaService,
    private notes: NotificationsService,
    private storage: StorageService,
    private workflow: WorkflowService,
  ) {}

  private async audit(agentId: string, action: string, entityType: string, entityId: string | null, after?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action,
        entityType,
        entityId,
        after: after == null ? undefined : ({ agentId, ...(after as object) } as any),
      },
    });
  }

  private async agentBranchId(agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException("Agent not found");
    if (agent.branchId) return agent.branchId;
    const branch =
      (await this.prisma.branch.findFirst({ where: { type: "corporate" } })) ??
      (await this.prisma.branch.findFirst());
    if (!branch) throw new BadRequestException("System not ready");
    return branch.id;
  }

  /**
   * Customer IDs this agent may access. FK ownership (primary/secondary agent)
   * is authoritative (V6 Wave 1); the legacy heuristic (applications + createdBy
   * string) is unioned in as a dual-read fallback for any not-yet-backfilled row.
   */
  private async ownedCustomerIds(agentId: string): Promise<string[]> {
    const owned = await this.prisma.customer.findMany({
      where: { deletedAt: null, OR: [{ primaryAgentId: agentId }, { secondaryAgentId: agentId }] },
      select: { id: true },
    });
    const apps = await this.prisma.application.findMany({
      where: { agentId, deletedAt: null },
      select: { customerId: true },
      distinct: ["customerId"],
    });
    const created = await this.prisma.customer.findMany({
      where: { createdBy: `agent:${agentId}`, deletedAt: null },
      select: { id: true },
    });
    return [...new Set([...owned.map((c) => c.id), ...apps.map((a) => a.customerId), ...created.map((c) => c.id)])];
  }

  private async assertCustomer(agentId: string, customerId: string) {
    const ids = await this.ownedCustomerIds(agentId);
    // NotFound (not Forbidden) — avoid confirming foreign customer IDs exist
    if (!ids.includes(customerId)) throw new NotFoundException("Customer not found");
  }

  async me(agentId: string, agentUserId: string) {
    const [agent, user, branch] = await Promise.all([
      this.prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true, code: true, name: true, email: true, phone: true,
          branchId: true, commissionRateBps: true, walletBalance: true, status: true,
        },
      }),
      this.prisma.agentUser.findUnique({
        where: { id: agentUserId },
        select: { email: true, mustChangePassword: true, lastLoginAt: true },
      }),
      this.prisma.agent.findUnique({ where: { id: agentId } }).then(async (a) => {
        if (!a?.branchId) return null;
        return this.prisma.branch.findUnique({
          where: { id: a.branchId },
          select: { id: true, name: true, type: true },
        });
      }),
    ]);
    return { agent, user, branch };
  }

  async dashboard(agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    const customerIds = await this.ownedCustomerIds(agentId);
    const [total, open, pendingQuotes, invoices, commAgg, salesMonth, notifications, supportOpen] =
      await Promise.all([
        this.prisma.application.count({ where: { agentId, deletedAt: null } }),
        this.prisma.application.count({
          where: {
            agentId,
            deletedAt: null,
            completedAt: null,
            status: { notIn: ["cancelled", "rejected", "completed"] },
          },
        }),
        customerIds.length
          ? this.prisma.quotation.count({
              where: {
                customerId: { in: customerIds },
                status: { in: ["draft", "pending_approval", "approved", "sent"] },
              },
            })
          : Promise.resolve(0),
        customerIds.length
          ? this.prisma.invoice.findMany({
              where: {
                customerId: { in: customerIds },
                deletedAt: null,
                status: { in: ["issued", "partially_paid"] },
              },
              select: {
                id: true,
                total: true,
                payments: { where: { deletedAt: null }, select: { amount: true, kind: true } },
              },
            })
          : Promise.resolve([]),
        this.prisma.commission.groupBy({
          by: ["status"],
          where: { agentId },
          _sum: { amount: true },
          orderBy: { status: "asc" },
        }),
        this.prisma.application.count({
          where: {
            agentId,
            deletedAt: null,
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        }),
        this.prisma.notification.findMany({
          where: { relatedType: "Agent", relatedId: agentId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, subject: true, body: true, status: true, createdAt: true },
        }),
        this.prisma.agentSupportRequest.count({
          where: { agentId, status: { in: ["open", "in_progress"] } },
        }),
      ]);

    let outstandingPoisha = 0;
    for (const inv of invoices) {
      const paid = inv.payments.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
      outstandingPoisha += Math.max(0, inv.total - paid);
    }
    const commissions = Object.fromEntries(commAgg.map((c) => [c.status, c._sum.amount || 0]));

    return {
      agent: {
        name: agent?.name,
        code: agent?.code,
        branchId: agent?.branchId,
        commissionRateBps: agent?.commissionRateBps ?? 0,
      },
      bookings: { total, open },
      pendingQuotations: pendingQuotes,
      walletBalance: agent?.walletBalance ?? 0,
      outstandingPoisha,
      commissions,
      salesSummary: { bookingsThisMonth: salesMonth },
      notifications,
      supportOpen,
    };
  }

  // ---- Bookings (cases) ----
  cases(agentId: string, q: { status?: string; serviceType?: string; take?: number }) {
    return this.prisma.application.findMany({
      where: {
        agentId,
        deletedAt: null,
        ...(q.status ? { status: q.status as any } : {}),
        ...(q.serviceType ? { serviceType: q.serviceType as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(q.take || 50, 100),
      select: {
        id: true, referenceNo: true, serviceType: true, title: true, status: true,
        currentStage: true, totalStages: true, createdAt: true, branchId: true,
        customer: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  async caseGet(agentId: string, id: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, agentId, deletedAt: null },
      select: {
        id: true, referenceNo: true, serviceType: true, title: true, status: true,
        currentStage: true, totalStages: true, createdAt: true, branchId: true, agentId: true,
        source: true,
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        stages: { select: { stageNo: true, name: true, status: true }, orderBy: { stageNo: "asc" } },
        events: { select: { type: true, message: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!app) throw new NotFoundException("Case not found");
    return app;
  }

  async createCase(agentId: string, dto: any) {
    const fullName = String(dto?.customerName || "").trim().slice(0, 100);
    const phone = String(dto?.customerPhone || "").trim().slice(0, 20);
    let serviceType = String(dto?.serviceType || "visa").trim();
    if (!SERVICE_TYPES.has(serviceType)) throw new BadRequestException("Invalid serviceType");
    if (fullName.length < 2) throw new BadRequestException("customerName is required");
    if (phone.length < 6) throw new BadRequestException("A valid customerPhone is required");

    // Reject client-supplied customerId — ownership is derived server-side only
    if (dto?.customerId) throw new BadRequestException("customerId is not accepted");

    const branchId = await this.agentBranchId(agentId);
    let customer = await this.prisma.customer.findFirst({ where: { phone, deletedAt: null } });
    if (customer) {
      // Do not attach bookings to another party's customer (cross-agent invoice/data leak)
      const owned = await this.ownedCustomerIds(agentId);
      if (!owned.includes(customer.id)) {
        throw new BadRequestException("Customer phone already exists");
      }
    } else {
      const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
      customer = await this.prisma.customer.create({
        data: {
          branchId,
          code,
          fullName,
          phone,
          email: dto?.customerEmail ? String(dto.customerEmail).trim() : undefined,
          source: "agent",
          createdBy: `agent:${agentId}`,
        },
      });
    }
    const referenceNo = await nextApplicationReference(this.prisma);
    const title = String(dto?.title || `Agent booking — ${serviceType}`).trim().slice(0, 200);
    const app = await this.prisma.application.create({
      data: {
        branchId,
        referenceNo,
        serviceType: serviceType as any,
        customerId: customer.id,
        title,
        status: "draft",
        source: "agent_portal",
        agentId,
        createdBy: `agent:${agentId}`,
      },
    });
    // Same spine as staff create — agent bookings must get workflow stages so admin can advance/approve.
    const totalStages = await this.workflow.instantiateStages(app.id, serviceType);
    if (totalStages > 0) {
      await this.prisma.application.update({
        where: { id: app.id },
        data: { totalStages, currentStage: 1 },
      });
    }
    await this.prisma.applicationEvent.create({
      data: {
        applicationId: app.id,
        type: "created",
        message: `Agent submitted ${serviceType} for ${fullName} (${phone})${dto?.message ? ": " + String(dto.message).slice(0, 500) : ""}`,
      },
    });
    await this.audit(agentId, "portal.agent.booking_create", "Application", app.id, { referenceNo, serviceType });
    return { ok: true, reference: referenceNo, id: app.id, customerId: customer.id };
  }

  // ---- Customers ----
  async listCustomers(agentId: string) {
    const ids = await this.ownedCustomerIds(agentId);
    if (!ids.length) return [];
    return this.prisma.customer.findMany({
      where: { id: { in: ids }, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true, code: true, fullName: true, phone: true, email: true,
        nationality: true, branchId: true, createdAt: true,
      },
    });
  }

  async getCustomer(agentId: string, customerId: string) {
    await this.assertCustomer(agentId, customerId);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: {
        id: true, code: true, fullName: true, phone: true, email: true, whatsapp: true,
        nationality: true, dob: true, gender: true, address: true, branchId: true,
      },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    const [passports, travellers, apps] = await Promise.all([
      this.prisma.passport.findMany({
        where: { customerId },
        select: { id: true, passportNo: true, issuingCountry: true, issueDate: true, expiryDate: true, isPrimary: true },
      }),
      this.prisma.customerSavedTraveller.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, fullName: true, passportNo: true, nationality: true, dob: true, phone: true, email: true,
        },
      }),
      this.prisma.application.findMany({
        where: { customerId, agentId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, referenceNo: true, serviceType: true, status: true, createdAt: true },
      }),
    ]);
    return { customer, passports, travellers, bookings: apps };
  }

  async createCustomer(agentId: string, dto: any) {
    const fullName = String(dto?.fullName || "").trim().slice(0, 100);
    const phone = String(dto?.phone || "").trim().slice(0, 20);
    if (fullName.length < 2) throw new BadRequestException("fullName required");
    if (phone.length < 6) throw new BadRequestException("phone required");
    const branchId = await this.agentBranchId(agentId);
    const existing = await this.prisma.customer.findFirst({ where: { phone, deletedAt: null } });
    if (existing) {
      // claim visibility by creating a draft link booking? just return if already owned
      const ids = await this.ownedCustomerIds(agentId);
      if (ids.includes(existing.id)) return existing;
      throw new BadRequestException("Customer phone already exists");
    }
    const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
    const row = await this.prisma.customer.create({
      data: {
        branchId,
        code,
        fullName,
        phone,
        email: dto?.email ? String(dto.email).trim() : undefined,
        nationality: dto?.nationality || undefined,
        source: "agent",
        createdBy: `agent:${agentId}`,
        primaryAgentId: agentId, // V6 Wave 1: the creating agent owns the customer
      },
    });
    await this.prisma.customerAssignment.create({ data: { customerId: row.id, toAgentId: agentId, role: "primary", action: "assign", reason: "agent portal create", actorAgentId: agentId } });
    await this.audit(agentId, "portal.agent.customer_create", "Customer", row.id, { phone });
    return row;
  }

  async upsertPassport(agentId: string, customerId: string, dto: any) {
    await this.assertCustomer(agentId, customerId);
    if (!dto?.passportNo?.trim()) throw new BadRequestException("passportNo required");
    if (dto.id) {
      const existing = await this.prisma.passport.findFirst({ where: { id: dto.id, customerId } });
      if (!existing) throw new NotFoundException("Passport not found");
      const updated = await this.prisma.passport.update({
        where: { id: dto.id },
        data: {
          passportNo: String(dto.passportNo).trim(),
          issuingCountry: dto.issuingCountry || null,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          isPrimary: !!dto.isPrimary,
        },
      });
      await this.audit(agentId, "portal.agent.passport_upsert", "Passport", updated.id, { customerId });
      return updated;
    }
    const created = await this.prisma.passport.create({
      data: {
        customerId,
        passportNo: String(dto.passportNo).trim(),
        issuingCountry: dto.issuingCountry || null,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        isPrimary: !!dto.isPrimary,
      },
    });
    await this.audit(agentId, "portal.agent.passport_upsert", "Passport", created.id, { customerId });
    return created;
  }

  async addTraveller(agentId: string, customerId: string, dto: any) {
    await this.assertCustomer(agentId, customerId);
    const fullName = String(dto?.fullName || "").trim().slice(0, 100);
    if (fullName.length < 2) throw new BadRequestException("fullName required");
    const row = await this.prisma.customerSavedTraveller.create({
      data: {
        customerId,
        fullName,
        passportNo: dto?.passportNo ? String(dto.passportNo).trim() : undefined,
        nationality: dto?.nationality || undefined,
        dob: dto?.dob ? new Date(dto.dob) : undefined,
        phone: dto?.phone ? String(dto.phone).trim() : undefined,
        email: dto?.email ? String(dto.email).trim() : undefined,
        notes: dto?.notes ? String(dto.notes).trim().slice(0, 500) : undefined,
      },
    });
    await this.audit(agentId, "portal.agent.traveller_create", "CustomerSavedTraveller", row.id, { customerId });
    return row;
  }

  // ---- Finance ----
  async commissions(agentId: string) {
    return this.prisma.commission.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, amount: true, status: true, note: true, applicationId: true,
        invoiceId: true, createdAt: true, approvedAt: true, paidAt: true,
      },
    });
  }

  async wallet(agentId: string) {
    const [agent, transactions] = await Promise.all([
      this.prisma.agent.findUnique({ where: { id: agentId }, select: { walletBalance: true } }),
      this.prisma.agentWalletTxn.findMany({
        where: { agentId },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, amount: true, type: true, memo: true, createdAt: true },
      }),
    ]);
    return { balance: agent?.walletBalance ?? 0, transactions };
  }

  async finance(agentId: string) {
    const customerIds = await this.ownedCustomerIds(agentId);
    const [wallet, commissions, invoices, payments] = await Promise.all([
      this.wallet(agentId),
      this.commissions(agentId),
      customerIds.length
        ? this.prisma.invoice.findMany({
            where: { customerId: { in: customerIds }, deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 100,
            select: {
              id: true, invoiceNo: true, status: true, total: true, currency: true,
              customerId: true, issuedAt: true, dueAt: true,
              payments: { where: { deletedAt: null }, select: { amount: true, kind: true } },
            },
          })
        : Promise.resolve([]),
      customerIds.length
        ? this.prisma.payment.findMany({
            where: { customerId: { in: customerIds }, deletedAt: null },
            orderBy: { receivedAt: "desc" },
            take: 100,
            select: {
              id: true, amount: true, kind: true, method: true, reference: true,
              receivedAt: true, customerId: true, invoiceId: true,
            },
          })
        : Promise.resolve([]),
    ]);
    let outstandingPoisha = 0;
    for (const inv of invoices) {
      if (!["issued", "partially_paid"].includes(String(inv.status))) continue;
      const paid = inv.payments.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
      outstandingPoisha += Math.max(0, inv.total - paid);
    }
    return {
      wallet,
      commissions,
      invoices,
      payments,
      outstandingPoisha,
      statement: {
        walletBalance: wallet.balance,
        commissionPending: commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0),
        commissionPaid: commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0),
        outstandingPoisha,
      },
    };
  }

  // ---- Documents ----
  async listDocuments(agentId: string) {
    const apps = await this.prisma.application.findMany({
      where: { agentId, deletedAt: null },
      select: { id: true },
    });
    const appIds = apps.map((a) => a.id);
    if (!appIds.length) return [];
    return this.prisma.document.findMany({
      where: { deletedAt: null, ownerType: "application", ownerId: { in: appIds } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, ownerId: true, category: true, fileName: true, status: true,
        mimeType: true, sizeBytes: true, createdAt: true,
      },
    });
  }

  private async assertDocAccess(agentId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, deletedAt: null } });
    if (!doc) throw new NotFoundException("Document not found");
    if (doc.ownerType === "application") {
      const app = await this.prisma.application.findFirst({
        where: { id: doc.ownerId, agentId, deletedAt: null },
      });
      if (app) return doc;
    }
    // Same status as missing — do not reveal foreign document IDs
    throw new NotFoundException("Document not found");
  }

  async documentVersions(agentId: string, documentId: string) {
    await this.assertDocAccess(agentId, documentId);
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: "desc" },
      select: { id: true, version: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    });
  }

  async uploadDocument(
    agentId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    body: any,
  ) {
    if (!file) throw new BadRequestException("file is required");
    if (!ALLOWED_MIME.has(file.mimetype)) throw new BadRequestException("Only JPG/PNG/WEBP/PDF allowed");
    if (file.size > MAX_UPLOAD) throw new BadRequestException("File too large (max 15MB)");
    const applicationId = String(body?.applicationId || "");
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, agentId, deletedAt: null },
    });
    if (!app) throw new BadRequestException("Valid applicationId required");
    const category = String(body?.category || "other").trim().slice(0, 40) || "other";
    const id = randomUUID();
    const ext = (file.mimetype.split("/")[1] || "bin").replace("jpeg", "jpg");
    const storageKey = `portal/agent/${agentId}/${id}.${ext}`;
    await this.storage.put(storageKey, file.buffer);

    const existing = await this.prisma.document.findFirst({
      where: { ownerType: "application", ownerId: applicationId, category, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

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
          uploadedBy: `agent:${agentId}`,
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
          uploadedBy: `agent:${agentId}`,
        },
      });
      await this.audit(agentId, "portal.agent.document_upload", "Document", row.id, { category, version: nextVer });
      return { id: row.id, category, fileName: row.fileName, status: row.status, version: nextVer };
    }

    const doc = await this.prisma.document.create({
      data: {
        branchId: app.branchId,
        ownerType: "application",
        ownerId: applicationId,
        category,
        isPassport: category === "passport",
        fileName: file.originalname || `${id}.${ext}`,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: `agent:${agentId}`,
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
        uploadedBy: `agent:${agentId}`,
      },
    });
    await this.prisma.applicationDocument
      .create({ data: { applicationId, documentId: doc.id, docType: category, status: "pending" } })
      .catch(() => null);
    await this.audit(agentId, "portal.agent.document_upload", "Document", doc.id, { category });
    return { id: doc.id, category, fileName: doc.fileName, status: doc.status, version: 1 };
  }

  async downloadDocument(agentId: string, documentId: string) {
    const doc = await this.assertDocAccess(agentId, documentId);
    const buf = await this.storage.get(doc.storageKey);
    await this.audit(agentId, "portal.agent.document_download", "Document", doc.id, {
      fileName: doc.fileName,
      ownerId: doc.ownerId,
    });
    return { buf, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  // ---- Communications ----
  async communications(agentId: string) {
    const [timeline, support] = await Promise.all([
      this.prisma.communication.findMany({
        where: { relatedType: "agent", relatedId: agentId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, channel: true, direction: true, subject: true, body: true, summary: true,
          status: true, createdAt: true,
        },
      }),
      this.prisma.agentSupportRequest.findMany({
        where: { agentId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    return { messages: timeline, support };
  }

  async createSupport(agentId: string, dto: any) {
    const subject = String(dto?.subject || "").trim().slice(0, 160);
    const body = String(dto?.body || "").trim().slice(0, 4000);
    if (subject.length < 3) throw new BadRequestException("subject required");
    if (body.length < 3) throw new BadRequestException("body required");
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    const row = await this.prisma.agentSupportRequest.create({
      data: {
        agentId,
        subject,
        body,
        priority: dto?.priority === "high" ? "high" : "normal",
        applicationId: dto?.applicationId || null,
      },
    });
    await this.prisma.communication.create({
      data: {
        branchId: agent?.branchId || null,
        relatedType: "agent",
        relatedId: agentId,
        partyKind: "agent",
        partyLabel: agent?.name || agentId,
        channel: "note",
        direction: "inbound",
        summary: subject,
        subject,
        body,
        status: "logged",
        byUser: `agent:${agentId}`,
      },
    });
    const staff = await this.prisma.user.findMany({
      where: {
        status: "active",
        deletedAt: null,
        role: { name: { in: ["super_admin", "general_manager", "office_incharge"] } },
      },
      select: { id: true },
      take: 20,
    });
    await this.notes.enqueueMany(
      staff.map((u) => ({ channel: "inapp", recipient: u.id })),
      { subject: `Agent support: ${subject}`, body, relatedType: "AgentSupportRequest", relatedId: row.id },
    );
    await this.audit(agentId, "portal.agent.support_create", "AgentSupportRequest", row.id, { subject });
    return row;
  }

  // ---- Reports ----
  async reports(agentId: string) {
    const customerIds = await this.ownedCustomerIds(agentId);
    const [bookings, commissions, finance] = await Promise.all([
      this.prisma.application.findMany({
        where: { agentId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true, referenceNo: true, serviceType: true, status: true, createdAt: true, completedAt: true,
          customer: { select: { fullName: true } },
        },
      }),
      this.commissions(agentId),
      this.finance(agentId),
    ]);
    const byService: Record<string, number> = {};
    for (const b of bookings) {
      byService[b.serviceType] = (byService[b.serviceType] || 0) + 1;
    }
    return {
      sales: { totalBookings: bookings.length, byService },
      commissions: {
        rows: commissions,
        pending: commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0),
        paid: commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0),
      },
      outstanding: { outstandingPoisha: finance.outstandingPoisha, invoices: finance.invoices },
      bookingHistory: bookings,
      customerCount: customerIds.length,
    };
  }
}
