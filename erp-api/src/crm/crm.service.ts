import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { ApplicationsService } from "../applications/applications.service";

const LEAD_SOURCES = new Set(["web", "walkin", "phone", "whatsapp", "facebook", "referral"]);
const CONTACT_KINDS = new Set(["individual", "family", "corporate"]);
const ORG_TYPES = new Set(["corporate", "travel_agent", "partner_agency"]);
const OPP_STAGES = ["qualification", "needs_analysis", "proposal", "negotiation", "won", "lost", "converted"] as const;
const ACTIVITY_TYPES = new Set(["call", "meeting", "email", "whatsapp", "task", "follow_up"]);
const QUOTE_SERVICES = new Set(["visa", "air_ticket", "hotel", "tour", "hajj", "umrah"]);
const CONVERT_SERVICES = QUOTE_SERVICES;
const HQ = new Set(["super_admin", "general_manager"]);

const STAGE_PROB: Record<string, number> = {
  qualification: 2000,
  needs_analysis: 4000,
  proposal: 6000,
  negotiation: 7500,
  won: 10000,
  lost: 0,
  converted: 10000,
};

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    private apps: ApplicationsService,
  ) {}

  private branchFilter(user: AuthedUser) {
    return HQ.has(user.role) ? {} : { branchId: user.branchId ?? "__none__" };
  }

  private async audit(userId: string | undefined, action: string, entityType: string, entityId: string | null, after?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        after: after == null ? undefined : (after as any),
      },
    });
  }

  private async nextNo(prefix: string, field: "leadNo" | "opportunityNo" | "quoteNo" | "code") {
    const model =
      field === "leadNo"
        ? this.prisma.lead
        : field === "opportunityNo"
          ? this.prisma.opportunity
          : field === "quoteNo"
            ? this.prisma.quotation
            : this.prisma.crmOrganization;
    for (let i = 0; i < 6; i++) {
      const count = await (model as any).count();
      const candidate = `${prefix}${String(count + 1 + i).padStart(5, "0")}`;
      const clash = await (model as any).findFirst({ where: { [field]: candidate } });
      if (!clash) return candidate;
    }
    return `${prefix}${Date.now().toString().slice(-8)}`;
  }

  // ---------- Leads ----------
  async listLeads(q: any, user: AuthedUser) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.source) where.source = q.source;
    if (q.assignedTo) where.assignedTo = q.assignedTo;
    if (q.q) {
      where.OR = ["name", "phone", "email", "serviceInterest", "leadNo"].map((f) => ({
        [f]: { contains: q.q, mode: "insensitive" },
      }));
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contact: { select: { id: true, fullName: true, kind: true } },
          organization: { select: { id: true, code: true, name: true, type: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getLead(id: string, user: AuthedUser) {
    const l = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
      include: {
        contact: true,
        organization: true,
        opportunities: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20 },
        quotations: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!l) throw new NotFoundException("Lead not found");
    return l;
  }

  async createLead(dto: any, user: AuthedUser) {
    if (!dto?.name?.trim()) throw new BadRequestException("name required");
    const source = String(dto.source || "walkin").toLowerCase();
    if (!LEAD_SOURCES.has(source)) throw new BadRequestException(`Invalid source (use ${[...LEAD_SOURCES].join(", ")})`);
    const leadNo = await this.nextNo("LD-", "leadNo");
    const row = await this.prisma.lead.create({
      data: {
        leadNo,
        name: String(dto.name).trim(),
        phone: dto.phone || null,
        email: dto.email || null,
        source,
        serviceInterest: dto.serviceInterest || null,
        priority: ["hot", "warm", "cold"].includes(dto.priority) ? dto.priority : "warm",
        assignedTo: dto.assignedTo || null,
        notes: dto.notes || null,
        contactId: dto.contactId || null,
        organizationId: dto.organizationId || null,
        customerId: dto.customerId || null,
        packageId: dto.packageId || null,
        branchId: dto.branchId ?? user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "crm.lead.create", "Lead", row.id, row);
    return row;
  }

  async updateLead(id: string, dto: any, user: AuthedUser) {
    await this.getLead(id, user);
    if (dto.source && !LEAD_SOURCES.has(String(dto.source).toLowerCase())) {
      throw new BadRequestException("Invalid source");
    }
    const row = await this.prisma.lead.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        source: dto.source ? String(dto.source).toLowerCase() : undefined,
        serviceInterest: dto.serviceInterest,
        status: dto.status,
        priority: dto.priority,
        assignedTo: dto.assignedTo,
        notes: dto.notes,
        contactId: dto.contactId,
        organizationId: dto.organizationId,
        customerId: dto.customerId,
        packageId: dto.packageId,
        lostReason: dto.lostReason,
      },
    });
    await this.audit(user.id, "crm.lead.update", "Lead", id, row);
    return row;
  }

  async deleteLead(id: string, user: AuthedUser) {
    await this.getLead(id, user);
    await this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(user.id, "crm.lead.delete", "Lead", id, {});
    return { ok: true };
  }

  // ---------- Contacts ----------
  async listContacts(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.kind) where.kind = q.kind;
    if (q.organizationId) where.organizationId = q.organizationId;
    if (q.q) {
      where.OR = ["fullName", "phone", "email", "familyGroup"].map((f) => ({
        [f]: { contains: q.q, mode: "insensitive" },
      }));
    }
    return this.prisma.crmContact.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: Math.min(200, Number(q.limit) || 100),
      include: { organization: { select: { id: true, code: true, name: true, type: true } } },
    });
  }

  async createContact(dto: any, user: AuthedUser) {
    if (!dto?.fullName?.trim()) throw new BadRequestException("fullName required");
    const kind = String(dto.kind || "individual");
    if (!CONTACT_KINDS.has(kind)) throw new BadRequestException("Invalid contact kind");
    const row = await this.prisma.crmContact.create({
      data: {
        kind,
        fullName: String(dto.fullName).trim(),
        phone: dto.phone || null,
        email: dto.email || null,
        familyGroup: dto.familyGroup || null,
        organizationId: dto.organizationId || null,
        customerId: dto.customerId || null,
        assignedTo: dto.assignedTo || null,
        notes: dto.notes || null,
        branchId: dto.branchId ?? user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "crm.contact.create", "CrmContact", row.id, row);
    return row;
  }

  async updateContact(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.crmContact.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
    });
    if (!existing) throw new NotFoundException("Contact not found");
    const row = await this.prisma.crmContact.update({
      where: { id },
      data: {
        kind: dto.kind,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        familyGroup: dto.familyGroup,
        organizationId: dto.organizationId,
        customerId: dto.customerId,
        assignedTo: dto.assignedTo,
        notes: dto.notes,
      },
    });
    await this.audit(user.id, "crm.contact.update", "CrmContact", id, row);
    return row;
  }

  // ---------- Organizations ----------
  async listOrganizations(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.type) where.type = q.type;
    if (q.active === "true") where.isActive = true;
    if (q.q) {
      where.OR = ["name", "code", "phone", "email"].map((f) => ({
        [f]: { contains: q.q, mode: "insensitive" },
      }));
    }
    return this.prisma.crmOrganization.findMany({
      where,
      orderBy: { name: "asc" },
      take: 200,
      include: { _count: { select: { contacts: true, opportunities: true } } },
    });
  }

  async createOrganization(dto: any, user: AuthedUser) {
    if (!dto?.name?.trim()) throw new BadRequestException("name required");
    const type = String(dto.type || "corporate");
    if (!ORG_TYPES.has(type)) throw new BadRequestException("Invalid organization type");
    const code = dto.code?.trim() || (await this.nextNo("ORG-", "code"));
    const row = await this.prisma.crmOrganization.create({
      data: {
        code,
        name: String(dto.name).trim(),
        type,
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
        agentId: dto.agentId || null,
        corporateClientId: dto.corporateClientId || null,
        creditLimitPoisha: Number(dto.creditLimitPoisha) || 0,
        notes: dto.notes || null,
        branchId: dto.branchId ?? user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "crm.org.create", "CrmOrganization", row.id, row);
    return row;
  }

  async updateOrganization(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.crmOrganization.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
    });
    if (!existing) throw new NotFoundException("Organization not found");
    const row = await this.prisma.crmOrganization.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        agentId: dto.agentId,
        corporateClientId: dto.corporateClientId,
        creditLimitPoisha: dto.creditLimitPoisha != null ? Number(dto.creditLimitPoisha) : undefined,
        isActive: dto.isActive,
        notes: dto.notes,
      },
    });
    await this.audit(user.id, "crm.org.update", "CrmOrganization", id, row);
    return row;
  }

  // ---------- Opportunities ----------
  async listOpportunities(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.stage) where.stage = q.stage;
    if (q.status) where.status = q.status;
    if (q.assignedTo) where.assignedTo = q.assignedTo;
    if (q.q) {
      where.OR = ["title", "opportunityNo"].map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
    }
    return this.prisma.opportunity.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: Math.min(200, Number(q.limit) || 100),
      include: {
        lead: { select: { id: true, name: true, leadNo: true } },
        contact: { select: { id: true, fullName: true } },
        organization: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async createOpportunity(dto: any, user: AuthedUser) {
    if (!dto?.title?.trim()) throw new BadRequestException("title required");
    const stage = OPP_STAGES.includes(dto.stage) ? dto.stage : "qualification";
    const opportunityNo = await this.nextNo("OP-", "opportunityNo");
    const row = await this.prisma.opportunity.create({
      data: {
        opportunityNo,
        title: String(dto.title).trim(),
        stage,
        probabilityBps: dto.probabilityBps != null ? Number(dto.probabilityBps) : STAGE_PROB[stage] ?? 2000,
        expectedRevenuePoisha: Number(dto.expectedRevenuePoisha) || 0,
        currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
        serviceType: dto.serviceType || null,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        leadId: dto.leadId || null,
        contactId: dto.contactId || null,
        organizationId: dto.organizationId || null,
        customerId: dto.customerId || null,
        packageId: dto.packageId || null,
        assignedTo: dto.assignedTo || null,
        notes: dto.notes || null,
        branchId: dto.branchId ?? user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "crm.opportunity.create", "Opportunity", row.id, row);
    return row;
  }

  async updateOpportunityStage(id: string, stage: string, user: AuthedUser, extra?: any) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
    });
    if (!opp) throw new NotFoundException("Opportunity not found");
    if (!OPP_STAGES.includes(stage as any)) throw new BadRequestException("Invalid stage");
    const data: any = {
      stage,
      probabilityBps: STAGE_PROB[stage] ?? opp.probabilityBps,
    };
    if (stage === "won") {
      data.status = "won";
      data.wonAt = new Date();
    } else if (stage === "lost") {
      data.status = "lost";
      data.lostAt = new Date();
      data.lostReason = extra?.lostReason || null;
    } else if (stage === "converted") {
      data.status = "converted";
      data.convertedAt = new Date();
    } else {
      data.status = "open";
    }
    const row = await this.prisma.opportunity.update({ where: { id }, data });
    await this.audit(user.id, "crm.opportunity.stage", "Opportunity", id, row);
    return row;
  }

  // ---------- Activities ----------
  async listActivities(q: any, user: AuthedUser) {
    const where: any = { ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.type) where.type = q.type;
    if (q.relatedType) where.relatedType = q.relatedType;
    if (q.relatedId) where.relatedId = q.relatedId;
    if (q.assignedTo) where.assignedTo = q.assignedTo;
    return this.prisma.crmActivity.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: Math.min(200, Number(q.limit) || 100),
    });
  }

  async createActivity(dto: any, user: AuthedUser) {
    if (!dto?.subject?.trim()) throw new BadRequestException("subject required");
    if (!dto?.relatedType || !dto?.relatedId) throw new BadRequestException("relatedType and relatedId required");
    const type = String(dto.type || "task");
    if (!ACTIVITY_TYPES.has(type)) throw new BadRequestException("Invalid activity type");
    const row = await this.prisma.crmActivity.create({
      data: {
        type,
        subject: String(dto.subject).trim(),
        body: dto.body || null,
        relatedType: String(dto.relatedType),
        relatedId: String(dto.relatedId),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        status: dto.status || "open",
        assignedTo: dto.assignedTo || user.id,
        byUser: user.id,
        branchId: user.branchId ?? null,
      },
    });
    // Mirror into Communication for timeline compatibility
    await this.prisma.communication.create({
      data: {
        relatedType: row.relatedType,
        relatedId: row.relatedId,
        channel: type === "follow_up" || type === "task" ? "meeting" : type,
        direction: "outbound",
        summary: row.subject,
        byUser: user.id,
      },
    });
    await this.audit(user.id, "crm.activity.create", "CrmActivity", row.id, row);
    return row;
  }

  async completeActivity(id: string, user: AuthedUser) {
    const a = await this.prisma.crmActivity.findFirst({
      where: { id, ...this.branchFilter(user) },
    });
    if (!a) throw new NotFoundException("Activity not found");
    const row = await this.prisma.crmActivity.update({
      where: { id },
      data: { status: "done", completedAt: new Date() },
    });
    await this.audit(user.id, "crm.activity.complete", "CrmActivity", id, row);
    return row;
  }

  // ---------- Quotations ----------
  async listQuotations(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.serviceType) where.serviceType = q.serviceType;
    return this.prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        lines: { orderBy: { lineNo: "asc" } },
        opportunity: { select: { id: true, opportunityNo: true, title: true } },
        lead: { select: { id: true, name: true } },
      },
    });
  }

  async createQuotation(dto: any, user: AuthedUser) {
    const serviceType = String(dto.serviceType || "");
    if (!QUOTE_SERVICES.has(serviceType)) {
      throw new BadRequestException(`serviceType must be one of ${[...QUOTE_SERVICES].join(", ")}`);
    }
    const linesIn = Array.isArray(dto.lines) ? dto.lines : [];
    if (linesIn.length < 1) throw new BadRequestException("At least one line required");
    let subtotal = 0;
    const lines = linesIn.map((l: any, i: number) => {
      const qty = Math.max(1, Number(l.quantity) || 1);
      const unit = Math.max(0, Number(l.unitPricePoisha) || 0);
      const amount = qty * unit;
      subtotal += amount;
      return {
        lineNo: i + 1,
        description: String(l.description || "Item").trim(),
        quantity: qty,
        unitPricePoisha: unit,
        amountPoisha: amount,
      };
    });
    const tax = Math.max(0, Number(dto.taxPoisha) || 0);
    const quoteNo = await this.nextNo("QT-", "quoteNo");
    const row = await this.prisma.quotation.create({
      data: {
        quoteNo,
        serviceType,
        status: "draft",
        opportunityId: dto.opportunityId || null,
        leadId: dto.leadId || null,
        contactId: dto.contactId || null,
        organizationId: dto.organizationId || null,
        customerId: dto.customerId || null,
        currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
        subtotalPoisha: subtotal,
        taxPoisha: tax,
        totalPoisha: subtotal + tax,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes || null,
        branchId: user.branchId ?? null,
        createdBy: user.id,
        lines: { create: lines },
      },
      include: { lines: true },
    });
    await this.audit(user.id, "crm.quote.create", "Quotation", row.id, row);
    return row;
  }

  async setQuotationStatus(id: string, status: string, user: AuthedUser) {
    const allowed = new Set(["draft", "sent", "accepted", "rejected", "expired", "converted"]);
    if (!allowed.has(status)) throw new BadRequestException("Invalid status");
    const q = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
    });
    if (!q) throw new NotFoundException("Quotation not found");
    const row = await this.prisma.quotation.update({ where: { id }, data: { status } });
    await this.audit(user.id, "crm.quote.status", "Quotation", id, row);
    return row;
  }

  // ---------- Conversion ----------
  async convert(dto: any, user: AuthedUser) {
    const serviceType = String(dto.serviceType || "");
    if (!CONVERT_SERVICES.has(serviceType)) {
      throw new BadRequestException(`serviceType must be one of ${[...CONVERT_SERVICES].join(", ")}`);
    }
    let opportunity =
      dto.opportunityId
        ? await this.prisma.opportunity.findFirst({
            where: { id: dto.opportunityId, deletedAt: null, ...this.branchFilter(user) },
          })
        : null;
    let quotation =
      dto.quotationId
        ? await this.prisma.quotation.findFirst({
            where: { id: dto.quotationId, deletedAt: null, ...this.branchFilter(user) },
            include: { lines: true },
          })
        : null;
    let lead =
      dto.leadId
        ? await this.prisma.lead.findFirst({
            where: { id: dto.leadId, deletedAt: null, ...this.branchFilter(user) },
          })
        : null;
    if (opportunity?.leadId && !lead) {
      lead = await this.prisma.lead.findFirst({ where: { id: opportunity.leadId, deletedAt: null } });
    }
    if (quotation?.leadId && !lead) {
      lead = await this.prisma.lead.findFirst({ where: { id: quotation.leadId, deletedAt: null } });
    }

    let customerId = dto.customerId || opportunity?.customerId || quotation?.customerId || lead?.customerId || null;
    if (!customerId) {
      const name = lead?.name || opportunity?.title || "CRM Customer";
      const phone = lead?.phone || dto.phone || `crm-${Date.now()}`;
      const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
      const branchId =
        user.branchId ||
        opportunity?.branchId ||
        lead?.branchId ||
        (await this.prisma.branch.findFirst({ where: { type: "corporate" }, select: { id: true } }))?.id ||
        (await this.prisma.branch.findFirst({ select: { id: true } }))?.id;
      if (!branchId) throw new BadRequestException("No branch available for customer");
      const customer = await this.prisma.customer.create({
        data: {
          branchId,
          code,
          fullName: name,
          phone,
          email: lead?.email || dto.email || null,
          source: lead?.source || "crm",
          createdBy: user.id,
        },
      });
      customerId = customer.id;
    }

    const title =
      dto.title ||
      quotation?.notes ||
      opportunity?.title ||
      `${serviceType} from ${lead?.name || "CRM"}`;

    const app = await this.apps.create(
      {
        customerId,
        serviceType,
        title: String(title).slice(0, 200),
        source: lead?.source || "crm",
        assignedTo: opportunity?.assignedTo || lead?.assignedTo || user.id,
        priority: lead?.priority === "hot" ? "high" : "medium",
      },
      user,
    );

    if (opportunity) {
      await this.prisma.opportunity.update({
        where: { id: opportunity.id },
        data: {
          status: "converted",
          stage: "converted",
          applicationId: app.id,
          customerId,
          convertedAt: new Date(),
          probabilityBps: 10000,
        },
      });
    }
    if (quotation) {
      await this.prisma.quotation.update({
        where: { id: quotation.id },
        data: { status: "converted", applicationId: app.id, customerId },
      });
    }
    if (lead) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: "converted",
          customerId,
          convertedApplicationId: app.id,
          convertedAt: new Date(),
        },
      });
    }

    await this.prisma.crmActivity.create({
      data: {
        type: "task",
        subject: `Converted to ${app.referenceNo} (${serviceType})`,
        relatedType: "application",
        relatedId: app.id,
        status: "done",
        completedAt: new Date(),
        byUser: user.id,
        assignedTo: user.id,
        branchId: user.branchId ?? null,
      },
    });
    await this.audit(user.id, "crm.convert", "Application", app.id, {
      serviceType,
      opportunityId: opportunity?.id,
      quotationId: quotation?.id,
      leadId: lead?.id,
      referenceNo: app.referenceNo,
    });
    return { application: app, customerId, opportunityId: opportunity?.id, quotationId: quotation?.id, leadId: lead?.id };
  }

  // ---------- Communications (legacy) ----------
  listComms(q: any) {
    const where: any = {};
    if (q.relatedType) where.relatedType = q.relatedType;
    if (q.relatedId) where.relatedId = q.relatedId;
    return this.prisma.communication.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async logComm(dto: any, user: AuthedUser) {
    if (!dto?.relatedType || !dto?.relatedId || !dto?.summary) {
      throw new BadRequestException("relatedType, relatedId, summary required");
    }
    const row = await this.prisma.communication.create({
      data: {
        relatedType: dto.relatedType,
        relatedId: dto.relatedId,
        channel: dto.channel || "call",
        direction: dto.direction || "outbound",
        summary: dto.summary,
        byUser: user.id,
      },
    });
    await this.prisma.crmActivity.create({
      data: {
        type: ACTIVITY_TYPES.has(dto.channel) ? dto.channel : "call",
        subject: dto.summary,
        relatedType: dto.relatedType,
        relatedId: dto.relatedId,
        status: "done",
        completedAt: new Date(),
        byUser: user.id,
        assignedTo: user.id,
        branchId: user.branchId ?? null,
      },
    });
    return row;
  }

  // ---------- Reports ----------
  async reportLeadSources(user: AuthedUser) {
    const rows = await this.prisma.lead.groupBy({
      by: ["source"],
      where: { deletedAt: null, ...this.branchFilter(user) },
      _count: { _all: true },
    });
    return {
      rows: rows.map((r) => ({ source: r.source || "unknown", count: r._count._all })),
    };
  }

  async reportConversion(user: AuthedUser) {
    const where = { deletedAt: null, ...this.branchFilter(user) };
    const [total, converted, lost, opps, quotes] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: "converted" } }),
      this.prisma.lead.count({ where: { ...where, status: "lost" } }),
      this.prisma.opportunity.count({ where: { deletedAt: null, ...this.branchFilter(user), status: "converted" } }),
      this.prisma.quotation.count({ where: { deletedAt: null, ...this.branchFilter(user), status: "converted" } }),
    ]);
    return {
      leadsTotal: total,
      leadsConverted: converted,
      leadsLost: lost,
      leadConversionRate: total ? Math.round((converted / total) * 10000) / 100 : 0,
      opportunitiesConverted: opps,
      quotationsConverted: quotes,
    };
  }

  async reportPipeline(user: AuthedUser) {
    const rows = await this.prisma.opportunity.groupBy({
      by: ["stage"],
      where: { deletedAt: null, status: "open", ...this.branchFilter(user) },
      _count: { _all: true },
      _sum: { expectedRevenuePoisha: true },
    });
    return {
      rows: OPP_STAGES.filter((s) => !["won", "lost", "converted"].includes(s)).map((stage) => {
        const r = rows.find((x) => x.stage === stage);
        return {
          stage,
          count: r?._count._all || 0,
          expectedRevenuePoisha: r?._sum.expectedRevenuePoisha || 0,
        };
      }),
    };
  }

  async reportTeam(user: AuthedUser) {
    const leads = await this.prisma.lead.groupBy({
      by: ["assignedTo"],
      where: { deletedAt: null, ...this.branchFilter(user) },
      _count: { _all: true },
    });
    const converted = await this.prisma.lead.groupBy({
      by: ["assignedTo"],
      where: { deletedAt: null, status: "converted", ...this.branchFilter(user) },
      _count: { _all: true },
    });
    const opps = await this.prisma.opportunity.groupBy({
      by: ["assignedTo"],
      where: { deletedAt: null, ...this.branchFilter(user) },
      _sum: { expectedRevenuePoisha: true },
      _count: { _all: true },
    });
    const ids = new Set<string>();
    for (const r of [...leads, ...converted, ...opps]) if (r.assignedTo) ids.add(r.assignedTo);
    return {
      rows: [...ids].map((assignedTo) => ({
        assignedTo,
        leads: leads.find((l) => l.assignedTo === assignedTo)?._count._all || 0,
        converted: converted.find((l) => l.assignedTo === assignedTo)?._count._all || 0,
        opportunities: opps.find((o) => o.assignedTo === assignedTo)?._count._all || 0,
        pipelinePoisha: opps.find((o) => o.assignedTo === assignedTo)?._sum.expectedRevenuePoisha || 0,
      })),
    };
  }

  async reportForecast(user: AuthedUser) {
    const open = await this.prisma.opportunity.findMany({
      where: { deletedAt: null, status: "open", ...this.branchFilter(user) },
      select: { expectedRevenuePoisha: true, probabilityBps: true, stage: true },
    });
    let weighted = 0;
    let unweighted = 0;
    for (const o of open) {
      unweighted += o.expectedRevenuePoisha;
      weighted += Math.round((o.expectedRevenuePoisha * o.probabilityBps) / 10000);
    }
    return {
      openCount: open.length,
      unweightedRevenuePoisha: unweighted,
      weightedRevenuePoisha: weighted,
      currencyCode: "BDT",
    };
  }
}
