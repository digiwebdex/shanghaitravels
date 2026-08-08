import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  BadRequestException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Permissions, CurrentUser, AuthedUser } from "./rbac";

const PKG_TYPES = new Set([
  "group", "private", "corporate", "honeymoon", "family", "educational", "religious", "other",
]);
const CATEGORIES = new Set(["domestic", "international"]);
const SEASONS = new Set(["peak", "shoulder", "off", "all_year"]);
const DEP_STATUS = new Set(["open", "full", "closed", "cancelled"]);

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Tour product catalogs — Phase B4.
 * Curated supplier packages + departures + destinations. Not an OTA marketplace.
 */
@Controller("reference")
export class TourCatalogController {
  constructor(private prisma: PrismaService) {}

  // ---------- Packages ----------
  @Get("tour-packages")
  async listPackages(
    @Query("q") q?: string,
    @Query("category") category?: string,
    @Query("packageType") packageType?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (category?.trim()) where.category = category.trim();
    if (packageType?.trim()) where.packageType = packageType.trim();
    if (q?.trim()) {
      where.OR = ["code", "name", "destination", "country", "city"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.tourPackage.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
      include: { _count: { select: { departures: true } } },
    });
    return { data, total: data.length };
  }

  @Get("tour-packages/:id")
  async getPackage(@Param("id") id: string) {
    const row = await this.prisma.tourPackage.findFirst({
      where: { id, deletedAt: null },
      include: { departures: { where: { deletedAt: null }, orderBy: { departAt: "asc" } } },
    });
    if (!row) throw new NotFoundException("Tour package not found");
    return row;
  }

  @Post("tour-packages")
  @Permissions("settings:manage")
  async createPackage(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const name = String(dto?.name || "").trim();
    const code = String(dto?.code || "").trim().toUpperCase();
    const packageType = String(dto?.packageType || "group").trim();
    const category = String(dto?.category || "international").trim();
    if (!name || !code) throw new BadRequestException("code and name are required");
    if (!PKG_TYPES.has(packageType)) throw new BadRequestException("invalid packageType");
    if (!CATEGORIES.has(category)) throw new BadRequestException("invalid category");
    if (dto.season && !SEASONS.has(String(dto.season))) throw new BadRequestException("invalid season");
    return this.prisma.tourPackage.create({
      data: {
        code,
        name,
        packageType,
        category,
        destination: dto.destination ? String(dto.destination).trim() : null,
        country: dto.country ? String(dto.country).trim() : null,
        city: dto.city ? String(dto.city).trim() : null,
        season: dto.season ? String(dto.season).trim() : null,
        durationDays: numOrNull(dto.durationDays),
        durationNights: numOrNull(dto.durationNights),
        itinerary: dto.itinerary != null ? String(dto.itinerary) : null,
        inclusions: dto.inclusions != null ? String(dto.inclusions) : null,
        exclusions: dto.exclusions != null ? String(dto.exclusions) : null,
        activities: dto.activities != null ? String(dto.activities) : null,
        hotelsNote: dto.hotelsNote != null ? String(dto.hotelsNote) : null,
        transportNote: dto.transportNote != null ? String(dto.transportNote) : null,
        flightsNote: dto.flightsNote != null ? String(dto.flightsNote) : null,
        visaRequirements: dto.visaRequirements != null ? String(dto.visaRequirements) : null,
        insuranceNote: dto.insuranceNote != null ? String(dto.insuranceNote) : null,
        occupancyNote: dto.occupancyNote != null ? String(dto.occupancyNote) : null,
        childPolicy: dto.childPolicy != null ? String(dto.childPolicy) : null,
        seasonalPricingNote: dto.seasonalPricingNote != null ? String(dto.seasonalPricingNote) : null,
        costBreakdown: dto.costBreakdown != null ? String(dto.costBreakdown) : null,
        supplierCostPoisha: numOrNull(dto.supplierCostPoisha),
        sellingPricePoisha: numOrNull(dto.sellingPricePoisha),
        notes: dto.notes != null ? String(dto.notes) : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch("tour-packages/:id")
  @Permissions("settings:manage")
  async updatePackage(@Param("id") id: string, @Body() dto: any) {
    await this.getPackage(id);
    const data: Record<string, unknown> = {};
    for (const k of [
      "name", "destination", "country", "city", "itinerary", "inclusions", "exclusions",
      "activities", "hotelsNote", "transportNote", "flightsNote", "visaRequirements",
      "insuranceNote", "occupancyNote", "childPolicy", "seasonalPricingNote", "costBreakdown", "notes",
    ] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]);
    }
    if (dto.code !== undefined) data.code = String(dto.code).trim().toUpperCase();
    if (dto.packageType !== undefined) {
      if (!PKG_TYPES.has(String(dto.packageType))) throw new BadRequestException("invalid packageType");
      data.packageType = String(dto.packageType);
    }
    if (dto.category !== undefined) {
      if (!CATEGORIES.has(String(dto.category))) throw new BadRequestException("invalid category");
      data.category = String(dto.category);
    }
    if (dto.season !== undefined) {
      if (dto.season && !SEASONS.has(String(dto.season))) throw new BadRequestException("invalid season");
      data.season = dto.season ? String(dto.season) : null;
    }
    if (dto.durationDays !== undefined) data.durationDays = numOrNull(dto.durationDays);
    if (dto.durationNights !== undefined) data.durationNights = numOrNull(dto.durationNights);
    if (dto.supplierCostPoisha !== undefined) data.supplierCostPoisha = numOrNull(dto.supplierCostPoisha);
    if (dto.sellingPricePoisha !== undefined) data.sellingPricePoisha = numOrNull(dto.sellingPricePoisha);
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    if (data.name === "" || data.code === "") throw new BadRequestException("code/name cannot be empty");
    return this.prisma.tourPackage.update({ where: { id }, data });
  }

  @Delete("tour-packages/:id")
  @Permissions("settings:manage")
  async removePackage(@Param("id") id: string) {
    await this.getPackage(id);
    await this.prisma.tourPackage.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { ok: true };
  }

  // ---------- Departures ----------
  @Get("tour-departures")
  async listDepartures(
    @Query("packageId") packageId?: string,
    @Query("status") status?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (packageId?.trim()) where.packageId = packageId.trim();
    if (status?.trim()) where.status = status.trim();
    const data = await this.prisma.tourDeparture.findMany({
      where,
      orderBy: [{ departAt: "asc" }],
      take: limit,
      include: { package: { select: { id: true, code: true, name: true } } },
    });
    return { data, total: data.length };
  }

  @Post("tour-departures")
  @Permissions("settings:manage")
  async createDeparture(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const packageId = String(dto?.packageId || "").trim();
    if (!packageId) throw new BadRequestException("packageId required");
    const pkg = await this.prisma.tourPackage.findFirst({ where: { id: packageId, deletedAt: null } });
    if (!pkg) throw new NotFoundException("Tour package not found");
    if (!dto.departAt) throw new BadRequestException("departAt required");
    const status = String(dto.status || "open");
    if (!DEP_STATUS.has(status)) throw new BadRequestException("invalid status");
    return this.prisma.tourDeparture.create({
      data: {
        packageId,
        departAt: new Date(dto.departAt),
        returnAt: dto.returnAt ? new Date(dto.returnAt) : null,
        seats: numOrNull(dto.seats),
        status,
        notes: dto.notes != null ? String(dto.notes) : null,
        createdBy: u.id,
      },
    });
  }

  @Patch("tour-departures/:id")
  @Permissions("settings:manage")
  async updateDeparture(@Param("id") id: string, @Body() dto: any) {
    const existing = await this.prisma.tourDeparture.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Departure not found");
    const data: Record<string, unknown> = {};
    if (dto.departAt !== undefined) data.departAt = new Date(dto.departAt);
    if (dto.returnAt !== undefined) data.returnAt = dto.returnAt ? new Date(dto.returnAt) : null;
    if (dto.seats !== undefined) data.seats = numOrNull(dto.seats);
    if (dto.notes !== undefined) data.notes = dto.notes == null ? null : String(dto.notes);
    if (dto.status !== undefined) {
      if (!DEP_STATUS.has(String(dto.status))) throw new BadRequestException("invalid status");
      data.status = String(dto.status);
    }
    return this.prisma.tourDeparture.update({ where: { id }, data });
  }

  @Delete("tour-departures/:id")
  @Permissions("settings:manage")
  async removeDeparture(@Param("id") id: string) {
    const existing = await this.prisma.tourDeparture.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Departure not found");
    await this.prisma.tourDeparture.update({ where: { id }, data: { deletedAt: new Date(), status: "cancelled" } });
    return { ok: true };
  }

  // ---------- Destinations ----------
  @Get("tour-destinations")
  async listDestinations(
    @Query("q") q?: string,
    @Query("country") country?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (country?.trim()) where.country = { contains: country.trim(), mode: "insensitive" };
    if (q?.trim()) {
      where.OR = ["name", "country", "city", "region"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.tourDestination.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
    });
    return { data, total: data.length };
  }

  @Post("tour-destinations")
  @Permissions("settings:manage")
  async createDestination(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const name = String(dto?.name || "").trim();
    if (!name) throw new BadRequestException("name is required");
    return this.prisma.tourDestination.create({
      data: {
        name,
        country: dto.country ? String(dto.country).trim() : null,
        city: dto.city ? String(dto.city).trim() : null,
        region: dto.region ? String(dto.region).trim() : null,
        season: dto.season ? String(dto.season).trim() : null,
        notes: dto.notes != null ? String(dto.notes) : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch("tour-destinations/:id")
  @Permissions("settings:manage")
  async updateDestination(@Param("id") id: string, @Body() dto: any) {
    const existing = await this.prisma.tourDestination.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Destination not found");
    const data: Record<string, unknown> = {};
    for (const k of ["name", "country", "city", "region", "season", "notes"] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]).trim();
    }
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    if (data.name === "") throw new BadRequestException("name cannot be empty");
    return this.prisma.tourDestination.update({ where: { id }, data });
  }

  @Delete("tour-destinations/:id")
  @Permissions("settings:manage")
  async removeDestination(@Param("id") id: string) {
    const existing = await this.prisma.tourDestination.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Destination not found");
    await this.prisma.tourDestination.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { ok: true };
  }
}
