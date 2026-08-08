const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const VALUE = { origin: "Bangladesh", destinations: ["China"], services: ["visa", "air_ticket", "hotel", "tour"] };
async function main() {
  await prisma.setting.upsert({ where: { key: "public_site_config" },
    create: { key: "public_site_config", value: VALUE, updatedBy: "setup" }, update: { value: VALUE } });
  console.log("public_site_config set:", JSON.stringify(VALUE));
}
main().finally(() => prisma.$disconnect());
