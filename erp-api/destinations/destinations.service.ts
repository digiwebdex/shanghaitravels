import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

const DEST_STATUSES = new Set(["draft", "published", "archived"]);
const REGIONS = new Set([
  "Asia",
  "Middle East",
  "Europe",
  "Americas",
  "Africa",
  "Oceania",
]);
const SHOWCASE_TYPE = "destination_showcase";
const SHOWCASE_SLUG = "homepage-settings";

const DEFAULT_SHOWCASE = {
  maxCards: 8,
  showPackageCount: true,
  showRegion: true,
  showFlag: true,
  showHeroImage: true,
  showCta: true,
  ctaLabel: "Explore Destination",
  enabled: true,
};

const PUBLISHED_PKG = { status: "published" as const, deletedAt: null };

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function floatOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function boolQuery(v?: string): boolean | undefined {
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "destination"
  );
}

@Injectable()
export class DestinationsService {
  constructor(private prisma: PrismaService) {}

  private publishedPackageCountSelect() {
    return {
      _count: {
        select: {
          packages: { where: PUBLISHED_PKG },
        },
      },
    };
  }

  private withPackageCount<T extends { _count?: { packages: number } }>(row: T) {
    const { _count, ...rest } = row;
    return { ...rest, packageCount: _count?.packages ?? 0 };
  }

  private buildStaffWhere(q: Record<string, string | undefined>) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (q.region) where.region = q.region.trim();
    if (q.status) where.status = q.status.trim();
    if (q.country) where.country = { contains: q.country.trim(), mode: "insensitive" };
    if (q.countryCode) where.countryCode = q.countryCode.trim().toUpperCase();
    const popular = boolQuery(q.popular);
    if (popular !== undefined) where.popular = popular;
    const featured = boolQuery(q.featured);
    if (featured !== undefined) where.featured = featured;
    const homepageFeatured = boolQuery(q.homepageFeatured);
    if (homepageFeatured !== undefined) where.homepageFeatured = homepageFeatured;
    if (q.q?.trim()) {
      const term = q.q.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { country: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
      ];
    }
    return where;
  }

  private destinationDataFromDto(dto: any, userId?: string, partial = false) {
    const data: Record<string, unknown> = {};
    const strFields = [
      "name",
      "country",
      "countryCode",
      "isoCode",
      "flagEmoji",
      "flagUrl",
      "heroImageUrl",
      "region",
      "seoTitle",
      "seoDescription",
      "description",
      "mapEmbedUrl",
    ] as const;
    for (const k of strFields) {
      if (dto[k] !== undefined || !partial) {
        if (dto[k] !== undefined) {
          data[k] =
            dto[k] == null
              ? null
              : k === "countryCode" || k === "isoCode"
                ? String(dto[k]).trim().toUpperCase()
                : String(dto[k]);
        }
      }
    }
    if (dto.slug !== undefined) data.slug = String(dto.slug).trim();
    if (dto.status !== undefined) {
      const st = String(dto.status);
      if (!DEST_STATUSES.has(st)) throw new BadRequestException("invalid status");
      data.status = st;
    }
    if (dto.region !== undefined && dto.region != null) {
      const region = String(dto.region);
      if (region && !REGIONS.has(region)) throw new BadRequestException("invalid region");
      data.region = region || null;
    }
    for (const k of ["displayOrder"] as const) {
      if (dto[k] !== undefined) data[k] = numOrNull(dto[k]) ?? 0;
    }
    for (const k of ["latitude", "longitude"] as const) {
      if (dto[k] !== undefined) data[k] = floatOrNull(dto[k]);
    }
    for (const k of [
      "visaRequired",
      "popular",
      "featured",
      "homepageFeatured",
    ] as const) {
      if (dto[k] !== undefined) data[k] = !!dto[k];
    }
    if (dto.galleryJson !== undefined) data.galleryJson = dto.galleryJson ?? null;
    if (userId && !partial) data.createdBy = userId;
    return data;
  }

  async list(q: Record<string, string | undefined>) {
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 50));
    const offset = Math.max(0, Number(q.offset) || 0);
    const where = this.buildStaffWhere(q);
    const [rows, total] = await Promise.all([
      this.prisma.destinationMaster.findMany({
        where,
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        take: limit,
        skip: offset,
        include: this.publishedPackageCountSelect(),
      }),
      this.prisma.destinationMaster.count({ where }),
    ]);
    return {
      data: rows.map((r) => this.withPackageCount(r)),
      total,
      limit,
      offset,
    };
  }

  async get(id: string) {
    const row = await this.prisma.destinationMaster.findFirst({
      where: { id, deletedAt: null },
      include: this.publishedPackageCountSelect(),
    });
    if (!row) throw new NotFoundException("Destination not found");
    return this.withPackageCount(row);
  }

  async create(dto: any, user: AuthedUser) {
    const name = String(dto?.name || "").trim();
    const country = String(dto?.country || "").trim();
    if (!name || !country) throw new BadRequestException("name and country required");
    const slug = dto.slug ? String(dto.slug).trim() : slugify(name);
    const data = this.destinationDataFromDto({ ...dto, name, country, slug }, user.id);
    return this.prisma.destinationMaster.create({ data: data as any });
  }

  async update(id: string, dto: any) {
    await this.get(id);
    const data = this.destinationDataFromDto(dto, undefined, true);
    if (dto.destinationId !== undefined) {
      // no-op guard — destinationId is on packages, not destinations
    }
    if (dto.name !== undefined && !String(dto.name).trim()) {
      throw new BadRequestException("name cannot be empty");
    }
    if (dto.country !== undefined && !String(dto.country).trim()) {
      throw new BadRequestException("country cannot be empty");
    }
    return this.prisma.destinationMaster.update({ where: { id }, data: data as any });
  }

  async publish(id: string) {
    await this.get(id);
    return this.prisma.destinationMaster.update({
      where: { id },
      data: { status: "published" },
    });
  }

  async unpublish(id: string) {
    await this.get(id);
    return this.prisma.destinationMaster.update({
      where: { id },
      data: { status: "draft" },
    });
  }

  async archive(id: string) {
    await this.get(id);
    return this.prisma.destinationMaster.update({
      where: { id },
      data: { status: "archived" },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.destinationMaster.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" },
    });
    return { ok: true };
  }

  // ---------- CMS showcase settings ----------
  private parseShowcase(row: { meta?: unknown; summary?: string | null }) {
    const raw = row.meta ?? (row.summary ? JSON.parse(row.summary) : null);
    return { ...DEFAULT_SHOWCASE, ...(raw as object) };
  }

  async getShowcaseSettings() {
    const row = await this.prisma.cmsContent.findFirst({
      where: { type: SHOWCASE_TYPE, slug: SHOWCASE_SLUG, deletedAt: null },
    });
    if (!row) return DEFAULT_SHOWCASE;
    try {
      return this.parseShowcase(row);
    } catch {
      return DEFAULT_SHOWCASE;
    }
  }

  async putShowcaseSettings(dto: any, user: AuthedUser) {
    const settings = { ...DEFAULT_SHOWCASE, ...dto };
    const meta = {
      maxCards: numOrNull(settings.maxCards) ?? DEFAULT_SHOWCASE.maxCards,
      showPackageCount: settings.showPackageCount !== false,
      showRegion: settings.showRegion !== false,
      showFlag: settings.showFlag !== false,
      showHeroImage: settings.showHeroImage !== false,
      showCta: settings.showCta !== false,
      ctaLabel: String(settings.ctaLabel || DEFAULT_SHOWCASE.ctaLabel),
      enabled: settings.enabled !== false,
    };
    const existing = await this.prisma.cmsContent.findFirst({
      where: { type: SHOWCASE_TYPE, slug: SHOWCASE_SLUG },
    });
    if (existing) {
      await this.prisma.cmsContent.update({
        where: { id: existing.id },
        data: {
          meta,
          summary: JSON.stringify(meta),
          status: "published",
          publishedAt: new Date(),
        },
      });
    } else {
      await this.prisma.cmsContent.create({
        data: {
          type: SHOWCASE_TYPE,
          slug: SHOWCASE_SLUG,
          title: "Destination Homepage Showcase",
          summary: JSON.stringify(meta),
          body: "",
          meta,
          status: "published",
          publishedAt: new Date(),
          createdBy: user.id,
        },
      });
    }
    return meta;
  }

  // ---------- Public API ----------
  private publicWhere(extra: Record<string, unknown> = {}): Record<string, unknown> {
    return { deletedAt: null, status: "published", ...extra };
  }

  async siteList(q: Record<string, string | undefined>) {
    const limit = Math.min(
      100,
      Math.max(1, Number(q.limit) || (q.collection === "home" ? 8 : 24)),
    );
    const offset = Math.max(0, Number(q.offset) || 0);
    const where = this.publicWhere();
    const collection = q.collection?.trim() || "home";

    if (collection === "home") where.homepageFeatured = true;
    else if (collection === "popular") where.popular = true;
    else if (collection === "featured") where.featured = true;

    const orderBy =
      collection === "home"
        ? [{ displayOrder: "asc" as const }, { name: "asc" as const }]
        : [{ updatedAt: "desc" as const }];

    const [rows, total] = await Promise.all([
      this.prisma.destinationMaster.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: this.publishedPackageCountSelect(),
      }),
      this.prisma.destinationMaster.count({ where }),
    ]);

    const includePreview = q.includePackages === "true";
    let data = rows.map((r) => this.withPackageCount(r));

    if (includePreview) {
      data = await Promise.all(
        data.map(async (dest) => {
          const packages = await this.prisma.packageMaster.findMany({
            where: { destinationId: dest.id, ...PUBLISHED_PKG },
            take: 4,
            orderBy: [{ homeFeatured: "desc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnailUrl: true,
              pricePoisha: true,
              offerPricePoisha: true,
              durationDays: true,
              category: { select: { code: true, name: true } },
            },
          });
          return { ...dest, packages };
        }),
      );
    }

    return { data, total, limit, offset, collection };
  }

  async siteSettings() {
    return this.getShowcaseSettings();
  }

  async siteDetailBySlug(slug: string) {
    const row = await this.prisma.destinationMaster.findFirst({
      where: this.publicWhere({ slug }),
      include: {
        packages: {
          where: PUBLISHED_PKG,
          orderBy: [{ homeFeatured: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            code: true,
            name: true,
            slug: true,
            pricePoisha: true,
            offerPricePoisha: true,
            currencyCode: true,
            durationDays: true,
            durationNights: true,
            thumbnailUrl: true,
            bannerUrl: true,
            description: true,
            travelStartAt: true,
            category: { select: { code: true, name: true, slug: true } },
          },
        },
        _count: { select: { packages: { where: PUBLISHED_PKG } } },
      },
    });
    if (!row) throw new NotFoundException("Destination not found");

    const byCategory = await this.prisma.packageMaster.groupBy({
      by: ["categoryId"],
      where: { destinationId: row.id, ...PUBLISHED_PKG },
      _count: { id: true },
    });
    const categories = await this.prisma.packageCategory.findMany({
      where: { id: { in: byCategory.map((b) => b.categoryId) } },
      select: { id: true, code: true, name: true },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    const packageCountByCategory = byCategory.map((b) => ({
      category: catMap[b.categoryId] ?? { id: b.categoryId, code: "unknown", name: "Unknown" },
      count: b._count.id,
    }));

    const { _count, packages, galleryJson, ...rest } = row;
    return {
      ...rest,
      gallery: Array.isArray(galleryJson) ? galleryJson : [],
      mapEmbedUrl: row.mapEmbedUrl,
      packageCount: _count.packages,
      packageCountByCategory,
      packages,
    };
  }

  async siteBrowse(q: Record<string, string | undefined>) {
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 24));
    const offset = Math.max(0, Number(q.offset) || 0);

    const geoClause: Record<string, unknown> = {};
    if (q.region) geoClause.region = q.region.trim();
    if (q.country) {
      geoClause.country = { contains: q.country.trim(), mode: "insensitive" };
    }
    if (q.q?.trim()) {
      const term = q.q.trim();
      geoClause.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { country: { contains: term, mode: "insensitive" } },
      ];
    }

    const categoryCode = q.categoryCode?.trim();
    const budgetMin = q.budgetMin ? Number(q.budgetMin) : undefined;
    const budgetMax = q.budgetMax ? Number(q.budgetMax) : undefined;
    const hasPackageFilters =
      categoryCode || budgetMin != null || budgetMax != null;

    const orClauses: Record<string, unknown>[] = [];
    if (Object.keys(geoClause).length > 0) orClauses.push(geoClause);

    if (hasPackageFilters) {
      const pkgWhere: Record<string, unknown> = {
        ...PUBLISHED_PKG,
        destinationId: { not: null },
      };
      if (categoryCode) {
        pkgWhere.category = { code: categoryCode, deletedAt: null };
      }
      if (budgetMin != null || budgetMax != null) {
        pkgWhere.pricePoisha = {};
        if (budgetMin != null) (pkgWhere.pricePoisha as any).gte = budgetMin;
        if (budgetMax != null) (pkgWhere.pricePoisha as any).lte = budgetMax;
      }
      const matching = await this.prisma.packageMaster.findMany({
        where: pkgWhere,
        select: { destinationId: true },
        distinct: ["destinationId"],
      });
      const ids = matching
        .map((m) => m.destinationId)
        .filter((id): id is string => !!id);
      if (ids.length) orClauses.push({ id: { in: ids } });
      else if (orClauses.length === 0) {
        return { data: [], total: 0, limit, offset };
      }
    }

    const where: Record<string, unknown> = this.publicWhere();
    if (orClauses.length === 1) Object.assign(where, orClauses[0]);
    else if (orClauses.length > 1) where.OR = orClauses;

    const [rows, total] = await Promise.all([
      this.prisma.destinationMaster.findMany({
        where,
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        take: limit,
        skip: offset,
        include: this.publishedPackageCountSelect(),
      }),
      this.prisma.destinationMaster.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.withPackageCount(r)),
      total,
      limit,
      offset,
    };
  }
}
