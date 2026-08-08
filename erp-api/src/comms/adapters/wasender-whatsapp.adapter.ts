import { Injectable, Logger } from "@nestjs/common";
import { MessagingAdapter, SendRequest, SendResult } from "./messaging.adapter";

/**
 * Production WhatsApp adapter for Wasender (HTTP JSON API), using Node's native
 * fetch (Node 18+). Enabled when COMMS_WHATSAPP_PROVIDER=wasender and
 * COMMS_WASENDER_API_KEY is set; otherwise MessagingModule routes to the
 * null/simulate adapter, so simulation stays available.
 *
 * Env: COMMS_WASENDER_API_KEY, COMMS_WASENDER_API_URL
 *      (default https://wasenderapi.com/api/send-message).
 */
@Injectable()
export class WasenderWhatsAppAdapter extends MessagingAdapter {
  readonly channel = "whatsapp" as const;
  readonly providerName = "wasender";
  private readonly log = new Logger("WasenderWhatsAppAdapter");

  enabled(): boolean {
    return process.env.COMMS_WHATSAPP_PROVIDER === "wasender" && !!process.env.COMMS_WASENDER_API_KEY;
  }

  async send(req: SendRequest): Promise<SendResult> {
    if (!this.enabled()) {
      return { ok: false, provider: this.providerName, status: "queued", error: "wasender not configured (COMMS_WASENDER_API_KEY)" };
    }
    const phone = String(req.to || "").replace(/[^\d+]/g, "");
    if (phone.replace(/\D/g, "").length < 8) {
      return { ok: false, provider: this.providerName, status: "failed", error: "invalid WhatsApp recipient" };
    }
    const url = process.env.COMMS_WASENDER_API_URL || "https://wasenderapi.com/api/send-message";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.COMMS_WASENDER_API_KEY}` },
        body: JSON.stringify({ to: phone, text: req.body }),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        return { ok: false, provider: this.providerName, status: "failed", error: `wasender HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}` };
      }
      const id = (json.messageId || json.id || (json.data as Record<string, unknown>)?.msgId) as string | undefined;
      return { ok: true, provider: this.providerName, providerMessageId: id ? String(id) : undefined, status: "sent" };
    } catch (e) {
      const error = e instanceof Error ? e.message : "wasender send failed";
      this.log.warn(`Wasender send failed to ${phone}: ${error}`);
      return { ok: false, provider: this.providerName, status: "failed", error };
    } finally {
      clearTimeout(timer);
    }
  }
}
