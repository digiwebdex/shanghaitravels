import { Injectable, BadRequestException, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { nextApplicationReference } from "../util/next-reference";

const SERVICE_TYPES = new Set(["visa", "air_ticket", "hotel", "tour", "hajj", "umrah", "student", "medical", "immigration", "insurance", "transport", "corporate", "work"]);
const ASSIGN_ROLES = ["super_admin", "general_manager", "office_incharge"];

// Default public-site scope until the owner changes it from Settings → admin.
// The website shows ONLY these destinations/services; everything else is hidden.
// China-only, Bangladesh → China, active services = ticket/visa/hotel/study/work.
const DEFAULT_SITE_CONFIG = { origin: "Bangladesh", destinations: ["China"], services: ["visa", "air_ticket", "hotel", "student", "work"] };

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService, private notes: NotificationsService) {}

  /**
   * Public, unauthenticated site config. Drives what the website shows so the
   * owner can add destinations/services from the admin panel (Settings key
   * `public_site_config`) with no redeploy. Falls back to China-only default.
   */
  async getPublicConfig() {
    const [site, active] = await Promise.all([
      this.prisma.setting.findUnique({ where: { key: "public_site_config" } }),
      this.prisma.setting.findUnique({ where: { key: "active_services" } }),
    ]);
    const merged = { ...DEFAULT_SITE_CONFIG, ...((site?.value as object) || {}) };
    // Single source of truth: services follow the admin `active_services` list when set.
    if (Array.isArray(active?.value)) merged.services = active!.value as string[];
    return merged;
  }

  // Simple in-memory per-IP rate limit (5 / 10 min). Good enough for a low-volume
  // intake form; swap for @nestjs/throttler + Redis if volume grows.
  private hits = new Map<string, { n: number; ts: number }>();
  private rateLimit(ip: string) {
    const now = Date.now(), rec = this.hits.get(ip) || { n: 0, ts: now };
    if (now - rec.ts > 10 * 60 * 1000) { rec.n = 0; rec.ts = now; }
    rec.n++; this.hits.set(ip, rec);
    if (rec.n > 5) throw new HttpException("Too many requests. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
  }

  private clean(s: any, max: number) { return typeof s === "string" ? s.trim().slice(0, max) : undefined; }

  /**
   * Public B2C intake: creates a REAL case (source=b2c_web, unassigned, draft)
   * for staff to fulfil by hand, and enqueues a staff alert. Returns ONLY a
   * reference — never internal ids/customer data to an unauthenticated caller.
   */
  /** Public country reference list (active), featured first. */
  async countries() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { iso2: true, name: true, isFeatured: true, region: true },
    });
  }

  /** QR document verification. Customer-safe fields only — no internal notes/finance/audit. */
  async verifyDocument(no: string) {
    const q = String(no || "").trim();
    if (!q) return { valid: false as const };
    const inv = await this.prisma.invoice.findFirst({
      where: { invoiceNo: { equals: q, mode: "insensitive" }, deletedAt: null },
      select: { invoiceNo: true, status: true, total: true, currency: true, issuedAt: true, createdAt: true, customer: { select: { fullName: true } } },
    });
    if (!inv) return { valid: false as const };
    const mask = (n?: string | null) => {
      if (!n) return "—";
      const p = n.trim().split(/\s+/);
      return p[0] + (p[1] ? ` ${p[1][0]}.` : "");
    };
    return {
      valid: true as const,
      type: "invoice",
      number: inv.invoiceNo,
      status: inv.status,
      total: inv.total,
      currency: inv.currency,
      issuedAt: inv.issuedAt || inv.createdAt,
      customerName: mask(inv.customer?.fullName),
    };
  }

  /**
   * V6 Wave 1 — public booking tracking by reference number. Customer-safe:
   * status + stage progress + masked name only (no finance/notes/personal data).
   */
  async trackBooking(ref: string) {
    const q = String(ref || "").trim();
    if (!q) return { found: false as const };
    const app = await this.prisma.application.findFirst({
      where: { referenceNo: { equals: q, mode: "insensitive" }, deletedAt: null },
      select: {
        referenceNo: true, serviceType: true, status: true, currentStage: true, totalStages: true,
        title: true, updatedAt: true, createdAt: true,
        customer: { select: { fullName: true } },
        stages: { orderBy: { stageNo: "asc" }, select: { stageNo: true, name: true, status: true, completedAt: true } },
      },
    });
    if (!app) return { found: false as const };
    const mask = (n?: string | null) => {
      if (!n) return "—";
      const p = n.trim().split(/\s+/);
      return p[0] + (p[1] ? ` ${p[1][0]}.` : "");
    };
    return {
      found: true as const,
      referenceNo: app.referenceNo,
      serviceType: app.serviceType,
      status: app.status,
      currentStage: app.currentStage,
      totalStages: app.totalStages,
      title: app.title,
      customerName: mask(app.customer?.fullName),
      updatedAt: app.updatedAt,
      createdAt: app.createdAt,
      stages: app.stages,
    };
  }

  async intake(dto: any, ip: string) {
    this.rateLimit(ip);
    const fullName = this.clean(dto.name, 100);
    const phone = this.clean(dto.phone, 20);
    const email = this.clean(dto.email, 120);
    const message = this.clean(dto.message, 2000);
    let serviceType = this.clean(dto.serviceType, 30) || "visa";
    if (!fullName || fullName.length < 2) throw new BadRequestException("Name is required.");
    if (!phone || phone.length < 6) throw new BadRequestException("A valid phone number is required.");
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequestException("Email is not valid.");
    if (!SERVICE_TYPES.has(serviceType)) serviceType = "visa";
    const destination = this.clean(dto.destination, 60);
    const direction = dto.direction === "inbound" ? "inbound" : "outbound";

    // Default branch (corporate) + reuse an existing customer if the phone matches.
    const branch = await this.prisma.branch.findFirst({ where: { type: "corporate" } }) ?? await this.prisma.branch.findFirst();
    if (!branch) throw new BadRequestException("System not ready.");
    let customer = await this.prisma.customer.findFirst({ where: { phone, deletedAt: null } });
    if (!customer) {
      const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
      customer = await this.prisma.customer.create({
        data: { branchId: branch.id, code, fullName, phone, email, source: "b2c_web", createdBy: "public-intake" },
      });
    }
    const referenceNo = await nextApplicationReference(this.prisma);
    const app = await this.prisma.application.create({
      data: { branchId: branch.id, referenceNo, serviceType: serviceType as any, customerId: customer.id,
        title: `Web enquiry — ${serviceType}${destination ? " to " + destination : ""}`, direction: direction as any,
        status: "draft", source: "b2c_web", createdBy: "public-intake" },
    });
    await this.prisma.applicationEvent.create({ data: { applicationId: app.id, type: "created",
      message: `B2C web intake from ${fullName} (${phone})${destination ? " · " + direction + " " + destination : ""}${message ? ": " + message : ""}` } });

    // Alert staff who can assign — inapp now; email/WhatsApp channels light up once creds exist.
    const staff = await this.prisma.user.findMany({ where: { status: "active", deletedAt: null, role: { name: { in: ASSIGN_ROLES } } }, select: { id: true } });
    await this.notes.enqueueMany(
      staff.map((u) => ({ channel: "inapp", recipient: u.id })),
      { subject: "New web enquiry", body: `${referenceNo}: ${serviceType} enquiry from ${fullName} (${phone})`, relatedType: "application", relatedId: app.id },
    );
    return { ok: true, reference: referenceNo };
  }
}
