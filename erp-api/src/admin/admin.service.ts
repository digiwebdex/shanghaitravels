import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ---- CMS pages (cms:manage) ----
  listPages() { return this.prisma.cmsPage.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" } }); }
  async getPage(slug: string) {
    const p = await this.prisma.cmsPage.findFirst({ where: { slug, deletedAt: null } });
    if (!p) throw new NotFoundException("Page not found");
    return p;
  }
  upsertPage(dto: any, user: AuthedUser) {
    return this.prisma.cmsPage.upsert({
      where: { slug: dto.slug },
      create: { slug: dto.slug, title: dto.title ?? dto.slug, body: dto.body ?? "", published: !!dto.published, updatedBy: user.id },
      update: { title: dto.title, body: dto.body, published: dto.published, updatedBy: user.id },
    });
  }
  async deletePage(slug: string) {
    await this.getPage(slug);
    await this.prisma.cmsPage.update({ where: { slug }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  // ---- Settings (key-value; settings:manage) ----
  listSettings() { return this.prisma.setting.findMany(); }
  setSetting(key: string, value: any, user: AuthedUser) {
    return this.prisma.setting.upsert({ where: { key }, create: { key, value, updatedBy: user.id }, update: { value, updatedBy: user.id } });
  }

  /**
   * Shanghai Travels Owner Requirement — Delivery Report.
   *
   * One row per application that has a real submission or customer-delivery
   * signal. Every column traces to existing data — nothing is invented:
   *   Submit Date    → VisaDetail.submittedAt (recorded on the visa form), else
   *                    the completedAt of a workflow stage named …Submission/
   *                    …Submitted (e.g. "Embassy Submission", "Application
   *                    Submitted") — the actual workflow event.
   *   Delivery Date  → VisaDetail.deliveredAt — stamped ONLY when the visa
   *                    "Delivered" stage completes (advanceStage), else the
   *                    completedAt of a stage named exactly "Delivered"
   *                    (air ticket / transport e-ticket & document handover).
   *                    "Collected" stamps collectedAt separately, so an embassy
   *                    return can NEVER appear as a customer delivery.
   *   Customer class → Application.corporateClientId → Corporate;
   *                    Application.agentId (BUG-02 snapshot) or
   *                    Customer.primaryAgentId → Agent; otherwise Individual.
   *   Passport No    → the customer's primary passport (else newest), falling
   *                    back to HajjUmrahDetail.passportNo.
   *   Remarks        → the service detail's existing notes field.
   */
  /**
   * Submit Report (owner requirement P16) — the SAME audited data path as the
   * Delivery Report, filtered to applications that carry a real SUBMISSION
   * event. There is deliberately no second query/engine: mode="submit" narrows
   * the signal to submittedAt / the "…Submission"/"…Submitted" stage, so the
   * Submit Date is never fabricated.
   */
  deliveryReport = (user: AuthedUser, q: any) => this.movementsReport(user, q, "delivery");
  submitReport = (user: AuthedUser, q: any) => this.movementsReport(user, q, "submit");

  private async movementsReport(
    user: AuthedUser,
    q: { from?: string; to?: string; customerType?: string; take?: number; skip?: number },
    mode: "delivery" | "submit",
  ) {
    const HQ = user.role === "super_admin" || user.role === "general_manager";
    const take = Math.min(Math.max(Number(q.take) || 100, 1), 500);
    const skip = Math.max(Number(q.skip) || 0, 0);
    const from = q.from ? new Date(q.from) : null;
    const to = q.to ? new Date(`${q.to}T23:59:59.999Z`) : null;
    const range = from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : null;

    // Stage names that legitimately mean "submitted to the authority" and
    // "delivered to the customer" in the EXISTING workflow templates.
    const SUBMIT_STAGES = ["Embassy Submission", "Application Submitted"];
    const DELIVER_STAGES = ["Delivered"];

    const signal = (names: string[], withRange: boolean) => ({
      stages: { some: { name: { in: names }, status: "done", ...(withRange && range ? { completedAt: range } : {}) } },
    });

    const where: any = {
      deletedAt: null,
      ...(HQ ? {} : { branchId: user.branchId ?? "__none__" }),
      // A row must carry a real signal (date-filtered when a range is given) —
      // the report is a register of events, not a case list. Submit mode keys
      // on the submission event; delivery mode on either submit or delivery.
      OR: range
        ? [
            { visa: { is: { submittedAt: range } } },
            signal(SUBMIT_STAGES, true),
            ...(mode === "delivery"
              ? [{ visa: { is: { deliveredAt: range } } }, signal(DELIVER_STAGES, true)]
              : []),
          ]
        : [
            { visa: { is: { submittedAt: { not: null } } } },
            signal(SUBMIT_STAGES, false),
            ...(mode === "delivery"
              ? [{ visa: { is: { deliveredAt: { not: null } } } }, signal(DELIVER_STAGES, false)]
              : []),
          ],
    };

    // Customer classification filter — reuses the existing ownership fields.
    const ctype = String(q.customerType || "all").toLowerCase();
    if (ctype === "agent") {
      where.AND = [{ corporateClientId: null }, { OR: [{ agentId: { not: null } }, { customer: { is: { primaryAgentId: { not: null } } } }] }];
    } else if (ctype === "corporate") {
      where.AND = [{ OR: [{ corporateClientId: { not: null } }, { customer: { is: { type: "corporate" } } }] }];
    } else if (ctype === "individual") {
      where.AND = [
        { corporateClientId: null },
        { agentId: null },
        { customer: { is: { primaryAgentId: null, type: { not: "corporate" } } } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          customer: {
            select: {
              fullName: true, code: true, type: true, primaryAgentId: true,
              passports: { select: { passportNo: true, isPrimary: true, issueDate: true } },
            },
          },
          visa: true, airTicket: true, hotel: true, transport: true, tour: true,
          hajjUmrah: true, student: true, work: true,
          stages: { select: { name: true, status: true, completedAt: true } },
        },
      }),
    ]);

    // Resolve agent / corporate display names in two batched lookups.
    const agentIds = new Set<string>();
    const corpIds = new Set<string>();
    for (const a of rows as any[]) {
      if (a.corporateClientId) corpIds.add(a.corporateClientId);
      else if (a.agentId) agentIds.add(a.agentId);
      else if (a.customer?.primaryAgentId) agentIds.add(a.customer.primaryAgentId);
    }
    const [agents, corps] = await Promise.all([
      agentIds.size ? this.prisma.agent.findMany({ where: { id: { in: [...agentIds] } }, select: { id: true, name: true, code: true } }) : [],
      corpIds.size ? this.prisma.corporateClient.findMany({ where: { id: { in: [...corpIds] } }, select: { id: true, companyName: true } }) : [],
    ]);
    const agentById = new Map<string, { id: string; name: string; code: string }>(agents.map((a) => [a.id, a] as const));
    const corpById = new Map<string, { id: string; companyName: string }>(corps.map((c) => [c.id, c] as const));

    const CATEGORY: Record<string, string> = {
      visa: "Visa", air_ticket: "Air Ticket", hotel: "Hotel", transport: "Transport",
      tour: "Tour", hajj: "Hajj", umrah: "Umrah", student: "Student", work: "Manpower",
      medical: "Medical", immigration: "Immigration", insurance: "Insurance", corporate: "Corporate",
    };

    const stageDone = (a: any, names: string[]): Date | null => {
      const hit = (a.stages || []).find((s: any) => names.includes(s.name) && s.status === "done" && s.completedAt);
      return hit ? hit.completedAt : null;
    };

    const data = (rows as any[]).map((a) => {
      const passports = (a.customer?.passports || []).slice().sort(
        (x: any, y: any) => Number(y.isPrimary) - Number(x.isPrimary) || +new Date(y.issueDate || 0) - +new Date(x.issueDate || 0),
      );
      const subtype =
        a.visa?.visaType ?? a.airTicket?.tripType ?? a.hotel?.roomType ?? a.transport?.serviceKind ??
        a.tour?.packageType ?? a.hajjUmrah?.packageType ?? a.student?.degreeLevel ?? a.work?.visaType ?? null;
      const remarks =
        a.visa?.notes ?? a.airTicket?.notes ?? a.hotel?.notes ?? a.transport?.notes ??
        a.tour?.notes ?? a.hajjUmrah?.notes ?? a.student?.notes ?? a.work?.notes ?? null;

      let customerClass = "Individual";
      let ownerName: string | null = null;
      if (a.corporateClientId || a.customer?.type === "corporate") {
        customerClass = "Corporate";
        ownerName = a.corporateClientId ? corpById.get(a.corporateClientId)?.companyName ?? null : null;
      } else if (a.agentId || a.customer?.primaryAgentId) {
        customerClass = "Agent";
        const ag = agentById.get(a.agentId || a.customer?.primaryAgentId);
        ownerName = ag ? `${ag.name} · ${ag.code}` : null;
      }

      return {
        applicationId: a.id,
        referenceNo: a.referenceNo,
        name: a.customer?.fullName ?? null,
        customerCode: a.customer?.code ?? null,
        passportNo: passports[0]?.passportNo ?? a.hajjUmrah?.passportNo ?? null,
        category: CATEGORY[a.serviceType] || a.serviceType,
        type: subtype,
        submitDate: a.visa?.submittedAt ?? stageDone(a, SUBMIT_STAGES),
        deliveryDate: a.visa?.deliveredAt ?? stageDone(a, DELIVER_STAGES),
        // embassy return is intentionally separate from customer delivery
        embassyCollectedAt: a.visa?.collectedAt ?? null,
        customerClass,
        customerOwner: ownerName,
        remarks,
      };
    });

    // Submit mode: only rows with a real Submit Date (belt-and-suspenders on top
    // of the WHERE), so the Submit Report never shows a fabricated submission.
    const out = mode === "submit" ? data.filter((r) => r.submitDate) : data;
    return { total: mode === "submit" ? out.length : total, take, skip, mode, data: out };
  }

  // ---- Reports & BI (report:read) — derived, never fabricated ----
  async operationalReport(user: AuthedUser) {
    const [byStatus, byService, leadsByStatus, openTasks, unassignedB2c] = await this.prisma.$transaction([
      this.prisma.application.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true, orderBy: { status: "asc" } }),
      this.prisma.application.groupBy({ by: ["serviceType"], where: { deletedAt: null }, _count: true, orderBy: { serviceType: "asc" } }),
      this.prisma.lead.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true, orderBy: { status: "asc" } }),
      this.prisma.task.count({ where: { deletedAt: null, status: { in: ["open", "in_progress"] } } }),
      this.prisma.application.count({ where: { deletedAt: null, source: "b2c_web", assignedTo: null } }),
    ]);
    return {
      casesByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      casesByService: Object.fromEntries(byService.map((r) => [r.serviceType, r._count])),
      leadsByStatus: Object.fromEntries(leadsByStatus.map((r) => [r.status, r._count])),
      openTasks, unassignedWebEnquiries: unassignedB2c,
    };
  }
}
