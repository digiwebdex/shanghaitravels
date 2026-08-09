import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { WorkflowService } from "../workflow/workflow.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ArApService } from "../arap/arap.service";
import { AuthedUser } from "../rbac";
import { nextApplicationReference } from "../util/next-reference";

const HQ_ROLES = new Set(["super_admin", "general_manager"]);
const DELETE_ROLES = new Set(["super_admin", "general_manager"]); // soft-delete only
// HF2 — service types without a real vertical yet. Rejected at create time so they
// are NOT silently created as visa cases (the frontend also blocks them).
// V14/V15: "student" and "work" (manpower) unblocked — their enterprise verticals
// exist. Remaining types stay blocked until theirs do. ("manpower" is not a valid
// ServiceType enum value; the manpower vertical uses serviceType "work".)
const UNSUPPORTED_SERVICE_TYPES = new Set(["manpower", "medical", "immigration", "insurance"]);

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
    private notes: NotificationsService,
    // FINAL WORKFLOW — reused so the booking never grows a second payables path.
    private arap: ArApService,
  ) {}

  /**
   * Visa-scoped notifications (V8). Best-effort fan-out through the EXISTING
   * NotificationsService outbox (in-app + SMS/WhatsApp to the applicant, in-app to
   * the assigned executive). Guarded to serviceType==="visa" so no other module is
   * affected. Never blocks the mutation.
   */
  private async notifyVisa(app: { id: string; serviceType: string; referenceNo: string; assignedTo?: string | null; customer?: { fullName?: string | null; phone?: string | null } | null }, event: string) {
    if (app.serviceType !== "visa") return;
    try {
      const recipients: { channel: string; recipient: string }[] = [];
      if (app.customer?.phone) {
        recipients.push({ channel: "sms", recipient: app.customer.phone });
        recipients.push({ channel: "whatsapp", recipient: app.customer.phone });
      }
      if (app.assignedTo) recipients.push({ channel: "in_app", recipient: app.assignedTo });
      if (!recipients.length) return;
      await this.notes.enqueueMany(recipients, {
        subject: `Visa · ${event}`,
        body: `${event} — case ${app.referenceNo}${app.customer?.fullName ? ` (${app.customer.fullName})` : ""}.`,
        relatedType: "Application",
        relatedId: app.id,
      });
    } catch { /* notifications are best-effort */ }
  }

  /** Visa stage-name → notification event (entering the stage fires the event). */
  private static readonly VISA_STAGE_EVENTS: Record<string, string> = {
    documents: "Documents Required",
    "embassy submission": "Embassy Submitted",
    interview: "Interview Scheduled",
    approved: "Visa Approved",
    collected: "Passport Collected",
    delivered: "Passport Delivered",
  };

  /**
   * Ticket-scoped notifications (V9). Same reused NotificationsService outbox,
   * guarded to serviceType==="air_ticket" so no other module (incl. frozen visa)
   * is affected. Never blocks the mutation.
   */
  private async notifyTicket(app: { id: string; serviceType: string; referenceNo: string; assignedTo?: string | null; customer?: { fullName?: string | null; phone?: string | null } | null }, event: string) {
    if (app.serviceType !== "air_ticket") return;
    try {
      const recipients: { channel: string; recipient: string }[] = [];
      if (app.customer?.phone) {
        recipients.push({ channel: "sms", recipient: app.customer.phone });
        recipients.push({ channel: "whatsapp", recipient: app.customer.phone });
      }
      if (app.assignedTo) recipients.push({ channel: "in_app", recipient: app.assignedTo });
      if (!recipients.length) return;
      await this.notes.enqueueMany(recipients, {
        subject: `Ticket · ${event}`,
        body: `${event} — case ${app.referenceNo}${app.customer?.fullName ? ` (${app.customer.fullName})` : ""}.`,
        relatedType: "Application",
        relatedId: app.id,
      });
    } catch { /* best-effort */ }
  }

  /** Ticket stage-name → notification event (entering the stage fires the event). */
  private static readonly TICKET_STAGE_EVENTS: Record<string, string> = {
    "fare confirmed": "fare.available",
    "payment pending": "payment.required",
    "ticket issued": "ticket.issued",
    "travel started": "boarding.reminder",
  };

  /**
   * Hotel-scoped notifications (V10). Same reused NotificationsService outbox,
   * guarded to serviceType==="hotel" so no frozen module is affected.
   */
  private async notifyHotel(app: { id: string; serviceType: string; referenceNo: string; assignedTo?: string | null; customer?: { fullName?: string | null; phone?: string | null } | null }, event: string) {
    if (app.serviceType !== "hotel") return;
    try {
      const recipients: { channel: string; recipient: string }[] = [];
      if (app.customer?.phone) {
        recipients.push({ channel: "sms", recipient: app.customer.phone });
        recipients.push({ channel: "whatsapp", recipient: app.customer.phone });
      }
      if (app.assignedTo) recipients.push({ channel: "in_app", recipient: app.assignedTo });
      if (!recipients.length) return;
      await this.notes.enqueueMany(recipients, {
        subject: `Hotel · ${event}`,
        body: `${event} — booking ${app.referenceNo}${app.customer?.fullName ? ` (${app.customer.fullName})` : ""}.`,
        relatedType: "Application",
        relatedId: app.id,
      });
    } catch { /* best-effort */ }
  }

  /** Hotel stage-name → notification event (entering the stage fires the event). */
  private static readonly HOTEL_STAGE_EVENTS: Record<string, string> = {
    "booking confirmed": "hotel.confirmed",
    "voucher issued": "voucher.issued",
    "guest checked in": "checkin.today",
    "guest checked out": "checkout.today",
  };

  /**
   * Transport-scoped notifications (V11). Same reused NotificationsService outbox,
   * guarded to serviceType==="transport" so no frozen module is affected.
   */
  private async notifyTransport(app: { id: string; serviceType: string; referenceNo: string; assignedTo?: string | null; customer?: { fullName?: string | null; phone?: string | null } | null }, event: string) {
    if (app.serviceType !== "transport") return;
    try {
      const recipients: { channel: string; recipient: string }[] = [];
      if (app.customer?.phone) {
        recipients.push({ channel: "sms", recipient: app.customer.phone });
        recipients.push({ channel: "whatsapp", recipient: app.customer.phone });
      }
      if (app.assignedTo) recipients.push({ channel: "in_app", recipient: app.assignedTo });
      if (!recipients.length) return;
      await this.notes.enqueueMany(recipients, {
        subject: `Transport · ${event}`,
        body: `${event} — booking ${app.referenceNo}${app.customer?.fullName ? ` (${app.customer.fullName})` : ""}.`,
        relatedType: "Application",
        relatedId: app.id,
      });
    } catch { /* best-effort */ }
  }

  /** Transport stage-name → notification event (entering the stage fires the event). */
  private static readonly TRANSPORT_STAGE_EVENTS: Record<string, string> = {
    "vehicle assigned": "vehicle.assigned",
    "driver assigned": "driver.assigned",
    "pickup ready": "pickup.ready",
    "passenger picked up": "trip.started",
    "trip completed": "trip.completed",
  };

  /**
   * V12+ — ONE notification registry for the remaining verticals (tour, hajj/umrah,
   * student, work) instead of more per-service copies. Reuses the same
   * NotificationsService outbox; a serviceType absent from this registry emits
   * nothing, so every frozen module is unaffected.
   */
  private static readonly VERTICAL_NOTIFY: Record<string, { prefix: string; created: string; stageEvents: Record<string, string> }> = {
    tour: {
      prefix: "Tour", created: "tour.created",
      stageEvents: {
        "quote confirmed": "quote.ready",
        "payment pending": "payment.required",
        "booking confirmed": "tour.confirmed",
        "pre-departure briefing": "departure.reminder",
        "travel completed": "trip.completed",
      },
    },
    hajj: {
      prefix: "Hajj", created: "hajj.created",
      stageEvents: {
        "package selected": "package.confirmed",
        "payment pending": "payment.required",
        "visa processing": "visa.processing",
        "pre-departure orientation": "departure.reminder",
        "departed": "journey.departed",
        "returned": "journey.returned",
      },
    },
    umrah: {
      prefix: "Umrah", created: "umrah.created",
      stageEvents: {
        "package selected": "package.confirmed",
        "payment pending": "payment.required",
        "visa processing": "visa.processing",
        "pre-departure orientation": "departure.reminder",
        "departed": "journey.departed",
        "returned": "journey.returned",
      },
    },
    student: {
      prefix: "Student", created: "student.created",
      stageEvents: {
        "application submitted": "application.submitted",
        "offer received": "offer.received",
        "payment pending": "payment.required",
        "visa processing": "visa.processing",
        "pre-departure": "departure.reminder",
        "enrolled": "enrolment.confirmed",
      },
    },
    work: {
      prefix: "Manpower", created: "manpower.created",
      stageEvents: {
        "medical & training": "medical.scheduled",
        "payment pending": "payment.required",
        "visa / work permit": "visa.processing",
        "ticketing": "bmet.cleared",
        "deployed": "deployment.confirmed",
      },
    },
  };

  private async notifyVertical(app: { id: string; serviceType: string; referenceNo: string; assignedTo?: string | null; customer?: { fullName?: string | null; phone?: string | null } | null }, event: string) {
    const cfg = ApplicationsService.VERTICAL_NOTIFY[app.serviceType];
    if (!cfg) return;
    try {
      const recipients: { channel: string; recipient: string }[] = [];
      if (app.customer?.phone) {
        recipients.push({ channel: "sms", recipient: app.customer.phone });
        recipients.push({ channel: "whatsapp", recipient: app.customer.phone });
      }
      if (app.assignedTo) recipients.push({ channel: "in_app", recipient: app.assignedTo });
      if (!recipients.length) return;
      await this.notes.enqueueMany(recipients, {
        subject: `${cfg.prefix} · ${event}`,
        body: `${event} — case ${app.referenceNo}${app.customer?.fullName ? ` (${app.customer.fullName})` : ""}.`,
        relatedType: "Application",
        relatedId: app.id,
      });
    } catch { /* best-effort */ }
  }

  private branchFilter(user: AuthedUser) {
    return HQ_ROLES.has(user.role) ? {} : { branchId: user.branchId ?? "__none__" };
  }

  /**
   * Additive per-service detail expansion. `?expand=visa` (comma-separated,
   * also accepts `include=`) opts a caller into the matching service-detail
   * relation + the applicant passport. WITHOUT expand the payload is byte-for-byte
   * the historical shape — the frozen Booking Engine and every other caller are
   * unaffected. One shared list, no duplicate endpoints. Extendable to
   * ticket/hotel/transport/tour/hajj by adding a row here.
   */
  private static readonly EXPAND_RELATIONS: Record<string, string> = {
    visa: "visa", ticket: "airTicket", hotel: "hotel", transport: "transport", tour: "tour", hajj: "hajjUmrah", umrah: "hajjUmrah", student: "student", work: "work", manpower: "work",
  };
  private listInclude(expandRaw?: string) {
    const include: any = {
      customer: { select: { fullName: true, code: true } },
      supplier: { select: { id: true, code: true, name: true } },
    };
    const expand = String(expandRaw || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!expand.length) return include; // default payload — unchanged
    let wantPassport = false;
    for (const e of expand) {
      const rel = ApplicationsService.EXPAND_RELATIONS[e];
      if (rel) include[rel] = true;
      if (e === "visa" || e === "passport") wantPassport = true;
    }
    if (wantPassport) {
      include.customer = {
        select: {
          id: true, fullName: true, code: true, phone: true,
          passports: { orderBy: { isPrimary: "desc" }, take: 1, select: { passportNo: true, expiryDate: true, issuingCountry: true } },
        },
      };
    }
    return include;
  }

  async list(user: AuthedUser, q: { page?: number; limit?: number; q?: string; serviceType?: string; status?: string; assignedTo?: string; source?: string; unassigned?: string; agentId?: string; expand?: string; include?: string }) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.serviceType) where.serviceType = q.serviceType;
    if (q.status) where.status = q.status;
    if (q.source) where.source = q.source;                       // e.g. b2c_web (intake queue)
    if (q.agentId) where.agentId = q.agentId;                     // B2B agent scope (direct column)
    if (q.unassigned === "true") where.assignedTo = null;         // assignment queue
    else if (q.assignedTo) where.assignedTo = q.assignedTo;
    if (q.q) where.OR = [
      { referenceNo: { contains: q.q, mode: "insensitive" } },
      { title: { contains: q.q, mode: "insensitive" } },
      { customer: { fullName: { contains: q.q, mode: "insensitive" } } },
    ];
    const [data, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
        include: this.listInclude(q.expand || q.include),
      }),
      this.prisma.application.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async get(id: string, user: AuthedUser) {
    const app = await this.prisma.application.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
      include: {
        customer: { select: { id: true, fullName: true, code: true, phone: true } },
        // FINAL WORKFLOW — booking commercials render the supplier inline.
        supplier: { select: { id: true, code: true, name: true, type: true } },
        visa: true, airTicket: true, hotel: true, tour: true, transport: true,
        hajjUmrah: true, student: true, medical: true, immigration: true, insurance: true, work: true,
        stages: { orderBy: { stageNo: "asc" } },
        docs: true,
        events: { orderBy: { createdAt: "desc" }, take: 40 },
      },
    });
    if (!app) throw new NotFoundException("Case not found");
    return app;
  }

  /** Case Journey Map = ordered stages + append-only event timeline. */
  async journey(id: string, user: AuthedUser) {
    await this.get(id, user); // scope check
    const [stages, events] = await this.prisma.$transaction([
      this.prisma.applicationStage.findMany({ where: { applicationId: id }, orderBy: { stageNo: "asc" } }),
      this.prisma.applicationEvent.findMany({ where: { applicationId: id }, orderBy: { createdAt: "asc" } }),
    ]);
    return { stages, events };
  }

  async create(dto: any, user: AuthedUser) {
    const serviceType = dto.serviceType || "visa";
    if (UNSUPPORTED_SERVICE_TYPES.has(serviceType)) {
      throw new BadRequestException(`Service type "${serviceType}" is not yet supported.`);
    }
    const branchId = user.branchId ?? dto.branchId;
    const referenceNo = await nextApplicationReference(this.prisma);

    // BUG-02 — snapshot the owning agent AT BOOKING TIME so attribution is
    // point-in-time. Precedence, in order:
    //   1. an explicitly supplied agentId wins and is never overwritten;
    //   2. otherwise the customer's CURRENT primary agent is copied onto the case;
    //   3. otherwise null.
    // A later ownership change does NOT rewrite this case — that is the point.
    // These stay three distinct concepts: customer-ownership agent, booking
    // agent, and portal-submitting agent. The agent portal creates its own
    // Application rows (agent-portal.service.ts) and never calls this method, so
    // its attribution is untouched.
    let agentId: string | null = dto.agentId ?? null;
    if (!agentId && dto.customerId) {
      const owner = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { primaryAgentId: true },
      });
      agentId = owner?.primaryAgentId ?? null;
    }

    const app = await this.prisma.application.create({
      data: {
        branchId, referenceNo, serviceType, customerId: dto.customerId, title: dto.title,
        direction: dto.direction === "inbound" ? "inbound" : "outbound",
        status: "draft", priority: dto.priority || "medium", assignedTo: dto.assignedTo,
        source: dto.source || "walkin", createdBy: user.id,
        packageId: dto.packageId || null,
        agentId,
      },
    });
    // Copy the active workflow template's stages onto the case (proves the spine pattern).
    const totalStages = await this.workflow.instantiateStages(app.id, serviceType);
    if (totalStages > 0) await this.prisma.application.update({ where: { id: app.id }, data: { totalStages, currentStage: 1 } });
    await this.prisma.applicationEvent.create({ data: { applicationId: app.id, type: "created", message: `Case created by ${user.email}`, userId: user.id } });
    const full = await this.get(app.id, user);
    await this.notifyVisa(full as any, "Application Submitted");
    await this.notifyTicket(full as any, "ticket.created");
    await this.notifyHotel(full as any, "hotel.created");
    await this.notifyTransport(full as any, "transport.created");
    const vcfg = ApplicationsService.VERTICAL_NOTIFY[serviceType];
    if (vcfg) await this.notifyVertical(full as any, vcfg.created);
    return full;
  }

  /** Advance to the next stage: mark current done, next active, bump currentStage. */
  async advanceStage(id: string, user: AuthedUser, note?: string) {
    const app = await this.get(id, user);
    const stages = app.stages;
    const cur = stages.find((s) => s.status === "active");
    if (!cur) throw new BadRequestException("Case is already at the final stage — nothing to advance");
    const next = stages.find((s) => s.stageNo === cur.stageNo + 1);
    await this.prisma.applicationStage.update({ where: { id: cur.id }, data: { status: "done", completedAt: new Date(), byUser: user.id } });
    if (next) await this.prisma.applicationStage.update({ where: { id: next.id }, data: { status: "active", startedAt: new Date() } });
    await this.prisma.application.update({
      where: { id },
      data: { currentStage: next ? next.stageNo : cur.stageNo, status: next ? "in_progress" : app.status },
    });
    const noteTxt = String(note || "").trim().slice(0, 500);
    await this.prisma.applicationEvent.create({ data: { applicationId: id, type: "stage_advanced", message: `${cur.name} → ${next?.name ?? "(final)"} by ${user.email}${noteTxt ? " — " + noteTxt : ""}`, userId: user.id } });
    // V8: stamp visa collection/delivery dates as those stages complete.
    if (app.serviceType === "visa") {
      const done = (cur.name || "").trim().toLowerCase();
      if (done === "collected") await this.prisma.visaDetail.updateMany({ where: { applicationId: id }, data: { collectedAt: new Date() } });
      else if (done === "delivered") await this.prisma.visaDetail.updateMany({ where: { applicationId: id }, data: { deliveredAt: new Date() } });
    }
    const full = await this.get(id, user);
    const nextName = next ? (next.name || "").trim().toLowerCase() : "";
    const event = next ? ApplicationsService.VISA_STAGE_EVENTS[nextName] : undefined;
    if (event) await this.notifyVisa(full as any, event);
    const tEvent = next ? ApplicationsService.TICKET_STAGE_EVENTS[nextName] : undefined;
    if (tEvent) await this.notifyTicket(full as any, tEvent);
    const hEvent = next ? ApplicationsService.HOTEL_STAGE_EVENTS[nextName] : undefined;
    if (hEvent) await this.notifyHotel(full as any, hEvent);
    const trEvent = next ? ApplicationsService.TRANSPORT_STAGE_EVENTS[nextName] : undefined;
    if (trEvent) await this.notifyTransport(full as any, trEvent);
    const vEvent = next ? ApplicationsService.VERTICAL_NOTIFY[app.serviceType]?.stageEvents[nextName] : undefined;
    if (vEvent) await this.notifyVertical(full as any, vEvent);
    return full;
  }

  /** Record a note/update against a case without changing the stage. */
  async addNote(id: string, message: string, user: AuthedUser) {
    await this.get(id, user); // scope check
    const msg = String(message || "").trim().slice(0, 1000);
    if (!msg) throw new BadRequestException("Note text is required");
    await this.prisma.applicationEvent.create({ data: { applicationId: id, type: "note", message: `${msg} — ${user.email}`, userId: user.id } });
    return this.get(id, user);
  }

  /** Assign (or reassign) a case to a staff member — used to clear the B2C queue. */
  async assign(id: string, assignedTo: string | null, user: AuthedUser) {
    await this.get(id, user);
    let label = "unassigned";
    let target: string | null = assignedTo ? String(assignedTo) : null;
    if (target) {
      const staff = await this.prisma.user.findFirst({
        where: { id: target, deletedAt: null, status: "active" },
        select: { id: true, fullName: true, email: true },
      });
      if (!staff) throw new BadRequestException("Assignee must be an active staff user");
      label = staff.fullName || staff.email;
    }
    await this.prisma.application.update({ where: { id }, data: { assignedTo: target } });
    await this.prisma.applicationEvent.create({
      data: {
        applicationId: id,
        type: "assigned",
        message: `Assigned to ${label} by ${user.email}`,
        userId: user.id,
        meta: { assignedTo: target },
      },
    });
    return this.get(id, user);
  }

  /** Checklist ticks for a case (multi-device). */
  async getChecklist(id: string, user: AuthedUser) {
    await this.get(id, user);
    const rows = await this.prisma.applicationChecklistItem.findMany({
      where: { applicationId: id },
      orderBy: { itemKey: "asc" },
    });
    const userIds = [...new Set(rows.map((r) => r.checkedBy).filter(Boolean))] as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));
    return {
      items: rows.map((r) => {
        const u = r.checkedBy ? byId.get(r.checkedBy) : undefined;
        return {
          itemKey: r.itemKey,
          checked: r.checked,
          checkedAt: r.checkedAt,
          checkedBy: r.checkedBy,
          checkedByName: u?.fullName || u?.email || null,
          updatedAt: r.updatedAt,
        };
      }),
    };
  }

  /**
   * Upsert checklist ticks. Body: { updates: [{ itemKey, checked }] }.
   * Writes ApplicationEvent for audit + per-row checkedAt/checkedBy.
   */
  async putChecklist(id: string, updates: { itemKey: string; checked: boolean }[], user: AuthedUser) {
    await this.get(id, user);
    if (!Array.isArray(updates) || !updates.length) throw new BadRequestException("updates[] required");
    const changed: string[] = [];
    for (const u of updates.slice(0, 80)) {
      const itemKey = String(u?.itemKey || "").trim().slice(0, 500);
      if (!itemKey) continue;
      const checked = !!u.checked;
      const existing = await this.prisma.applicationChecklistItem.findUnique({
        where: { applicationId_itemKey: { applicationId: id, itemKey } },
      });
      if (existing && existing.checked === checked) continue;
      await this.prisma.applicationChecklistItem.upsert({
        where: { applicationId_itemKey: { applicationId: id, itemKey } },
        create: {
          applicationId: id,
          itemKey,
          checked,
          checkedAt: checked ? new Date() : null,
          checkedBy: checked ? user.id : null,
        },
        update: {
          checked,
          checkedAt: checked ? new Date() : null,
          checkedBy: checked ? user.id : null,
        },
      });
      changed.push(`${checked ? "✓" : "○"} ${itemKey}`);
    }
    if (changed.length) {
      await this.prisma.applicationEvent.create({
        data: {
          applicationId: id,
          type: "checklist_updated",
          message: `Checklist updated by ${user.email}: ${changed.slice(0, 12).join("; ")}${changed.length > 12 ? "…" : ""}`,
          userId: user.id,
          meta: { count: changed.length },
        },
      });
    }
    return this.getChecklist(id, user);
  }

  async update(id: string, dto: any, user: AuthedUser) {
    const before = await this.get(id, user);
    const { title, priority, assignedTo, status, slaDueAt } = dto;
    await this.prisma.application.update({ where: { id }, data: { title, priority, assignedTo, status, slaDueAt: slaDueAt ? new Date(slaDueAt) : undefined } });
    if (status != null && String(status) !== before.status) {
      await this.prisma.applicationEvent.create({
        data: {
          applicationId: id,
          type: "status_changed",
          message: `Status ${before.status} → ${status} by ${user.email}`,
          userId: user.id,
          meta: { from: before.status, to: status },
        },
      });
      const map: Record<string, string> = { rejected: "Visa Rejected", docs_required: "Documents Required" };
      const event = map[String(status)];
      if (event) await this.notifyVisa(before as any, event);
      if (String(status) === "cancelled") await this.notifyTicket(before as any, "cancelled");
      if (String(status) === "cancelled") await this.notifyHotel(before as any, "cancelled");
      if (String(status) === "cancelled") await this.notifyTransport(before as any, "cancelled");
      if (String(status) === "cancelled") await this.notifyVertical(before as any, "cancelled");
    }
    return this.get(id, user);
  }

  /**
   * FINAL WORKFLOW — booking commercials.
   *
   * Supplier + cost + selling price belong to the booking TRANSACTION, so one
   * customer can buy a visa from one supplier and a ticket from another.
   * Recorded as one edit with an audit event; no money moves here — the payable
   * is raised separately by `createSupplierBill`.
   */
  async setCommercials(id: string, dto: any, user: AuthedUser) {
    const before = (await this.get(id, user)) as unknown as Record<string, any>;

    const has = (k: string) => Object.prototype.hasOwnProperty.call(dto || {}, k);
    const money = (v: any, label: string): number | null => {
      if (v === null || v === "") return null;
      const n = Math.round(Number(v));
      if (!Number.isFinite(n) || n < 0) throw new BadRequestException(`${label} must be a non-negative amount`);
      return n;
    };

    const data: Record<string, any> = {};
    if (has("supplierId")) {
      const supplierId = dto.supplierId || null;
      if (supplierId) {
        const sup = await this.prisma.supplier.findFirst({ where: { id: supplierId, deletedAt: null } });
        if (!sup) throw new NotFoundException("Supplier not found");
      }
      data.supplierId = supplierId;
    }
    if (has("supplierCostPoisha")) data.supplierCostPoisha = money(dto.supplierCostPoisha, "Supplier cost");
    if (has("sellingPricePoisha")) data.sellingPricePoisha = money(dto.sellingPricePoisha, "Selling price");
    if (!Object.keys(data).length) throw new BadRequestException("Nothing to update");

    await this.prisma.application.update({ where: { id }, data });
    await this.prisma.applicationEvent.create({
      data: {
        applicationId: id,
        type: "commercials_updated",
        message: `Commercials updated by ${user.email}`,
        userId: user.id,
        meta: {
          from: {
            supplierId: before.supplierId ?? null,
            supplierCostPoisha: before.supplierCostPoisha ?? null,
            sellingPricePoisha: before.sellingPricePoisha ?? null,
          },
          to: data as Prisma.InputJsonValue,
        },
      },
    });
    return this.get(id, user);
  }

  /**
   * Raises the supplier payable for this booking by REUSING the AP engine —
   * deliberately not a second payables path. Refuses to bill the same supplier
   * twice for the same booking.
   */
  async createSupplierBill(id: string, dto: any, user: AuthedUser) {
    const app = (await this.get(id, user)) as unknown as Record<string, any>;
    const supplierId = dto?.supplierId || app.supplierId;
    if (!supplierId) throw new BadRequestException("Assign a supplier to this booking first");
    const cost = dto?.amountPoisha != null ? Math.round(Number(dto.amountPoisha)) : app.supplierCostPoisha;
    if (!(Number.isFinite(cost) && cost > 0)) throw new BadRequestException("Supplier cost must be greater than zero");

    const existing = await this.prisma.apDocument.findFirst({
      where: { applicationId: id, supplierId, deletedAt: null },
      select: { docNo: true },
    });
    if (existing) throw new BadRequestException(`Supplier already billed on this booking (${existing.docNo})`);

    const doc: any = await this.arap.createApDocument(
      {
        type: "bill",
        supplierId,
        applicationId: id,
        branchId: app.branchId,
        issueDate: dto?.issueDate,
        dueDate: dto?.dueDate,
        memo: dto?.memo || `${app.referenceNo} — ${app.serviceType} supplier cost`,
        reference: app.referenceNo,
        lines: [{ description: dto?.description || `${app.serviceType} service cost`, amountPoisha: cost }],
      },
      user,
    );

    await this.prisma.applicationEvent.create({
      data: {
        applicationId: id,
        type: "supplier_billed",
        message: `Supplier payable ${doc.docNo} raised by ${user.email}`,
        userId: user.id,
        meta: { apDocumentId: doc.id, docNo: doc.docNo, amountPoisha: cost },
      },
    });
    return doc;
  }

  async approve(id: string, user: AuthedUser) {
    const app = await this.get(id, user);
    if (app.status === "approved") throw new BadRequestException("Case is already approved");
    if (!app.stages.length || !app.stages.every((s: any) => s.status === "done"))
      throw new BadRequestException("All stages must be completed before approval");
    const updated = await this.prisma.application.update({ where: { id }, data: { status: "approved", completedAt: new Date() } });
    await this.prisma.applicationEvent.create({ data: { applicationId: id, type: "approved", message: `Approved by ${user.email}`, userId: user.id } });
    await this.notifyVisa(app as any, "Visa Approved");
    return updated;
  }

  async softDelete(id: string, user: AuthedUser) {
    await this.get(id, user);
    if (user.role !== "super_admin" && !DELETE_ROLES.has(user.role)) throw new ForbiddenException("Not permitted to delete cases");
    await this.prisma.application.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.applicationEvent.create({ data: { applicationId: id, type: "deleted", message: `Soft-deleted by ${user.email}`, userId: user.id } });
    return { ok: true };
  }

  // ---- Visa detail (thin per-service table) ----
  async upsertVisa(id: string, dto: any, user: AuthedUser) {
    await this.get(id, user);
    const data = {
      visaType: dto.visaType, destination: dto.destination, embassy: dto.embassy, entryType: dto.entryType,
      durationDays: dto.durationDays != null ? Number(dto.durationDays) : null, applicationNo: dto.applicationNo,
      appointmentAt: dto.appointmentAt ? new Date(dto.appointmentAt) : null,
      submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : null,
      decisionAt: dto.decisionAt ? new Date(dto.decisionAt) : null,
      visaNumber: dto.visaNumber, outcome: dto.outcome, notes: dto.notes,
    };
    return this.prisma.visaDetail.upsert({
      where: { applicationId: id },
      create: { applicationId: id, ...data, visaType: data.visaType || "tourist", destination: data.destination || "" },
      update: data,
    });
  }

  // ---- Phase 4 service detail tables (air/hotel/tour/transport) ----
  // One generic upsert; whitelists fields per type and coerces dates/ints.
  private static DETAIL = {
    air_ticket: { delegate: "airTicketDetail",
      str: ["pnr", "airline", "flightNo", "origin", "destination", "tripType", "cabinClass", "passengerName", "ticketNo", "notes"],
      date: ["departAt", "returnAt"], int: [] as string[] },
    hotel: { delegate: "hotelDetail",
      str: ["hotelName", "city", "country", "roomType", "mealPlan", "confirmationNo", "notes"],
      date: ["checkIn", "checkOut"], int: ["nights", "rooms", "guests"] },
    tour: { delegate: "tourPackageDetail",
      str: [
        "packageName", "packageCode", "packageType", "category", "destination", "season",
        "itinerary", "inclusions", "exclusions", "activities", "hotelsNote", "transportNote",
        "flightsNote", "visaRequirements", "insuranceNote", "occupancyNote", "childPolicy",
        "seasonalPricingNote", "costBreakdown", "confirmationNo", "notes",
      ],
      date: ["startDate", "endDate"], int: ["pax", "supplierCostPoisha", "sellingPricePoisha"] },
    transport: { delegate: "transportDetail",
      str: ["vehicleType", "serviceKind", "pickupLocation", "dropLocation", "routeName", "driverName", "vehicleNo", "confirmationNo", "notes"],
      date: ["scheduledAt"], int: ["passengers"] },
    // Phase 7 / B5 — hajj & umrah share one detail table
    hajj: { delegate: "hajjUmrahDetail",
      str: [
        "packageType", "year", "pilgrimName", "passportNo", "mahramName", "packageName", "packageCode",
        "packageCategory", "groupCode", "groupName", "leaderName", "nationality", "gender", "dob", "phone",
        "mahramRelation", "healthNotes", "emergencyContact", "emergencyPhone", "visaStatus", "visaNo",
        "passportStatus", "flightNo", "airline", "transportNote", "roomAllocation", "occupancyNote",
        "inclusions", "exclusions", "paymentPlanNote", "confirmationNo", "hotelMakkah", "hotelMadinah",
        "roomType", "notes",
      ],
      date: ["departureDate", "returnDate"],
      int: ["supplierCostPoisha", "sellingPricePoisha", "paidPoisha"] },
    umrah: { delegate: "hajjUmrahDetail",
      str: [
        "packageType", "year", "pilgrimName", "passportNo", "mahramName", "packageName", "packageCode",
        "packageCategory", "groupCode", "groupName", "leaderName", "nationality", "gender", "dob", "phone",
        "mahramRelation", "healthNotes", "emergencyContact", "emergencyPhone", "visaStatus", "visaNo",
        "passportStatus", "flightNo", "airline", "transportNote", "roomAllocation", "occupancyNote",
        "inclusions", "exclusions", "paymentPlanNote", "confirmationNo", "hotelMakkah", "hotelMadinah",
        "roomType", "notes",
      ],
      date: ["departureDate", "returnDate"],
      int: ["supplierCostPoisha", "sellingPricePoisha", "paidPoisha"] },
    student: { delegate: "studentDetail",
      str: ["institution", "country", "courseName", "degreeLevel", "intakeTerm", "applicationRef", "notes"],
      date: [], int: [] },
    medical: { delegate: "medicalDetail",
      str: ["hospital", "country", "treatment", "patientName", "notes"],
      date: ["appointmentDate"], int: [] },
    immigration: { delegate: "immigrationDetail",
      str: ["country", "visaCategory", "applicationRef", "notes"],
      date: [], int: [] },
    insurance: { delegate: "insuranceDetail",
      str: ["policyType", "provider", "policyNo", "coverageNote", "insuredName", "notes"],
      date: ["startDate", "endDate"], int: [] },
    // China work / manpower service (Z visa)
    work: { delegate: "workDetail",
      str: ["employerName", "jobTitle", "country", "workPermitNo", "visaType", "bmetClearance", "medicalStatus", "agencyRef", "notes"],
      date: ["departureDate"], int: ["contractMonths"] },
  } as Record<string, { delegate: string; str: string[]; date: string[]; int: string[] }>;

  async upsertDetail(id: string, serviceType: string, dto: any, user: AuthedUser) {
    await this.get(id, user);
    const spec = ApplicationsService.DETAIL[serviceType];
    if (!spec) throw new NotFoundException(`No detail table for serviceType '${serviceType}'`);
    const data: any = {};
    for (const k of spec.str) if (dto[k] !== undefined) data[k] = dto[k];
    for (const k of spec.date) if (dto[k] !== undefined) data[k] = dto[k] ? new Date(dto[k]) : null;
    for (const k of spec.int) if (dto[k] !== undefined) data[k] = dto[k] != null ? Number(dto[k]) : null;
    return (this.prisma as any)[spec.delegate].upsert({
      where: { applicationId: id }, create: { applicationId: id, ...data }, update: data,
    });
  }
}
