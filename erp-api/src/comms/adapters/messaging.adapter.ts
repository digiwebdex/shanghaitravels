/** Phase D3 — pluggable messaging adapters (email / WhatsApp / SMS). */

export type MessagingChannel = "email" | "whatsapp" | "sms";

export type SendRequest = {
  to: string;
  subject?: string;
  body: string;
  templateCode?: string;
  meta?: Record<string, unknown>;
};

export type SendResult = {
  ok: boolean;
  provider: string;
  providerMessageId?: string;
  status: "sent" | "delivered" | "queued" | "failed";
  error?: string;
  simulated?: boolean;
};

export abstract class MessagingAdapter {
  abstract readonly channel: MessagingChannel;
  abstract readonly providerName: string;
  abstract enabled(): boolean;
  abstract send(req: SendRequest): Promise<SendResult>;
}

export const EMAIL_ADAPTER = Symbol("EMAIL_ADAPTER");
export const WHATSAPP_ADAPTER = Symbol("WHATSAPP_ADAPTER");
export const SMS_ADAPTER = Symbol("SMS_ADAPTER");
