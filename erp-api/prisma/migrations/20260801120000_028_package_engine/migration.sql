-- Phase E3: Package Engine — PackageMaster as single source of truth (additive).

CREATE TYPE "PackageMasterStatus" AS ENUM ('draft', 'published', 'archived', 'scheduled');
CREATE TYPE "PackageGalleryKind" AS ENUM ('thumbnail', 'gallery', 'banner');
CREATE TYPE "PackageAvailabilityStatus" AS ENUM ('open', 'full', 'closed', 'cancelled');

CREATE TABLE IF NOT EXISTS "PackageCategory" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PackageCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PackageCategory_code_key" ON "PackageCategory"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "PackageCategory_slug_key" ON "PackageCategory"("slug");
CREATE INDEX IF NOT EXISTS "PackageCategory_isActive_idx" ON "PackageCategory"("isActive");
CREATE INDEX IF NOT EXISTS "PackageCategory_sortOrder_idx" ON "PackageCategory"("sortOrder");

CREATE TABLE IF NOT EXISTS "PackageMaster" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "country" TEXT,
  "destination" TEXT,
  "cities" TEXT,
  "durationDays" INTEGER,
  "durationNights" INTEGER,
  "packageType" TEXT,
  "travelStartAt" TIMESTAMP(3),
  "travelEndAt" TIMESTAMP(3),
  "pricePoisha" INTEGER NOT NULL DEFAULT 0,
  "offerPricePoisha" INTEGER,
  "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
  "adultPricePoisha" INTEGER,
  "childPricePoisha" INTEGER,
  "infantPricePoisha" INTEGER,
  "singleSupplementPoisha" INTEGER,
  "maxPax" INTEGER,
  "minPax" INTEGER,
  "seatsAvailable" INTEGER,
  "seatsSold" INTEGER NOT NULL DEFAULT 0,
  "status" "PackageMasterStatus" NOT NULL DEFAULT 'draft',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "popular" BOOLEAN NOT NULL DEFAULT false,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "homeFeatured" BOOLEAN NOT NULL DEFAULT false,
  "agentFeatured" BOOLEAN NOT NULL DEFAULT false,
  "corporateFeatured" BOOLEAN NOT NULL DEFAULT false,
  "corporateApproved" BOOLEAN NOT NULL DEFAULT false,
  "tags" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "thumbnailUrl" TEXT,
  "bannerUrl" TEXT,
  "videoUrl" TEXT,
  "description" TEXT,
  "highlights" TEXT,
  "included" TEXT,
  "excluded" TEXT,
  "terms" TEXT,
  "cancellationPolicy" TEXT,
  "visaRequirements" TEXT,
  "hotelDetails" TEXT,
  "flightDetails" TEXT,
  "transportDetails" TEXT,
  "mealPlan" TEXT,
  "tourPlan" TEXT,
  "itineraryJson" JSONB,
  "mapEmbedUrl" TEXT,
  "faqJson" JSONB,
  "ratingAvg" DOUBLE PRECISION,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "supplierId" TEXT,
  "agentCommissionBps" INTEGER,
  "publishAt" TIMESTAMP(3),
  "expireAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PackageMaster_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PackageMaster_code_key" ON "PackageMaster"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "PackageMaster_slug_key" ON "PackageMaster"("slug");
CREATE INDEX IF NOT EXISTS "PackageMaster_categoryId_idx" ON "PackageMaster"("categoryId");
CREATE INDEX IF NOT EXISTS "PackageMaster_status_idx" ON "PackageMaster"("status");
CREATE INDEX IF NOT EXISTS "PackageMaster_destination_idx" ON "PackageMaster"("destination");
CREATE INDEX IF NOT EXISTS "PackageMaster_country_idx" ON "PackageMaster"("country");
CREATE INDEX IF NOT EXISTS "PackageMaster_featured_idx" ON "PackageMaster"("featured");
CREATE INDEX IF NOT EXISTS "PackageMaster_popular_idx" ON "PackageMaster"("popular");
CREATE INDEX IF NOT EXISTS "PackageMaster_recommended_idx" ON "PackageMaster"("recommended");
CREATE INDEX IF NOT EXISTS "PackageMaster_homeFeatured_idx" ON "PackageMaster"("homeFeatured");
CREATE INDEX IF NOT EXISTS "PackageMaster_agentFeatured_idx" ON "PackageMaster"("agentFeatured");
CREATE INDEX IF NOT EXISTS "PackageMaster_corporateFeatured_idx" ON "PackageMaster"("corporateFeatured");
CREATE INDEX IF NOT EXISTS "PackageMaster_corporateApproved_idx" ON "PackageMaster"("corporateApproved");
CREATE INDEX IF NOT EXISTS "PackageMaster_travelStartAt_idx" ON "PackageMaster"("travelStartAt");
CREATE INDEX IF NOT EXISTS "PackageMaster_deletedAt_idx" ON "PackageMaster"("deletedAt");

ALTER TABLE "PackageMaster" ADD CONSTRAINT "PackageMaster_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "PackageCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageMaster" ADD CONSTRAINT "PackageMaster_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PackageGalleryItem" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "kind" "PackageGalleryKind" NOT NULL DEFAULT 'gallery',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageGalleryItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PackageGalleryItem_packageId_idx" ON "PackageGalleryItem"("packageId");
ALTER TABLE "PackageGalleryItem" ADD CONSTRAINT "PackageGalleryItem_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PackageAvailability" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3),
  "seats" INTEGER,
  "seatsSold" INTEGER NOT NULL DEFAULT 0,
  "status" "PackageAvailabilityStatus" NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageAvailability_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PackageAvailability_packageId_idx" ON "PackageAvailability"("packageId");
CREATE INDEX IF NOT EXISTS "PackageAvailability_startAt_idx" ON "PackageAvailability"("startAt");
CREATE INDEX IF NOT EXISTS "PackageAvailability_status_idx" ON "PackageAvailability"("status");
ALTER TABLE "PackageAvailability" ADD CONSTRAINT "PackageAvailability_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PackageFaq" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageFaq_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PackageFaq_packageId_idx" ON "PackageFaq"("packageId");
ALTER TABLE "PackageFaq" ADD CONSTRAINT "PackageFaq_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PackageReview" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "body" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageReview_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PackageReview_packageId_idx" ON "PackageReview"("packageId");
ALTER TABLE "PackageReview" ADD CONSTRAINT "PackageReview_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PackageWishlist" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageWishlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PackageWishlist_customerId_packageId_key" ON "PackageWishlist"("customerId", "packageId");
CREATE INDEX IF NOT EXISTS "PackageWishlist_customerId_idx" ON "PackageWishlist"("customerId");
CREATE INDEX IF NOT EXISTS "PackageWishlist_packageId_idx" ON "PackageWishlist"("packageId");
ALTER TABLE "PackageWishlist" ADD CONSTRAINT "PackageWishlist_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackageWishlist" ADD CONSTRAINT "PackageWishlist_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- packageId on existing CRM/sales/case tables
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "Application_packageId_idx" ON "Application"("packageId");
ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_packageId_fkey";
ALTER TABLE "Application" ADD CONSTRAINT "Application_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "Lead_packageId_idx" ON "Lead"("packageId");
ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_packageId_fkey";
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "Opportunity_packageId_idx" ON "Opportunity"("packageId");
ALTER TABLE "Opportunity" DROP CONSTRAINT IF EXISTS "Opportunity_packageId_fkey";
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "Quotation_packageId_idx" ON "Quotation"("packageId");
ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS "Quotation_packageId_fkey";
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuotationLine" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "QuotationLine_packageId_idx" ON "QuotationLine"("packageId");
ALTER TABLE "QuotationLine" DROP CONSTRAINT IF EXISTS "QuotationLine_packageId_fkey";
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "Invoice_packageId_idx" ON "Invoice"("packageId");
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_packageId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "InvoiceItem_packageId_idx" ON "InvoiceItem"("packageId");
ALTER TABLE "InvoiceItem" DROP CONSTRAINT IF EXISTS "InvoiceItem_packageId_fkey";
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "TourPackageDetail_packageId_idx" ON "TourPackageDetail"("packageId");
ALTER TABLE "TourPackageDetail" DROP CONSTRAINT IF EXISTS "TourPackageDetail_packageId_fkey";
ALTER TABLE "TourPackageDetail" ADD CONSTRAINT "TourPackageDetail_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "HajjUmrahDetail_packageId_idx" ON "HajjUmrahDetail"("packageId");
ALTER TABLE "HajjUmrahDetail" DROP CONSTRAINT IF EXISTS "HajjUmrahDetail_packageId_fkey";
ALTER TABLE "HajjUmrahDetail" ADD CONSTRAINT "HajjUmrahDetail_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CmsTravelOffer" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "CmsTravelOffer_packageId_idx" ON "CmsTravelOffer"("packageId");
ALTER TABLE "CmsTravelOffer" DROP CONSTRAINT IF EXISTS "CmsTravelOffer_packageId_fkey";
ALTER TABLE "CmsTravelOffer" ADD CONSTRAINT "CmsTravelOffer_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CorporateTravelRequest" ADD COLUMN IF NOT EXISTS "packageId" TEXT;
CREATE INDEX IF NOT EXISTS "CorporateTravelRequest_packageId_idx" ON "CorporateTravelRequest"("packageId");
ALTER TABLE "CorporateTravelRequest" DROP CONSTRAINT IF EXISTS "CorporateTravelRequest_packageId_fkey";
ALTER TABLE "CorporateTravelRequest" ADD CONSTRAINT "CorporateTravelRequest_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default categories
INSERT INTO "PackageCategory" ("id","code","name","slug","description","sortOrder","isActive")
SELECT gen_random_uuid()::text, v.code, v.name, v.slug, v.description, v.sortOrder, true
FROM (VALUES
  ('visa','Visa Services','visa','Visa processing packages',10),
  ('air_ticket','Air Tickets','air-ticket','Flight and air ticket packages',20),
  ('hotel','Hotels','hotel','Hotel stay packages',30),
  ('tour','Tours','tour','Tour and travel packages',40),
  ('hajj','Hajj','hajj','Hajj pilgrimage packages',50),
  ('umrah','Umrah','umrah','Umrah pilgrimage packages',60),
  ('transport','Transport','transport','Transport and transfer packages',70),
  ('student','Student','student','Student visa and travel packages',80),
  ('work_permit','Work Permit','work-permit','Work permit and employment packages',90),
  ('medical','Medical','medical','Medical travel packages',100),
  ('custom','Custom','custom','Custom bespoke packages',110)
) AS v(code,name,slug,description,sortOrder)
WHERE NOT EXISTS (SELECT 1 FROM "PackageCategory" c WHERE c.code = v.code);
