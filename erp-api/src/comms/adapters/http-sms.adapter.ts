import { Injectable, Logger } from "@nestjs/common";
import { MessagingAdapter, SendRequest, SendResult } from "./messaging.adapter";

/**
 * Production SMS adapter for a generic HTTP JSON gateway (native fetch). Enabled
 * when COMMS_SMS_PROVIDER=http and COMMS_SMS_API_URL is set; otherwise
 * MessagingModule routes to the null/simulate adapter (simulation stays available).
 *
 * Env: COMMS_SMS_API_URL, COMMS_SMS_API_KEY (optional bearer), COMMS_SMS_SENDER.
 * Posts { to, text, sender } — adjust the gateway to accept this shape, or point
 * COMMS_SMS_API_URL at an adapter endpoint that maps it.
 */
@Injectable()
export class HttpSmsAdapter extends MessagingAdapter {
  readonly channel = "sms" as const;
  readonly providerName = "http-sms";
  private readonly log = new Logger("HttpSmsAdapter");

  enabled(): boolean {
    return process.env.COMMS_SMS_PROVIDER === "http" && !!process.env.COMMS_SMS_API_URL;
  }

  async send(req: SendRequest): Promise<SendResult> {
    if (!this.enabled()) {
      return { ok: false, provider: this.providerName, status: "queued", error: "sms gateway not configured (COMMS_SMS_API_URL)" };
    }
    const phone = String(req.to || "").replace(/[^\d+]/g, "");
    if (phone.replace(/\D/g, "").length < 8) {
      return { ok: false, provider: this.providerName, status: "failed", error: "invalid SMS recipient" };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.COMMS_SMS_API_KEY) headers.Authorization = `Bearer ${process.env.COMMS_SMS_API_KEY}`;
      const res = await fetch(process.env.COMMS_SMS_API_URL as string, {
        method: "POST",
        headers,
        body: JSON.stringify({ to: phone, text: req.body, sender: process.env.COMMS_SMS_SENDER || undefined }),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        return { ok: false, provider: this.providerName, status: "failed", error: `sms HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}` };
      }
      const id = (json.messageId || json.id) as string | undefined;
      return { ok: true, provider: this.providerName, providerMessageId: id ? String(id) : undefined, status: "sent" };
    } catch (e) {
      const error = e instanceof Error ? e.message : "sms send failed";
      this.log.warn(`SMS send failed to ${phone}: ${error}`);
      return { ok: false, provider: this.providerName, status: "failed", error };
    } finally {
      clearTimeout(timer);
    }
  }
}
