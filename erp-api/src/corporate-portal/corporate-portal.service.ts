import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { StorageService } from "../storage/storage";
import { WorkflowService } from "../workflow/workflow.service";
import { nextApplicationReference } from "../util/next-reference";
import { CorporateCtx } from "./corporate-jwt.guard";

const SERVICE_TYPES = new Set(["visa", "air_ticket", "hotel", "transport", "tour"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD = 15 * 1024 * 1024;
const MANAGER_PLUS = new Set(["admin", "manager", "dept_head", "finance", "travel_desk"]);

type CorpCtx = Pick<
  CorporateCtx,
  "corporateClientId" | "corporateUserId" | "role" | "employeeId"
>;

@Injectable()
export class CorporatePortalService {
  constructor(
    private prisma: PrismaService,
    private notes: NotificationsService,
    private storage: StorageService,
    private workflow: WorkflowService,
  ) {}

  private isAdmin(role: string) {
    return role === "admin";
  }

  private isManagerPlus(role: string) {
    return MANAGER_PLUS.has(role);
  }

  private async audit(
    corporateClientId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    after?: unknown,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action,
        entityType,
        entityId,
        after: after == null ? undefined : ({ corporateClientId, ...(after as object) } as any),
      },
    });
  }

  private async tenantClient(corporateClientId: string) {
    const client = await this.prisma.corporateClient.findFirst({
      where: { id: corporateClientId, deletedAt: null, isActive: true },
    });
    if (!client) throw new NotFoundException("Company not found");
    return client;
  }

  private async branchIdFor(corporateClientId: string) {
    const client = await this.tenantClient(corporateClientId);
    if (client.branchId) return client.branchId;
    const branch =
      (await this.prisma.branch.findFirst({ where: { type: "corporate" } })) ??
      (await this.prisma.branch.findFirst());
    if (!branch) throw new BadRequestException("System not ready");
    return branch.id;
  }

  private travelRequestScope(ctx: CorpCtx) {
    if (this.isManagerPlus(ctx.role)) return { corporateClientId: ctx.corporateClientId };
    if (!ctx.employeeId) return { corporateClientId: ctx.corporateClientId, employeeId: "__none__" };
    return { corporateClientId: ctx.corporateClientId, employeeId: ctx.employeeId };
  }

  async me(corporateClientId: string, corporateUserId: string) {
    const [client, user] = await Promise.all([
      this.prisma.corporateClient.findUnique({
        where: { id: corporateClientId },
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          phone: true,
          email: true,
          address: true,
          billingAddress: true,
          preferredServices: true,
          creditLimit: true,
          paymentTermsDays: true,
          isActive: true,
        },
      }),
      this.prisma.corporateUser.findUnique({
        where: { id: corporateUserId },
        select: {
          email: true,
          role: true,
          mustChangePassword: true,
          lastLoginAt: true,
          employeeId: true,
          employee: { select: { id: true, fullName: true, department: true } },
        },
      }),
    ]);
    return { company: client, user };
  }

  async dashboard(ctx: CorpCtx) {
    const client = await this.tenantClient(ctx.corporateClientId);
    const reqScope = this.travelRequestScope(ctx);
    const appWhere = { corporateClientId: ctx.corporateClientId, deletedAt: null };

    const [
      travelTotal,
      travelPending,
      travelApproved,
      bookingsTotal,
      bookingsOpen,
      pendingApprovals,
      supportOpen,
      announcements,
    ] = await Promise.all([
      this.prisma.corporateTravelRequest.count({ where: reqScope }),
      this.prisma.corporateTravelRequest.count({
        where: { ...reqScope, status: { in: ["draft", "submitted"] } },
      }),
      this.prisma.corporateTravelRequest.count({ where: { ...reqScope, status: "approved" } }),
      this.prisma.application.count({ where: appWhere }),
      this.prisma.application.count({
        where: {
          ...appWhere,
          completedAt: null,
          status: { notIn: ["cancelled", "rejected", "completed"] },
        },
      }),
      this.listApprovals(ctx).then((rows) => rows.length),
      this.prisma.corporateSupportRequest.count({
        where: { corporateClientId: ctx.corporateClientId, status: { in: ["open", "in_progress"] } },
      }),
      this.prisma.corporateAnnouncement.findMany({
        where: {
          corporateClientId: ctx.corporateClientId,
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, body: true, createdAt: true },
      }),
    ]);

    let financeSummary = { creditLimit: client.creditLimit, utilized: 0, available: client.creditLimit };
    if (client.billingCustomerId) {
      const fin = await this.finance(ctx);
      financeSummary = {
        creditLimit: fin.creditLimit,
        utilized: fin.utilized,
        available: fin.available,
      };
    }

    return {
      company: { name: client.companyName, creditLimit: client.creditLimit },
      travelRequests: { total: travelTotal, pending: travelPending, approved: travelApproved },
      bookings: { total: bookingsTotal, open: bookingsOpen },
      pendingApprovals,
      supportOpen,
      finance: financeSummary,
      announcements,
    };
  }

  async getCompany(ctx: CorpCtx) {
    const client = await this.tenantClient(ctx.corporateClientId);
    return {
      id: client.id,
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
      address: client.address,
      billingAddress: client.billingAddress,
      preferredServices: client.preferredServices ? JSON.parse(client.preferredServices) : [],
      creditLimit: client.creditLimit,
      paymentTermsDays: client.paymentTermsDays,
    };
  }

  async patchCompany(ctx: CorpCtx, dto: any) {
    await this.tenantClient(ctx.corporateClientId);
    const data: Record<string, unknown> = {};

    if (this.isAdmin(ctx.role)) {
      if (dto.billingAddress !== undefined) data.billingAddress = String(dto.billingAddress || "").slice(0, 500) || null;
      if (dto.preferredServices !== undefined) {
        const arr = Array.isArray(dto.preferredServices) ? dto.preferredServices : [];
        data.preferredServices = JSON.stringify(arr.filter((s: string) => SERVICE_TYPES.has(s)));
      }
      if (dto.contactPerson !== undefined) data.contactPerson = String(dto.contactPerson || "").slice(0, 100) || null;
      if (dto.phone !== undefined) data.phone = String(dto.phone || "").slice(0, 20) || null;
      if (dto.address !== undefined) data.address = String(dto.address || "").slice(0, 500) || null;
    } else {
      if (dto.creditLimit !== undefined) throw new ForbiddenException("creditLimit is read-only");
      if (dto.billingAddress !== undefined || dto.preferredServices !== undefined) {
        throw new ForbiddenException("Only admins may update billing profile");
      }
    }

    if (!Object.keys(data).length) throw new BadRequestException("No updatable fields");
    const updated = await this.prisma.corporateClient.update({
      where: { id: ctx.corporateClientId },
      data,
    });
    await this.audit(ctx.corporateClientId, "portal.corporate.company_update", "CorporateClient", ctx.corporateClientId);
    return this.getCompany({ ...ctx, corporateClientId: updated.id });
  }

  // ---- Employees ----
  listEmployees(ctx: CorpCtx) {
    return this.prisma.corporateEmployee.findMany({
      where: { corporateClientId: ctx.corporateClientId, deletedAt: null },
      orderBy: { fullName: "asc" },
      take: 500,
      select: {
        id: true,
        code: true,
        fullName: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        status: true,
        isFrequentTraveller: true,
      },
    });
  }

  async getEmployee(ctx: CorpCtx, id: string) {
    const emp = await this.prisma.corporateEmployee.findFirst({
      where: { id, corporateClientId: ctx.corporateClientId, deletedAt: null },
      include: {
        emergencyContacts: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!emp) throw new NotFoundException("Employee not found");
    return emp;
  }

  async createEmployee(ctx: CorpCtx, dto: any) {
    if (!this.isManagerPlus(ctx.role)) throw new ForbiddenException("Insufficient role");
    const fullName = String(dto?.fullName || "").trim().slice(0, 100);
    if (fullName.length < 2) throw new BadRequestException("fullName required");
    const row = await this.prisma.corporateEmployee.create({
      data: {
        corporateClientId: ctx.corporateClientId,
        fullName,
        email: dto?.email ? String(dto.email).trim().slice(0, 120) : undefined,
        phone: dto?.phone ? String(dto.phone).trim().slice(0, 20) : undefined,
        department: dto?.department ? String(dto.department).trim().slice(0, 80) : undefined,
        designation: dto?.designation ? String(dto.designation).trim().slice(0, 80) : undefined,
        managerEmployeeId: dto?.managerEmployeeId || undefined,
        passportNo: dto?.passportNo ? String(dto.passportNo).trim() : undefined,
        nationality: dto?.nationality || undefined,
        dob: dto?.dob ? new Date(dto.dob) : undefined,
        isFrequentTraveller: !!dto?.isFrequentTraveller,
        createdBy: `corporate:${ctx.corporateUserId}`,
      },
    });
    await this.audit(ctx.corporateClientId, "portal.corporate.employee_create", "CorporateEmployee", row.id);
    return row;
  }

  async patchEmployee(ctx: CorpCtx, id: string, dto: any) {
    if (!this.isManagerPlus(ctx.role)) throw new ForbiddenException("Insufficient role");
    await this.getEmployee(ctx, id);
    const data: Record<string, unknown> = {};
    for (const f of [
      "fullName",
      "email",
      "phone",
      "department",
      "designation",
      "passportNo",
      "nationality",
      "status",
    ] as const) {
      if (dto[f] !== undefined) data[f] = dto[f] == null ? null : String(dto[f]).trim();
    }
    if (dto.managerEmployeeId !== undefined) data.managerEmployeeId = dto.managerEmployeeId || null;
    if (dto.dob !== undefined) data.dob = dto.dob ? new Date(dto.dob) : null;
    if (dto.isFrequentTraveller !== undefined) data.isFrequentTraveller = !!dto.isFrequentTraveller;
    const updated = await this.prisma.corporateEmployee.update({ where: { id }, data });
    await this.audit(ctx.corporateClientId, "portal.corporate.employee_update", "CorporateEmployee", id);
    return updated;
  }

  async addEmergencyContact(ctx: CorpCtx, employeeId: string, dto: any) {
    await this.getEmployee(ctx, employeeId);
    const fullName = String(dto?.fullName || "").trim().slice(0, 100);
    const phone = String(dto?.phone || "").trim().slice(0, 20);
    if (fullName.length < 2) throw new BadRequestException("fullName required");
    if (phone.length < 6) throw new BadRequestException("phone required");
    const row = await this.prisma.corporateEmployeeEmergency.create({
      data: {
        employeeId,
        fullName,
        phone,
        relationship: dto?.relationship ? String(dto.relationship).trim().slice(0, 60) : undefined,
        email: dto?.email ? String(dto.email).trim() : undefined,
      },
    });
    await this.audit(ctx.corporateClientId, "portal.corporate.emergency_create", "CorporateEmployeeEmergency", row.id, {
      employeeId,
    });
    return row;
  }

  // ---- Travel requests ----
  listTravelRequests(ctx: CorpCtx, q: { status?: string; take?: number }) {
    return this.prisma.corporateTravelRequest.findMany({
      where: {
        ...this.travelRequestScope(ctx),
        ...(q.status ? { status: q.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(q.take || 50, 100),
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
      },
    });
  }

  async getTravelRequest(ctx: CorpCtx, id: string) {
    const row = await this.prisma.corporateTravelRequest.findFirst({
      where: { id, ...this.travelRequestScope(ctx) },
      include: {
        employee: { select: { id: true, fullName: true, department: true, email: true, phone: true } },
        approvals: { orderBy: { levelNo: "asc" } },
      },
    });
    if (!row) throw new NotFoundException("Travel request not found");
    return row;
  }

  async createTravelRequest(ctx: CorpCtx, dto: any) {
    let employeeId = ctx.employeeId;
    if (dto?.employeeId) {
      if (!this.isManagerPlus(ctx.role)) throw new ForbiddenException("Cannot assign employee");
      const emp = await this.prisma.corporateEmployee.findFirst({
        where: { id: dto.employeeId, corporateClientId: ctx.corporateClientId, deletedAt: null },
      });
      if (!emp) throw new NotFoundException("Employee not found");
      employeeId = emp.id;
    }
    if (!employeeId) throw new BadRequestException("employeeId required");

    let serviceType = String(dto?.serviceType || "visa").trim();
    if (!SERVICE_TYPES.has(serviceType)) throw new BadRequestException("Invalid serviceType");

    const row = await this.prisma.corporateTravelRequest.create({
      data: {
        corporateClientId: ctx.corporateClientId,
        employeeId,
        requesterUserId: ctx.corporateUserId,
        serviceType,
        title: dto?.title ? String(dto.title).trim().slice(0, 200) : undefined,
        message: dto?.message ? String(dto.message).trim().slice(0, 2000) : undefined,
        destination: dto?.destination ? String(dto.destination).trim().slice(0, 120) : undefined,
        departAt: dto?.departAt ? new Date(dto.departAt) : undefined,
        returnAt: dto?.returnAt ? new Date(dto.returnAt) : undefined,
        packageId: dto?.packageId ? String(dto.packageId).trim() : undefined,
        status: "draft",
      },
    });
    await this.audit(ctx.corporateClientId, "portal.corporate.travel_create", "CorporateTravelRequest", row.id);
    return row;
  }

  async patchTravelRequest(ctx: CorpCtx, id: string, dto: any) {
    const row = await this.getTravelRequest(ctx, id);
    if (row.status !== "draft") throw new BadRequestException("Only draft requests can be edited");
    if (dto?.corporateClientId || dto?.applicationId || dto?.customerId) {
      throw new BadRequestException("Invalid fields");
    }
    const data: Record<string, unknown> = {};
    if (dto.serviceType !== undefined) {
      const st = String(dto.serviceType).trim();
      if (!SERVICE_TYPES.has(st)) throw new BadRequestException("Invalid serviceType");
      data.serviceType = st;
    }
    for (const f of ["title", "message", "destination"] as const) {
      if (dto[f] !== undefined) data[f] = dto[f] == null ? null : String(dto[f]).trim().slice(0, f === "message" ? 2000 : 200);
    }
    if (dto.packageId !== undefined) data.packageId = dto.packageId ? String(dto.packageId).trim() : null;
    if (dto.departAt !== undefined) data.departAt = dto.departAt ? new Date(dto.departAt) : null;
    if (dto.returnAt !== undefined) data.returnAt = dto.returnAt ? new Date(dto.returnAt) : null;
    const updated = await this.prisma.corporateTravelRequest.update({ where: { id }, data });
    await this.audit(ctx.corporateClientId, "portal.corporate.travel_update", "CorporateTravelRequest", id);
    return updated;
  }

  async submitTravelRequest(ctx: CorpCtx, id: string) {
    const row = await this.getTravelRequest(ctx, id);
    if (row.status !== "draft") throw new BadRequestException("Only draft requests can be submitted");

    const chain = await this.prisma.corporateApprovalChain.findFirst({
      where: { corporateClientId: ctx.corporateClientId, isDefault: true },
      include: { steps: { orderBy: { levelNo: "asc" } } },
    });
    if (!chain?.steps.length) throw new BadRequestException("Approval chain not configured");

    await this.prisma.corporateTravelApproval.deleteMany({ where: { requestId: id } });
    for (const step of chain.steps) {
      await this.prisma.corporateTravelApproval.create({
        data: {
          requestId: id,
          levelNo: step.levelNo,
          role: step.role,
          decision: "pending",
        },
      });
    }

    const updated = await this.prisma.corporateTravelRequest.update({
      where: { id },
      data: {
        status: "submitted",
        currentLevel: 1,
        chainId: chain.id,
        submittedAt: new Date(),
      },
    });
    await this.audit(ctx.corporateClientId, "portal.corporate.travel_submit", "CorporateTravelRequest", id);
    return updated;
  }

  async cancelTravelRequest(ctx: CorpCtx, id: string) {
    const row = await this.getTravelRequest(ctx, id);
    if (!["draft", "submitted"].includes(row.status)) {
      throw new BadRequestException("Request cannot be cancelled");
    }
    const updated = await this.prisma.corporateTravelRequest.update({
      where: { id },
      data: { status: "cancelled", decidedAt: new Date() },
    });
    await this.audit(ctx.corporateClientId, "portal.corporate.travel_cancel", "CorporateTravelRequest", id);
    return updated;
  }

  // ---- Approvals ----
  async listApprovals(ctx: CorpCtx) {
    const requests = await this.prisma.corporateTravelRequest.findMany({
      where: { corporateClientId: ctx.corporateClientId, status: "submitted" },
      include: {
        approvals: { orderBy: { levelNo: "asc" } },
        employee: { select: { fullName: true, department: true } },
      },
      orderBy: { submittedAt: "asc" },
    });
    return requests.filter((r) => {
      const current = r.approvals.find((a) => a.levelNo === r.currentLevel && a.decision === "pending");
      if (!current) return false;
      return this.isAdmin(ctx.role) || current.role === ctx.role;
    });
  }

  async decideApproval(ctx: CorpCtx, approvalId: string, dto: { decision: string; note?: string }) {
    const decision = dto?.decision === "rejected" ? "rejected" : dto?.decision === "approved" ? "approved" : null;
    if (!decision) throw new BadRequestException("decision must be approved or rejected");

    const approval = await this.prisma.corporateTravelApproval.findUnique({
      where: { id: approvalId },
      include: {
        request: {
          include: {
            employee: { select: { fullName: true } },
            approvals: { orderBy: { levelNo: "asc" } },
          },
        },
      },
    });
    if (!approval || approval.request.corporateClientId !== ctx.corporateClientId) {
      throw new NotFoundException("Approval not found");
    }
    const req = approval.request;
    if (req.status !== "submitted") throw new BadRequestException("Request is not pending approval");
    if (approval.levelNo !== req.currentLevel || approval.decision !== "pending") {
      throw new BadRequestException("This approval step is not active");
    }
    if (!this.isAdmin(ctx.role) && approval.role !== ctx.role) {
      throw new ForbiddenException("Your role cannot act on this approval");
    }

    await this.prisma.corporateTravelApproval.update({
      where: { id: approvalId },
      data: {
        decision,
        note: dto?.note ? String(dto.note).trim().slice(0, 500) : null,
        decidedByUserId: ctx.corporateUserId,
        decidedAt: new Date(),
      },
    });

    if (decision === "rejected") {
      const updated = await this.prisma.corporateTravelRequest.update({
        where: { id: req.id },
        data: { status: "rejected", decidedAt: new Date() },
      });
      await this.audit(ctx.corporateClientId, "portal.corporate.approval_reject", "CorporateTravelRequest", req.id);
      return updated;
    }

    const maxLevel = Math.max(...req.approvals.map((a) => a.levelNo));
    if (req.currentLevel < maxLevel) {
      const updated = await this.prisma.corporateTravelRequest.update({
        where: { id: req.id },
        data: { currentLevel: req.currentLevel + 1 },
      });
      await this.audit(ctx.corporateClientId, "portal.corporate.approval_advance", "CorporateTravelRequest", req.id, {
        level: req.currentLevel + 1,
      });
      return updated;
    }

    const client = await this.tenantClient(ctx.corporateClientId);
    if (!client.billingCustomerId) throw new BadRequestException("Billing customer not configured");

    const branchId = await this.branchIdFor(ctx.corporateClientId);
    const referenceNo = await nextApplicationReference(this.prisma);
    const title =
      req.title ||
      `Corporate ${req.serviceType} — ${req.employee?.fullName || "traveller"}`;

    const app = await this.prisma.application.create({
      data: {
        branchId,
        referenceNo,
        serviceType: req.serviceType as any,
        customerId: client.billingCustomerId,
        title: String(title).slice(0, 200),
        status: "draft",
        source: "corporate_portal",
        corporateClientId: ctx.corporateClientId,
        createdBy: `corporate:${ctx.corporateUserId}`,
      },
    });
    const totalStages = await this.workflow.instantiateStages(app.id, String(req.serviceType));
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
        message: `Corporate travel request approved — ${req.serviceType}${req.destination ? ` to ${req.destination}` : ""}`,
      },
    });

    const updated = await this.prisma.corporateTravelRequest.update({
      where: { id: req.id },
      data: {
        status: "approved",
        applicationId: app.id,
        decidedAt: new Date(),
      },
    });

    await this.audit(ctx.corporateClientId, "portal.corporate.approval_final", "CorporateTravelRequest", req.id, {
      applicationId: app.id,
      referenceNo,
    });
    return { request: updated, application: { id: app.id, referenceNo } };
  }

  // ---- Bookings ----
  listBookings(ctx: CorpCtx, q: { status?: string; take?: number }) {
    return this.prisma.application.findMany({
      where: {
        corporateClientId: ctx.corporateClientId,
        deletedAt: null,
        ...(q.status ? { status: q.status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(q.take || 50, 100),
      select: {
        id: true,
        referenceNo: true,
        serviceType: true,
        title: true,
        status: true,
        currentStage: true,
        totalStages: true,
        createdAt: true,
        completedAt: true,
        customer: { select: { id: true, fullName: true } },
      },
    });
  }

  async getBooking(ctx: CorpCtx, id: string) {
    const app = await this.prisma.application.findFirst({
      where: { id, corporateClientId: ctx.corporateClientId, deletedAt: null },
      select: {
        id: true,
        referenceNo: true,
        serviceType: true,
        title: true,
        status: true,
        currentStage: true,
        totalStages: true,
        createdAt: true,
        completedAt: true,
        source: true,
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        stages: { select: { stageNo: true, name: true, status: true }, orderBy: { stageNo: "asc" } },
        events: { select: { type: true, message: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!app) throw new NotFoundException("Booking not found");
    return app;
  }

  // ---- Finance ----
  async finance(ctx: CorpCtx) {
    const client = await this.tenantClient(ctx.corporateClientId);
    if (!client.billingCustomerId) {
      return {
        creditLimit: client.creditLimit,
        utilized: 0,
        available: client.creditLimit,
        invoices: [],
        payments: [],
      };
    }

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { customerId: client.billingCustomerId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          invoiceNo: true,
          status: true,
          total: true,
          currency: true,
          issuedAt: true,
          dueAt: true,
          payments: { where: { deletedAt: null }, select: { amount: true, kind: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: { customerId: client.billingCustomerId, deletedAt: null },
        orderBy: { receivedAt: "desc" },
        take: 100,
        select: {
          id: true,
          amount: true,
          kind: true,
          method: true,
          reference: true,
          receivedAt: true,
          invoiceId: true,
        },
      }),
    ]);

    let utilized = 0;
    for (const inv of invoices) {
      if (!["issued", "partially_paid"].includes(String(inv.status))) continue;
      const paid = inv.payments.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
      utilized += Math.max(0, inv.total - paid);
    }

    return {
      creditLimit: client.creditLimit,
      utilized,
      available: Math.max(0, client.creditLimit - utilized),
      invoices,
      payments,
    };
  }

  // ---- Documents ----
  async listDocuments(ctx: CorpCtx, applicationId: string) {
    await this.assertAppAccess(ctx.corporateClientId, applicationId);
    return this.prisma.document.findMany({
      where: { deletedAt: null, ownerType: "application", ownerId: applicationId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        category: true,
        fileName: true,
        status: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });
  }

  private async assertAppAccess(corporateClientId: string, applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, corporateClientId, deletedAt: null },
    });
    if (!app) throw new NotFoundException("Application not found");
    return app;
  }

  private async assertDocAccess(corporateClientId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, deletedAt: null } });
    if (!doc) throw new NotFoundException("Document not found");
    if (doc.ownerType === "application") {
      const app = await this.prisma.application.findFirst({
        where: { id: doc.ownerId, corporateClientId, deletedAt: null },
      });
      if (app) return doc;
    }
    throw new NotFoundException("Document not found");
  }

  async documentVersions(ctx: CorpCtx, documentId: string) {
    await this.assertDocAccess(ctx.corporateClientId, documentId);
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: "desc" },
      select: { id: true, version: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    });
  }

  async uploadDocument(
    ctx: CorpCtx,
    applicationId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    body: any,
  ) {
    if (!file) throw new BadRequestException("file is required");
    if (!ALLOWED_MIME.has(file.mimetype)) throw new BadRequestException("Only JPG/PNG/WEBP/PDF allowed");
    if (file.size > MAX_UPLOAD) throw new BadRequestException("File too large (max 15MB)");

    const app = await this.assertAppAccess(ctx.corporateClientId, applicationId);
    const category = String(body?.category || "other").trim().slice(0, 40) || "other";
    const id = randomUUID();
    const ext = (file.mimetype.split("/")[1] || "bin").replace("jpeg", "jpg");
    const storageKey = `portal/corporate/${ctx.corporateClientId}/${id}.${ext}`;
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
          uploadedBy: `corporate:${ctx.corporateUserId}`,
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
          uploadedBy: `corporate:${ctx.corporateUserId}`,
        },
      });
      await this.audit(ctx.corporateClientId, "portal.corporate.document_upload", "Document", row.id, {
        category,
        version: nextVer,
      });
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
        uploadedBy: `corporate:${ctx.corporateUserId}`,
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
        uploadedBy: `corporate:${ctx.corporateUserId}`,
      },
    });
    await this.prisma.applicationDocument
      .create({ data: { applicationId, documentId: doc.id, docType: category, status: "pending" } })
      .catch(() => null);
    await this.audit(ctx.corporateClientId, "portal.corporate.document_upload", "Document", doc.id, { category });
    return { id: doc.id, category, fileName: doc.fileName, status: doc.status, version: 1 };
  }

  async downloadDocument(ctx: CorpCtx, documentId: string) {
    const doc = await this.assertDocAccess(ctx.corporateClientId, documentId);
    const buf = await this.storage.get(doc.storageKey);
    await this.audit(ctx.corporateClientId, "portal.corporate.document_download", "Document", doc.id, {
      fileName: doc.fileName,
      ownerId: doc.ownerId,
    });
    return { buf, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  // ---- Communications ----
  async communications(ctx: CorpCtx) {
    const [messages, support, announcements] = await Promise.all([
      this.prisma.communication.findMany({
        where: { relatedType: "corporate", relatedId: ctx.corporateClientId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          channel: true,
          direction: true,
          subject: true,
          body: true,
          summary: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.corporateSupportRequest.findMany({
        where: { corporateClientId: ctx.corporateClientId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.corporateAnnouncement.findMany({
        where: {
          corporateClientId: ctx.corporateClientId,
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    return { messages, support, announcements };
  }

  async createSupport(ctx: CorpCtx, dto: any) {
    const subject = String(dto?.subject || "").trim().slice(0, 160);
    const body = String(dto?.body || "").trim().slice(0, 4000);
    if (subject.length < 3) throw new BadRequestException("subject required");
    if (body.length < 3) throw new BadRequestException("body required");

    if (dto?.applicationId) {
      await this.assertAppAccess(ctx.corporateClientId, dto.applicationId);
    }

    const client = await this.tenantClient(ctx.corporateClientId);
    const row = await this.prisma.corporateSupportRequest.create({
      data: {
        corporateClientId: ctx.corporateClientId,
        createdByUserId: ctx.corporateUserId,
        subject,
        body,
        priority: dto?.priority === "high" ? "high" : "normal",
        applicationId: dto?.applicationId || null,
      },
    });
    await this.prisma.communication.create({
      data: {
        branchId: client.branchId || null,
        relatedType: "corporate",
        relatedId: ctx.corporateClientId,
        partyKind: "corporate",
        partyLabel: client.companyName,
        channel: "note",
        direction: "inbound",
        summary: subject,
        subject,
        body,
        status: "logged",
        byUser: `corporate:${ctx.corporateUserId}`,
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
      {
        subject: `Corporate support: ${subject}`,
        body,
        relatedType: "CorporateSupportRequest",
        relatedId: row.id,
      },
    );
    await this.audit(ctx.corporateClientId, "portal.corporate.support_create", "CorporateSupportRequest", row.id, {
      subject,
    });
    return row;
  }

  listAnnouncements(ctx: CorpCtx) {
    return this.prisma.corporateAnnouncement.findMany({
      where: {
        corporateClientId: ctx.corporateClientId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createAnnouncement(ctx: CorpCtx, dto: any) {
    if (!this.isAdmin(ctx.role)) throw new ForbiddenException("Admin only");
    const title = String(dto?.title || "").trim().slice(0, 160);
    const body = String(dto?.body || "").trim().slice(0, 8000);
    if (title.length < 3) throw new BadRequestException("title required");
    if (body.length < 3) throw new BadRequestException("body required");
    const row = await this.prisma.corporateAnnouncement.create({
      data: {
        corporateClientId: ctx.corporateClientId,
        title,
        body,
        createdByUserId: ctx.corporateUserId,
        expiresAt: dto?.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    await this.audit(ctx.corporateClientId, "portal.corporate.announcement_create", "CorporateAnnouncement", row.id);
    return row;
  }

  // ---- Approval chain ----
  async getApprovalChain(ctx: CorpCtx) {
    const chain = await this.prisma.corporateApprovalChain.findFirst({
      where: { corporateClientId: ctx.corporateClientId, isDefault: true },
      include: { steps: { orderBy: { levelNo: "asc" } } },
    });
    return chain || { steps: [] };
  }

  async putApprovalChain(ctx: CorpCtx, dto: { steps: Array<{ levelNo: number; role: string; name?: string }> }) {
    if (!this.isAdmin(ctx.role)) throw new ForbiddenException("Admin only");
    const steps = Array.isArray(dto?.steps) ? dto.steps : [];
    if (!steps.length) throw new BadRequestException("steps required");

    let chain = await this.prisma.corporateApprovalChain.findFirst({
      where: { corporateClientId: ctx.corporateClientId, isDefault: true },
    });
    if (!chain) {
      chain = await this.prisma.corporateApprovalChain.create({
        data: { corporateClientId: ctx.corporateClientId, name: "Default", isDefault: true },
      });
    }

    await this.prisma.corporateApprovalStep.deleteMany({ where: { chainId: chain.id } });
    for (const step of steps) {
      const role = String(step.role || "").trim();
      if (!role) throw new BadRequestException("Each step needs a role");
      await this.prisma.corporateApprovalStep.create({
        data: {
          chainId: chain.id,
          levelNo: Number(step.levelNo) || 1,
          role,
          name: step.name ? String(step.name).trim().slice(0, 80) : undefined,
        },
      });
    }

    await this.audit(ctx.corporateClientId, "portal.corporate.approval_chain_update", "CorporateApprovalChain", chain.id);
    return this.getApprovalChain(ctx);
  }

  // ---- Reports ----
  async reports(ctx: CorpCtx) {
    const reqScope = this.travelRequestScope(ctx);
    const [travelRequests, bookings, finance] = await Promise.all([
      this.prisma.corporateTravelRequest.findMany({
        where: reqScope,
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          serviceType: true,
          status: true,
          destination: true,
          createdAt: true,
          submittedAt: true,
          employee: { select: { fullName: true, department: true } },
        },
      }),
      this.listBookings(ctx, { take: 200 }),
      this.finance(ctx),
    ]);

    const byService: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const r of travelRequests) {
      byService[r.serviceType] = (byService[r.serviceType] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    }

    return {
      travel: { total: travelRequests.length, byService, byStatus, rows: travelRequests },
      bookings: { total: bookings.length, rows: bookings },
      finance: {
        creditLimit: finance.creditLimit,
        utilized: finance.utilized,
        available: finance.available,
      },
    };
  }
}
