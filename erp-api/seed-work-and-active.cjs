const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// China work-visa (Z) flow via CVASC
const WORK_STAGES = ["Enquiry & Eligibility", "Document Collection", "Work Permit / Invitation", "Z Visa Application (COVA)", "CVASC Submission", "Embassy Processing", "Departure & Handover"];
const ACTIVE = ["visa", "air_ticket", "hotel", "student", "work"]; // China scope; owner edits from admin
async function main() {
  if (!(await prisma.workflowTemplate.findFirst({ where: { serviceType: "work", isActive: true, deletedAt: null } }))) {
    const v = (await prisma.workflowTemplate.count({ where: { serviceType: "work" } })) + 1;
    await prisma.workflowTemplate.create({ data: { serviceType: "work", name: "China Work (Z) — CVASC", version: v, isActive: true,
      stages: { create: WORK_STAGES.map((name, i) => ({ stageNo: i + 1, name })) } } });
    console.log("seeded work workflow (" + WORK_STAGES.length + " stages)");
  } else console.log("work workflow exists");
  await prisma.setting.upsert({ where: { key: "active_services" },
    create: { key: "active_services", value: ACTIVE, updatedBy: "setup" }, update: { value: ACTIVE } });
  console.log("active_services =", JSON.stringify(ACTIVE));
}
main().finally(() => prisma.$disconnect());
