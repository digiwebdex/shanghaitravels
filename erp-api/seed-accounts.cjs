const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ACCOUNTS = [
  { name: "Cash in Hand", type: "cash" },
  { name: "Bank — Main Operating", type: "bank", bankName: "(set by owner)" },
];
async function main() {
  for (const a of ACCOUNTS) {
    const exists = await prisma.account.findFirst({ where: { name: a.name, deletedAt: null } });
    if (exists) { console.log("exists:", a.name); continue; }
    const acc = await prisma.account.create({ data: { ...a, openingBalance: 0, currentBalance: 0 } });
    console.log("seeded account:", acc.name, acc.id);
  }
}
main().finally(() => prisma.$disconnect());
