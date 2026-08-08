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

const VEHICLE_CATS = new Set(["sedan", "microbus", "coaster", "bus", "other"]);
const ROUTE_KINDS = new Set(["airport_transfer", "city_transfer", "chauffeur", "other"]);

/**
 * Transport reference catalogs — Phase B3.
 * Supplier vehicle offers + routes. Not fleet management / GPS / driver HR.
 */
@Controller("reference")
export class TransportCatalogController {
  constructor(private prisma: PrismaService) {}

  // ---- Vehicle types (supplier offer catalog) ----
  @Get("transport-vehicles")
  async listVehicles(
    @Query("q") q?: string,
    @Query("category") category?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (category?.trim()) where.category = category.trim();
    if (q?.trim()) {
      where.OR = ["name", "category", "notes"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.transportVehicleType.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
    });
    return { data, total: data.length };
  }

  @Post("transport-vehicles")
  @Permissions("settings:manage")
  async createVehicle(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const name = String(dto?.name || "").trim();
    const category = String(dto?.category || "other").trim();
    if (!name) throw new BadRequestException("name is required");
    if (!VEHICLE_CATS.has(category)) throw new BadRequestException("invalid category");
    return this.prisma.transportVehicleType.create({
      data: {
        name,
        category,
        capacity: dto.capacity != null && dto.capacity !== "" ? Number(dto.capacity) : null,
        notes: dto.notes ? String(dto.notes).trim() : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch("transport-vehicles/:id")
  @Permissions("settings:manage")
  async updateVehicle(@Param("id") id: string, @Body() dto: any) {
    const existing = await this.prisma.transportVehicleType.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Vehicle type not found");
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      const name = String(dto.name).trim();
      if (!name) throw new BadRequestException("name cannot be empty");
      data.name = name;
    }
    if (dto.category !== undefined) {
      const category = String(dto.category).trim();
      if (!VEHICLE_CATS.has(category)) throw new BadRequestException("invalid category");
      data.category = category;
    }
    if (dto.capacity !== undefined) data.capacity = dto.capacity == null || dto.capacity === "" ? null : Number(dto.capacity);
    if (dto.notes !== undefined) data.notes = dto.notes == null ? null : String(dto.notes).trim();
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    return this.prisma.transportVehicleType.update({ where: { id }, data });
  }

  @Delete("transport-vehicles/:id")
  @Permissions("settings:manage")
  async removeVehicle(@Param("id") id: string) {
    const existing = await this.prisma.transportVehicleType.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Vehicle type not found");
    await this.prisma.transportVehicleType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }

  // ---- Routes ----
  @Get("transport-routes")
  async listRoutes(
    @Query("q") q?: string,
    @Query("kind") kind?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (kind?.trim()) where.kind = kind.trim();
    if (q?.trim()) {
      where.OR = ["name", "origin", "destination", "notes"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.transportRoute.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
    });
    return { data, total: data.length };
  }

  @Post("transport-routes")
  @Permissions("settings:manage")
  async createRoute(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const name = String(dto?.name || "").trim();
    const origin = String(dto?.origin || "").trim();
    const destination = String(dto?.destination || "").trim();
    const kind = String(dto?.kind || "other").trim();
    if (!name || !origin || !destination) throw new BadRequestException("name, origin, destination required");
    if (!ROUTE_KINDS.has(kind)) throw new BadRequestException("invalid kind");
    return this.prisma.transportRoute.create({
      data: {
        name,
        origin,
        destination,
        kind,
        notes: dto.notes ? String(dto.notes).trim() : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch("transport-routes/:id")
  @Permissions("settings:manage")
  async updateRoute(@Param("id") id: string, @Body() dto: any) {
    const existing = await this.prisma.transportRoute.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Route not found");
    const data: Record<string, unknown> = {};
    for (const k of ["name", "origin", "destination", "notes"] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]).trim();
    }
    if (dto.kind !== undefined) {
      const kind = String(dto.kind).trim();
      if (!ROUTE_KINDS.has(kind)) throw new BadRequestException("invalid kind");
      data.kind = kind;
    }
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    if (data.name === "" || data.origin === "" || data.destination === "") {
      throw new BadRequestException("name, origin, destination cannot be empty");
    }
    return this.prisma.transportRoute.update({ where: { id }, data });
  }

  @Delete("transport-routes/:id")
  @Permissions("settings:manage")
  async removeRoute(@Param("id") id: string) {
    const existing = await this.prisma.transportRoute.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Route not found");
    await this.prisma.transportRoute.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }
}
