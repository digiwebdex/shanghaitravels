// Seed the default ACTIVE visa workflow template (business config, not fake data).
// Idempotent: skips if an active visa template already exists.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const STAGES = [
  { name: "Intake", slaHours: 24 },
  { name: "Document Collection", slaHours: 72 },
  { name: "Embassy/VFS Submission", slaHours: 48 },
  { name: "Awaiting Decision", slaHours: null },
  { name: "Decision & Delivery", slaHours: 24 },
];

async function main() {
  const existing = await prisma.workflowTemplate.findFirst({ where: { serviceType: "visa", isActive: true, deletedAt: null } });
  if (existing) { console.log("Active visa template already exists:", existing.id); return; }
  const t = await prisma.workflowTemplate.create({
    data: {
      serviceType: "visa", name: "Visa — standard workflow", version: 1, isActive: true,
      stages: { create: STAGES.map((s, i) => ({ stageNo: i + 1, name: s.name, slaHours: s.slaHours })) },
    },
    include: { stages: true },
  });
  console.log("Seeded active visa workflow template:", t.id, "with", t.stages.length, "stages");
}
main().finally(() => prisma.$disconnect());
