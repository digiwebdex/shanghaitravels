-- V6 Wave 1: Wallet immutable ledger + top-up/withdrawal requests (additive)

-- Extend WalletTxnType (values not used within this migration → safe in txn)
ALTER TYPE "WalletTxnType" ADD VALUE IF NOT EXISTS 'topup';
ALTER TYPE "WalletTxnType" ADD VALUE IF NOT EXISTS 'refund';
ALTER TYPE "WalletTxnType" ADD VALUE IF NOT EXISTS 'settlement';

-- Ledger running-balance snapshot (nullable, additive)
ALTER TABLE "AgentWalletTxn" ADD COLUMN "runningBalance" INTEGER;

-- Backfill runningBalance chronologically per agent
UPDATE "AgentWalletTxn" t
SET "runningBalance" = s.rb
FROM (
  SELECT id, SUM(amount) OVER (PARTITION BY "agentId" ORDER BY "createdAt", id) AS rb
  FROM "AgentWalletTxn"
) s
WHERE t.id = s.id;

-- Top-up requests
CREATE TABLE "WalletTopupRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "proofDocumentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestedBy" TEXT NOT NULL,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "txnId" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTopupRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WalletTopupRequest_agentId_idx" ON "WalletTopupRequest"("agentId");
CREATE INDEX "WalletTopupRequest_status_idx" ON "WalletTopupRequest"("status");

-- Withdrawal requests
CREATE TABLE "WalletWithdrawalRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank',
    "bankRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestedBy" TEXT NOT NULL,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "txnId" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletWithdrawalRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WalletWithdrawalRequest_agentId_idx" ON "WalletWithdrawalRequest"("agentId");
CREATE INDEX "WalletWithdrawalRequest_status_idx" ON "WalletWithdrawalRequest"("status");
