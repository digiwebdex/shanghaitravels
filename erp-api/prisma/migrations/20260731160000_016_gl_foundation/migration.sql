-- Phase C1: Finance ERP Foundation — double-entry GL (additive; cash Account untouched).

CREATE TABLE IF NOT EXISTS "GlAccountGroup" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "GlAccountGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "GlAccountGroup_code_key" ON "GlAccountGroup"("code");

CREATE TABLE IF NOT EXISTS "GlAccount" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "groupId" TEXT,
  "parentId" TEXT,
  "isHeader" BOOLEAN NOT NULL DEFAULT false,
  "isPostable" BOOLEAN NOT NULL DEFAULT true,
  "currencyCode" TEXT,
  "branchId" TEXT,
  "taxCode" TEXT,
  "costCenterRequired" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "GlAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "GlAccount_code_key" ON "GlAccount"("code");

CREATE TABLE IF NOT EXISTS "FiscalYear" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FiscalYear_code_key" ON "FiscalYear"("code");

CREATE TABLE IF NOT EXISTS "AccountingPeriod" (
  "id" TEXT NOT NULL,
  "fiscalYearId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "closedAt" TIMESTAMP(3),
  "closedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AccountingPeriod_fiscalYearId_code_key" ON "AccountingPeriod"("fiscalYearId", "code");

CREATE TABLE IF NOT EXISTS "CostCenter" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "branchId" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CostCenter_code_key" ON "CostCenter"("code");

CREATE TABLE IF NOT EXISTS "Currency" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "symbol" TEXT,
  "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
  "isBase" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Currency_code_key" ON "Currency"("code");

CREATE TABLE IF NOT EXISTS "ExchangeRate" (
  "id" TEXT NOT NULL,
  "fromCode" TEXT NOT NULL,
  "toCode" TEXT NOT NULL,
  "rateScaled" BIGINT NOT NULL,
  "rateDate" TIMESTAMP(3) NOT NULL,
  "source" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ExchangeRate_fromCode_toCode_rateDate_idx" ON "ExchangeRate"("fromCode", "toCode", "rateDate");

CREATE TABLE IF NOT EXISTS "JournalEntry" (
  "id" TEXT NOT NULL,
  "journalNo" TEXT NOT NULL,
  "entryDate" TIMESTAMP(3) NOT NULL,
  "periodId" TEXT NOT NULL,
  "branchId" TEXT,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "type" TEXT NOT NULL DEFAULT 'standard',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "memo" TEXT,
  "reference" TEXT,
  "totalDebitPoisha" INTEGER NOT NULL DEFAULT 0,
  "totalCreditPoisha" INTEGER NOT NULL DEFAULT 0,
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
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_journalNo_key" ON "JournalEntry"("journalNo");
CREATE INDEX IF NOT EXISTS "JournalEntry_entryDate_idx" ON "JournalEntry"("entryDate");
CREATE INDEX IF NOT EXISTS "JournalEntry_status_idx" ON "JournalEntry"("status");
CREATE INDEX IF NOT EXISTS "JournalEntry_periodId_idx" ON "JournalEntry"("periodId");

CREATE TABLE IF NOT EXISTS "JournalLine" (
  "id" TEXT NOT NULL,
  "journalId" TEXT NOT NULL,
  "lineNo" INTEGER NOT NULL,
  "glAccountId" TEXT NOT NULL,
  "costCenterId" TEXT,
  "debitPoisha" INTEGER NOT NULL DEFAULT 0,
  "creditPoisha" INTEGER NOT NULL DEFAULT 0,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "fxRateScaled" BIGINT,
  "debitBasePoisha" INTEGER NOT NULL DEFAULT 0,
  "creditBasePoisha" INTEGER NOT NULL DEFAULT 0,
  "memo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "JournalLine_glAccountId_idx" ON "JournalLine"("glAccountId");
CREATE INDEX IF NOT EXISTS "JournalLine_journalId_lineNo_idx" ON "JournalLine"("journalId", "lineNo");

-- GL permissions (additive)
INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('gl:read', 'View chart of accounts / GL masters'),
  ('gl:manage', 'Manage CoA, groups, cost centers, fiscal setup'),
  ('journal:create', 'Create / edit draft journal entries'),
  ('journal:approve', 'Approve / reject journal entries'),
  ('period:close', 'Close accounting periods'),
  ('fx:manage', 'Manage currencies and exchange rates')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

-- Grant to super_admin + accounts_manager; read to general_manager
INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'super_admin'
  AND p.key IN ('gl:read','gl:manage','journal:create','journal:approve','period:close','fx:manage')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp WHERE rp."roleId" = r.id AND rp."permId" = p.id
  );

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'accounts_manager'
  AND p.key IN ('gl:read','gl:manage','journal:create','journal:approve','period:close','fx:manage')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp WHERE rp."roleId" = r.id AND rp."permId" = p.id
  );

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'general_manager'
  AND p.key IN ('gl:read')
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp WHERE rp."roleId" = r.id AND rp."permId" = p.id
  );
