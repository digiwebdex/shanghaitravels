import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { NotificationsService } from "../notifications/notifications.service";
import {
  EMAIL_ADAPTER,
  MessagingAdapter,
  MessagingChannel,
  SMS_ADAPTER,
  WHATSAPP_ADAPTER,
} from "./adapters/messaging.adapter";

const CHANNELS = new Set(["call", "email", "whatsapp", "meeting", "sms", "note", "internal"]);
const SEND_CHANNELS = new Set<MessagingChannel>(["email", "whatsapp", "sms"]);
const PARTY_KINDS = new Set(["prospect", "customer", "agent", "supplier", "corporate", "internal"]);
const ACTIVITY_TYPES = new Set(["call", "meeting", "email", "whatsapp", "task", "follow_up"]);
const RECURRENCE = new Set(["none", "daily", "weekly", "monthly"]);

@Injectable()
export class CommsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    @Inject(EMAIL_ADAPTER) private email: MessagingAdapter,
    @Inject(WHATSAPP_ADAPTER) private whatsapp: MessagingAdapter,
    @Inject(SMS_ADAPTER) private sms: MessagingAdapter,
  ) {}

  private branchFilter(user: AuthedUser) {
    return ["super_admin", "general_manager"].includes(user.role)
      ? {}
      : { branchId: user.branchId ?? "__none__" };
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

  private adapter(channel: MessagingChannel): MessagingAdapter {
    if (channel === "email") return this.email;
    if (channel === "whatsapp") return this.whatsapp;
    return this.sms;
  }

  renderTemplate(body: string, subject: string | null | undefined, vars: Record<string, string>) {
    const replace = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
    return { subject: subject ? replace(subject) : null, body: replace(body) };
  }

  async bootstrap(user: AuthedUser) {
    const defaults: Array<[string, string, string, string, string | null, string, string[]]> = [
      ["email_booking_update", "Booking update", "email", "booking", "Booking update — {{referenceNo}}", "Dear {{customerName}}, your {{serviceType}} booking {{referenceNo}} is now {{status}}.", ["customerName", "referenceNo", "serviceType", "status"]],
      ["email_quotation", "Quotation share", "email", "quotation", "Quotation {{quoteNo}}", "Dear {{customerName}}, please find quotation {{quoteNo}} totaling {{totalAmount}}.", ["customerName", "quoteNo", "totalAmount"]],
      ["email_payment_reminder", "Payment reminder", "email", "payment", "Payment reminder — {{referenceNo}}", "Dear {{customerName}}, a payment of {{amount}} is due for {{referenceNo}}.", ["customerName", "referenceNo", "amount"]],
      ["wa_booking_update", "WA booking update", "whatsapp", "booking", null, "Shanghai Travels: booking {{referenceNo}} is {{status}}. Reply if you need help.", ["referenceNo", "status"]],
      ["wa_quotation", "WA quotation", "whatsapp", "quotation", null, "Quotation {{quoteNo}} for {{totalAmount}} is ready. Valid until {{validUntil}}.", ["quoteNo", "totalAmount", "validUntil"]],
      ["wa_payment_reminder", "WA payment reminder", "whatsapp", "payment", null, "Reminder: {{amount}} due for {{referenceNo}}. Pay to confirm.", ["amount", "referenceNo"]],
      ["sms_otp", "SMS OTP", "sms", "otp", null, "Your Shanghai Travels OTP is {{otp}}. Valid {{minutes}} minutes.", ["otp", "minutes"]],
      ["sms_booking", "SMS booking", "sms", "booking", null, "Booking {{referenceNo}} confirmed. Status: {{status}}.", ["referenceNo", "status"]],
      ["sms_reminder", "SMS reminder", "sms", "reminder", null, "Reminder: {{message}} — Shanghai Travels", ["message"]],
      // V5 Phase 3 — commercial invoice templates. paymentLink / trackUrl render blank until
      // Phase 4 (PDF/pay link) & tracking exist; applyMergeFields drops unknown vars safely.
      ["inv_email", "Invoice (commercial)", "email", "payment", "Invoice {{invoiceNo}} — Shanghai Travels", "Dear {{customerName}},\n\nInvoice {{invoiceNo}} for booking {{bookingNo}} totals {{amount}} (amount due {{dueAmount}}).\nPay online: {{paymentLink}}\nTrack your booking: {{trackUrl}}\nCustomer portal: {{portalUrl}}\n\nThank you — Shanghai Travels.", ["customerName", "invoiceNo", "bookingNo", "amount", "dueAmount", "paymentLink", "trackUrl", "portalUrl"]],
      ["inv_whatsapp", "Invoice (commercial)", "whatsapp", "payment", null, "Shanghai Travels: Invoice {{invoiceNo}} (booking {{bookingNo}}) — {{amount}}, due {{dueAmount}}. Pay: {{paymentLink}} · Track: {{trackUrl}} · Portal: {{portalUrl}}", ["invoiceNo", "bookingNo", "amount", "dueAmount", "paymentLink", "trackUrl", "portalUrl"]],
      ["inv_sms", "Invoice (commercial)", "sms", "payment", null, "Shanghai Travels: Invoice {{invoiceNo}} {{amount}} (due {{dueAmount}}). Pay: {{paymentLink}}", ["invoiceNo", "amount", "dueAmount", "paymentLink"]],
    ];
    let created = 0;
    for (const [code, name, channel, category, subject, body, mergeFields] of defaults) {
      const exists = await this.prisma.commTemplate.findFirst({ where: { code } });
      if (exists) continue;
      await this.prisma.commTemplate.create({
        data: {
          code,
          name,
          channel,
          category,
          subject,
          body,
          mergeFields,
          createdBy: user.id,
          branchId: user.branchId ?? null,
        },
      });
      created++;
    }
    await this.audit(user.id, "comms.bootstrap", "CommTemplate", null, { created });
    return { ok: true, created, templates: await this.listTemplates(user) };
  }

  // ---------- Timeline ----------
  async timeline(q: any, user: AuthedUser) {
    if (!q.relatedType || !q.relatedId) throw new BadRequestException("relatedType and relatedId required");
    const relatedType = String(q.relatedType);
    const relatedId = String(q.relatedId);
    const [comms, messages, activities] = await Promise.all([
      this.prisma.communication.findMany({
        where: { relatedType, relatedId, ...this.branchFilter(user) },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { attachments: true },
      }),
      this.prisma.commMessage.findMany({
        where: {
          ...this.branchFilter(user),
          thread: { relatedType, relatedId },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { attachments: true, thread: { select: { id: true, subject: true, channel: true } } },
      }),
      this.prisma.crmActivity.findMany({
        where: { relatedType, relatedId, ...this.branchFilter(user) },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    const items = [
      ...comms.map((c) => ({
        kind: "communication" as const,
        id: c.id,
        channel: c.channel,
        direction: c.direction,
        summary: c.summary,
        subject: c.subject,
        body: c.body,
        status: c.status,
        partyKind: c.partyKind,
        attachments: c.attachments,
        createdAt: c.createdAt,
      })),
      ...messages.map((m) => ({
        kind: "message" as const,
        id: m.id,
        channel: m.channel,
        direction: m.direction,
        summary: m.subject || m.body.slice(0, 120),
        subject: m.subject,
        body: m.body,
        status: m.status,
        partyKind: null,
        attachments: m.attachments,
        threadId: m.threadId,
        createdAt: m.createdAt,
      })),
      ...activities.map((a) => ({
        kind: "activity" as const,
        id: a.id,
        channel: a.type,
        direction: "internal",
        summary: a.subject,
        subject: a.subject,
        body: a.body,
        status: a.status,
        partyKind: null,
        attachments: [],
        dueAt: a.dueAt,
        slaDueAt: a.slaDueAt,
        createdAt: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { relatedType, relatedId, items };
  }

  async logEntry(dto: any, user: AuthedUser) {
    if (!dto?.relatedType || !dto?.relatedId || !dto?.summary?.trim()) {
      throw new BadRequestException("relatedType, relatedId, summary required");
    }
    const channel = String(dto.channel || "note");
    if (!CHANNELS.has(channel)) throw new BadRequestException("Invalid channel");
    const attachments = Array.isArray(dto.attachments) ? dto.attachments : [];
    const row = await this.prisma.communication.create({
      data: {
        relatedType: String(dto.relatedType),
        relatedId: String(dto.relatedId),
        channel,
        direction: dto.direction || (channel === "internal" || channel === "note" ? "internal" : "outbound"),
        summary: String(dto.summary).trim(),
        subject: dto.subject || null,
        body: dto.body || null,
        status: "logged",
        partyKind: dto.partyKind && PARTY_KINDS.has(dto.partyKind) ? dto.partyKind : null,
        partyLabel: dto.partyLabel || null,
        branchId: user.branchId ?? null,
        byUser: user.id,
        attachmentCount: attachments.length,
        attachments: {
          create: attachments.map((a: any) => ({
            fileName: String(a.fileName || "file"),
            mimeType: a.mimeType || "application/octet-stream",
            sizeBytes: Number(a.sizeBytes) || 0,
            storageKey: String(a.storageKey || a.fileName || "file"),
            createdBy: user.id,
          })),
        },
      },
      include: { attachments: true },
    });
    await this.audit(user.id, "comms.log", "Communication", row.id, row);
    return row;
  }

  // ---------- Templates ----------
  listTemplates(user: AuthedUser, q?: any) {
    const where: any = { deletedAt: null, isActive: true, ...this.branchFilter(user) };
    if (q?.channel) where.channel = q.channel;
    if (q?.category) where.category = q.category;
    return this.prisma.commTemplate.findMany({ where, orderBy: { code: "asc" }, take: 200 });
  }

  async createTemplate(dto: any, user: AuthedUser) {
    if (!dto?.code?.trim() || !dto?.name?.trim() || !dto?.body?.trim()) {
      throw new BadRequestException("code, name, body required");
    }
    const channel = String(dto.channel || "email");
    if (!SEND_CHANNELS.has(channel as MessagingChannel)) throw new BadRequestException("Invalid template channel");
    const row = await this.prisma.commTemplate.create({
      data: {
        code: String(dto.code).trim(),
        name: String(dto.name).trim(),
        channel,
        category: dto.category || "general",
        subject: dto.subject || null,
        body: String(dto.body),
        mergeFields: dto.mergeFields || [],
        branchId: user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "comms.template.create", "CommTemplate", row.id, row);
    return row;
  }

  async renderTemplateById(id: string, vars: Record<string, string>, user: AuthedUser) {
    const t = await this.prisma.commTemplate.findFirst({ where: { id, deletedAt: null, ...this.branchFilter(user) } });
    if (!t) throw new NotFoundException("Template not found");
    return { templateId: t.id, code: t.code, channel: t.channel, ...this.renderTemplate(t.body, t.subject, vars || {}) };
  }

  // ---------- Threads / messages ----------
  listThreads(q: any, user: AuthedUser) {
    const where: any = { ...this.branchFilter(user) };
    if (q.channel) where.channel = q.channel;
    if (q.relatedType) where.relatedType = q.relatedType;
    if (q.relatedId) where.relatedId = q.relatedId;
    if (q.partyKind) where.partyKind = q.partyKind;
    return this.prisma.commThread.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  }

  async getThread(id: string, user: AuthedUser) {
    const t = await this.prisma.commThread.findFirst({
      where: { id, ...this.branchFilter(user) },
      include: {
        messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
      },
    });
    if (!t) throw new NotFoundException("Thread not found");
    return t;
  }

  async createThread(dto: any, user: AuthedUser) {
    if (!dto?.relatedType || !dto?.relatedId || !dto?.channel) {
      throw new BadRequestException("relatedType, relatedId, channel required");
    }
    const row = await this.prisma.commThread.create({
      data: {
        channel: String(dto.channel),
        subject: dto.subject || null,
        relatedType: String(dto.relatedType),
        relatedId: String(dto.relatedId),
        partyKind: dto.partyKind && PARTY_KINDS.has(dto.partyKind) ? dto.partyKind : "customer",
        partyId: dto.partyId || null,
        partyLabel: dto.partyLabel || null,
        branchId: user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "comms.thread.create", "CommThread", row.id, row);
    return row;
  }

  async addMessage(threadId: string, dto: any, user: AuthedUser) {
    const thread = await this.getThread(threadId, user);
    if (!dto?.body?.trim()) throw new BadRequestException("body required");
    const msg = await this.prisma.commMessage.create({
      data: {
        threadId,
        channel: dto.channel || thread.channel,
        direction: dto.direction || "outbound",
        subject: dto.subject || thread.subject,
        body: String(dto.body),
        status: dto.status || "draft",
        templateId: dto.templateId || null,
        branchId: user.branchId ?? null,
        byUser: user.id,
      },
    });
    await this.prisma.commThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date() } });
    await this.audit(user.id, "comms.message.create", "CommMessage", msg.id, msg);
    return msg;
  }

  // ---------- Send ----------
  async send(dto: any, user: AuthedUser) {
    const channel = String(dto.channel || "") as MessagingChannel;
    if (!SEND_CHANNELS.has(channel)) throw new BadRequestException("channel must be email|whatsapp|sms");
    if (!dto?.to?.trim()) throw new BadRequestException("to required");
    if (!dto?.relatedType || !dto?.relatedId) throw new BadRequestException("relatedType and relatedId required");

    let subject = dto.subject || null;
    let body = dto.body || "";
    let templateId: string | null = null;
    if (dto.templateId || dto.templateCode) {
      const t = await this.prisma.commTemplate.findFirst({
        where: {
          deletedAt: null,
          ...(dto.templateId ? { id: dto.templateId } : { code: dto.templateCode }),
          ...this.branchFilter(user),
        },
      });
      if (!t) throw new NotFoundException("Template not found");
      templateId = t.id;
      const rendered = this.renderTemplate(t.body, t.subject, dto.vars || {});
      subject = rendered.subject || subject;
      body = rendered.body;
    }
    if (!body.trim()) throw new BadRequestException("body required");

    let threadId = dto.threadId as string | undefined;
    if (!threadId) {
      const thread = await this.createThread(
        {
          channel,
          subject,
          relatedType: dto.relatedType,
          relatedId: dto.relatedId,
          partyKind: dto.partyKind || "customer",
          partyId: dto.partyId,
          partyLabel: dto.partyLabel || dto.to,
        },
        user,
      );
      threadId = thread.id;
    }

    const msg = await this.prisma.commMessage.create({
      data: {
        threadId: threadId!,
        channel,
        direction: "outbound",
        subject,
        body,
        status: "queued",
        templateId,
        branchId: user.branchId ?? null,
        byUser: user.id,
      },
    });

    await this.notifications.enqueue({
      channel,
      recipient: String(dto.to).trim(),
      subject: subject || undefined,
      body,
      relatedType: "CommMessage",
      relatedId: msg.id,
    });

    const timeline = await this.prisma.communication.create({
      data: {
        relatedType: String(dto.relatedType),
        relatedId: String(dto.relatedId),
        channel,
        direction: "outbound",
        summary: subject || body.slice(0, 120),
        subject,
        body,
        status: "queued",
        partyKind: dto.partyKind || "customer",
        partyLabel: dto.partyLabel || dto.to,
        threadId,
        templateId,
        branchId: user.branchId ?? null,
        byUser: user.id,
        deliveryStatus: "queued",
      },
    });

    const result = await this.adapter(channel).send({
      to: String(dto.to).trim(),
      subject: subject || undefined,
      body,
      templateCode: dto.templateCode,
      meta: { messageId: msg.id },
    });

    const status = result.ok ? result.status : result.status === "failed" ? "failed" : "queued";
    const updated = await this.prisma.commMessage.update({
      where: { id: msg.id },
      data: {
        status,
        provider: result.provider,
        providerMessageId: result.providerMessageId || null,
        error: result.error || null,
        sentAt: result.ok ? new Date() : null,
        deliveredAt: result.status === "delivered" ? new Date() : null,
      },
    });
    await this.prisma.communication.update({
      where: { id: timeline.id },
      data: {
        status,
        provider: result.provider,
        providerMessageId: result.providerMessageId || null,
        deliveryStatus: status,
      },
    });
    await this.prisma.commThread.update({ where: { id: threadId! }, data: { lastMessageAt: new Date() } });
    await this.audit(user.id, "comms.send", "CommMessage", msg.id, { channel, status, provider: result.provider });
    return { message: updated, delivery: result, threadId, communicationId: timeline.id };
  }

  listDelivery(q: any, user: AuthedUser) {
    const where: any = { ...this.branchFilter(user) };
    if (q.channel) where.channel = q.channel;
    if (q.status) where.status = q.status;
    return this.prisma.commMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { thread: { select: { id: true, relatedType: true, relatedId: true, partyLabel: true, subject: true } } },
    });
  }

  /** Retry a failed message in place (reuses the adapter; no duplicate message/thread). */
  async resendMessage(id: string) {
    const msg = await this.prisma.commMessage.findFirst({ where: { id }, include: { thread: true } });
    if (!msg) throw new NotFoundException("Message not found");
    const to = msg.thread?.partyLabel || "";
    const result = await this.adapter(msg.channel as MessagingChannel).send({
      to,
      subject: msg.subject || undefined,
      body: msg.body,
      meta: { messageId: msg.id, retry: true },
    });
    const status = result.ok ? result.status : result.status === "failed" ? "failed" : "queued";
    await this.prisma.commMessage.update({
      where: { id },
      data: {
        status,
        provider: result.provider,
        providerMessageId: result.providerMessageId || null,
        error: result.error || null,
        sentAt: result.ok ? new Date() : msg.sentAt,
        deliveredAt: result.status === "delivered" ? new Date() : msg.deliveredAt,
      },
    });
    return { ok: result.ok, status };
  }

  async processOutbox(user: AuthedUser) {
    const pending = await this.prisma.commMessage.findMany({
      where: { status: "queued", ...this.branchFilter(user) },
      take: 50,
      include: { thread: true },
    });
    let delivered = 0;
    let failed = 0;
    let stillQueued = 0;
    for (const msg of pending) {
      const to = msg.thread.partyLabel || "unknown";
      const channel = msg.channel as MessagingChannel;
      if (!SEND_CHANNELS.has(channel)) {
        stillQueued++;
        continue;
      }
      const result = await this.adapter(channel).send({
        to,
        subject: msg.subject || undefined,
        body: msg.body,
      });
      if (result.ok) {
        delivered++;
        await this.prisma.commMessage.update({
          where: { id: msg.id },
          data: {
            status: result.status,
            provider: result.provider,
            providerMessageId: result.providerMessageId || null,
            sentAt: new Date(),
            error: null,
          },
        });
      } else if (result.status === "failed") {
        failed++;
        await this.prisma.commMessage.update({
          where: { id: msg.id },
          data: { status: "failed", provider: result.provider, error: result.error || "send failed" },
        });
      } else {
        stillQueued++;
      }
    }
    await this.audit(user.id, "comms.process_outbox", "CommMessage", null, { delivered, failed, stillQueued });
    return { scanned: pending.length, delivered, failed, stillQueued };
  }

  // ---------- Activities / calendar / SLA ----------
  listActivities(q: any, user: AuthedUser) {
    const where: any = { ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.assignedTo) where.assignedTo = q.assignedTo;
    if (q.from || q.to) {
      where.dueAt = {};
      if (q.from) where.dueAt.gte = new Date(q.from);
      if (q.to) where.dueAt.lte = new Date(q.to);
    }
    return this.prisma.crmActivity.findMany({ where, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], take: 200 });
  }

  calendar(q: any, user: AuthedUser) {
    const from = q.from ? new Date(q.from) : new Date(new Date().setDate(1));
    const to = q.to ? new Date(q.to) : new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59);
    return this.prisma.crmActivity.findMany({
      where: {
        ...this.branchFilter(user),
        dueAt: { gte: from, lte: to },
      },
      orderBy: { dueAt: "asc" },
      take: 500,
    });
  }

  async createActivity(dto: any, user: AuthedUser) {
    if (!dto?.subject?.trim()) throw new BadRequestException("subject required");
    if (!dto?.relatedType || !dto?.relatedId) throw new BadRequestException("relatedType and relatedId required");
    const type = String(dto.type || "follow_up");
    if (!ACTIVITY_TYPES.has(type)) throw new BadRequestException("Invalid activity type");
    const recurrenceRule = String(dto.recurrenceRule || "none");
    if (!RECURRENCE.has(recurrenceRule)) throw new BadRequestException("Invalid recurrenceRule");
    const dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    const slaHours = Number(dto.slaHours) || 48;
    const slaDueAt = dto.slaDueAt ? new Date(dto.slaDueAt) : dueAt || new Date(Date.now() + slaHours * 3600_000);
    const row = await this.prisma.crmActivity.create({
      data: {
        type,
        subject: String(dto.subject).trim(),
        body: dto.body || null,
        relatedType: String(dto.relatedType),
        relatedId: String(dto.relatedId),
        dueAt,
        status: "open",
        assignedTo: dto.assignedTo || user.id,
        byUser: user.id,
        branchId: user.branchId ?? null,
        recurrenceRule,
        slaDueAt,
        escalateAt: dto.escalateAt ? new Date(dto.escalateAt) : slaDueAt,
      },
    });
    await this.prisma.communication.create({
      data: {
        relatedType: row.relatedType,
        relatedId: row.relatedId,
        channel: type === "follow_up" || type === "task" ? "meeting" : type,
        direction: "internal",
        summary: row.subject,
        body: row.body,
        status: "logged",
        partyKind: "internal",
        branchId: user.branchId ?? null,
        byUser: user.id,
      },
    });
    if (recurrenceRule !== "none" && dueAt) {
      const next = new Date(dueAt);
      if (recurrenceRule === "daily") next.setDate(next.getDate() + 1);
      if (recurrenceRule === "weekly") next.setDate(next.getDate() + 7);
      if (recurrenceRule === "monthly") next.setMonth(next.getMonth() + 1);
      await this.prisma.crmActivity.create({
        data: {
          type,
          subject: row.subject,
          body: row.body,
          relatedType: row.relatedType,
          relatedId: row.relatedId,
          dueAt: next,
          status: "open",
          assignedTo: row.assignedTo,
          byUser: user.id,
          branchId: user.branchId ?? null,
          recurrenceRule,
          slaDueAt: new Date(next.getTime() + slaHours * 3600_000),
          parentActivityId: row.id,
        },
      });
    }
    await this.audit(user.id, "comms.activity.create", "CrmActivity", row.id, row);
    return row;
  }

  async completeActivity(id: string, user: AuthedUser) {
    const a = await this.prisma.crmActivity.findFirst({ where: { id, ...this.branchFilter(user) } });
    if (!a) throw new NotFoundException("Activity not found");
    const row = await this.prisma.crmActivity.update({
      where: { id },
      data: { status: "done", completedAt: new Date() },
    });
    await this.audit(user.id, "comms.activity.complete", "CrmActivity", id, row);
    return row;
  }

  async escalateActivity(id: string, user: AuthedUser) {
    const a = await this.prisma.crmActivity.findFirst({ where: { id, ...this.branchFilter(user) } });
    if (!a) throw new NotFoundException("Activity not found");
    if (a.status !== "open") throw new BadRequestException("Only open activities can be escalated");
    const row = await this.prisma.crmActivity.update({
      where: { id },
      data: { status: "escalated", escalatedAt: new Date() },
    });
    await this.audit(user.id, "comms.activity.escalate", "CrmActivity", id, row);
    return row;
  }

  async slaDashboard(user: AuthedUser) {
    const now = new Date();
    const open = await this.prisma.crmActivity.count({ where: { status: "open", ...this.branchFilter(user) } });
    const overdue = await this.prisma.crmActivity.count({
      where: { status: "open", slaDueAt: { lt: now }, ...this.branchFilter(user) },
    });
    const escalated = await this.prisma.crmActivity.count({
      where: { status: "escalated", ...this.branchFilter(user) },
    });
    const done = await this.prisma.crmActivity.count({ where: { status: "done", ...this.branchFilter(user) } });
    const compliance = open + overdue + done > 0 ? Math.round((done / (open + overdue + done)) * 10000) / 100 : 100;
    return { open, overdue, escalated, done, compliancePct: compliance };
  }

  // ---------- Portal prep ----------
  async portalTimeline(partyKind: string, partyId: string, user: AuthedUser) {
    if (!PARTY_KINDS.has(partyKind)) throw new BadRequestException("Invalid partyKind");
    const threads = await this.prisma.commThread.findMany({
      where: { partyKind, partyId, ...this.branchFilter(user) },
      select: { id: true, relatedType: true, relatedId: true },
      take: 50,
    });
    const relatedPairs = threads.map((t) => ({ relatedType: t.relatedType, relatedId: t.relatedId }));
    // Also treat partyId as relatedId for customer/lead/org
    const relatedTypeGuess =
      partyKind === "prospect" ? "lead" : partyKind === "corporate" ? "organization" : partyKind === "customer" ? "customer" : partyKind;

    const [byParty, byRelated] = await Promise.all([
      this.prisma.communication.findMany({
        where: {
          OR: [{ partyKind, relatedId: partyId }, { relatedType: relatedTypeGuess, relatedId: partyId }],
          ...this.branchFilter(user),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { attachments: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, storageKey: true } } },
      }),
      relatedPairs.length
        ? this.prisma.commMessage.findMany({
            where: { threadId: { in: threads.map((t) => t.id) } },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { attachments: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, storageKey: true } } },
          })
        : Promise.resolve([]),
    ]);

    const items = [
      ...byParty.map((c) => ({
        id: c.id,
        source: "communication",
        channel: c.channel,
        direction: c.direction,
        summary: c.summary,
        body: c.body,
        status: c.status,
        attachments: c.attachments,
        createdAt: c.createdAt,
      })),
      ...byRelated.map((m) => ({
        id: m.id,
        source: "message",
        channel: m.channel,
        direction: m.direction,
        summary: m.subject || m.body.slice(0, 120),
        body: m.body,
        status: m.status,
        attachments: m.attachments,
        createdAt: m.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      partyKind,
      partyId,
      items,
      meta: { forPortal: true, stableDtoVersion: 1 },
    };
  }

  // ---------- Reports ----------
  async reportVolume(user: AuthedUser) {
    const rows = await this.prisma.commMessage.groupBy({
      by: ["channel"],
      where: { ...this.branchFilter(user) },
      _count: { _all: true },
    });
    const logged = await this.prisma.communication.groupBy({
      by: ["channel"],
      where: { ...this.branchFilter(user) },
      _count: { _all: true },
    });
    return {
      messages: rows.map((r) => ({ channel: r.channel, count: r._count._all })),
      timeline: logged.map((r) => ({ channel: r.channel, count: r._count._all })),
    };
  }

  async reportResponseTime(user: AuthedUser) {
    const threads = await this.prisma.commThread.findMany({
      where: { ...this.branchFilter(user) },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } },
      take: 100,
    });
    const deltas: number[] = [];
    for (const t of threads) {
      const inbound = t.messages.find((m) => m.direction === "inbound");
      const outbound = t.messages.find((m) => m.direction === "outbound" && inbound && m.createdAt > inbound.createdAt);
      if (inbound && outbound) {
        deltas.push((outbound.createdAt.getTime() - inbound.createdAt.getTime()) / 3600000);
      }
    }
    const avgHours = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
    return { sampleSize: deltas.length, avgResponseHours: Math.round(avgHours * 100) / 100 };
  }

  async reportSlaCompliance(user: AuthedUser) {
    return this.slaDashboard(user);
  }

  async reportActivityCompletion(user: AuthedUser) {
    const rows = await this.prisma.crmActivity.groupBy({
      by: ["status"],
      where: { ...this.branchFilter(user) },
      _count: { _all: true },
    });
    return { rows: rows.map((r) => ({ status: r.status, count: r._count._all })) };
  }

  async reportExecutiveProductivity(user: AuthedUser) {
    const rows = await this.prisma.crmActivity.groupBy({
      by: ["assignedTo"],
      where: { ...this.branchFilter(user) },
      _count: { _all: true },
    });
    const done = await this.prisma.crmActivity.groupBy({
      by: ["assignedTo"],
      where: { status: "done", ...this.branchFilter(user) },
      _count: { _all: true },
    });
    const sent = await this.prisma.commMessage.groupBy({
      by: ["byUser"],
      where: { status: { in: ["sent", "delivered"] }, ...this.branchFilter(user) },
      _count: { _all: true },
    });
    return {
      rows: rows.map((r) => ({
        userId: r.assignedTo,
        activities: r._count._all,
        completed: done.find((d) => d.assignedTo === r.assignedTo)?._count._all || 0,
        messagesSent: sent.find((s) => s.byUser === r.assignedTo)?._count._all || 0,
      })),
    };
  }
}
