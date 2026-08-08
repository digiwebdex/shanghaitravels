const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const VALUE = { origin: "Bangladesh", destinations: ["China"], services: ["visa", "air_ticket", "hotel", "student", "work"] };
async function main() {
  await prisma.setting.upsert({ where: { key: "public_site_config" },
    create: { key: "public_site_config", value: VALUE, updatedBy: "china-fix" }, update: { value: VALUE } });
  const s = await prisma.setting.findUnique({ where: { key: "public_site_config" } });
  console.log("public_site_config.services =", JSON.stringify(s.value.services));
}
main().finally(() => prisma.$disconnect());
