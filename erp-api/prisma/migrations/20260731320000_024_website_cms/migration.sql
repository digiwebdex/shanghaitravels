-- Phase E — Website & CMS

ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "blocks" JSONB;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "templateKey" TEXT DEFAULT 'default';
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "ogImage" TEXT;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "structuredData" JSONB;
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "CmsPage" ADD COLUMN IF NOT EXISTS "publishedBy" TEXT;

UPDATE "CmsPage" SET "status" = 'published' WHERE "published" = true AND ("status" IS NULL OR "status" = 'draft');

CREATE INDEX IF NOT EXISTS "CmsPage_branchId_idx" ON "CmsPage"("branchId");
CREATE INDEX IF NOT EXISTS "CmsPage_status_idx" ON "CmsPage"("status");
CREATE INDEX IF NOT EXISTS "CmsPage_published_idx" ON "CmsPage"("published");

CREATE TABLE IF NOT EXISTS "CmsPageVersion" (
  "id" TEXT PRIMARY KEY,
  "pageId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "blocks" JSONB,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "status" TEXT NOT NULL,
  "snapshot" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "CmsPageVersion_pageId_version_key" ON "CmsPageVersion"("pageId", "version");
CREATE INDEX IF NOT EXISTS "CmsPageVersion_pageId_idx" ON "CmsPageVersion"("pageId");

CREATE TABLE IF NOT EXISTS "CmsMenu" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "CmsMenu_code_key" ON "CmsMenu"("code");
CREATE INDEX IF NOT EXISTS "CmsMenu_branchId_idx" ON "CmsMenu"("branchId");

CREATE TABLE IF NOT EXISTS "CmsMenuItem" (
  "id" TEXT PRIMARY KEY,
  "menuId" TEXT NOT NULL,
  "parentId" TEXT,
  "label" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "openInNew" BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS "CmsMenuItem_menuId_idx" ON "CmsMenuItem"("menuId");
CREATE INDEX IF NOT EXISTS "CmsMenuItem_parentId_idx" ON "CmsMenuItem"("parentId");

CREATE TABLE IF NOT EXISTS "CmsMedia" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "fileName" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL DEFAULT 0,
  "altText" TEXT,
  "folder" TEXT DEFAULT 'general',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CmsMedia_branchId_idx" ON "CmsMedia"("branchId");
CREATE INDEX IF NOT EXISTS "CmsMedia_folder_idx" ON "CmsMedia"("folder");

CREATE TABLE IF NOT EXISTS "CmsBanner" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "imageUrl" TEXT,
  "linkHref" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "placement" TEXT NOT NULL DEFAULT 'hero',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CmsBanner_branchId_idx" ON "CmsBanner"("branchId");
CREATE INDEX IF NOT EXISTS "CmsBanner_placement_idx" ON "CmsBanner"("placement");
CREATE INDEX IF NOT EXISTS "CmsBanner_isActive_idx" ON "CmsBanner"("isActive");

CREATE TABLE IF NOT EXISTS "CmsRedirect" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "fromPath" TEXT NOT NULL,
  "toPath" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL DEFAULT 301,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "CmsRedirect_fromPath_key" ON "CmsRedirect"("fromPath");
CREATE INDEX IF NOT EXISTS "CmsRedirect_isActive_idx" ON "CmsRedirect"("isActive");

CREATE TABLE IF NOT EXISTS "CmsContent" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "type" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "body" TEXT NOT NULL DEFAULT '',
  "coverUrl" TEXT,
  "meta" JSONB,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "authorName" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "CmsContent_type_slug_key" ON "CmsContent"("type", "slug");
CREATE INDEX IF NOT EXISTS "CmsContent_type_idx" ON "CmsContent"("type");
CREATE INDEX IF NOT EXISTS "CmsContent_status_idx" ON "CmsContent"("status");
CREATE INDEX IF NOT EXISTS "CmsContent_branchId_idx" ON "CmsContent"("branchId");

CREATE TABLE IF NOT EXISTS "CmsTravelOffer" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "serviceType" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "body" TEXT NOT NULL DEFAULT '',
  "coverUrl" TEXT,
  "priceFromPoisha" INTEGER,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "destination" TEXT,
  "highlights" JSONB,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "CmsTravelOffer_serviceType_slug_key" ON "CmsTravelOffer"("serviceType", "slug");
CREATE INDEX IF NOT EXISTS "CmsTravelOffer_serviceType_idx" ON "CmsTravelOffer"("serviceType");
CREATE INDEX IF NOT EXISTS "CmsTravelOffer_status_idx" ON "CmsTravelOffer"("status");
CREATE INDEX IF NOT EXISTS "CmsTravelOffer_branchId_idx" ON "CmsTravelOffer"("branchId");

CREATE TABLE IF NOT EXISTS "CmsFormSubmission" (
  "id" TEXT PRIMARY KEY,
  "branchId" TEXT,
  "formType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "message" TEXT,
  "payload" JSONB,
  "pageSlug" TEXT,
  "leadId" TEXT,
  "applicationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CmsFormSubmission_formType_idx" ON "CmsFormSubmission"("formType");
CREATE INDEX IF NOT EXISTS "CmsFormSubmission_status_idx" ON "CmsFormSubmission"("status");
CREATE INDEX IF NOT EXISTS "CmsFormSubmission_leadId_idx" ON "CmsFormSubmission"("leadId");
CREATE INDEX IF NOT EXISTS "CmsFormSubmission_createdAt_idx" ON "CmsFormSubmission"("createdAt");
CREATE INDEX IF NOT EXISTS "CmsFormSubmission_branchId_idx" ON "CmsFormSubmission"("branchId");

CREATE TABLE IF NOT EXISTS "CmsPageView" (
  "id" TEXT PRIMARY KEY,
  "pageId" TEXT,
  "path" TEXT NOT NULL,
  "branchId" TEXT,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "referrer" TEXT,
  "userAgent" TEXT
);
CREATE INDEX IF NOT EXISTS "CmsPageView_pageId_idx" ON "CmsPageView"("pageId");
CREATE INDEX IF NOT EXISTS "CmsPageView_path_idx" ON "CmsPageView"("path");
CREATE INDEX IF NOT EXISTS "CmsPageView_viewedAt_idx" ON "CmsPageView"("viewedAt");

DO $$ BEGIN
  ALTER TABLE "CmsPageVersion" ADD CONSTRAINT "CmsPageVersion_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "CmsPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CmsMenuItem" ADD CONSTRAINT "CmsMenuItem_menuId_fkey"
    FOREIGN KEY ("menuId") REFERENCES "CmsMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CmsPageView" ADD CONSTRAINT "CmsPageView_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "CmsPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "Permission" ("id", "key", "description")
SELECT gen_random_uuid()::text, v.key, v.description
FROM (VALUES
  ('cms:read', 'View CMS content and form submissions'),
  ('cms:publish', 'Publish CMS pages and content')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = v.key);

INSERT INTO "RolePermission" ("roleId", "permId")
SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name IN ('super_admin','general_manager','marketing_manager','office_incharge')
  AND p.key IN ('cms:read','cms:publish','cms:manage')
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permId"=p.id);
