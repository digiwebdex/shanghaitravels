import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ---- CMS pages (cms:manage) ----
  listPages() { return this.prisma.cmsPage.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" } }); }
  async getPage(slug: string) {
    const p = await this.prisma.cmsPage.findFirst({ where: { slug, deletedAt: null } });
    if (!p) throw new NotFoundException("Page not found");
    return p;
  }
  upsertPage(dto: any, user: AuthedUser) {
    return this.prisma.cmsPage.upsert({
      where: { slug: dto.slug },
      create: { slug: dto.slug, title: dto.title ?? dto.slug, body: dto.body ?? "", published: !!dto.published, updatedBy: user.id },
      update: { title: dto.title, body: dto.body, published: dto.published, updatedBy: user.id },
    });
  }
  async deletePage(slug: string) {
    await this.getPage(slug);
    await this.prisma.cmsPage.update({ where: { slug }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  // ---- Settings (key-value; settings:manage) ----
  listSettings() { return this.prisma.setting.findMany(); }
  setSetting(key: string, value: any, user: AuthedUser) {
    return this.prisma.setting.upsert({ where: { key }, create: { key, value, updatedBy: user.id }, update: { value, updatedBy: user.id } });
  }

  // ---- Reports & BI (report:read) — derived, never fabricated ----
  async operationalReport(user: AuthedUser) {
    const [byStatus, byService, leadsByStatus, openTasks, unassignedB2c] = await this.prisma.$transaction([
      this.prisma.application.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true, orderBy: { status: "asc" } }),
      this.prisma.application.groupBy({ by: ["serviceType"], where: { deletedAt: null }, _count: true, orderBy: { serviceType: "asc" } }),
      this.prisma.lead.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true, orderBy: { status: "asc" } }),
      this.prisma.task.count({ where: { deletedAt: null, status: { in: ["open", "in_progress"] } } }),
      this.prisma.application.count({ where: { deletedAt: null, source: "b2c_web", assignedTo: null } }),
    ]);
    return {
      casesByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      casesByService: Object.fromEntries(byService.map((r) => [r.serviceType, r._count])),
      leadsByStatus: Object.fromEntries(leadsByStatus.map((r) => [r.status, r._count])),
      openTasks, unassignedWebEnquiries: unassignedB2c,
    };
  }
}
