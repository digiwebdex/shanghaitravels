import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

const HQ_ROLES = new Set(["super_admin", "general_manager"]);

export type IntelligenceHit = {
  kind:
    | "passport"
    | "nid"
    | "customer_id"
    | "booking"
    | "visa_file"
    | "mobile"
    | "email"
    | "customer_name"
    | "agent"
    | "corporate";
  priority: number;
  customerId?: string;
  applicationId?: string;
  agentId?: string;
  corporateId?: string;
  label: string;
  subtitle: string;
  matchedField: string;
  matchValue: string;
  duplicateHint?: boolean;
};

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private branchFilter(user: AuthedUser) {
    return HQ_ROLES.has(user.role) ? {} : { branchId: user.branchId ?? "__none__" };
  }

  private hasPerm(user: AuthedUser, key: string) {
    return user.role === "super_admin" || user.permissions.has(key);
  }

  async list(user: AuthedUser & { branchId?: string }, q: { page?: number; limit?: number; q?: string; agentId?: string }) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.q) where.OR = ["fullName", "email", "phone", "code"].map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
    // Customer belongs to a B2B agent = owned (FK primary/secondary, V6 Wave 1) OR
    // referred via an application (legacy). AND-wrapped so it composes with search.
    if (q.agentId) where.AND = [{ OR: [{ primaryAgentId: q.agentId }, { secondaryAgentId: q.agentId }, { applications: { some: { agentId: q.agentId, deletedAt: null } } }] }];
    const ownerSelect = { primaryAgent: { select: { id: true, name: true, code: true } } };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: ownerSelect }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async get(id: string, user: AuthedUser & { branchId?: string }) {
    const c = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
      include: { passports: true, primaryAgent: { select: { id: true, name: true, code: true } }, secondaryAgent: { select: { id: true, name: true, code: true } } },
    });
    if (!c) throw new NotFoundException("Customer not found");
    return c;
  }

  async create(dto: any, user: AuthedUser & { branchId?: string }) {
    const fullName = String(dto.fullName || "").trim();
    const phone = String(dto.phone || "").trim();
    const email = dto.email ? String(dto.email).trim() : undefined;
    if (fullName.length < 2) throw new BadRequestException("Full name is required (min 2 characters)");
    if (phone.length < 6) throw new BadRequestException("A valid phone number is required");
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException("Email is not valid");
    const branchId = user.branchId ?? dto.branchId;
    const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
    return this.prisma.customer.create({
      data: {
        branchId, code, fullName, email, phone, whatsapp: dto.whatsapp,
        nationality: dto.nationality, gender: dto.gender, address: dto.address, notes: dto.notes,
        dob: dto.dob ? new Date(dto.dob) : null, createdBy: user.id,
      },
    });
  }

  async update(id: string, dto: any, user: AuthedUser & { branchId?: string }) {
    await this.get(id, user);
    const { fullName, email, phone, whatsapp, nationality, gender, address, notes, status } = dto;
    return this.prisma.customer.update({ where: { id }, data: { fullName, email, phone, whatsapp, nationality, gender, address, notes, status } });
  }

  async softDelete(id: string, user: AuthedUser & { branchId?: string }) {
    await this.get(id, user);
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  /**
   * Enterprise global intelligence search — priority-ranked, branch-scoped.
   * No schema changes; uses existing indexed unique fields (passportNo, code, referenceNo, …).
   */
  async intelligenceSearch(user: AuthedUser, qRaw: string) {
    const t0 = Date.now();
    const q = String(qRaw || "").trim();
    if (q.length < 2) return { query: q, hits: [] as IntelligenceHit[], tookMs: 0 };

    const branch = this.branchFilter(user);
    const custBranch = { deletedAt: null, ...branch };
    const hits: IntelligenceHit[] = [];
    const isEmail = q.includes("@");
    const digits = q.replace(/\D/g, "");
    const isPhone = digits.length >= 6 && /^[\d+\-\s()]+$/.test(q);
    const isPassportLike = /^[A-Za-z0-9]{5,12}$/.test(q) && !isPhone && !isEmail;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);

    const push = (h: IntelligenceHit) => hits.push(h);

    // 1) Passport — central repository: saved Customer passports + the Passport-OCR /
    // Document Intelligence store (OcrScan). Exact, partial and MRZ (rawText), case-insensitive.
    if (isPassportLike || q.length >= 3) {
      const passports = await this.prisma.passport.findMany({
        where: {
          passportNo: { contains: q, mode: "insensitive" },
          customer: custBranch,
        },
        take: 8,
        include: { customer: { select: { id: true, fullName: true, code: true, phone: true, status: true } } },
      });
      const dup = passports.length > 1;
      const seenPass = new Set<string>();
      for (const p of passports) {
        seenPass.add(p.passportNo.toUpperCase());
        push({
          kind: "passport",
          priority: 1,
          customerId: p.customerId,
          label: p.customer.fullName,
          subtitle: `${p.customer.code} · Passport ${p.passportNo}`,
          matchedField: "passportNo",
          matchValue: p.passportNo,
          duplicateHint: dup,
        });
      }

      // Also search the Passport-OCR / Document Intelligence repository so a passport that
      // was scanned (or linked to a booking/visa case) but not yet saved as a Customer
      // passport still appears. Reuses the existing OcrScan store + the same JSON/rawText
      // pattern as the NID step below — no new table, API or schema.
      try {
        const ocrPass = await this.prisma.ocrScan.findMany({
          where: {
            deletedAt: null,
            docType: "passport",
            ...branch,
            OR: [
              { fields: { path: ["passportNo"], equals: q } },
              { rawText: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { customerId: true, applicationId: true, fields: true },
        });
        for (const row of ocrPass) {
          const f = (row.fields || {}) as Record<string, unknown>;
          const no = String(f.passportNo || "").trim();
          if (!no || seenPass.has(no.toUpperCase())) continue;
          seenPass.add(no.toUpperCase());
          let customer: { id: string; fullName: string; code: string } | null = null;
          if (row.customerId) {
            customer = await this.prisma.customer.findFirst({
              where: { id: row.customerId, ...custBranch },
              select: { id: true, fullName: true, code: true },
            });
          }
          push({
            kind: "passport",
            priority: 1,
            customerId: customer?.id,
            applicationId: row.applicationId || undefined,
            label: customer?.fullName || `Passport ${no}`,
            subtitle: customer ? `${customer.code} · Passport ${no}` : `Document Intelligence · Passport ${no}`,
            matchedField: "passportNo",
            matchValue: no,
          });
        }
      } catch {
        /* JSON-path support varies; saved passports already returned above. */
      }
    }

    // 2) NID — OCR fields JSON + rawText (no dedicated NID column)
    if (!isEmail && q.length >= 4) {
      try {
        const ocrRows = await this.prisma.ocrScan.findMany({
          where: {
            deletedAt: null,
            customerId: { not: null },
            OR: [
              { fields: { path: ["nidNumber"], equals: q } },
              { fields: { path: ["nationalId"], equals: q } },
              { fields: { path: ["nid"], equals: q } },
              { rawText: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 6,
          select: { customerId: true, fields: true },
        });
        const seen = new Set<string>();
        for (const row of ocrRows) {
          if (!row.customerId || seen.has(row.customerId)) continue;
          const cust = await this.prisma.customer.findFirst({
            where: { id: row.customerId, ...custBranch },
            select: { id: true, fullName: true, code: true },
          });
          if (!cust) continue;
          seen.add(cust.id);
          const fields = (row.fields || {}) as Record<string, unknown>;
          const nidVal = String(fields.nidNumber || fields.nationalId || fields.nid || q);
          push({
            kind: "nid",
            priority: 2,
            customerId: cust.id,
            label: cust.fullName,
            subtitle: `${cust.code} · NID ${nidVal}`,
            matchedField: "nid",
            matchValue: nidVal,
          });
        }
      } catch {
        /* JSON path support varies — ignore */
      }
    }

    // 3) Customer ID / code
    if (isUuid) {
      const byId = await this.prisma.customer.findFirst({
        where: { id: q, ...custBranch },
        select: { id: true, fullName: true, code: true },
      });
      if (byId) {
        push({
          kind: "customer_id",
          priority: 3,
          customerId: byId.id,
          label: byId.fullName,
          subtitle: byId.code,
          matchedField: "id",
          matchValue: byId.id,
        });
      }
    }
    {
      const byCode = await this.prisma.customer.findMany({
        where: {
          ...custBranch,
          OR: [
            { code: { equals: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        select: { id: true, fullName: true, code: true },
      });
      for (const c of byCode) {
        push({
          kind: "customer_id",
          priority: 3,
          customerId: c.id,
          label: c.fullName,
          subtitle: c.code,
          matchedField: "code",
          matchValue: c.code,
        });
      }
    }

    // 4) Booking / application reference
    if (this.hasPerm(user, "application:read") || user.role === "super_admin") {
      const apps = await this.prisma.application.findMany({
        where: {
          deletedAt: null,
          ...branch,
          OR: [
            { referenceNo: { equals: q, mode: "insensitive" } },
            { referenceNo: { contains: q, mode: "insensitive" } },
            { id: isUuid ? q : undefined },
          ].filter((x) => {
            if ("id" in x && x.id === undefined) return false;
            return true;
          }) as any[],
        },
        take: 8,
        include: { customer: { select: { id: true, fullName: true, code: true } } },
      });
      for (const a of apps) {
        push({
          kind: "booking",
          priority: 4,
          customerId: a.customerId,
          applicationId: a.id,
          label: a.referenceNo,
          subtitle: `${a.customer?.fullName || "—"} · ${a.serviceType} · ${a.status}`,
          matchedField: "referenceNo",
          matchValue: a.referenceNo,
        });
      }
    }

    // 5) Visa file / application / visa number
    if (this.hasPerm(user, "application:read") || user.role === "super_admin") {
      const visas = await this.prisma.visaDetail.findMany({
        where: {
          OR: [
            { applicationNo: { equals: q, mode: "insensitive" } },
            { applicationNo: { contains: q, mode: "insensitive" } },
            { visaNumber: { equals: q, mode: "insensitive" } },
            { visaNumber: { contains: q, mode: "insensitive" } },
          ],
          application: { deletedAt: null, ...branch },
        },
        take: 6,
        include: {
          application: {
            select: {
              id: true,
              referenceNo: true,
              customerId: true,
              customer: { select: { fullName: true, code: true } },
            },
          },
        },
      });
      for (const v of visas) {
        const val = v.applicationNo || v.visaNumber || q;
        push({
          kind: "visa_file",
          priority: 5,
          customerId: v.application.customerId,
          applicationId: v.application.id,
          label: v.application.customer?.fullName || v.application.referenceNo,
          subtitle: `Visa file ${val} · ${v.application.referenceNo}`,
          matchedField: v.applicationNo ? "applicationNo" : "visaNumber",
          matchValue: String(val),
        });
      }
    }

    // 6) Mobile
    if (isPhone || digits.length >= 6) {
      const phoneQ = digits.length >= 6 ? digits.slice(-10) : q;
      const mobiles = await this.prisma.customer.findMany({
        where: {
          ...custBranch,
          OR: [
            { phone: { contains: phoneQ, mode: "insensitive" } },
            { whatsapp: { contains: phoneQ, mode: "insensitive" } },
          ],
        },
        take: 8,
        select: { id: true, fullName: true, code: true, phone: true },
      });
      for (const c of mobiles) {
        push({
          kind: "mobile",
          priority: 6,
          customerId: c.id,
          label: c.fullName,
          subtitle: `${c.code} · ${c.phone || ""}`,
          matchedField: "phone",
          matchValue: c.phone || phoneQ,
        });
      }
    }

    // 7) Email
    if (isEmail || q.includes(".")) {
      const emails = await this.prisma.customer.findMany({
        where: {
          ...custBranch,
          email: { contains: q, mode: "insensitive" },
        },
        take: 8,
        select: { id: true, fullName: true, code: true, email: true },
      });
      for (const c of emails) {
        push({
          kind: "email",
          priority: 7,
          customerId: c.id,
          label: c.fullName,
          subtitle: `${c.code} · ${c.email}`,
          matchedField: "email",
          matchValue: c.email || q,
        });
      }
    }

    // 8) Customer name
    if (!isEmail && !isPhone && q.length >= 2) {
      const names = await this.prisma.customer.findMany({
        where: {
          ...custBranch,
          fullName: { contains: q, mode: "insensitive" },
        },
        take: 10,
        select: { id: true, fullName: true, code: true, phone: true },
      });
      for (const c of names) {
        push({
          kind: "customer_name",
          priority: 8,
          customerId: c.id,
          label: c.fullName,
          subtitle: `${c.code}${c.phone ? ` · ${c.phone}` : ""}`,
          matchedField: "fullName",
          matchValue: c.fullName,
        });
      }
    }

    // 9) Agent name
    if (this.hasPerm(user, "agent:manage") || this.hasPerm(user, "partner:read") || user.role === "super_admin") {
      try {
        const agents = await this.prisma.agent.findMany({
          where: {
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 6,
          select: { id: true, name: true, code: true, phone: true, commissionRateBps: true, branchId: true },
        });
        for (const a of agents) {
          push({
            kind: "agent",
            priority: 9,
            agentId: a.id,
            label: a.name,
            subtitle: `${a.code} · commission ${(a.commissionRateBps / 100).toFixed(2)}%`,
            matchedField: "agent",
            matchValue: a.name,
          });
        }
      } catch {
        /* agent table/perm */
      }
    }

    // 10) Corporate name
    if (this.hasPerm(user, "corporate:manage") || this.hasPerm(user, "partner:read") || user.role === "super_admin") {
      try {
        const corps = await this.prisma.corporateClient.findMany({
          where: {
            deletedAt: null,
            OR: [
              { companyName: { contains: q, mode: "insensitive" } },
              { contactPerson: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 6,
          select: { id: true, companyName: true, contactPerson: true, phone: true },
        });
        for (const c of corps) {
          push({
            kind: "corporate",
            priority: 10,
            corporateId: c.id,
            label: c.companyName,
            subtitle: c.contactPerson || c.phone || "Corporate client",
            matchedField: "companyName",
            matchValue: c.companyName,
          });
        }
      } catch {
        /* corporate */
      }
    }

    // Deduplicate: keep best priority per entity key
    const best = new Map<string, IntelligenceHit>();
    for (const h of hits) {
      const key = h.customerId
        ? `c:${h.customerId}`
        : h.applicationId
          ? `a:${h.applicationId}`
          : h.agentId
            ? `ag:${h.agentId}`
            : h.corporateId
              ? `co:${h.corporateId}`
              : `${h.kind}:${h.matchValue}`;
      const prev = best.get(key);
      if (!prev || h.priority < prev.priority) best.set(key, h);
    }

    const ranked = [...best.values()].sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
    return { query: q, hits: ranked.slice(0, 40), tookMs: Date.now() - t0 };
  }

  /** 360° customer intelligence profile for search result dashboard. */
  async intelligenceProfile(id: string, user: AuthedUser) {
    // branchId on AuthedUser is string|null|undefined; get() wants string|undefined — normalize null→undefined.
    const customer = await this.get(id, { ...user, branchId: user.branchId ?? undefined });
    const canFinance =
      this.hasPerm(user, "invoice:amount:read") ||
      this.hasPerm(user, "invoice:read") ||
      this.hasPerm(user, "finance:read") ||
      user.role === "super_admin";
    const canApps = this.hasPerm(user, "application:read") || user.role === "super_admin";
    const canCrm = this.hasPerm(user, "crm:read") || user.role === "super_admin";
    const canDocs = this.hasPerm(user, "document:read") || this.hasPerm(user, "ocr:use") || user.role === "super_admin";

    const apps = canApps
      ? await this.prisma.application.findMany({
          where: { customerId: id, deletedAt: null, ...this.branchFilter(user) },
          orderBy: { createdAt: "desc" },
          take: 40,
          include: {
            visa: true,
            airTicket: true,
            hotel: true,
            tour: true,
            transport: true,
            hajjUmrah: true,
            student: true,
            stages: { orderBy: { stageNo: "asc" } },
            events: { orderBy: { createdAt: "desc" }, take: 30 },
            tasks: { where: { deletedAt: null, status: { not: "done" as any } }, take: 10 },
          },
        })
      : [];

    const invoices = canFinance
      ? await this.prisma.invoice.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { payments: { where: { deletedAt: null } } },
        })
      : [];

    const payments = canFinance
      ? await this.prisma.payment.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { receivedAt: "desc" },
          take: 30,
        })
      : [];

    const documents = canDocs
      ? await this.prisma.document.findMany({
          where: { ownerType: "customer", ownerId: id, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 40,
        })
      : [];

    const ocrScans = canDocs
      ? await this.prisma.ocrScan.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            docType: true,
            status: true,
            confidence: true,
            fields: true,
            createdAt: true,
            appliedAt: true,
          },
        })
      : [];

    const leads = canCrm
      ? await this.prisma.lead.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 10,
        })
      : [];

    const opportunities = canCrm
      ? await this.prisma.opportunity
          .findMany({
            where: { deletedAt: null, OR: [{ customerId: id }, { lead: { customerId: id } }] },
            orderBy: { updatedAt: "desc" },
            take: 10,
          })
          .catch(() => [])
      : [];

    const communications = await this.prisma.communication
      .findMany({
        where: { relatedType: "customer", relatedId: id },
        orderBy: { createdAt: "desc" },
        take: 40,
      })
      .catch(() => []);

    // Agent / corporate from latest apps
    let agent: any = null;
    let corporate: any = null;
    const agentId = apps.find((a) => a.agentId)?.agentId;
    const corpId = apps.find((a) => a.corporateClientId)?.corporateClientId;
    if (agentId) {
      agent = await this.prisma.agent.findFirst({
        where: { id: agentId, deletedAt: null },
        select: { id: true, name: true, code: true, commissionRateBps: true, branchId: true, phone: true, email: true },
      });
    }
    if (corpId) {
      corporate = await this.prisma.corporateClient.findFirst({
        where: { id: corpId, deletedAt: null },
        select: { id: true, companyName: true, contactPerson: true, phone: true, email: true },
      });
    }

    const openStatuses = new Set(["draft", "submitted", "in_progress", "pending", "docs_required", "processing"]);
    const current = apps.find((a) => openStatuses.has(a.status)) || apps[0] || null;

    const byService = (st: string) => apps.filter((a) => a.serviceType === st);
    const statusOf = (list: typeof apps) => list[0]?.status || null;

    let outstandingDue = 0;
    let paidAmount = 0;
    let refundAmount = 0;
    if (canFinance) {
      for (const inv of invoices) {
        const paid = (inv.payments || [])
          .filter((p) => p.kind === "payment" || !p.kind)
          .reduce((s, p) => s + (p.amount || 0), 0);
        const refunds = (inv.payments || [])
          .filter((p) => p.kind === "refund")
          .reduce((s, p) => s + (p.amount || 0), 0);
        paidAmount += paid;
        refundAmount += refunds;
        if (!["cancelled", "void", "draft"].includes(inv.status)) {
          outstandingDue += Math.max(0, (inv.total || 0) - paid + refunds);
        }
      }
    }

    const timeline: { at: string; type: string; title: string; meta?: string }[] = [];
    timeline.push({ at: customer.createdAt.toISOString(), type: "customer", title: "Customer Created" });
    for (const p of customer.passports || []) {
      timeline.push({
        at: customer.createdAt.toISOString(),
        type: "passport",
        title: "Passport on file",
        meta: p.passportNo,
      });
    }
    for (const s of ocrScans) {
      timeline.push({
        at: s.createdAt.toISOString(),
        type: "ocr",
        title: s.appliedAt ? "OCR Completed" : `OCR ${s.status}`,
        meta: `${s.docType}${s.confidence != null ? ` · ${Math.round(s.confidence)}%` : ""}`,
      });
    }
    for (const a of apps) {
      timeline.push({
        at: a.createdAt.toISOString(),
        type: "booking",
        title: `Booking ${a.referenceNo}`,
        meta: `${a.serviceType} · ${a.status}`,
      });
      for (const ev of a.events || []) {
        timeline.push({
          at: ev.createdAt.toISOString(),
          type: "event",
          title: ev.message || ev.type,
          meta: a.referenceNo,
        });
      }
      if (a.visa?.submittedAt) {
        timeline.push({ at: a.visa.submittedAt.toISOString(), type: "visa", title: "Visa Submitted", meta: a.referenceNo });
      }
      if (a.visa?.outcome === "approved" && a.visa.decisionAt) {
        timeline.push({ at: a.visa.decisionAt.toISOString(), type: "visa", title: "Visa Approved", meta: a.referenceNo });
      }
      if (a.completedAt) {
        timeline.push({ at: a.completedAt.toISOString(), type: "travel", title: "Travel / Case Completed", meta: a.referenceNo });
      }
    }
    for (const p of payments) {
      timeline.push({
        at: p.receivedAt.toISOString(),
        type: "payment",
        title: p.kind === "refund" ? "Refund Issued" : "Payment Received",
        meta: String(p.amount),
      });
    }
    for (const c of communications) {
      timeline.push({
        at: c.createdAt.toISOString(),
        type: "comms",
        title: c.summary || c.channel,
        meta: c.channel,
      });
    }
    timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    const pendingTasks = apps.flatMap((a) =>
      (a.tasks || []).map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        applicationId: a.id,
        referenceNo: a.referenceNo,
        dueAt: t.dueAt,
      })),
    );

    const primaryPassport = (customer.passports || []).find((p) => p.isPrimary) || (customer.passports || [])[0] || null;
    const vip = (customer.notes || "").toLowerCase().includes("vip") || customer.type === "vip";

    return {
      customer: {
        id: customer.id,
        code: customer.code,
        fullName: customer.fullName,
        passportNo: primaryPassport?.passportNo || null,
        nationality: customer.nationality,
        dob: customer.dob,
        gender: customer.gender,
        mobile: customer.phone,
        whatsapp: customer.whatsapp,
        email: customer.email,
        address: customer.address,
        status: customer.status,
        tier: vip ? "VIP" : "Regular",
        type: customer.type,
        photoDocumentId: documents.find((d) => (d.category || "").toLowerCase().includes("photo"))?.id || null,
        passports: customer.passports,
      },
      bookings: {
        total: apps.length,
        current: current
          ? {
              id: current.id,
              referenceNo: current.referenceNo,
              status: current.status,
              serviceType: current.serviceType,
              currentStage: current.currentStage,
              totalStages: current.totalStages,
              assignedTo: current.assignedTo,
            }
          : null,
        visaStatus: statusOf(byService("visa")),
        ticketStatus: statusOf(byService("air_ticket")),
        hotelStatus: statusOf(byService("hotel")),
        tourStatus: statusOf(byService("tour")),
        transportStatus: statusOf(byService("transport")),
        hajjStatus: statusOf(byService("hajj_umrah")) || statusOf(byService("hajj")),
        studentStatus: statusOf(byService("student")),
        manpowerStatus: statusOf(byService("work")) || statusOf(byService("manpower")),
        upcoming: apps
          .filter((a) => !["completed", "cancelled", "rejected"].includes(a.status))
          .slice(0, 5)
          .map((a) => ({ id: a.id, referenceNo: a.referenceNo, serviceType: a.serviceType, status: a.status })),
        history: apps
          .filter((a) => ["completed", "cancelled", "rejected"].includes(a.status))
          .slice(0, 8)
          .map((a) => ({ id: a.id, referenceNo: a.referenceNo, serviceType: a.serviceType, status: a.status })),
        list: apps.slice(0, 12).map((a) => ({
          id: a.id,
          referenceNo: a.referenceNo,
          serviceType: a.serviceType,
          status: a.status,
          currentStage: a.currentStage,
          totalStages: a.totalStages,
        })),
      },
      finance: canFinance
        ? {
            outstandingDue,
            paidAmount,
            refundAmount,
            invoices: invoices.map((i) => ({
              id: i.id,
              invoiceNo: i.invoiceNo,
              status: i.status,
              total: i.total,
              dueAt: i.dueAt,
            })),
            payments: payments.slice(0, 15).map((p) => ({
              id: p.id,
              amount: p.amount,
              kind: p.kind,
              method: p.method,
              receivedAt: p.receivedAt,
            })),
          }
        : null,
      documents: canDocs
        ? {
            items: documents.map((d) => ({
              id: d.id,
              category: d.category,
              fileName: d.fileName,
              status: d.status,
              isPassport: d.isPassport,
              createdAt: d.createdAt,
            })),
            ocr: ocrScans,
          }
        : null,
      crm: canCrm
        ? {
            leads: leads.map((l) => ({
              id: l.id,
              name: l.name,
              status: l.status,
              priority: l.priority,
              assignedTo: l.assignedTo,
              updatedAt: l.updatedAt,
            })),
            opportunities: (opportunities as any[]).map((o) => ({
              id: o.id,
              title: o.title || o.name,
              stage: o.stage || o.status,
              assignedTo: o.assignedTo,
            })),
            salesExecutive: leads[0]?.assignedTo || null,
            lastContact: communications[0]?.createdAt || null,
          }
        : null,
      operations: current
        ? {
            currentStage: current.currentStage,
            stageName: current.stages?.find((s) => s.stageNo === current.currentStage)?.name || null,
            assignedOfficer: current.assignedTo,
            pendingTasks,
            urgent: current.priority === "urgent" || current.priority === "high",
            workflow: (current.stages || []).map((s) => ({
              stageNo: s.stageNo,
              name: s.name,
              status: (s as any).status,
            })),
          }
        : { currentStage: null, pendingTasks, urgent: false, workflow: [] },
      agent,
      corporate,
      communications: communications.slice(0, 20).map((c) => ({
        id: c.id,
        channel: c.channel,
        summary: c.summary,
        createdAt: c.createdAt,
        status: c.status,
      })),
      timeline: timeline.slice(-60),
      permissions: {
        finance: canFinance,
        applications: canApps,
        crm: canCrm,
        documents: canDocs,
      },
      duplicate: {
        passportExists: (customer.passports || []).length > 0,
        passportCount: (customer.passports || []).length,
        bookingCount: apps.length,
        documentCount: documents.length,
      },
    };
  }

  /** Passport / search health reports (additive; most-searched is client-tracked). */
  async intelligenceReports(user: AuthedUser) {
    const branch = this.branchFilter(user);
    const now = new Date();
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const passports = await this.prisma.passport.findMany({
      where: { customer: { deletedAt: null, ...branch } },
      include: { customer: { select: { id: true, fullName: true, code: true } } },
      take: 5000,
    });

    const byNo = new Map<string, typeof passports>();
    for (const p of passports) {
      const key = p.passportNo.toUpperCase();
      const arr = byNo.get(key) || [];
      arr.push(p);
      byNo.set(key, arr);
    }
    const duplicates = [...byNo.entries()]
      .filter(([, rows]) => rows.length > 1)
      .slice(0, 50)
      .map(([passportNo, rows]) => ({
        passportNo,
        count: rows.length,
        customers: rows.map((r) => ({ id: r.customer.id, name: r.customer.fullName, code: r.customer.code })),
      }));

    const expired = passports
      .filter((p) => p.expiryDate && p.expiryDate < now)
      .slice(0, 50)
      .map((p) => ({
        passportNo: p.passportNo,
        expiryDate: p.expiryDate,
        customerId: p.customerId,
        customerName: p.customer.fullName,
        code: p.customer.code,
      }));

    const expiringSoon = passports
      .filter((p) => p.expiryDate && p.expiryDate >= now && p.expiryDate <= in90)
      .slice(0, 50)
      .map((p) => ({
        passportNo: p.passportNo,
        expiryDate: p.expiryDate,
        customerId: p.customerId,
        customerName: p.customer.fullName,
        code: p.customer.code,
      }));

    const customersMissingPassport = await this.prisma.customer.count({
      where: { deletedAt: null, ...branch, passports: { none: {} } },
    });

    const pendingOcr = await this.prisma.ocrScan.count({
      where: { deletedAt: null, status: { in: ["pending", "processing", "failed"] as any } },
    });

    return {
      duplicatePassports: duplicates,
      expiredPassports: expired,
      expiringSoonPassports: expiringSoon,
      pendingPassports: customersMissingPassport,
      pendingOcrScans: pendingOcr,
      totals: {
        passportsIndexed: passports.length,
        duplicateGroups: duplicates.length,
        expired: expired.length,
        expiringSoon: expiringSoon.length,
      },
    };
  }

  // ================= V6 Wave 1: Customer Ownership =================

  private async auditOwnership(user: AuthedUser, action: string, customerId: string, before?: unknown, after?: unknown) {
    try {
      await this.prisma.auditLog.create({
        data: { userId: user.id, action, entityType: "Customer", entityId: customerId,
          before: before == null ? undefined : (before as any), after: after == null ? undefined : (after as any) },
      });
    } catch { /* best-effort */ }
  }

  private async requireCustomer(id: string) {
    const c = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!c) throw new NotFoundException("Customer not found");
    return c;
  }

  async ownershipHistory(customerId: string) {
    await this.requireCustomer(customerId);
    return this.prisma.customerAssignment.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, take: 100 });
  }

  /** Assign / reassign the PRIMARY agent (the owner). Writes history + audit. */
  async assignPrimary(customerId: string, dto: { agentId?: string; reason?: string }, user: AuthedUser) {
    const c = await this.requireCustomer(customerId);
    if (!dto.agentId) throw new BadRequestException("agentId required");
    const agent = await this.prisma.agent.findFirst({ where: { id: dto.agentId, deletedAt: null } });
    if (!agent) throw new NotFoundException("Agent not found");
    if (c.primaryAgentId === dto.agentId) return c;
    const action = c.primaryAgentId ? "reassign" : "assign";
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.customer.update({ where: { id: customerId }, data: { primaryAgentId: dto.agentId, assignedById: user.id } });
      await tx.customerAssignment.create({ data: { customerId, fromAgentId: c.primaryAgentId, toAgentId: dto.agentId, role: "primary", action, reason: dto.reason ?? null, assignedById: user.id } });
      return u;
    });
    await this.auditOwnership(user, `customer.ownership.${action}`, customerId, { primaryAgentId: c.primaryAgentId }, { primaryAgentId: dto.agentId });
    return updated;
  }

  /** Release a customer to the house (primary → null). Writes history + audit. */
  async releaseOwnership(customerId: string, dto: { reason?: string }, user: AuthedUser) {
    const c = await this.requireCustomer(customerId);
    if (!c.primaryAgentId) return c;
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.customer.update({ where: { id: customerId }, data: { primaryAgentId: null, assignedById: user.id } });
      await tx.customerAssignment.create({ data: { customerId, fromAgentId: c.primaryAgentId, toAgentId: null, role: "primary", action: "release", reason: dto.reason ?? null, assignedById: user.id } });
      return u;
    });
    await this.auditOwnership(user, "customer.ownership.release", customerId, { primaryAgentId: c.primaryAgentId }, { primaryAgentId: null });
    return updated;
  }

  /** Add or remove the optional SECONDARY (co-servicing) agent. */
  async setSecondary(customerId: string, dto: { agentId?: string | null; reason?: string }, user: AuthedUser) {
    const c = await this.requireCustomer(customerId);
    const to = dto.agentId || null;
    if (to) {
      const agent = await this.prisma.agent.findFirst({ where: { id: to, deletedAt: null } });
      if (!agent) throw new NotFoundException("Agent not found");
      if (to === c.primaryAgentId) throw new BadRequestException("Secondary agent must differ from the primary");
    }
    const action = to ? "add_secondary" : "remove_secondary";
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.customer.update({ where: { id: customerId }, data: { secondaryAgentId: to } });
      await tx.customerAssignment.create({ data: { customerId, fromAgentId: c.secondaryAgentId, toAgentId: to, role: "secondary", action, reason: dto.reason ?? null, assignedById: user.id } });
      return u;
    });
    await this.auditOwnership(user, `customer.ownership.${action}`, customerId, { secondaryAgentId: c.secondaryAgentId }, { secondaryAgentId: to });
    return updated;
  }
}
