import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { NotificationsService } from "../notifications/notifications.service";
import { nextApplicationReference } from "../util/next-reference";

const PKG_STATUSES = new Set(["draft", "published", "archived", "scheduled"]);
const GALLERY_KINDS = new Set(["thumbnail", "gallery", "banner"]);
const AVAIL_STATUSES = new Set(["open", "full", "closed", "cancelled"]);

const CATEGORY_TO_SERVICE: Record<string, string> = {
  visa: "visa",
  air_ticket: "air_ticket",
  hotel: "hotel",
  tour: "tour",
  hajj: "hajj",
  umrah: "umrah",
  transport: "transport",
  student: "student",
  work_permit: "work",
  medical: "medical",
  custom: "tour",
};

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function boolQuery(v?: string): boolean | undefined {
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "package";
}

@Injectable()
export class PackagesService {
  constructor(
    private prisma: PrismaService,
    private notes: NotificationsService,
  ) {}

  // ---------- Categories ----------
  async listCategories(activeOnly?: boolean) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (activeOnly) where.isActive = true;
    const data = await this.prisma.packageCategory.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { packages: { where: { deletedAt: null } } } } },
    });
    return { data, total: data.length };
  }

  async createCategory(dto: any) {
    const code = String(dto?.code || "").trim().toLowerCase();
    const name = String(dto?.name || "").trim();
    if (!code || !name) throw new BadRequestException("code and name are required");
    const slug = dto.slug ? String(dto.slug).trim() : slugify(name);
    return this.prisma.packageCategory.create({
      data: {
        code,
        name,
        slug,
        description: dto.description != null ? String(dto.description) : null,
        icon: dto.icon != null ? String(dto.icon) : null,
        sortOrder: numOrNull(dto.sortOrder) ?? 0,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateCategory(id: string, dto: any) {
    const row = await this.prisma.packageCategory.findFirst({ where: { id, deletedAt: null } });
    if (!row) throw new NotFoundException("Category not found");
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = String(dto.name).trim();
    if (dto.code !== undefined) data.code = String(dto.code).trim().toLowerCase();
    if (dto.slug !== undefined) data.slug = String(dto.slug).trim();
    if (dto.description !== undefined) data.description = dto.description == null ? null : String(dto.description);
    if (dto.icon !== undefined) data.icon = dto.icon == null ? null : String(dto.icon);
    if (dto.sortOrder !== undefined) data.sortOrder = numOrNull(dto.sortOrder) ?? 0;
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    return this.prisma.packageCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const row = await this.prisma.packageCategory.findFirst({ where: { id, deletedAt: null } });
    if (!row) throw new NotFoundException("Category not found");
    await this.prisma.packageCategory.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }

  // ---------- Package filters ----------
  private buildStaffWhere(q: Record<string, string | undefined>) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (q.categoryId) where.categoryId = q.categoryId.trim();
    if (q.categoryCode) where.category = { code: q.categoryCode.trim(), deletedAt: null };
    if (q.country) where.country = { contains: q.country.trim(), mode: "insensitive" };
    if (q.destination) where.destination = { contains: q.destination.trim(), mode: "insensitive" };
    if (q.status) where.status = q.status.trim();
    if (q.packageType) where.packageType = q.packageType.trim();
    const featured = boolQuery(q.featured);
    if (featured !== undefined) where.featured = featured;
    const popular = boolQuery(q.popular);
    if (popular !== undefined) where.popular = popular;
    const recommended = boolQuery(q.recommended);
    if (recommended !== undefined) where.recommended = recommended;
    const homeFeatured = boolQuery(q.homeFeatured);
    if (homeFeatured !== undefined) where.homeFeatured = homeFeatured;
    const agentFeatured = boolQuery(q.agentFeatured);
    if (agentFeatured !== undefined) where.agentFeatured = agentFeatured;
    const corporateFeatured = boolQuery(q.corporateFeatured);
    if (corporateFeatured !== undefined) where.corporateFeatured = corporateFeatured;
    if (q.durationMin || q.durationMax) {
      where.durationDays = {};
      if (q.durationMin) (where.durationDays as any).gte = Number(q.durationMin);
      if (q.durationMax) (where.durationDays as any).lte = Number(q.durationMax);
    }
    if (q.priceMin || q.priceMax) {
      where.pricePoisha = {};
      if (q.priceMin) (where.pricePoisha as any).gte = Number(q.priceMin);
      if (q.priceMax) (where.pricePoisha as any).lte = Number(q.priceMax);
    }
    if (q.travelMonth) {
      const [y, m] = q.travelMonth.split("-").map(Number);
      if (y && m) {
        const start = new Date(Date.UTC(y, m - 1, 1));
        const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
        where.travelStartAt = { gte: start, lte: end };
      }
    }
    if (q.tags?.trim()) {
      where.tags = { contains: q.tags.trim(), mode: "insensitive" };
    }
    if (q.q?.trim()) {
      where.OR = ["code", "name", "slug", "destination", "country", "tags"].map((f) => ({
        [f]: { contains: q.q!.trim(), mode: "insensitive" },
      }));
    }
    return where;
  }

  private buildPublicWhere(q: Record<string, string | undefined>, collection?: string) {
    const now = new Date();
    const where: Record<string, unknown> = {
      deletedAt: null,
      status: "published",
      OR: [{ expireAt: null }, { expireAt: { gt: now } }],
    };
    if (collection === "featured") where.featured = true;
    else if (collection === "popular") where.popular = true;
    else if (collection === "recommended") where.recommended = true;
    else if (collection === "home" || collection === "banner") where.homeFeatured = true;
    else if (collection === "latest") { /* order handled separately */ }
    else if (collection === "seasonal") {
      where.travelStartAt = { gte: now };
    }
    Object.assign(where, this.buildStaffWhere(q));
    delete (where as any).status;
    (where as any).status = "published";
    return where;
  }

  async listPackages(q: Record<string, string | undefined>) {
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 50));
    const offset = Math.max(0, Number(q.offset) || 0);
    const where = this.buildStaffWhere(q);
    const [data, total] = await Promise.all([
      this.prisma.packageMaster.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          category: { select: { id: true, code: true, name: true, slug: true } },
          _count: { select: { gallery: true, availability: true, faqs: true } },
        },
      }),
      this.prisma.packageMaster.count({ where }),
    ]);
    return { data, total, limit, offset };
  }

  async getPackage(id: string) {
    const row = await this.prisma.packageMaster.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        gallery: { orderBy: { sortOrder: "asc" } },
        availability: { orderBy: { startAt: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
        reviews: { where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 50 },
        supplier: { select: { id: true, code: true, name: true } },
      },
    });
    if (!row) throw new NotFoundException("Package not found");
    return row;
  }

  private packageDataFromDto(dto: any, userId?: string, partial = false) {
    const data: Record<string, unknown> = {};
    const strFields = [
      "name", "country", "destination", "cities", "packageType", "currencyCode", "tags",
      "seoTitle", "seoDescription", "thumbnailUrl", "bannerUrl", "videoUrl", "description",
      "highlights", "included", "excluded", "terms", "cancellationPolicy", "visaRequirements",
      "hotelDetails", "flightDetails", "transportDetails", "mealPlan", "tourPlan", "mapEmbedUrl",
    ] as const;
    for (const k of strFields) {
      if (dto[k] !== undefined || !partial) {
        if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]);
      }
    }
    if (dto.code !== undefined || !partial) {
      if (dto.code !== undefined) data.code = String(dto.code).trim().toUpperCase();
    }
    if (dto.slug !== undefined) data.slug = String(dto.slug).trim();
    if (dto.categoryId !== undefined) data.categoryId = String(dto.categoryId).trim();
    if (dto.status !== undefined) {
      const st = String(dto.status);
      if (!PKG_STATUSES.has(st)) throw new BadRequestException("invalid status");
      data.status = st;
    }
    for (const k of [
      "durationDays", "durationNights", "pricePoisha", "offerPricePoisha",
      "adultPricePoisha", "childPricePoisha", "infantPricePoisha", "singleSupplementPoisha",
      "maxPax", "minPax", "seatsAvailable", "seatsSold", "agentCommissionBps", "ratingCount",
    ] as const) {
      if (dto[k] !== undefined) data[k] = numOrNull(dto[k]);
    }
    if (dto.ratingAvg !== undefined) data.ratingAvg = dto.ratingAvg == null ? null : Number(dto.ratingAvg);
    for (const k of [
      "featured", "popular", "recommended", "homeFeatured", "agentFeatured",
      "corporateFeatured", "corporateApproved",
    ] as const) {
      if (dto[k] !== undefined) data[k] = !!dto[k];
    }
    if (dto.travelStartAt !== undefined) data.travelStartAt = dto.travelStartAt ? new Date(dto.travelStartAt) : null;
    if (dto.travelEndAt !== undefined) data.travelEndAt = dto.travelEndAt ? new Date(dto.travelEndAt) : null;
    if (dto.publishAt !== undefined) data.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
    if (dto.expireAt !== undefined) data.expireAt = dto.expireAt ? new Date(dto.expireAt) : null;
    if (dto.supplierId !== undefined) data.supplierId = dto.supplierId || null;
    if (dto.destinationId !== undefined) data.destinationId = dto.destinationId || null;
    if (dto.itineraryJson !== undefined) data.itineraryJson = dto.itineraryJson ?? null;
    if (dto.faqJson !== undefined) data.faqJson = dto.faqJson ?? null;
    if (userId && !partial) data.createdBy = userId;
    return data;
  }

  async createPackage(dto: any, user: AuthedUser) {
    const code = String(dto?.code || "").trim().toUpperCase();
    const name = String(dto?.name || "").trim();
    const categoryId = String(dto?.categoryId || "").trim();
    if (!code || !name || !categoryId) throw new BadRequestException("code, name, categoryId required");
    const cat = await this.prisma.packageCategory.findFirst({ where: { id: categoryId, deletedAt: null } });
    if (!cat) throw new NotFoundException("Category not found");
    const slug = dto.slug ? String(dto.slug).trim() : slugify(name);
    const data = this.packageDataFromDto({ ...dto, code, name, categoryId, slug }, user.id);
    return this.prisma.packageMaster.create({ data: data as any });
  }

  async updatePackage(id: string, dto: any) {
    await this.getPackage(id);
    const data = this.packageDataFromDto(dto, undefined, true);
    if (dto.categoryId) {
      const cat = await this.prisma.packageCategory.findFirst({ where: { id: dto.categoryId, deletedAt: null } });
      if (!cat) throw new NotFoundException("Category not found");
    }
    return this.prisma.packageMaster.update({ where: { id }, data: data as any });
  }

  async publishPackage(id: string) {
    await this.getPackage(id);
    return this.prisma.packageMaster.update({
      where: { id },
      data: { status: "published", publishAt: new Date() },
    });
  }

  async unpublishPackage(id: string) {
    await this.getPackage(id);
    return this.prisma.packageMaster.update({ where: { id }, data: { status: "draft" } });
  }

  async archivePackage(id: string) {
    await this.getPackage(id);
    return this.prisma.packageMaster.update({ where: { id }, data: { status: "archived" } });
  }

  async schedulePackage(id: string, dto: { publishAt?: string; expireAt?: string }) {
    await this.getPackage(id);
    const publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
    const expireAt = dto.expireAt ? new Date(dto.expireAt) : null;
    const status = publishAt && publishAt > new Date() ? "scheduled" : "published";
    return this.prisma.packageMaster.update({
      where: { id },
      data: { publishAt, expireAt, status },
    });
  }

  async clonePackage(id: string, user: AuthedUser) {
    const src = await this.getPackage(id);
    const suffix = Date.now().toString().slice(-6);
    const code = `${src.code}-${suffix}`.slice(0, 40);
    const slug = `${src.slug}-${suffix}`.slice(0, 120);
    const { id: _id, createdAt, updatedAt, deletedAt, gallery, availability, faqs, reviews, category, supplier, ...rest } = src as any;
    const clone = await this.prisma.packageMaster.create({
      data: {
        ...rest,
        code,
        slug,
        name: `${src.name} (Copy)`,
        status: "draft",
        seatsSold: 0,
        publishAt: null,
        expireAt: null,
        createdBy: user.id,
      },
    });
    if (gallery?.length) {
      await this.prisma.packageGalleryItem.createMany({
        data: gallery.map((g: any) => ({
          packageId: clone.id,
          url: g.url,
          caption: g.caption,
          sortOrder: g.sortOrder,
          kind: g.kind,
        })),
      });
    }
    if (faqs?.length) {
      await this.prisma.packageFaq.createMany({
        data: faqs.map((f: any) => ({
          packageId: clone.id,
          question: f.question,
          answer: f.answer,
          sortOrder: f.sortOrder,
        })),
      });
    }
    return this.getPackage(clone.id);
  }

  async deletePackage(id: string) {
    await this.getPackage(id);
    await this.prisma.packageMaster.update({ where: { id }, data: { deletedAt: new Date(), status: "archived" } });
    return { ok: true };
  }

  // ---------- Gallery ----------
  async listGallery(packageId: string) {
    await this.getPackage(packageId);
    const data = await this.prisma.packageGalleryItem.findMany({
      where: { packageId },
      orderBy: { sortOrder: "asc" },
    });
    return { data, total: data.length };
  }

  async addGalleryItem(packageId: string, dto: any) {
    await this.getPackage(packageId);
    const url = String(dto?.url || "").trim();
    if (!url) throw new BadRequestException("url required");
    const kind = String(dto.kind || "gallery");
    if (!GALLERY_KINDS.has(kind)) throw new BadRequestException("invalid kind");
    return this.prisma.packageGalleryItem.create({
      data: {
        packageId,
        url,
        caption: dto.caption != null ? String(dto.caption) : null,
        sortOrder: numOrNull(dto.sortOrder) ?? 0,
        kind: kind as any,
      },
    });
  }

  async deleteGalleryItem(packageId: string, itemId: string) {
    const item = await this.prisma.packageGalleryItem.findFirst({ where: { id: itemId, packageId } });
    if (!item) throw new NotFoundException("Gallery item not found");
    await this.prisma.packageGalleryItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  // ---------- Availability ----------
  async listAvailability(packageId: string) {
    await this.getPackage(packageId);
    const data = await this.prisma.packageAvailability.findMany({
      where: { packageId },
      orderBy: { startAt: "asc" },
    });
    return { data, total: data.length };
  }

  async addAvailability(packageId: string, dto: any) {
    await this.getPackage(packageId);
    if (!dto.startAt) throw new BadRequestException("startAt required");
    const status = String(dto.status || "open");
    if (!AVAIL_STATUSES.has(status)) throw new BadRequestException("invalid status");
    return this.prisma.packageAvailability.create({
      data: {
        packageId,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        seats: numOrNull(dto.seats),
        seatsSold: numOrNull(dto.seatsSold) ?? 0,
        status: status as any,
        notes: dto.notes != null ? String(dto.notes) : null,
      },
    });
  }

  async updateAvailability(packageId: string, slotId: string, dto: any) {
    const slot = await this.prisma.packageAvailability.findFirst({ where: { id: slotId, packageId } });
    if (!slot) throw new NotFoundException("Availability slot not found");
    const data: Record<string, unknown> = {};
    if (dto.startAt !== undefined) data.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) data.endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (dto.seats !== undefined) data.seats = numOrNull(dto.seats);
    if (dto.seatsSold !== undefined) data.seatsSold = numOrNull(dto.seatsSold) ?? 0;
    if (dto.notes !== undefined) data.notes = dto.notes == null ? null : String(dto.notes);
    if (dto.status !== undefined) {
      if (!AVAIL_STATUSES.has(String(dto.status))) throw new BadRequestException("invalid status");
      data.status = String(dto.status);
    }
    return this.prisma.packageAvailability.update({ where: { id: slotId }, data });
  }

  async deleteAvailability(packageId: string, slotId: string) {
    const slot = await this.prisma.packageAvailability.findFirst({ where: { id: slotId, packageId } });
    if (!slot) throw new NotFoundException("Availability slot not found");
    await this.prisma.packageAvailability.delete({ where: { id: slotId } });
    return { ok: true };
  }

  // ---------- FAQs ----------
  async listFaqs(packageId: string) {
    await this.getPackage(packageId);
    const data = await this.prisma.packageFaq.findMany({
      where: { packageId },
      orderBy: { sortOrder: "asc" },
    });
    return { data, total: data.length };
  }

  async addFaq(packageId: string, dto: any) {
    await this.getPackage(packageId);
    const question = String(dto?.question || "").trim();
    const answer = String(dto?.answer || "").trim();
    if (!question || !answer) throw new BadRequestException("question and answer required");
    return this.prisma.packageFaq.create({
      data: {
        packageId,
        question,
        answer,
        sortOrder: numOrNull(dto.sortOrder) ?? 0,
      },
    });
  }

  // ---------- Reports ----------
  async reportsSummary() {
    const apps = await this.prisma.application.groupBy({
      by: ["packageId"],
      where: { packageId: { not: null }, deletedAt: null },
      _count: { id: true },
    });
    const invoices = await this.prisma.invoice.groupBy({
      by: ["packageId"],
      where: { packageId: { not: null }, deletedAt: null, status: { in: ["issued", "partially_paid", "paid"] } },
      _sum: { total: true },
      _count: { id: true },
    });
    const popular = await this.prisma.packageMaster.findMany({
      where: { deletedAt: null, popular: true },
      select: { id: true, code: true, name: true, seatsSold: true, pricePoisha: true },
      take: 20,
    });
    const unsold = await this.prisma.packageMaster.findMany({
      where: { deletedAt: null, status: "published", seatsSold: 0 },
      select: { id: true, code: true, name: true, seatsAvailable: true },
      take: 50,
    });
    const byCategory = await this.prisma.packageMaster.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null },
      _count: { id: true },
    });
    const categories = await this.prisma.packageCategory.findMany({
      where: { id: { in: byCategory.map((b) => b.categoryId) } },
      select: { id: true, code: true, name: true },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const agentCount = await this.prisma.packageMaster.count({ where: { deletedAt: null, agentFeatured: true } });
    const corporateCount = await this.prisma.packageMaster.count({
      where: { deletedAt: null, OR: [{ corporateApproved: true }, { corporateFeatured: true }] },
    });
    const packageIds = [...new Set([
      ...apps.map((a) => a.packageId!),
      ...invoices.map((i) => i.packageId!),
    ])];
    const packages = packageIds.length
      ? await this.prisma.packageMaster.findMany({
          where: { id: { in: packageIds } },
          select: { id: true, code: true, name: true },
        })
      : [];
    const pkgMap = Object.fromEntries(packages.map((p) => [p.id, p]));
    return {
      salesByPackage: apps.map((a) => ({
        packageId: a.packageId,
        package: pkgMap[a.packageId!] ?? null,
        bookings: a._count.id,
        revenuePoisha: invoices.find((i) => i.packageId === a.packageId)?._sum.total ?? 0,
        invoiceCount: invoices.find((i) => i.packageId === a.packageId)?._count.id ?? 0,
      })),
      popular,
      unsold,
      revenuePoisha: invoices.reduce((s, i) => s + (i._sum.total ?? 0), 0),
      agentFeaturedCount: agentCount,
      corporatePackageCount: corporateCount,
      byCategory: byCategory.map((b) => ({
        categoryId: b.categoryId,
        category: catMap[b.categoryId] ?? null,
        count: b._count.id,
      })),
    };
  }

  // ---------- CSV export/import ----------
  async exportCsv() {
    const rows = await this.prisma.packageMaster.findMany({
      where: { deletedAt: null },
      include: { category: { select: { code: true } } },
      orderBy: { code: "asc" },
    });
    const headers = [
      "code", "name", "slug", "categoryCode", "country", "destination", "durationDays", "durationNights",
      "packageType", "pricePoisha", "offerPricePoisha", "currencyCode", "status", "featured", "popular",
    ];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push([
        r.code, r.name, r.slug, r.category.code, r.country ?? "", r.destination ?? "",
        r.durationDays ?? "", r.durationNights ?? "", r.packageType ?? "",
        r.pricePoisha, r.offerPricePoisha ?? "", r.currencyCode, r.status,
        r.featured, r.popular,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    return lines.join("\n");
  }

  async importCsv(body: { csv?: string; rows?: Record<string, unknown>[] }, user: AuthedUser) {
    let rows: Record<string, unknown>[] = [];
    if (body.rows?.length) {
      rows = body.rows;
    } else if (body.csv) {
      const lines = body.csv.trim().split(/\r?\n/);
      if (lines.length < 2) throw new BadRequestException("csv must have header + rows");
      const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
      rows = lines.slice(1).map((line) => {
        const cols = line.match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
        return obj;
      });
    } else {
      throw new BadRequestException("csv or rows required");
    }
    const cats = await this.prisma.packageCategory.findMany({ where: { deletedAt: null } });
    const catByCode = Object.fromEntries(cats.map((c) => [c.code, c.id]));
    const created: string[] = [];
    for (const row of rows) {
      const code = String(row.code || "").trim().toUpperCase();
      const name = String(row.name || "").trim();
      const categoryCode = String(row.categoryCode || "custom").trim();
      const categoryId = catByCode[categoryCode];
      if (!code || !name || !categoryId) continue;
      const existing = await this.prisma.packageMaster.findFirst({ where: { code } });
      if (existing) continue;
      const pkg = await this.prisma.packageMaster.create({
        data: {
          code,
          name,
          slug: String(row.slug || slugify(name)),
          categoryId,
          country: row.country ? String(row.country) : null,
          destination: row.destination ? String(row.destination) : null,
          durationDays: numOrNull(row.durationDays),
          durationNights: numOrNull(row.durationNights),
          packageType: row.packageType ? String(row.packageType) : null,
          pricePoisha: numOrNull(row.pricePoisha) ?? 0,
          offerPricePoisha: numOrNull(row.offerPricePoisha),
          currencyCode: String(row.currencyCode || "BDT"),
          status: PKG_STATUSES.has(String(row.status)) ? (String(row.status) as any) : "draft",
          featured: row.featured === true || row.featured === "true",
          popular: row.popular === true || row.popular === "true",
          createdBy: user.id,
        },
      });
      created.push(pkg.id);
    }
    return { ok: true, created: created.length, ids: created };
  }

  // ---------- Public site ----------
  async siteList(q: Record<string, string | undefined>) {
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 24));
    const offset = Math.max(0, Number(q.offset) || 0);
    const where = this.buildPublicWhere(q, q.collection);
    const orderBy =
      q.collection === "latest"
        ? [{ publishAt: "desc" as const }, { createdAt: "desc" as const }]
        : [{ updatedAt: "desc" as const }];
    const [data, total] = await Promise.all([
      this.prisma.packageMaster.findMany({
        where,
        orderBy: orderBy as any,
        take: limit,
        skip: offset,
        select: {
          id: true, code: true, name: true, slug: true, destination: true, country: true,
          durationDays: true, durationNights: true, pricePoisha: true, offerPricePoisha: true,
          currencyCode: true, thumbnailUrl: true, bannerUrl: true, featured: true, popular: true,
          recommended: true, travelStartAt: true, travelEndAt: true, tags: true, ratingAvg: true,
          category: { select: { code: true, name: true, slug: true } },
        },
      }),
      this.prisma.packageMaster.count({ where }),
    ]);
    return { data, total, limit, offset };
  }

  async siteSearch(q: Record<string, string | undefined>) {
    return this.siteList(q);
  }

  async siteDetailBySlug(slug: string) {
    const now = new Date();
    const row = await this.prisma.packageMaster.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: "published",
        OR: [{ expireAt: null }, { expireAt: { gt: now } }],
      },
      include: {
        category: { select: { code: true, name: true, slug: true } },
        gallery: { orderBy: { sortOrder: "asc" } },
        availability: { where: { status: "open" }, orderBy: { startAt: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
        reviews: { where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!row) throw new NotFoundException("Package not found");
    const related = await this.prisma.packageMaster.findMany({
      where: {
        deletedAt: null,
        status: "published",
        id: { not: row.id },
        OR: [
          { categoryId: row.categoryId },
          { destination: row.destination ?? undefined },
        ],
      },
      take: 6,
      select: {
        id: true, name: true, slug: true, thumbnailUrl: true, pricePoisha: true,
        offerPricePoisha: true, destination: true, durationDays: true,
      },
    });
    return { ...row, related };
  }

  async siteEnquire(slug: string, dto: any, ip?: string) {
    const pkg = await this.prisma.packageMaster.findFirst({
      where: { slug, deletedAt: null, status: "published" },
      include: { category: true },
    });
    if (!pkg) throw new NotFoundException("Package not found");
    const name = String(dto?.name || "").trim();
    if (!name) throw new BadRequestException("name required");
    const branchId = (await this.prisma.branch.findFirst({ where: { type: "corporate" } }))?.id ?? null;
    const leadNo = `LD-PKG-${Date.now().toString().slice(-8)}`;
    const serviceInterest = CATEGORY_TO_SERVICE[pkg.category.code] ?? "tour";
    const lead = await this.prisma.lead.create({
      data: {
        leadNo,
        name,
        phone: dto.phone ? String(dto.phone).trim() : null,
        email: dto.email ? String(dto.email).trim() : null,
        source: "web",
        serviceInterest,
        status: "new_lead",
        priority: "warm",
        notes: [
          `Enquiry for package ${pkg.name} (${pkg.code})`,
          dto.travelDate ? `Travel date: ${dto.travelDate}` : null,
          dto.pax != null ? `Pax: ${dto.pax}` : null,
          dto.notes || dto.message ? String(dto.notes || dto.message).trim().slice(0, 3500) : null,
          ip ? `IP: ${ip}` : null,
        ].filter(Boolean).join("\n"),
        packageId: pkg.id,
        branchId,
        createdBy: "site-package",
      },
    });
    const staff = await this.prisma.user.findMany({
      where: {
        status: "active",
        deletedAt: null,
        role: { name: { in: ["super_admin", "general_manager", "marketing_manager", "office_incharge"] } },
      },
      select: { id: true },
      take: 20,
    });
    await this.notes.enqueueMany(
      staff.map((u) => ({ channel: "inapp", recipient: u.id })),
      {
        subject: `Package enquiry: ${pkg.name}`,
        body: `${name} enquired about ${pkg.code}`,
        relatedType: "Lead",
        relatedId: lead.id,
      },
    );
    return { ok: true, leadId: lead.id, packageId: pkg.id };
  }

  serviceTypeForPackage(pkg: { category: { code: string } }) {
    return (CATEGORY_TO_SERVICE[pkg.category.code] ?? "tour") as any;
  }

  // ---------- Customer portal ----------
  async customerListPublished(limit = 50) {
    return this.siteList({ limit: String(limit) });
  }

  async customerGetPublished(id: string) {
    const now = new Date();
    const row = await this.prisma.packageMaster.findFirst({
      where: {
        id,
        deletedAt: null,
        status: "published",
        OR: [{ expireAt: null }, { expireAt: { gt: now } }],
      },
      include: {
        category: { select: { code: true, name: true } },
        gallery: { orderBy: { sortOrder: "asc" } },
        availability: { where: { status: "open" }, orderBy: { startAt: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!row) throw new NotFoundException("Package not found");
    return row;
  }

  async listWishlist(customerId: string) {
    const data = await this.prisma.packageWishlist.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        package: {
          select: {
            id: true, code: true, name: true, slug: true, thumbnailUrl: true,
            pricePoisha: true, offerPricePoisha: true, destination: true, status: true,
          },
        },
      },
    });
    return { data, total: data.length };
  }

  async addWishlist(customerId: string, packageId: string) {
    const pkg = await this.customerGetPublished(packageId);
    await this.prisma.packageWishlist.upsert({
      where: { customerId_packageId: { customerId, packageId: pkg.id } },
      create: { customerId, packageId: pkg.id },
      update: {},
    });
    return { ok: true };
  }

  async removeWishlist(customerId: string, packageId: string) {
    await this.prisma.packageWishlist.deleteMany({ where: { customerId, packageId } });
    return { ok: true };
  }

  async customerBook(customerId: string, packageId: string, dto: any) {
    const pkg = await this.prisma.packageMaster.findFirst({
      where: { id: packageId, deletedAt: null, status: "published" },
      include: { category: true },
    });
    if (!pkg) throw new NotFoundException("Package not found");
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    const serviceType = this.serviceTypeForPackage(pkg);
    const referenceNo = await nextApplicationReference(this.prisma);
    const app = await this.prisma.application.create({
      data: {
        branchId: customer.branchId,
        referenceNo,
        serviceType,
        customerId,
        packageId: pkg.id,
        title: String(dto?.title || pkg.name).trim().slice(0, 200),
        status: "draft",
        source: "customer_portal",
        createdBy: `customer:${customerId}`,
      },
    });
    await this.prisma.applicationEvent.create({
      data: {
        applicationId: app.id,
        type: "created",
        message: `Customer booked package ${pkg.code}${dto?.message ? ": " + String(dto.message).slice(0, 400) : ""}`,
      },
    });
    return { ok: true, id: app.id, referenceNo, packageId: pkg.id };
  }

  // ---------- Agent portal ----------
  async agentListPublished(limit = 100) {
    const data = await this.prisma.packageMaster.findMany({
      where: { deletedAt: null, status: "published", agentFeatured: true },
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true, code: true, name: true, slug: true, destination: true, country: true,
        pricePoisha: true, offerPricePoisha: true, agentCommissionBps: true, durationDays: true,
        thumbnailUrl: true, category: { select: { code: true, name: true } },
      },
    });
    return { data, total: data.length };
  }

  async agentBook(agentId: string, packageId: string, dto: any) {
    const pkg = await this.prisma.packageMaster.findFirst({
      where: { id: packageId, deletedAt: null, status: "published" },
      include: { category: true },
    });
    if (!pkg) throw new NotFoundException("Package not found");
    let customerId = dto?.customerId ? String(dto.customerId).trim() : null;
    const branch = await this.prisma.branch.findFirst({ where: { type: "corporate" } });
    const branchId = branch?.id;
    if (!branchId) throw new BadRequestException("No branch configured");
    if (!customerId) {
      const fullName = String(dto?.customerName || dto?.fullName || "").trim();
      const phone = String(dto?.phone || dto?.customerPhone || "").trim();
      if (!fullName || !phone) throw new BadRequestException("customerId or customerName+phone required");
      const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
      const customer = await this.prisma.customer.create({
        data: {
          branchId,
          code,
          fullName,
          phone,
          email: dto?.customerEmail ? String(dto.customerEmail).trim() : undefined,
          source: "agent",
          createdBy: `agent:${agentId}`,
        },
      });
      customerId = customer.id;
    }
    const serviceType = this.serviceTypeForPackage(pkg);
    const referenceNo = await nextApplicationReference(this.prisma);
    const app = await this.prisma.application.create({
      data: {
        branchId,
        referenceNo,
        serviceType,
        customerId,
        packageId: pkg.id,
        title: String(dto?.title || pkg.name).trim().slice(0, 200),
        status: "draft",
        source: "agent_portal",
        agentId,
        createdBy: `agent:${agentId}`,
      },
    });
    return { ok: true, id: app.id, referenceNo, customerId, packageId: pkg.id };
  }

  // ---------- Corporate portal ----------
  async corporateListPublished(limit = 100) {
    const data = await this.prisma.packageMaster.findMany({
      where: {
        deletedAt: null,
        status: "published",
        OR: [{ corporateApproved: true }, { corporateFeatured: true }],
      },
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true, code: true, name: true, slug: true, destination: true, country: true,
        pricePoisha: true, offerPricePoisha: true, durationDays: true, corporateApproved: true,
        thumbnailUrl: true, category: { select: { code: true, name: true } },
      },
    });
    return { data, total: data.length };
  }
}
