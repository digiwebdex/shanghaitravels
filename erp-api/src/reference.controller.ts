import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// Reference data for admin selectors. Authenticated (global guard) but no special
// permission — any logged-in staff can read countries/airlines/services.
@Controller("reference")
export class ReferenceController {
  constructor(private prisma: PrismaService) {}

  @Get("countries")
  countries() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { iso2: true, name: true, isFeatured: true, region: true },
    });
  }

  @Get("airlines")
  airlines() {
    return this.prisma.airline.findMany({
      where: { isActive: true }, orderBy: { name: "asc" }, select: { name: true, iata: true, country: true },
    });
  }

  // Active service types with their active workflow template (name + stage count).
  @Get("services")
  async services() {
    const tpls = await this.prisma.workflowTemplate.findMany({
      where: { isActive: true },
      select: { serviceType: true, name: true, _count: { select: { stages: true } } },
    });
    return tpls.map((t) => ({ serviceType: t.serviceType, workflow: t.name, stages: t._count.stages }));
  }
}
