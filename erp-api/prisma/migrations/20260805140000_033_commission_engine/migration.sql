-- V6 Wave 1: Commission Engine (additive only)

-- Commission: additive nullable engine columns
ALTER TABLE "Commission" ADD COLUMN     "ruleId" TEXT,
ADD COLUMN     "ruleSnapshot" JSONB,
ADD COLUMN     "baseAmount" INTEGER,
ADD COLUMN     "trigger" TEXT;

-- CommissionRule (policy)
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "basis" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "agentId" TEXT,
    "agentTierId" TEXT,
    "serviceType" TEXT,
    "countryCode" TEXT,
    "packageId" TEXT,
    "branchId" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommissionRule_active_idx" ON "CommissionRule"("active");

-- CommissionLedger (append-only)
CREATE TABLE "CommissionLedger" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "commissionId" TEXT,
    "entryType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "runningBalance" INTEGER NOT NULL,
    "memo" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionLedger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommissionLedger_agentId_idx" ON "CommissionLedger"("agentId");
