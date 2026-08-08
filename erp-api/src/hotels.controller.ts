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

/**
 * Hotel master (reference catalog) — Phase B2.
 * Read: any authenticated staff. Mutations: settings:manage.
 * Not a GDS / inventory API — staff-maintained property list for booking pickers.
 */
@Controller("reference/hotels")
export class HotelsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @Query("q") q?: string,
    @Query("city") city?: string,
    @Query("country") country?: string,
    @Query("active") active?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 100));
    const where: Record<string, unknown> = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (city?.trim()) where.city = { contains: city.trim(), mode: "insensitive" };
    if (country?.trim()) where.country = { contains: country.trim(), mode: "insensitive" };
    if (q?.trim()) {
      where.OR = ["name", "city", "country", "area", "address"].map((f) => ({
        [f]: { contains: q.trim(), mode: "insensitive" },
      }));
    }
    const data = await this.prisma.hotel.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
    });
    return { data, total: data.length };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const h = await this.prisma.hotel.findFirst({ where: { id, deletedAt: null } });
    if (!h) throw new NotFoundException("Hotel not found");
    return h;
  }

  @Post()
  @Permissions("settings:manage")
  async create(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    const name = String(dto?.name || "").trim();
    if (!name) throw new BadRequestException("name is required");
    return this.prisma.hotel.create({
      data: {
        name,
        country: dto.country ? String(dto.country).trim() : null,
        city: dto.city ? String(dto.city).trim() : null,
        area: dto.area ? String(dto.area).trim() : null,
        address: dto.address ? String(dto.address).trim() : null,
        stars: dto.stars != null && dto.stars !== "" ? Number(dto.stars) : null,
        phone: dto.phone ? String(dto.phone).trim() : null,
        notes: dto.notes ? String(dto.notes).trim() : null,
        isActive: dto.isActive !== false,
        createdBy: u.id,
      },
    });
  }

  @Patch(":id")
  @Permissions("settings:manage")
  async update(@Param("id") id: string, @Body() dto: any) {
    await this.get(id);
    const data: Record<string, unknown> = {};
    for (const k of ["name", "country", "city", "area", "address", "phone", "notes"] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]).trim();
    }
    if (dto.stars !== undefined) data.stars = dto.stars == null || dto.stars === "" ? null : Number(dto.stars);
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    if (data.name === "") throw new BadRequestException("name cannot be empty");
    return this.prisma.hotel.update({ where: { id }, data });
  }

  @Delete(":id")
  @Permissions("settings:manage")
  async remove(@Param("id") id: string) {
    await this.get(id);
    await this.prisma.hotel.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { ok: true };
  }
}
