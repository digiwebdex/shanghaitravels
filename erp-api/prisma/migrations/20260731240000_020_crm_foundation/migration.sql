-- Phase D1 — CRM Foundation

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "leadNo" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'warm';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedApplicationId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lostReason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Lead_leadNo_key" ON "Lead"("leadNo");
CREATE INDEX IF NOT EXISTS "Lead_branchId_idx" ON "Lead"("branchId");
CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
CREATE INDEX IF NOT EXISTS "Lead_source_idx" ON "Lead"("source");

CREATE TABLE IF NOT EXISTS "CrmContact" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'individual',
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "familyGroup" TEXT,
  "organizationId" TEXT,
  "customerId" TEXT,
  "assignedTo" TEXT,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CrmContact_branchId_idx" ON "CrmContact"("branchId");
CREATE INDEX IF NOT EXISTS "CrmContact_kind_idx" ON "CrmContact"("kind");
CREATE INDEX IF NOT EXISTS "CrmContact_organizationId_idx" ON "CrmContact"("organizationId");

CREATE TABLE IF NOT EXISTS "CrmOrganization" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "agentId" TEXT,
  "corporateClientId" TEXT,
  "creditLimitPoisha" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "CrmOrganization_code_key" ON "CrmOrganization"("code");
CREATE INDEX IF NOT EXISTS "CrmOrganization_branchId_idx" ON "CrmOrganization"("branchId");
CREATE INDEX IF NOT EXISTS "CrmOrganization_type_idx" ON "CrmOrganization"("type");

CREATE TABLE IF NOT EXISTS "Opportunity" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "opportunityNo" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "stage" TEXT NOT NULL DEFAULT 'qualification',
  "probabilityBps" INTEGER NOT NULL DEFAULT 2000,
  "expectedRevenuePoisha" INTEGER NOT NULL DEFAULT 0,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "serviceType" TEXT,
  "expectedCloseDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'open',
  "leadId" TEXT,
  "contactId" TEXT,
  "organizationId" TEXT,
  "customerId" TEXT,
  "applicationId" TEXT,
  "assignedTo" TEXT,
  "lostReason" TEXT,
  "wonAt" TIMESTAMP(3),
  "lostAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "Opportunity_opportunityNo_key" ON "Opportunity"("opportunityNo");
CREATE INDEX IF NOT EXISTS "Opportunity_branchId_idx" ON "Opportunity"("branchId");
CREATE INDEX IF NOT EXISTS "Opportunity_stage_idx" ON "Opportunity"("stage");
CREATE INDEX IF NOT EXISTS "Opportunity_status_idx" ON "Opportunity"("status");
CREATE INDEX IF NOT EXISTS "Opportunity_assignedTo_idx" ON "Opportunity"("assignedTo");

CREATE TABLE IF NOT EXISTS "CrmActivity" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT,
  "relatedType" TEXT NOT NULL,
  "relatedId" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'open',
  "assignedTo" TEXT,
  "byUser" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CrmActivity_relatedType_relatedId_idx" ON "CrmActivity"("relatedType", "relatedId");
CREATE INDEX IF NOT EXISTS "CrmActivity_status_idx" ON "CrmActivity"("status");
CREATE INDEX IF NOT EXISTS "CrmActivity_dueAt_idx" ON "CrmActivity"("dueAt");
CREATE INDEX IF NOT EXISTS "CrmActivity_assignedTo_idx" ON "CrmActivity"("assignedTo");

CREATE TABLE IF NOT EXISTS "Quotation" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "quoteNo" TEXT NOT NULL,
  "serviceType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "opportunityId" TEXT,
  "leadId" TEXT,
  "contactId" TEXT,
  "organizationId" TEXT,
  "customerId" TEXT,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "subtotalPoisha" INTEGER NOT NULL DEFAULT 0,
  "taxPoisha" INTEGER NOT NULL DEFAULT 0,
  "totalPoisha" INTEGER NOT NULL DEFAULT 0,
  "validUntil" TIMESTAMP(3),
  "notes" TEXT,
  "applicationId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_quoteNo_key" ON "Quotation"("quoteNo");
CREATE INDEX IF NOT EXISTS "Quotation_branchId_idx" ON "Quotation"("branchId");
CREATE INDEX IF NOT EXISTS "Quotation_status_idx" ON "Quotation"("status");
CREATE INDEX IF NOT EXISTS "Quotation_serviceType_idx" ON "Quotation"("serviceType");

CREATE TABLE IF NOT EXISTS "QuotationLine" (
  "id" TEXT PRIMARY KEY,
  "quotationId" TEXT NOT NULL,
  "lineNo" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPricePoisha" INTEGER NOT NULL DEFAULT 0,
  "amountPoisha" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "QuotationLine_quotationId_idx" ON "QuotationLine"("quotationId");

CREATE INDEX IF NOT EXISTS "Communication_relatedType_relatedId_idx" ON "Communication"("relatedType", "relatedId");

DO $$ BEGIN
  ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_opportunityId_fkey"
    FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_quotationId_fkey"
    FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('opportunity:read', 'View CRM opportunities'),
  ('opportunity:manage', 'Manage CRM opportunities'),
  ('quote:read', 'View CRM quotations'),
  ('quote:manage', 'Manage CRM quotations'),
  ('crm:convert', 'Convert CRM opportunities/quotes to cases')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'super_admin'
  AND p.key IN ('opportunity:read','opportunity:manage','quote:read','quote:manage','crm:convert')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'marketing_manager'
  AND p.key IN ('opportunity:read','opportunity:manage','quote:read','quote:manage','crm:convert','customer:create')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'general_manager'
  AND p.key IN ('opportunity:read','opportunity:manage','quote:read','quote:manage','crm:convert','lead:manage','communication:manage')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'office_incharge'
  AND p.key IN ('lead:read','lead:manage','crm:read','communication:manage','opportunity:read','opportunity:manage','quote:read','quote:manage','crm:convert')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);
