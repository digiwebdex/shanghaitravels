-- V6 Wave 1: Customer Ownership (additive + backfill; no existing column altered/dropped)

-- AlterTable: additive nullable ownership columns
ALTER TABLE "Customer" ADD COLUMN     "primaryAgentId" TEXT,
ADD COLUMN     "secondaryAgentId" TEXT,
ADD COLUMN     "assignedById" TEXT;

-- CreateTable: append-only ownership history
CREATE TABLE "CustomerAssignment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fromAgentId" TEXT,
    "toAgentId" TEXT,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "assignedById" TEXT,
    "actorAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAssignment_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Customer_primaryAgentId_idx" ON "Customer"("primaryAgentId");
CREATE INDEX "Customer_secondaryAgentId_idx" ON "Customer"("secondaryAgentId");
CREATE INDEX "CustomerAssignment_customerId_idx" ON "CustomerAssignment"("customerId");
CREATE INDEX "CustomerAssignment_toAgentId_idx" ON "CustomerAssignment"("toAgentId");

-- Foreign keys
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_primaryAgentId_fkey" FOREIGN KEY ("primaryAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_secondaryAgentId_fkey" FOREIGN KEY ("secondaryAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerAssignment" ADD CONSTRAINT "CustomerAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Backfill ownership from the existing heuristic (only where primaryAgentId is NULL) =====
-- (1) createdBy = 'agent:<id>' → that agent, when the agent exists
UPDATE "Customer" c
SET "primaryAgentId" = substring(c."createdBy" from 7)
WHERE c."createdBy" LIKE 'agent:%'
  AND c."primaryAgentId" IS NULL
  AND substring(c."createdBy" from 7) IN (SELECT id FROM "Agent");

-- (2) customers with exactly ONE distinct application agent → that agent
UPDATE "Customer" c
SET "primaryAgentId" = sub.agentid
FROM (
  SELECT "customerId", MIN("agentId") AS agentid
  FROM "Application"
  WHERE "agentId" IS NOT NULL AND "deletedAt" IS NULL
  GROUP BY "customerId"
  HAVING COUNT(DISTINCT "agentId") = 1
) sub
WHERE c.id = sub."customerId" AND c."primaryAgentId" IS NULL;

-- (3) record a backfill history row for every customer that got an owner
INSERT INTO "CustomerAssignment" ("id", "customerId", "toAgentId", "role", "action", "reason", "createdAt")
SELECT gen_random_uuid(), c.id, c."primaryAgentId", 'primary', 'backfill', 'migration 032 backfill', now()
FROM "Customer" c
WHERE c."primaryAgentId" IS NOT NULL;
