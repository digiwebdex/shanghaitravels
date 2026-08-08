const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const p = new PrismaClient();
(async () => {
  const agent = await p.agent.upsert({
    where: { code: "TEST-AGENT" },
    update: { status: "active", walletBalance: 50000 },
    create: { code: "TEST-AGENT", name: "Test Travel Agent", email: "agenttest@example.com", commissionRateBps: 250, walletBalance: 50000, status: "active", createdBy: "test" },
  });
  const hash = await argon2.hash("AgentPass123", { type: argon2.argon2id });
  const ex = await p.agentUser.findFirst({ where: { email: "agenttest@example.com" } });
  if (ex) await p.agentUser.update({ where: { id: ex.id }, data: { agentId: agent.id, passwordHash: hash, mustChangePassword: false, status: "active", deletedAt: null } });
  else await p.agentUser.create({ data: { agentId: agent.id, email: "agenttest@example.com", passwordHash: hash, mustChangePassword: false, createdBy: "test" } });
  await p.commission.create({ data: { agentId: agent.id, amount: 5000, status: "approved", note: "test", createdBy: "test" } }).catch(() => {});
  await p.agentWalletTxn.create({ data: { agentId: agent.id, amount: 50000, type: "commission_credit", memo: "opening", createdBy: "test" } }).catch(() => {});
  console.log("OK agentId=" + agent.id);
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
