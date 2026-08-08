import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async list(user: AuthedUser, q: { page?: number; limit?: number; status?: string; mine?: string; applicationId?: string }) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null };
    if (q.status) where.status = q.status;
    if (q.applicationId) where.applicationId = q.applicationId;
    if (q.mine === "true") where.assignedTo = user.id;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({ where, orderBy: [{ status: "asc" }, { dueAt: "asc" }], skip: (page - 1) * limit, take: limit }),
      this.prisma.task.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async get(id: string) {
    const t = await this.prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!t) throw new NotFoundException("Task not found");
    return t;
  }

  create(dto: any, user: AuthedUser) {
    return this.prisma.task.create({
      data: {
        title: dto.title, description: dto.description, applicationId: dto.applicationId || null,
        assignedTo: dto.assignedTo || null, priority: dto.priority || "medium",
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null, createdBy: user.id,
      },
    });
  }

  async update(id: string, dto: any) {
    await this.get(id);
    const done = dto.status === "done";
    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title, description: dto.description, assignedTo: dto.assignedTo,
        priority: dto.priority, status: dto.status, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        completedAt: done ? new Date() : dto.status ? null : undefined,
      },
    });
  }

  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }
}
