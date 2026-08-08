-- Phase C4 — Financial Statements & Closing controls

ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "reversesJournalId" TEXT;

CREATE TABLE IF NOT EXISTS "PeriodReopenRequest" (
  "id" TEXT PRIMARY KEY,
  "periodId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "requestedBy" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ClosingRun" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "fiscalYearId" TEXT,
  "periodId" TEXT,
  "closingJournalId" TEXT,
  "openingJournalId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "notes" TEXT,
  "meta" JSONB,
  "createdBy" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "JournalEntry_reversesJournalId_idx" ON "JournalEntry"("reversesJournalId");
CREATE INDEX IF NOT EXISTS "PeriodReopenRequest_periodId_idx" ON "PeriodReopenRequest"("periodId");
CREATE INDEX IF NOT EXISTS "PeriodReopenRequest_status_idx" ON "PeriodReopenRequest"("status");
CREATE INDEX IF NOT EXISTS "ClosingRun_type_idx" ON "ClosingRun"("type");
CREATE INDEX IF NOT EXISTS "ClosingRun_fiscalYearId_idx" ON "ClosingRun"("fiscalYearId");

DO $$ BEGIN
  ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_reversesJournalId_fkey"
    FOREIGN KEY ("reversesJournalId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PeriodReopenRequest" ADD CONSTRAINT "PeriodReopenRequest_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('fs:export', 'Export financial statements (CSV/HTML)'),
  ('period:lock', 'Lock closed accounting periods'),
  ('period:reopen-approve', 'Approve reopen of closed/locked periods')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'super_admin'
  AND p.key IN ('fs:export','period:lock','period:reopen-approve')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'accounts_manager'
  AND p.key IN ('fs:export','period:lock','period:reopen-approve')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'general_manager'
  AND p.key IN ('fs:export')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);
