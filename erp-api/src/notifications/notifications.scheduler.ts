import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NotificationsService } from "./notifications.service";

/**
 * HF1 — auto-deliver the notification outbox. Reuses NotificationsService.
 * processPending() (no new queue) on a fixed cadence, independent of the
 * automation on/off toggle so enqueued approvals/alerts always send once a
 * delivery provider is configured. Safe in simulate/unconfigured modes
 * (processPending only delivers when the channel adapter is enabled).
 */
@Injectable()
export class NotificationScheduler {
  private readonly log = new Logger("NotificationScheduler");
  constructor(private notes: NotificationsService) {}

  @Cron("*/2 * * * *")
  async flush() {
    try {
      const r = await this.notes.processPending();
      if (r.delivered || r.failed) this.log.log(`outbox flush: delivered=${r.delivered} failed=${r.failed} skipped=${r.skipped}`);
    } catch (e) {
      this.log.warn(`outbox flush error: ${e instanceof Error ? e.message : e}`);
    }
  }
}
