import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async list(q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null };
    if (q.type) where.type = q.type;
    if (q.q) where.OR = ["name", "code", "contactName", "phone"].map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.supplier.count({ where }),
    ]);
    return { data, total, page, limit };
  }
  async get(id: string) {
    const s = await this.prisma.supplier.findFirst({ where: { id, deletedAt: null } });
    if (!s) throw new NotFoundException("Supplier not found");
    return s;
  }
  async create(dto: any, user: AuthedUser) {
    const code = `SUP-${String((await this.prisma.supplier.count()) + 1).padStart(5, "0")}`;
    return this.prisma.supplier.create({ data: { code, name: dto.name, type: dto.type || "other",
      contactName: dto.contactName, phone: dto.phone, email: dto.email, address: dto.address, notes: dto.notes,
      branchId: dto.branchId ?? user.branchId ?? null, createdBy: user.id } });
  }
  async update(id: string, dto: any) {
    await this.get(id);
    const { name, type, contactName, phone, email, address, notes, isActive } = dto;
    return this.prisma.supplier.update({ where: { id }, data: { name, type, contactName, phone, email, address, notes, isActive } });
  }
  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }
}
