import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { MessagingAdapter, SendRequest, SendResult } from "./messaging.adapter";

/**
 * Production SMTP email adapter (nodemailer). Enabled when COMMS_EMAIL_PROVIDER=smtp
 * and SMTP host + user are set. Falls through to the null/simulate adapter otherwise
 * (selection happens in MessagingModule), so simulation mode stays available.
 *
 * Env: SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE (true=465), SMTP_USER,
 *      SMTP_PASS, SMTP_FROM (default SMTP_USER).
 */
@Injectable()
export class SmtpEmailAdapter extends MessagingAdapter {
  readonly channel = "email" as const;
  readonly providerName = "smtp";
  private readonly log = new Logger("SmtpEmailAdapter");
  private transport?: nodemailer.Transporter;

  enabled(): boolean {
    return process.env.COMMS_EMAIL_PROVIDER === "smtp" && !!process.env.SMTP_HOST && !!process.env.SMTP_USER;
  }

  private transporter(): nodemailer.Transporter {
    if (!this.transport) {
      this.transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    return this.transport;
  }

  async send(req: SendRequest): Promise<SendResult> {
    if (!this.enabled()) {
      return { ok: false, provider: this.providerName, status: "queued", error: "smtp not configured (SMTP_HOST/SMTP_USER)" };
    }
    if (!req.to?.includes("@")) {
      return { ok: false, provider: this.providerName, status: "failed", error: "invalid email recipient" };
    }
    try {
      const info = await this.transporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: req.to,
        subject: req.subject || "(no subject)",
        text: req.body,
      });
      return { ok: true, provider: this.providerName, providerMessageId: info.messageId, status: "sent" };
    } catch (e) {
      const error = e instanceof Error ? e.message : "smtp send failed";
      this.log.warn(`SMTP send failed to ${req.to}: ${error}`);
      return { ok: false, provider: this.providerName, status: "failed", error };
    }
  }
}
