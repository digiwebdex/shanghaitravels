import { Injectable } from "@nestjs/common";
import { MessagingAdapter, SendRequest, SendResult } from "./messaging.adapter";

/** Default SMS adapter — simulate or queue until a gateway is configured. */
@Injectable()
export class NullSmsAdapter extends MessagingAdapter {
  readonly channel = "sms" as const;
  readonly providerName = process.env.COMMS_SMS_PROVIDER || "null-sms";

  enabled(): boolean {
    return process.env.COMMS_SIMULATE_DELIVERY === "1" || process.env.COMMS_SMS_PROVIDER === "simulate";
  }

  async send(req: SendRequest): Promise<SendResult> {
    if (!this.enabled()) {
      return { ok: false, provider: this.providerName, status: "queued", error: "sms adapter not configured" };
    }
    const phone = String(req.to || "").replace(/\D/g, "");
    if (phone.length < 8) {
      return { ok: false, provider: this.providerName, status: "failed", error: "invalid SMS recipient" };
    }
    return {
      ok: true,
      provider: "simulate-sms",
      providerMessageId: `sim-sms-${Date.now()}`,
      status: "sent",
      simulated: true,
    };
  }
}
