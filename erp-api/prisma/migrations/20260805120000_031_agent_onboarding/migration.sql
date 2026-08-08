-- V6 Phase 1: Agent Onboarding (additive only — no existing column altered/dropped)

-- CreateTable
CREATE TABLE "AgentTier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentTier_code_key" ON "AgentTier"("code");

-- AlterTable (all new columns nullable / additive)
ALTER TABLE "Agent" ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "kycNotes" TEXT,
ADD COLUMN     "kycStatus" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "parentAgentId" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "tierId" TEXT,
ADD COLUMN     "tradeLicenseNo" TEXT;

-- CreateIndex
CREATE INDEX "Agent_tierId_idx" ON "Agent"("tierId");

-- CreateIndex
CREATE INDEX "Agent_parentAgentId_idx" ON "Agent"("parentAgentId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "AgentTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_parentAgentId_fkey" FOREIGN KEY ("parentAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
