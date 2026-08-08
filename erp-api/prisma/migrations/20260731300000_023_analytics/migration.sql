-- Phase D4 — CRM Analytics & Customer Intelligence

CREATE TABLE IF NOT EXISTS "AnalyticsReportTemplate" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "definition" JSONB NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsReportTemplate_code_key" ON "AnalyticsReportTemplate"("code");
CREATE INDEX IF NOT EXISTS "AnalyticsReportTemplate_category_idx" ON "AnalyticsReportTemplate"("category");
CREATE INDEX IF NOT EXISTS "AnalyticsReportTemplate_branchId_idx" ON "AnalyticsReportTemplate"("branchId");

CREATE TABLE IF NOT EXISTS "AnalyticsScheduledReport" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "templateId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "cronExpr" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'csv',
  "filters" JSONB,
  "recipients" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "nextRunAt" TIMESTAMP(3),
  "lastRunAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "AnalyticsScheduledReport_templateId_idx" ON "AnalyticsScheduledReport"("templateId");
CREATE INDEX IF NOT EXISTS "AnalyticsScheduledReport_isActive_idx" ON "AnalyticsScheduledReport"("isActive");
CREATE INDEX IF NOT EXISTS "AnalyticsScheduledReport_branchId_idx" ON "AnalyticsScheduledReport"("branchId");

DO $$ BEGIN
  ALTER TABLE "AnalyticsScheduledReport" ADD CONSTRAINT "AnalyticsScheduledReport_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "AnalyticsReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('analytics:read', 'View CRM analytics dashboards'),
  ('analytics:manage', 'Manage analytics report templates and schedules'),
  ('analytics:export', 'Export analytics reports to CSV/Excel/PDF')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name IN ('super_admin','general_manager','marketing_manager','office_incharge')
  AND p.key IN ('analytics:read','analytics:manage','analytics:export')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);
