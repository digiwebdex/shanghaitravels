import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma.service";
import { CommsService } from "../comms/comms.service";
import { AuthedUser } from "../rbac";

/**
 * V5 Phase 5 — enterprise automation engine (@nestjs/schedule). Reuses CommsService
 * (send), Communication + AuditLog (history) and the Setting store (admin config).
 * NO duplicate notification engine. Delivery stays SIMULATION-safe: when disabled
 * (default in prod) the cron jobs no-op; when enabled, sends go through CommsService
 * whose adapters simulate until Wasender/SMTP creds exist.
 *
 * Named roles: AutomationService (this) · ReminderScheduler/NotificationScheduler
 * (the @Cron methods) · QueueProcessor/RetryProcessor (runRetries) · AutomationRunner
 * (runReminders) · AutomationLog (AuditLog action=automation.*) · AutomationRules (config).
 */

type Channel = "whatsapp" | "email" | "sms";
type AutoConfig = { enabled: boolean; channelPriority: Channel[]; businessHours?: { start: number; end: number }; holidaySkip?: boolean };
const DEFAULT_CONFIG: AutoConfig = { enabled: false, channelPriority: ["whatsapp", "email", "sms"], businessHours: { start: 9, end: 21 } };
const SYSTEM: AuthedUser = { id: "system", email: "system@automation", role: "super_admin", branchId: null, permissions: new Set() } as AuthedUser;
const money = (m?: number | null) => `৳${((m ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

@Injectable()
export class AutomationService {
  private readonly log = new Logger("Automation");
  /** In-memory job registry powers the dashboard's scheduled/last-run/next-run view. */
  private jobs: Record<string, { cron: string; lastRun?: string; lastResult?: unknown; runs: number; failures: number }> = {
    dailyReminders: { cron: "0 3 * * *", runs: 0, failures: 0 },
    retrySweep: { cron: "*/15 * * * *", runs: 0, failures: 0 },
  };

  constructor(private prisma: PrismaService, private comms: CommsService) {}

  async config(): Promise<AutoConfig> {
    const s = await this.prisma.setting.findUnique({ where: { key: "automation_config" } });
    return { ...DEFAULT_CONFIG, ...((s?.value as object) || {}) };
  }
  async setConfig(value: Partial<AutoConfig>, userId: string) {
    const merged = { ...DEFAULT_CONFIG, ...(value || {}) };
    await this.prisma.setting.upsert({
      where: { key: "automation_config" },
      create: { key: "automation_config", value: merged as object, updatedBy: userId },
      update: { value: merged as object, updatedBy: userId },
    });
    return merged;
  }

  private async audit(action: string, entityType: string, entityId: string, meta?: unknown) {
    try {
      await this.prisma.auditLog.create({ data: { userId: "system", action, entityType, entityId, after: (meta as object) ?? undefined } });
    } catch {
      /* audit best-effort */
    }
  }

  /**
   * Single reusable event → customer/agent/staff notification. Every commercial event
   * (booking/invoice/payment/document/delivery) calls this — no per-event engine.
   */
  async notify(
    event: string,
    ctx: { customerId?: string; invoiceId?: string; applicationId?: string; channel?: Channel; templateCode?: string; vars?: Record<string, string>; to?: string },
  ) {
    const cfg = await this.config();
    const anchor = ctx.invoiceId || ctx.applicationId || ctx.customerId || "-";
    if (!cfg.enabled) {
      await this.audit(`automation.${event}.skipped`, "Automation", anchor, { reason: "disabled" });
      return { skipped: true };
    }
    const channel = ctx.channel || cfg.channelPriority[0] || "whatsapp";
    let to = ctx.to;
    if (!to && ctx.customerId) {
      const c = await this.prisma.customer.findUnique({ where: { id: ctx.customerId }, select: { email: true, phone: true, whatsapp: true } });
      to = channel === "email" ? c?.email || "" : channel === "whatsapp" ? c?.whatsapp || c?.phone || "" : c?.phone || "";
    }
    if (!to) {
      await this.audit(`automation.${event}.skipped`, "Automation", anchor, { reason: "no recipient" });
      return { skipped: true };
    }
    const relatedType = ctx.invoiceId ? "invoice" : ctx.applicationId ? "application" : "customer";
    const relatedId = ctx.invoiceId || ctx.applicationId || ctx.customerId || anchor;
    try {
      await this.comms.send(
        { channel, to, relatedType, relatedId, templateCode: ctx.templateCode, vars: ctx.vars || {}, partyKind: "customer", partyId: ctx.customerId },
        SYSTEM,
      );
      await this.audit(`automation.${event}.sent`, "Automation", anchor, { channel, to });
      return { sent: true };
    } catch (e) {
      await this.audit(`automation.${event}.failed`, "Automation", anchor, { error: String((e as Error)?.message || e) });
      return { failed: true };
    }
  }

  /** AutomationRunner — due/overdue payment reminders + passport-expiry reminders. */
  async runReminders() {
    const now = new Date();
    const days = (d: string | Date) => Math.round((new Date(d).getTime() - now.getTime()) / 86400000);
    let sent = 0;
    // Payment reminders — status filter excludes paid, so matches are outstanding.
    const invoices = await this.prisma.invoice.findMany({
      where: { deletedAt: null, dueAt: { not: null }, status: { in: ["issued", "sent", "approved", "viewed", "partially_paid", "overdue"] } },
      select: { id: true, invoiceNo: true, customerId: true, dueAt: true, total: true },
      take: 500,
    });
    for (const inv of invoices) {
      const d = days(inv.dueAt as Date);
      const w = d === 1 ? "due_1d" : d === 0 ? "due_today" : d === -1 ? "overdue_1d" : d === -3 ? "overdue_3d" : d === -7 ? "overdue_7d" : null;
      if (!w) continue;
      const r = await this.notify(`payment.${w}`, { customerId: inv.customerId, invoiceId: inv.id, templateCode: "inv_whatsapp", vars: { invoiceNo: inv.invoiceNo, amount: money(inv.total), dueAmount: money(inv.total) } });
      if ((r as { sent?: boolean }).sent) sent++;
    }
    // Passport-expiry reminders (30/15/7/1 days).
    const passports = await this.prisma.passport.findMany({ where: { expiryDate: { not: null } }, select: { passportNo: true, expiryDate: true, customerId: true }, take: 1000 });
    for (const p of passports) {
      const d = days(p.expiryDate as Date);
      if (![30, 15, 7, 1].includes(d)) continue;
      const r = await this.notify(`passport.expiry_${d}d`, { customerId: p.customerId, channel: "whatsapp", templateCode: "sms_reminder", vars: { message: `Passport ${p.passportNo} expires in ${d} day(s).` } });
      if ((r as { sent?: boolean }).sent) sent++;
    }
    return { sent, invoicesScanned: invoices.length, passportsScanned: passports.length };
  }

  /** RetryProcessor — re-dispatch failed messages up to 3 attempts (no duplicates). */
  async runRetries() {
    const failed = await this.prisma.commMessage.findMany({ where: { status: "failed" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true } });
    let retried = 0;
    for (const m of failed) {
      const prior = await this.prisma.auditLog.count({ where: { action: "automation.retry", entityId: m.id } });
      if (prior >= 3) continue;
      try {
        const r = await this.comms.resendMessage(m.id);
        await this.audit("automation.retry", "CommMessage", m.id, { attempt: prior + 1, ok: r.ok });
        if (r.ok) retried++;
      } catch (e) {
        await this.audit("automation.retry", "CommMessage", m.id, { attempt: prior + 1, ok: false, error: String((e as Error)?.message || e) });
      }
    }
    return { retried, scanned: failed.length };
  }

  async status() {
    return {
      config: await this.config(),
      jobs: this.jobs,
      recent: await this.prisma.auditLog.findMany({
        where: { action: { startsWith: "automation." } },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { id: true, action: true, entityType: true, entityId: true, after: true, createdAt: true },
      }),
    };
  }

  // ---- ReminderScheduler / RetryProcessor (@nestjs/schedule) ----
  @Cron("0 3 * * *")
  async cronReminders() {
    const cfg = await this.config();
    if (!cfg.enabled) return;
    const j = this.jobs.dailyReminders;
    j.lastRun = new Date().toISOString();
    j.runs++;
    try {
      j.lastResult = await this.runReminders();
    } catch (e) {
      j.failures++;
      this.log.error(`reminders failed: ${(e as Error)?.message}`);
    }
  }

  @Cron("*/15 * * * *")
  async cronRetries() {
    const cfg = await this.config();
    if (!cfg.enabled) return;
    const j = this.jobs.retrySweep;
    j.lastRun = new Date().toISOString();
    j.runs++;
    try {
      j.lastResult = await this.runRetries();
    } catch (e) {
      j.failures++;
      this.log.error(`retries failed: ${(e as Error)?.message}`);
    }
  }
}
