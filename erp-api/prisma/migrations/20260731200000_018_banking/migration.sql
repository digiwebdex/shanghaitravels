-- Phase C3 — Banking & Cash Management

CREATE TABLE IF NOT EXISTS "BankMaster" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "swiftBic" TEXT,
  "countryCode" TEXT DEFAULT 'BD',
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "BankAccount" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "bankMasterId" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'bank',
  "name" TEXT NOT NULL,
  "accountNo" TEXT,
  "iban" TEXT,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "glAccountId" TEXT NOT NULL,
  "cashAccountId" TEXT,
  "openingBalancePoisha" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "BankMovement" (
  "id" TEXT PRIMARY KEY,
  "movementNo" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "branchId" TEXT,
  "fromBankAccountId" TEXT,
  "toBankAccountId" TEXT,
  "amountPoisha" INTEGER NOT NULL,
  "movementDate" TIMESTAMP(3) NOT NULL,
  "memo" TEXT,
  "reference" TEXT,
  "journalId" TEXT,
  "chequeId" TEXT,
  "arDocumentId" TEXT,
  "apDocumentId" TEXT,
  "paymentId" TEXT,
  "applicationId" TEXT,
  "createdBy" TEXT NOT NULL,
  "postedBy" TEXT,
  "postedAt" TIMESTAMP(3),
  "voidedBy" TEXT,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "Cheque" (
  "id" TEXT PRIMARY KEY,
  "bankAccountId" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "chequeNo" TEXT NOT NULL,
  "chequeDate" TIMESTAMP(3) NOT NULL,
  "amountPoisha" INTEGER NOT NULL,
  "payeeOrDrawer" TEXT,
  "status" TEXT NOT NULL DEFAULT 'received',
  "printedAt" TIMESTAMP(3),
  "printPayload" JSONB,
  "clearedAt" TIMESTAMP(3),
  "bounceReason" TEXT,
  "movementId" TEXT,
  "arDocumentId" TEXT,
  "apDocumentId" TEXT,
  "memo" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "BankStatement" (
  "id" TEXT PRIMARY KEY,
  "bankAccountId" TEXT NOT NULL,
  "statementDate" TIMESTAMP(3) NOT NULL,
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3),
  "openingBalancePoisha" INTEGER NOT NULL DEFAULT 0,
  "closingBalancePoisha" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "importRef" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "BankStatementLine" (
  "id" TEXT PRIMARY KEY,
  "statementId" TEXT NOT NULL,
  "lineNo" INTEGER NOT NULL,
  "txnDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "amountPoisha" INTEGER NOT NULL,
  "bankRef" TEXT,
  "matchStatus" TEXT NOT NULL DEFAULT 'unmatched',
  "matchedMovementId" TEXT,
  "matchedJournalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BankReconciliation" (
  "id" TEXT PRIMARY KEY,
  "bankAccountId" TEXT NOT NULL,
  "statementId" TEXT,
  "asOfDate" TIMESTAMP(3) NOT NULL,
  "statementBalancePoisha" INTEGER NOT NULL DEFAULT 0,
  "bookBalancePoisha" INTEGER NOT NULL DEFAULT 0,
  "differencePoisha" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'in_progress',
  "notes" TEXT,
  "completedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "ChequePrintConfig" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE DEFAULT 'default',
  "template" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedBy" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BankAccount_kind_idx" ON "BankAccount"("kind");
CREATE INDEX IF NOT EXISTS "BankAccount_glAccountId_idx" ON "BankAccount"("glAccountId");
CREATE INDEX IF NOT EXISTS "BankAccount_branchId_idx" ON "BankAccount"("branchId");
CREATE INDEX IF NOT EXISTS "BankMovement_type_idx" ON "BankMovement"("type");
CREATE INDEX IF NOT EXISTS "BankMovement_status_idx" ON "BankMovement"("status");
CREATE INDEX IF NOT EXISTS "BankMovement_movementDate_idx" ON "BankMovement"("movementDate");
CREATE INDEX IF NOT EXISTS "BankMovement_fromBankAccountId_idx" ON "BankMovement"("fromBankAccountId");
CREATE INDEX IF NOT EXISTS "BankMovement_toBankAccountId_idx" ON "BankMovement"("toBankAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Cheque_bankAccountId_chequeNo_key" ON "Cheque"("bankAccountId", "chequeNo");
CREATE INDEX IF NOT EXISTS "Cheque_status_idx" ON "Cheque"("status");
CREATE INDEX IF NOT EXISTS "Cheque_chequeDate_idx" ON "Cheque"("chequeDate");
CREATE INDEX IF NOT EXISTS "BankStatement_bankAccountId_idx" ON "BankStatement"("bankAccountId");
CREATE INDEX IF NOT EXISTS "BankStatement_statementDate_idx" ON "BankStatement"("statementDate");
CREATE INDEX IF NOT EXISTS "BankStatementLine_statementId_idx" ON "BankStatementLine"("statementId");
CREATE INDEX IF NOT EXISTS "BankStatementLine_matchStatus_idx" ON "BankStatementLine"("matchStatus");
CREATE INDEX IF NOT EXISTS "BankReconciliation_bankAccountId_idx" ON "BankReconciliation"("bankAccountId");
CREATE INDEX IF NOT EXISTS "BankReconciliation_status_idx" ON "BankReconciliation"("status");

DO $$ BEGIN ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_bankMasterId_fkey" FOREIGN KEY ("bankMasterId") REFERENCES "BankMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "GlAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankMovement" ADD CONSTRAINT "BankMovement_fromBankAccountId_fkey" FOREIGN KEY ("fromBankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankMovement" ADD CONSTRAINT "BankMovement_toBankAccountId_fkey" FOREIGN KEY ("toBankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankMovement" ADD CONSTRAINT "BankMovement_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "BankStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "BankStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('banking:read', 'View banking / cash books'),
  ('banking:manage', 'Manage bank accounts and post movements'),
  ('banking:reconcile', 'Import statements and reconcile'),
  ('cheque:manage', 'Manage cheque register and printing')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'super_admin'
  AND p.key IN ('banking:read','banking:manage','banking:reconcile','cheque:manage')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'accounts_manager'
  AND p.key IN ('banking:read','banking:manage','banking:reconcile','cheque:manage')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'general_manager'
  AND p.key IN ('banking:read')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "ChequePrintConfig" ("id", "name", "template", "isActive")
SELECT gen_random_uuid()::text, 'default',
  '{"widthMm":190,"heightMm":90,"fields":[{"key":"payee","x":20,"y":30,"fontSize":12},{"key":"amount","x":140,"y":30,"fontSize":12},{"key":"amountWords","x":20,"y":45,"fontSize":10},{"key":"date","x":140,"y":15,"fontSize":10},{"key":"chequeNo","x":10,"y":10,"fontSize":9}]}'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM "ChequePrintConfig" WHERE "name" = 'default');
