import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  EMAIL_ADAPTER,
  SMS_ADAPTER,
  WHATSAPP_ADAPTER,
  MessagingAdapter,
  MessagingChannel,
} from "../comms/adapters/messaging.adapter";

/**
 * Outbox + delivery worker. enqueue() records a notification as `pending`.
 * processPending() delivers pending external-channel rows (email/whatsapp/sms)
 * through the shared MessagingModule adapters — REAL when a provider is
 * configured, simulate when COMMS_SIMULATE_DELIVERY=1, and left `pending` (no
 * fabricated delivery) when nothing is configured. In-app rows are consumed
 * in-app and are not touched here.
 */
@Injectable()
export class NotificationsService {
  private readonly log = new Logger("NotificationsService");
  constructor(
    private prisma: PrismaService,
    @Inject(EMAIL_ADAPTER) private email: MessagingAdapter,
    @Inject(WHATSAPP_ADAPTER) private whatsapp: MessagingAdapter,
    @Inject(SMS_ADAPTER) private sms: MessagingAdapter,
  ) {}

  private adapter(channel: string): MessagingAdapter | null {
    if (channel === "email") return this.email;
    if (channel === "whatsapp") return this.whatsapp;
    if (channel === "sms") return this.sms;
    return null; // inapp / unknown → no external delivery
  }

  enqueue(n: { channel: string; recipient: string; subject?: string; body: string; relatedType?: string; relatedId?: string }) {
    return this.prisma.notification.create({ data: { ...n, status: "pending" } });
  }

  /** Fan-out one event to every recipient/channel; returns enqueued rows. */
  async enqueueMany(recipients: { channel: string; recipient: string }[], msg: { subject?: string; body: string; relatedType?: string; relatedId?: string }) {
    return Promise.all(recipients.map((r) => this.enqueue({ ...r, ...msg })));
  }

  list(q: { status?: string; limit?: number }) {
    return this.prisma.notification.findMany({
      where: { ...(q.status ? { status: q.status } : {}) },
      orderBy: { createdAt: "desc" }, take: Math.min(200, Number(q.limit) || 50),
    });
  }

  /**
   * Delivery worker. Attempts each pending external-channel row through its
   * adapter. Marks `sent` (with providerMessageId) on success, `failed` (with
   * error) on adapter failure, and leaves rows `pending` when the channel's
   * adapter is not enabled (so nothing is fabricated). Batched.
   */
  async processPending(limit = 100) {
    const rows = await this.prisma.notification.findMany({
      where: { status: "pending", channel: { in: ["email", "whatsapp", "sms"] } },
      orderBy: { createdAt: "asc" }, take: Math.min(500, limit),
    });
    let delivered = 0, failed = 0, skipped = 0;
    for (const n of rows) {
      const adapter = this.adapter(n.channel);
      if (!adapter || !adapter.enabled()) { skipped++; continue; }
      try {
        const r = await adapter.send({ to: n.recipient, subject: n.subject || undefined, body: n.body });
        if (r.ok) {
          await this.prisma.notification.update({ where: { id: n.id }, data: { status: "sent", sentAt: new Date(), error: r.simulated ? "simulated" : null } });
          delivered++;
        } else {
          await this.prisma.notification.update({ where: { id: n.id }, data: { status: "failed", error: r.error || "delivery failed" } });
          failed++;
        }
      } catch (e) {
        await this.prisma.notification.update({ where: { id: n.id }, data: { status: "failed", error: e instanceof Error ? e.message : "delivery error" } });
        failed++;
      }
    }
    const stillPending = await this.prisma.notification.count({ where: { status: "pending", channel: { in: ["email", "whatsapp", "sms"] } } });
    return { processed: rows.length, delivered, failed, skipped, stillPending };
  }
}
