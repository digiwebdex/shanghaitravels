import { Injectable } from "@nestjs/common";
import { MessagingAdapter, SendRequest, SendResult } from "./messaging.adapter";

/**
 * Simulation/fallback WhatsApp adapter. The REAL Wasender client is
 * WasenderWhatsAppAdapter, selected by MessagingModule when
 * COMMS_WHATSAPP_PROVIDER=wasender. This adapter simulates
 * (COMMS_SIMULATE_DELIVERY=1 or provider=simulate) or queues otherwise.
 */
@Injectable()
export class NullWhatsAppAdapter extends MessagingAdapter {
  readonly channel = "whatsapp" as const;
  readonly providerName = "null-whatsapp";

  enabled(): boolean {
    return process.env.COMMS_SIMULATE_DELIVERY === "1" || process.env.COMMS_WHATSAPP_PROVIDER === "simulate";
  }

  async send(req: SendRequest): Promise<SendResult> {
    if (!this.enabled()) {
      return { ok: false, provider: this.providerName, status: "queued", error: "whatsapp adapter not configured" };
    }
    const phone = String(req.to || "").replace(/\D/g, "");
    if (phone.length < 8) {
      return { ok: false, provider: this.providerName, status: "failed", error: "invalid WhatsApp recipient" };
    }
    return {
      ok: true,
      provider: "simulate-whatsapp",
      providerMessageId: `sim-wa-${Date.now()}`,
      status: "sent",
      simulated: true,
    };
  }
}
