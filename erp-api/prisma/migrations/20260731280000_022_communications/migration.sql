-- Phase D3 — Customer Communication & Engagement

ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'logged';
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "partyKind" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "partyLabel" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "threadId" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "providerMessageId" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "deliveryStatus" TEXT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "attachmentCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Communication_channel_idx" ON "Communication"("channel");
CREATE INDEX IF NOT EXISTS "Communication_status_idx" ON "Communication"("status");
CREATE INDEX IF NOT EXISTS "Communication_threadId_idx" ON "Communication"("threadId");
CREATE INDEX IF NOT EXISTS "Communication_branchId_idx" ON "Communication"("branchId");

ALTER TABLE "CrmActivity" ADD COLUMN IF NOT EXISTS "recurrenceRule" TEXT DEFAULT 'none';
ALTER TABLE "CrmActivity" ADD COLUMN IF NOT EXISTS "slaDueAt" TIMESTAMP(3);
ALTER TABLE "CrmActivity" ADD COLUMN IF NOT EXISTS "escalateAt" TIMESTAMP(3);
ALTER TABLE "CrmActivity" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "CrmActivity" ADD COLUMN IF NOT EXISTS "parentActivityId" TEXT;
CREATE INDEX IF NOT EXISTS "CrmActivity_slaDueAt_idx" ON "CrmActivity"("slaDueAt");

CREATE TABLE IF NOT EXISTS "CommTemplate" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "mergeFields" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommTemplate_code_key" ON "CommTemplate"("code");
CREATE INDEX IF NOT EXISTS "CommTemplate_channel_idx" ON "CommTemplate"("channel");
CREATE INDEX IF NOT EXISTS "CommTemplate_category_idx" ON "CommTemplate"("category");
CREATE INDEX IF NOT EXISTS "CommTemplate_branchId_idx" ON "CommTemplate"("branchId");

CREATE TABLE IF NOT EXISTS "CommThread" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "channel" TEXT NOT NULL,
  "subject" TEXT,
  "relatedType" TEXT NOT NULL,
  "relatedId" TEXT NOT NULL,
  "partyKind" TEXT NOT NULL DEFAULT 'customer',
  "partyId" TEXT,
  "partyLabel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CommThread_relatedType_relatedId_idx" ON "CommThread"("relatedType", "relatedId");
CREATE INDEX IF NOT EXISTS "CommThread_partyKind_partyId_idx" ON "CommThread"("partyKind", "partyId");
CREATE INDEX IF NOT EXISTS "CommThread_channel_idx" ON "CommThread"("channel");
CREATE INDEX IF NOT EXISTS "CommThread_status_idx" ON "CommThread"("status");
CREATE INDEX IF NOT EXISTS "CommThread_branchId_idx" ON "CommThread"("branchId");

CREATE TABLE IF NOT EXISTS "CommMessage" (
  "id" TEXT PRIMARY KEY,
  "threadId" TEXT NOT NULL,
  "branchId" TEXT,
  "channel" TEXT NOT NULL,
  "direction" TEXT NOT NULL DEFAULT 'outbound',
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "templateId" TEXT,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "error" TEXT,
  "byUser" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CommMessage_threadId_idx" ON "CommMessage"("threadId");
CREATE INDEX IF NOT EXISTS "CommMessage_status_idx" ON "CommMessage"("status");
CREATE INDEX IF NOT EXISTS "CommMessage_channel_idx" ON "CommMessage"("channel");
CREATE INDEX IF NOT EXISTS "CommMessage_createdAt_idx" ON "CommMessage"("createdAt");

CREATE TABLE IF NOT EXISTS "CommAttachment" (
  "id" TEXT PRIMARY KEY,
  "messageId" TEXT,
  "communicationId" TEXT,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
  "sizeBytes" INTEGER NOT NULL DEFAULT 0,
  "storageKey" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CommAttachment_messageId_idx" ON "CommAttachment"("messageId");
CREATE INDEX IF NOT EXISTS "CommAttachment_communicationId_idx" ON "CommAttachment"("communicationId");

DO $$ BEGIN
  ALTER TABLE "CommMessage" ADD CONSTRAINT "CommMessage_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "CommThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommAttachment" ADD CONSTRAINT "CommAttachment_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "CommMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CommAttachment" ADD CONSTRAINT "CommAttachment_communicationId_fkey"
    FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('comms:read', 'View communication hub and timelines'),
  ('comms:manage', 'Manage templates, threads, and engagement activities'),
  ('comms:send', 'Send email, WhatsApp, and SMS via adapters')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name IN ('super_admin','general_manager','marketing_manager','office_incharge')
  AND p.key IN ('comms:read','comms:manage','comms:send')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);
