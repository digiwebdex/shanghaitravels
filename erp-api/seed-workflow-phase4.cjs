const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const TEMPLATES = {
  air_ticket: ["Requirement", "Fare & Booking", "Ticket Issued", "Delivered"],
  hotel:      ["Requirement", "Availability & Quote", "Booking Confirmed", "Voucher Delivered"],
  tour:       ["Enquiry", "Itinerary & Quote", "Confirmed", "In Progress", "Completed"],
  transport:  ["Requirement", "Vehicle Assigned", "Dispatched", "Completed"],
};
async function main() {
  for (const [serviceType, stages] of Object.entries(TEMPLATES)) {
    const exists = await prisma.workflowTemplate.findFirst({ where: { serviceType, isActive: true, deletedAt: null } });
    if (exists) { console.log("exists:", serviceType); continue; }
    const t = await prisma.workflowTemplate.create({ data: { serviceType, name: `${serviceType} — standard`, version: 1, isActive: true,
      stages: { create: stages.map((name, i) => ({ stageNo: i + 1, name })) } } });
    console.log("seeded:", serviceType, `(${stages.length} stages)`);
  }
}
main().finally(() => prisma.$disconnect());
