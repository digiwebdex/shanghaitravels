import { PrismaService } from "../prisma.service";

/** Allocate next APP-##### with retry on unique collisions (count+1 races). */
export async function nextApplicationReference(prisma: PrismaService): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const last = await prisma.application.findFirst({
      where: { referenceNo: { startsWith: "APP-" } },
      orderBy: { referenceNo: "desc" },
      select: { referenceNo: true },
    });
    const n = last ? Number(last.referenceNo.replace(/^APP-/, "")) || 0 : 0;
    const candidate = `APP-${String(n + 1 + attempt).padStart(5, "0")}`;
    const clash = await prisma.application.findFirst({
      where: { referenceNo: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `APP-${Date.now().toString().slice(-8)}`;
}
