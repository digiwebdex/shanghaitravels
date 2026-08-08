import { Injectable } from "@nestjs/common";
import { MessagingAdapter, SendRequest, SendResult } from "./messaging.adapter";

/**
 * Default email adapter. Marks simulated delivery only when COMMS_SIMULATE_DELIVERY=1.
 * Swap for SMTP/SendGrid later without changing CommsService.
 */
@Injectable()
export class NullEmailAdapter extends MessagingAdapter {
  readonly channel = "email" as const;
  readonly providerName = "null-email";

  enabled(): boolean {
    return process.env.COMMS_SIMULATE_DELIVERY === "1" || process.env.COMMS_EMAIL_PROVIDER === "simulate";
  }

  async send(req: SendRequest): Promise<SendResult> {
    if (!this.enabled()) {
      return { ok: false, provider: this.providerName, status: "queued", error: "email adapter not configured" };
    }
    if (!req.to?.includes("@")) {
      return { ok: false, provider: this.providerName, status: "failed", error: "invalid email recipient" };
    }
    return {
      ok: true,
      provider: "simulate-email",
      providerMessageId: `sim-email-${Date.now()}`,
      status: "sent",
      simulated: true,
    };
  }
}
