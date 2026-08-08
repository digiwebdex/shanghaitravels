-- Phase G1 — Agent Portal extensions

ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
CREATE INDEX IF NOT EXISTS "Agent_branchId_idx" ON "Agent"("branchId");

CREATE TABLE IF NOT EXISTS "AgentAuthCode" (
  "id" TEXT PRIMARY KEY,
  "agentUserId" TEXT,
  "email" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AgentAuthCode_email_purpose_idx" ON "AgentAuthCode"("email", "purpose");
CREATE INDEX IF NOT EXISTS "AgentAuthCode_agentUserId_idx" ON "AgentAuthCode"("agentUserId");

CREATE TABLE IF NOT EXISTS "AgentSupportRequest" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "applicationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "AgentSupportRequest_agentId_idx" ON "AgentSupportRequest"("agentId");
CREATE INDEX IF NOT EXISTS "AgentSupportRequest_status_idx" ON "AgentSupportRequest"("status");

DO $$ BEGIN
  ALTER TABLE "AgentAuthCode" ADD CONSTRAINT "AgentAuthCode_agentUserId_fkey"
    FOREIGN KEY ("agentUserId") REFERENCES "AgentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AgentSupportRequest" ADD CONSTRAINT "AgentSupportRequest_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
