import { Module } from "@nestjs/common";
import { EMAIL_ADAPTER, SMS_ADAPTER, WHATSAPP_ADAPTER } from "./adapters/messaging.adapter";
import { NullEmailAdapter } from "./adapters/null-email.adapter";
import { NullWhatsAppAdapter } from "./adapters/null-whatsapp.adapter";
import { NullSmsAdapter } from "./adapters/null-sms.adapter";
import { SmtpEmailAdapter } from "./adapters/smtp-email.adapter";
import { WasenderWhatsAppAdapter } from "./adapters/wasender-whatsapp.adapter";
import { HttpSmsAdapter } from "./adapters/http-sms.adapter";

/**
 * Provider architecture for outbound messaging. Each channel token resolves to a
 * REAL adapter when its provider env names a production provider, otherwise to the
 * null/simulate adapter — so simulation mode (COMMS_SIMULATE_DELIVERY=1) is always
 * available and switching to production is env-only, no code change.
 *
 *   COMMS_EMAIL_PROVIDER=smtp       → SmtpEmailAdapter (else null/simulate)
 *   COMMS_WHATSAPP_PROVIDER=wasender→ WasenderWhatsAppAdapter (else null/simulate)
 *   COMMS_SMS_PROVIDER=http         → HttpSmsAdapter (else null/simulate)
 *
 * Shared by CommsModule (thread/message send) and NotificationsModule (outbox
 * delivery worker) so both deliver through the same adapters — no duplication.
 */
@Module({
  providers: [
    { provide: EMAIL_ADAPTER, useFactory: () => (process.env.COMMS_EMAIL_PROVIDER === "smtp" ? new SmtpEmailAdapter() : new NullEmailAdapter()) },
    { provide: WHATSAPP_ADAPTER, useFactory: () => (process.env.COMMS_WHATSAPP_PROVIDER === "wasender" ? new WasenderWhatsAppAdapter() : new NullWhatsAppAdapter()) },
    { provide: SMS_ADAPTER, useFactory: () => (process.env.COMMS_SMS_PROVIDER === "http" ? new HttpSmsAdapter() : new NullSmsAdapter()) },
  ],
  exports: [EMAIL_ADAPTER, WHATSAPP_ADAPTER, SMS_ADAPTER],
})
export class MessagingModule {}
