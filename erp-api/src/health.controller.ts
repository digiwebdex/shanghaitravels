import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "./rbac";
import { PrismaService } from "./prisma.service";

@SkipThrottle() // monitoring polls these — must never be rate-limited
@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  /** Liveness — process is up + DB reachable. Used by the ST monitor. */
  @Public()
  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, service: "st-erp-api", ts: new Date().toISOString() };
  }

  /**
   * Readiness — verifies dependencies before routing traffic. Returns 503 if a
   * critical dependency (DB) is down; otherwise reports non-fatal signals
   * (delivery configured?, automation enabled?) for operators.
   */
  @Public()
  @Get("ready")
  async ready() {
    const checks: Record<string, string> = {};
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
      checks.database = "ok";
    } catch {
      checks.database = "down";
    }
    // Non-fatal operational signals.
    checks.deliveryMode =
      process.env.COMMS_EMAIL_PROVIDER === "smtp" || process.env.COMMS_WHATSAPP_PROVIDER === "wasender" || process.env.COMMS_SMS_PROVIDER === "http"
        ? "live" : (process.env.COMMS_SIMULATE_DELIVERY === "1" ? "simulate" : "unconfigured");
    checks.env = process.env.NODE_ENV || "unknown";
    const body = { ok: dbOk, service: "st-erp-api", ts: new Date().toISOString(), checks };
    if (!dbOk) throw new ServiceUnavailableException(body);
    return body;
  }
}
