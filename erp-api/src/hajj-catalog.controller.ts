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

const KINDS = new Set(["hajj", "umrah"]);
const CATEGORIES = new Set(["economy", "standard", "premium", "vip"]);
const GROUP_STATUS = new Set(["forming", "confirmed", "departed", "returned", "cancelled"]);
const VISA_STATUS = new Set(["not_applied", "applied", "approved", "rejected"]);
const PASSPORT_STATUS = new Set(["received", "pending", "expired"]);

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Hajj & Umrah catalogs — Phase B5.
 * Packages, pilgrims, groups. Booking cases remain on Application spine.
 */
@Controller("reference")
export class HajjCatalogController {
  constructor(private prisma: PrismaService) {}

  // ---------- Packages ----------
  @Get("hajj-packages")
  async listPackages(
    @Query("q") q?: string,
    @Query("kind") kind?: string,
    @Query("category") category?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (kind?.trim()) where.kind = kind.trim();
    if (category?.trim()) where.category = category.trim();
    if (q?.trim()) {
      where.OR = ["code", "name", "season", "departureCity"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.hajjUmrahPackage.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
      include: { _count: { select: { groups: true } } },
    });
    return { data, total: data.length };
  }

  @Get("hajj-packages/:id")
  async getPackage(@Param("id") id: string) {
    const row = await this.prisma.hajjUmrahPackage.findFirst({
      where: { id, deletedAt: null },
      include: { groups: { where: { deletedAt: null }, orderBy: { departAt: "asc" } } },
    });
    if (!row) throw new NotFoundException("Hajj/Umrah package not found");
    return row;
  }

  @Post("hajj-packages")
  @Permissions("settings:manage")
  async createPackage(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const name = String(dto?.name || "").trim();
    const code = String(dto?.code || "").trim().toUpperCase();
    const kind = String(dto?.kind || "hajj").trim();
    const category = String(dto?.category || "standard").trim();
    if (!name || !code) throw new BadRequestException("code and name are required");
    if (!KINDS.has(kind)) throw new BadRequestException("invalid kind");
    if (!CATEGORIES.has(category)) throw new BadRequestException("invalid category");
    return this.prisma.hajjUmrahPackage.create({
      data: {
        code,
        name,
        kind,
        category,
        season: dto.season ? String(dto.season).trim() : null,
        year: dto.year ? String(dto.year).trim() : null,
        durationDays: numOrNull(dto.durationDays),
        departureCity: dto.departureCity ? String(dto.departureCity).trim() : null,
        hotelMakkah: dto.hotelMakkah ? String(dto.hotelMakkah).trim() : null,
        hotelMadinah: dto.hotelMadinah ? String(dto.hotelMadinah).trim() : null,
        roomType: dto.roomType ? String(dto.roomType).trim() : null,
        occupancyNote: dto.occupancyNote != null ? String(dto.occupancyNote) : null,
        inclusions: dto.inclusions != null ? String(dto.inclusions) : null,
        exclusions: dto.exclusions != null ? String(dto.exclusions) : null,
        capacity: numOrNull(dto.capacity),
        supplierCostPoisha: numOrNull(dto.supplierCostPoisha),
        sellingPricePoisha: numOrNull(dto.sellingPricePoisha),
        notes: dto.notes != null ? String(dto.notes) : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch("hajj-packages/:id")
  @Permissions("settings:manage")
  async updatePackage(@Param("id") id: string, @Body() dto: any) {
    await this.getPackage(id);
    const data: Record<string, unknown> = {};
    for (const k of [
      "name", "season", "year", "departureCity", "hotelMakkah", "hotelMadinah", "roomType",
      "occupancyNote", "inclusions", "exclusions", "notes",
    ] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]);
    }
    if (dto.code !== undefined) data.code = String(dto.code).trim().toUpperCase();
    if (dto.kind !== undefined) {
      if (!KINDS.has(String(dto.kind))) throw new BadRequestException("invalid kind");
      data.kind = String(dto.kind);
    }
    if (dto.category !== undefined) {
      if (!CATEGORIES.has(String(dto.category))) throw new BadRequestException("invalid category");
      data.category = String(dto.category);
    }
    if (dto.durationDays !== undefined) data.durationDays = numOrNull(dto.durationDays);
    if (dto.capacity !== undefined) data.capacity = numOrNull(dto.capacity);
    if (dto.supplierCostPoisha !== undefined) data.supplierCostPoisha = numOrNull(dto.supplierCostPoisha);
    if (dto.sellingPricePoisha !== undefined) data.sellingPricePoisha = numOrNull(dto.sellingPricePoisha);
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    if (data.name === "" || data.code === "") throw new BadRequestException("code/name cannot be empty");
    return this.prisma.hajjUmrahPackage.update({ where: { id }, data });
  }

  @Delete("hajj-packages/:id")
  @Permissions("settings:manage")
  async removePackage(@Param("id") id: string) {
    await this.getPackage(id);
    await this.prisma.hajjUmrahPackage.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }

  // ---------- Pilgrims ----------
  @Get("hajj-pilgrims")
  async listPilgrims(
    @Query("q") q?: string,
    @Query("visaStatus") visaStatus?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (visaStatus?.trim()) where.visaStatus = visaStatus.trim();
    if (q?.trim()) {
      where.OR = ["code", "fullName", "passportNo", "phone", "nationality"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.hajjPilgrim.findMany({
      where,
      orderBy: [{ fullName: "asc" }],
      take: limit,
    });
    return { data, total: data.length };
  }

  @Post("hajj-pilgrims")
  @Permissions("settings:manage")
  async createPilgrim(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const fullName = String(dto?.fullName || "").trim();
    const code = String(dto?.code || "").trim().toUpperCase();
    if (!fullName || !code) throw new BadRequestException("code and fullName are required");
    if (dto.visaStatus && !VISA_STATUS.has(String(dto.visaStatus))) {
      throw new BadRequestException("invalid visaStatus");
    }
    if (dto.passportStatus && !PASSPORT_STATUS.has(String(dto.passportStatus))) {
      throw new BadRequestException("invalid passportStatus");
    }
    return this.prisma.hajjPilgrim.create({
      data: {
        code,
        fullName,
        passportNo: dto.passportNo ? String(dto.passportNo).trim() : null,
        nationality: dto.nationality ? String(dto.nationality).trim() : null,
        gender: dto.gender ? String(dto.gender).trim() : null,
        dob: dto.dob ? String(dto.dob).trim() : null,
        phone: dto.phone ? String(dto.phone).trim() : null,
        email: dto.email ? String(dto.email).trim() : null,
        mahramName: dto.mahramName ? String(dto.mahramName).trim() : null,
        mahramRelation: dto.mahramRelation ? String(dto.mahramRelation).trim() : null,
        healthNotes: dto.healthNotes != null ? String(dto.healthNotes) : null,
        emergencyContact: dto.emergencyContact ? String(dto.emergencyContact).trim() : null,
        emergencyPhone: dto.emergencyPhone ? String(dto.emergencyPhone).trim() : null,
        visaStatus: dto.visaStatus ? String(dto.visaStatus).trim() : "not_applied",
        visaNo: dto.visaNo ? String(dto.visaNo).trim() : null,
        passportStatus: dto.passportStatus ? String(dto.passportStatus).trim() : "pending",
        notes: dto.notes != null ? String(dto.notes) : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch("hajj-pilgrims/:id")
  @Permissions("settings:manage")
  async updatePilgrim(@Param("id") id: string, @Body() dto: any) {
    const existing = await this.prisma.hajjPilgrim.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Pilgrim not found");
    const data: Record<string, unknown> = {};
    for (const k of [
      "fullName", "passportNo", "nationality", "gender", "dob", "phone", "email", "mahramName",
      "mahramRelation", "healthNotes", "emergencyContact", "emergencyPhone", "visaNo", "notes",
    ] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]);
    }
    if (dto.code !== undefined) data.code = String(dto.code).trim().toUpperCase();
    if (dto.visaStatus !== undefined) {
      if (dto.visaStatus && !VISA_STATUS.has(String(dto.visaStatus))) {
        throw new BadRequestException("invalid visaStatus");
      }
      data.visaStatus = dto.visaStatus ? String(dto.visaStatus) : null;
    }
    if (dto.passportStatus !== undefined) {
      if (dto.passportStatus && !PASSPORT_STATUS.has(String(dto.passportStatus))) {
        throw new BadRequestException("invalid passportStatus");
      }
      data.passportStatus = dto.passportStatus ? String(dto.passportStatus) : null;
    }
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    if (data.fullName === "" || data.code === "") throw new BadRequestException("code/fullName cannot be empty");
    return this.prisma.hajjPilgrim.update({ where: { id }, data });
  }

  @Delete("hajj-pilgrims/:id")
  @Permissions("settings:manage")
  async removePilgrim(@Param("id") id: string) {
    const existing = await this.prisma.hajjPilgrim.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Pilgrim not found");
    await this.prisma.hajjPilgrim.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }

  // ---------- Groups ----------
  @Get("hajj-groups")
  async listGroups(
    @Query("q") q?: string,
    @Query("kind") kind?: string,
    @Query("status") status?: string,
    @Query("packageId") packageId?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (kind?.trim()) where.kind = kind.trim();
    if (status?.trim()) where.status = status.trim();
    if (packageId?.trim()) where.packageId = packageId.trim();
    if (q?.trim()) {
      where.OR = ["code", "name", "leaderName", "flightNo"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.hajjGroup.findMany({
      where,
      orderBy: [{ departAt: "asc" }],
      take: limit,
      include: { package: { select: { id: true, code: true, name: true } } },
    });
    return { data, total: data.length };
  }

  @Post("hajj-groups")
  @Permissions("settings:manage")
  async createGroup(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const name = String(dto?.name || "").trim();
    const code = String(dto?.code || "").trim().toUpperCase();
    const kind = String(dto?.kind || "hajj").trim();
    if (!name || !code) throw new BadRequestException("code and name are required");
    if (!KINDS.has(kind)) throw new BadRequestException("invalid kind");
    const status = String(dto.status || "forming");
    if (!GROUP_STATUS.has(status)) throw new BadRequestException("invalid status");
    let packageId: string | null = dto.packageId ? String(dto.packageId).trim() : null;
    if (packageId) {
      const pkg = await this.prisma.hajjUmrahPackage.findFirst({ where: { id: packageId, deletedAt: null } });
      if (!pkg) throw new NotFoundException("Package not found");
    }
    return this.prisma.hajjGroup.create({
      data: {
        code,
        name,
        kind,
        packageId,
        season: dto.season ? String(dto.season).trim() : null,
        year: dto.year ? String(dto.year).trim() : null,
        leaderName: dto.leaderName ? String(dto.leaderName).trim() : null,
        leaderPhone: dto.leaderPhone ? String(dto.leaderPhone).trim() : null,
        capacity: numOrNull(dto.capacity),
        enrolled: numOrNull(dto.enrolled),
        flightNo: dto.flightNo ? String(dto.flightNo).trim() : null,
        airline: dto.airline ? String(dto.airline).trim() : null,
        transportNote: dto.transportNote != null ? String(dto.transportNote) : null,
        hotelMakkah: dto.hotelMakkah ? String(dto.hotelMakkah).trim() : null,
        hotelMadinah: dto.hotelMadinah ? String(dto.hotelMadinah).trim() : null,
        roomingNote: dto.roomingNote != null ? String(dto.roomingNote) : null,
        status,
        departAt: dto.departAt ? new Date(dto.departAt) : null,
        returnAt: dto.returnAt ? new Date(dto.returnAt) : null,
        notes: dto.notes != null ? String(dto.notes) : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch("hajj-groups/:id")
  @Permissions("settings:manage")
  async updateGroup(@Param("id") id: string, @Body() dto: any) {
    const existing = await this.prisma.hajjGroup.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Group not found");
    const data: Record<string, unknown> = {};
    for (const k of [
      "name", "season", "year", "leaderName", "leaderPhone", "flightNo", "airline",
      "transportNote", "hotelMakkah", "hotelMadinah", "roomingNote", "notes",
    ] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]);
    }
    if (dto.code !== undefined) data.code = String(dto.code).trim().toUpperCase();
    if (dto.kind !== undefined) {
      if (!KINDS.has(String(dto.kind))) throw new BadRequestException("invalid kind");
      data.kind = String(dto.kind);
    }
    if (dto.status !== undefined) {
      if (!GROUP_STATUS.has(String(dto.status))) throw new BadRequestException("invalid status");
      data.status = String(dto.status);
    }
    if (dto.packageId !== undefined) {
      const packageId = dto.packageId ? String(dto.packageId).trim() : null;
      if (packageId) {
        const pkg = await this.prisma.hajjUmrahPackage.findFirst({ where: { id: packageId, deletedAt: null } });
        if (!pkg) throw new NotFoundException("Package not found");
      }
      data.packageId = packageId;
    }
    if (dto.capacity !== undefined) data.capacity = numOrNull(dto.capacity);
    if (dto.enrolled !== undefined) data.enrolled = numOrNull(dto.enrolled);
    if (dto.departAt !== undefined) data.departAt = dto.departAt ? new Date(dto.departAt) : null;
    if (dto.returnAt !== undefined) data.returnAt = dto.returnAt ? new Date(dto.returnAt) : null;
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    if (data.name === "" || data.code === "") throw new BadRequestException("code/name cannot be empty");
    return this.prisma.hajjGroup.update({ where: { id }, data });
  }

  @Delete("hajj-groups/:id")
  @Permissions("settings:manage")
  async removeGroup(@Param("id") id: string) {
    const existing = await this.prisma.hajjGroup.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Group not found");
    await this.prisma.hajjGroup.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: "cancelled" },
    });
    return { ok: true };
  }
}
