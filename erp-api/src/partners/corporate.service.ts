import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

@Injectable()
export class CorporateService {
  constructor(private prisma: PrismaService) {}

  async list(q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null };
    if (q.q) where.OR = ["companyName", "contactPerson", "phone", "email"].map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
    const [data, total] = await this.prisma.$transaction([
      this.prisma.corporateClient.findMany({ where, orderBy: { companyName: "asc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.corporateClient.count({ where }),
    ]);
    return { data, total, page, limit };
  }
  async get(id: string) {
    const c = await this.prisma.corporateClient.findFirst({ where: { id, deletedAt: null } });
    if (!c) throw new NotFoundException("Corporate client not found");
    return c;
  }
  create(dto: any, user: AuthedUser) {
    return this.prisma.corporateClient.create({ data: { companyName: dto.companyName, contactPerson: dto.contactPerson,
      phone: dto.phone, email: dto.email, address: dto.address, notes: dto.notes,
      creditLimit: Math.round(Number(dto.creditLimit) || 0), paymentTermsDays: Math.round(Number(dto.paymentTermsDays) || 0),
      branchId: dto.branchId ?? user.branchId ?? null, createdBy: user.id } });
  }
  async update(id: string, dto: any) {
    await this.get(id);
    const { companyName, contactPerson, phone, email, address, notes, isActive } = dto;
    return this.prisma.corporateClient.update({ where: { id }, data: { companyName, contactPerson, phone, email, address, notes, isActive,
      creditLimit: dto.creditLimit != null ? Math.round(Number(dto.creditLimit)) : undefined,
      paymentTermsDays: dto.paymentTermsDays != null ? Math.round(Number(dto.paymentTermsDays)) : undefined } });
  }
  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.corporateClient.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }
}
