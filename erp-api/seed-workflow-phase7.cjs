const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const T = {
  hajj:        ["Registration", "Documents & Visa", "Package & Payment", "Pre-departure", "In Progress", "Completed"],
  umrah:       ["Registration", "Documents & Visa", "Package & Payment", "Pre-departure", "Completed"],
  student:     ["Counselling", "Application", "Offer Received", "Visa", "Enrolled"],
  medical:     ["Enquiry", "Hospital Coordination", "Appointment", "Travel", "Completed"],
  immigration: ["Assessment", "Documentation", "Submission", "Decision"],
  insurance:   ["Requirement", "Quote", "Policy Issued", "Delivered"],
};
async function main() {
  for (const [serviceType, stages] of Object.entries(T)) {
    if (await prisma.workflowTemplate.findFirst({ where: { serviceType, isActive: true, deletedAt: null } })) { console.log("exists:", serviceType); continue; }
    await prisma.workflowTemplate.create({ data: { serviceType, name: `${serviceType} — standard`, version: 1, isActive: true, stages: { create: stages.map((name, i) => ({ stageNo: i + 1, name })) } } });
    console.log("seeded:", serviceType, `(${stages.length})`);
  }
}
main().finally(() => prisma.$disconnect());
