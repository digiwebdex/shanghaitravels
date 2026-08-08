-- Phase C2 — AR/AP subledgers

CREATE TABLE IF NOT EXISTS "ArDocument" (
  "id" TEXT PRIMARY KEY,
  "docNo" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "branchId" TEXT,
  "customerId" TEXT NOT NULL,
  "applicationId" TEXT,
  "invoiceId" TEXT,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "subtotalPoisha" INTEGER NOT NULL DEFAULT 0,
  "taxPoisha" INTEGER NOT NULL DEFAULT 0,
  "totalPoisha" INTEGER NOT NULL DEFAULT 0,
  "balancePoisha" INTEGER NOT NULL DEFAULT 0,
  "memo" TEXT,
  "reference" TEXT,
  "journalId" TEXT,
  "createdBy" TEXT NOT NULL,
  "submittedBy" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectReason" TEXT,
  "postedBy" TEXT,
  "postedAt" TIMESTAMP(3),
  "voidedBy" TEXT,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "ArDocumentLine" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "lineNo" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPricePoisha" INTEGER NOT NULL DEFAULT 0,
  "amountPoisha" INTEGER NOT NULL DEFAULT 0,
  "glAccountCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ArAllocation" (
  "id" TEXT PRIMARY KEY,
  "fromDocId" TEXT NOT NULL,
  "toDocId" TEXT NOT NULL,
  "amountPoisha" INTEGER NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ApDocument" (
  "id" TEXT PRIMARY KEY,
  "docNo" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "branchId" TEXT,
  "supplierId" TEXT NOT NULL,
  "applicationId" TEXT,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "subtotalPoisha" INTEGER NOT NULL DEFAULT 0,
  "taxPoisha" INTEGER NOT NULL DEFAULT 0,
  "totalPoisha" INTEGER NOT NULL DEFAULT 0,
  "balancePoisha" INTEGER NOT NULL DEFAULT 0,
  "memo" TEXT,
  "reference" TEXT,
  "journalId" TEXT,
  "createdBy" TEXT NOT NULL,
  "submittedBy" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectReason" TEXT,
  "postedBy" TEXT,
  "postedAt" TIMESTAMP(3),
  "voidedBy" TEXT,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "ApDocumentLine" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "lineNo" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPricePoisha" INTEGER NOT NULL DEFAULT 0,
  "amountPoisha" INTEGER NOT NULL DEFAULT 0,
  "glAccountCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ApAllocation" (
  "id" TEXT PRIMARY KEY,
  "fromDocId" TEXT NOT NULL,
  "toDocId" TEXT NOT NULL,
  "amountPoisha" INTEGER NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ArDocument_customerId_idx" ON "ArDocument"("customerId");
CREATE INDEX IF NOT EXISTS "ArDocument_applicationId_idx" ON "ArDocument"("applicationId");
CREATE INDEX IF NOT EXISTS "ArDocument_status_idx" ON "ArDocument"("status");
CREATE INDEX IF NOT EXISTS "ArDocument_type_idx" ON "ArDocument"("type");
CREATE INDEX IF NOT EXISTS "ArDocument_issueDate_idx" ON "ArDocument"("issueDate");
CREATE INDEX IF NOT EXISTS "ArDocumentLine_documentId_idx" ON "ArDocumentLine"("documentId");
CREATE INDEX IF NOT EXISTS "ArAllocation_fromDocId_idx" ON "ArAllocation"("fromDocId");
CREATE INDEX IF NOT EXISTS "ArAllocation_toDocId_idx" ON "ArAllocation"("toDocId");
CREATE INDEX IF NOT EXISTS "ApDocument_supplierId_idx" ON "ApDocument"("supplierId");
CREATE INDEX IF NOT EXISTS "ApDocument_applicationId_idx" ON "ApDocument"("applicationId");
CREATE INDEX IF NOT EXISTS "ApDocument_status_idx" ON "ApDocument"("status");
CREATE INDEX IF NOT EXISTS "ApDocument_type_idx" ON "ApDocument"("type");
CREATE INDEX IF NOT EXISTS "ApDocument_issueDate_idx" ON "ApDocument"("issueDate");
CREATE INDEX IF NOT EXISTS "ApDocumentLine_documentId_idx" ON "ApDocumentLine"("documentId");
CREATE INDEX IF NOT EXISTS "ApAllocation_fromDocId_idx" ON "ApAllocation"("fromDocId");
CREATE INDEX IF NOT EXISTS "ApAllocation_toDocId_idx" ON "ApAllocation"("toDocId");

DO $$ BEGIN
  ALTER TABLE "ArDocument" ADD CONSTRAINT "ArDocument_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ArDocument" ADD CONSTRAINT "ArDocument_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ArDocument" ADD CONSTRAINT "ArDocument_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ArDocument" ADD CONSTRAINT "ArDocument_journalId_fkey"
    FOREIGN KEY ("journalId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ArDocumentLine" ADD CONSTRAINT "ArDocumentLine_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "ArDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ArAllocation" ADD CONSTRAINT "ArAllocation_fromDocId_fkey"
    FOREIGN KEY ("fromDocId") REFERENCES "ArDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ArAllocation" ADD CONSTRAINT "ArAllocation_toDocId_fkey"
    FOREIGN KEY ("toDocId") REFERENCES "ArDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ApDocument" ADD CONSTRAINT "ApDocument_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ApDocument" ADD CONSTRAINT "ApDocument_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ApDocument" ADD CONSTRAINT "ApDocument_journalId_fkey"
    FOREIGN KEY ("journalId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ApDocumentLine" ADD CONSTRAINT "ApDocumentLine_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "ApDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ApAllocation" ADD CONSTRAINT "ApAllocation_fromDocId_fkey"
    FOREIGN KEY ("fromDocId") REFERENCES "ApDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ApAllocation" ADD CONSTRAINT "ApAllocation_toDocId_fkey"
    FOREIGN KEY ("toDocId") REFERENCES "ApDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Permissions
INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('ar:read', 'View accounts receivable'),
  ('ar:manage', 'Create / approve / post AR documents'),
  ('ap:read', 'View accounts payable'),
  ('ap:manage', 'Create / approve / post AP documents')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'super_admin'
  AND p.key IN ('ar:read','ar:manage','ap:read','ap:manage')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp WHERE rp."roleId" = r.id AND rp."permId" = p.id
  );

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'accounts_manager'
  AND p.key IN ('ar:read','ar:manage','ap:read','ap:manage')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp WHERE rp."roleId" = r.id AND rp."permId" = p.id
  );

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'general_manager'
  AND p.key IN ('ar:read','ap:read')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp WHERE rp."roleId" = r.id AND rp."permId" = p.id
  );
