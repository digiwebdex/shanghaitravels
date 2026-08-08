-- Phase D2 — Sales Automation & Quotations

ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "lostReasonId" TEXT;

ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "rootQuoteId" TEXT;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "discountPoisha" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "discountBps" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "htmlSnapshot" TEXT;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "rejectedBy" TEXT;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;

ALTER TABLE "QuotationLine" ADD COLUMN IF NOT EXISTS "productCode" TEXT;
ALTER TABLE "QuotationLine" ADD COLUMN IF NOT EXISTS "discountPoisha" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "SalesStage" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "defaultProbabilityBps" INTEGER NOT NULL DEFAULT 2000,
  "isWon" BOOLEAN NOT NULL DEFAULT false,
  "isLost" BOOLEAN NOT NULL DEFAULT false,
  "isConverted" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "SalesStage_code_key" ON "SalesStage"("code");

CREATE TABLE IF NOT EXISTS "OpportunityStageHistory" (
  "id" TEXT PRIMARY KEY,
  "opportunityId" TEXT NOT NULL,
  "fromStage" TEXT,
  "toStage" TEXT NOT NULL,
  "probabilityBps" INTEGER,
  "note" TEXT,
  "lostReasonId" TEXT,
  "changedBy" TEXT NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OpportunityStageHistory_opportunityId_idx" ON "OpportunityStageHistory"("opportunityId");
CREATE INDEX IF NOT EXISTS "OpportunityStageHistory_changedAt_idx" ON "OpportunityStageHistory"("changedAt");

CREATE TABLE IF NOT EXISTS "LostReason" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "LostReason_code_key" ON "LostReason"("code");

CREATE TABLE IF NOT EXISTS "PriceTemplate" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "serviceType" TEXT NOT NULL,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "PriceTemplate_code_key" ON "PriceTemplate"("code");
CREATE INDEX IF NOT EXISTS "PriceTemplate_serviceType_idx" ON "PriceTemplate"("serviceType");
CREATE INDEX IF NOT EXISTS "PriceTemplate_branchId_idx" ON "PriceTemplate"("branchId");

CREATE TABLE IF NOT EXISTS "PriceTemplateLine" (
  "id" TEXT PRIMARY KEY,
  "templateId" TEXT NOT NULL,
  "lineNo" INTEGER NOT NULL,
  "productCode" TEXT,
  "description" TEXT NOT NULL,
  "unitPricePoisha" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "PriceTemplateLine_templateId_idx" ON "PriceTemplateLine"("templateId");

CREATE TABLE IF NOT EXISTS "PriceBook" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'standard',
  "serviceType" TEXT,
  "customerId" TEXT,
  "organizationId" TEXT,
  "agentId" TEXT,
  "productCode" TEXT,
  "unitPricePoisha" INTEGER,
  "discountBps" INTEGER NOT NULL DEFAULT 0,
  "validFrom" TIMESTAMP(3),
  "validTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "PriceBook_code_key" ON "PriceBook"("code");
CREATE INDEX IF NOT EXISTS "PriceBook_kind_idx" ON "PriceBook"("kind");
CREATE INDEX IF NOT EXISTS "PriceBook_serviceType_idx" ON "PriceBook"("serviceType");
CREATE INDEX IF NOT EXISTS "PriceBook_customerId_idx" ON "PriceBook"("customerId");
CREATE INDEX IF NOT EXISTS "PriceBook_organizationId_idx" ON "PriceBook"("organizationId");
CREATE INDEX IF NOT EXISTS "PriceBook_agentId_idx" ON "PriceBook"("agentId");

CREATE TABLE IF NOT EXISTS "SalesTask" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'follow_up',
  "status" TEXT NOT NULL DEFAULT 'open',
  "opportunityId" TEXT,
  "quotationId" TEXT,
  "leadId" TEXT,
  "assignedTo" TEXT,
  "dueAt" TIMESTAMP(3),
  "reminderAt" TIMESTAMP(3),
  "slaDueAt" TIMESTAMP(3),
  "escalatedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SalesTask_status_idx" ON "SalesTask"("status");
CREATE INDEX IF NOT EXISTS "SalesTask_assignedTo_idx" ON "SalesTask"("assignedTo");
CREATE INDEX IF NOT EXISTS "SalesTask_dueAt_idx" ON "SalesTask"("dueAt");
CREATE INDEX IF NOT EXISTS "SalesTask_slaDueAt_idx" ON "SalesTask"("slaDueAt");
CREATE INDEX IF NOT EXISTS "SalesTask_opportunityId_idx" ON "SalesTask"("opportunityId");

CREATE INDEX IF NOT EXISTS "Quotation_rootQuoteId_idx" ON "Quotation"("rootQuoteId");

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_lostReasonId_fkey"
    FOREIGN KEY ("lostReasonId") REFERENCES "LostReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_opportunityId_fkey"
    FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PriceTemplateLine" ADD CONSTRAINT "PriceTemplateLine_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "PriceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_opportunityId_fkey"
    FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('quote:approve', 'Approve or reject sales quotations'),
  ('sales:pricing', 'Manage sales pricing templates and price books'),
  ('sales:task', 'Manage sales tasks and escalations')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name IN ('super_admin','general_manager','marketing_manager','office_incharge')
  AND p.key IN ('quote:approve','sales:pricing','sales:task')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);

-- Default stages
INSERT INTO "SalesStage" ("id","code","name","sortOrder","defaultProbabilityBps","isWon","isLost","isConverted")
SELECT gen_random_uuid()::text, v.code, v.name, v.sortOrder, v.prob, v.isWon, v.isLost, v.isConverted
FROM (VALUES
  ('qualification','Qualification',10,2000,false,false,false),
  ('needs_analysis','Needs Analysis',20,4000,false,false,false),
  ('proposal','Proposal',30,6000,false,false,false),
  ('negotiation','Negotiation',40,7500,false,false,false),
  ('won','Won',90,10000,true,false,false),
  ('lost','Lost',91,0,false,true,false),
  ('converted','Converted',100,10000,false,false,true)
) AS v(code,name,sortOrder,prob,isWon,isLost,isConverted)
WHERE NOT EXISTS (SELECT 1 FROM "SalesStage" s WHERE s.code = v.code);

INSERT INTO "LostReason" ("id","code","label","sortOrder")
SELECT gen_random_uuid()::text, v.code, v.label, v.sortOrder
FROM (VALUES
  ('price','Price too high',10),
  ('competitor','Chose competitor',20),
  ('timing','Timing / postponed',30),
  ('no_budget','No budget',40),
  ('no_response','No response',50),
  ('other','Other',90)
) AS v(code,label,sortOrder)
WHERE NOT EXISTS (SELECT 1 FROM "LostReason" r WHERE r.code = v.code);
