-- Phase B4: tour product master + booking detail fields (additive / non-breaking).

ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "packageCode" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "packageType" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "season" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "exclusions" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "activities" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "hotelsNote" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "transportNote" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "flightsNote" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "visaRequirements" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "insuranceNote" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "occupancyNote" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "childPolicy" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "seasonalPricingNote" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "costBreakdown" TEXT;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "supplierCostPoisha" INTEGER;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "sellingPricePoisha" INTEGER;
ALTER TABLE "TourPackageDetail" ADD COLUMN IF NOT EXISTS "confirmationNo" TEXT;

CREATE TABLE IF NOT EXISTS "TourPackage" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "packageType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "destination" TEXT,
  "country" TEXT,
  "city" TEXT,
  "season" TEXT,
  "durationDays" INTEGER,
  "durationNights" INTEGER,
  "itinerary" TEXT,
  "inclusions" TEXT,
  "exclusions" TEXT,
  "activities" TEXT,
  "hotelsNote" TEXT,
  "transportNote" TEXT,
  "flightsNote" TEXT,
  "visaRequirements" TEXT,
  "insuranceNote" TEXT,
  "occupancyNote" TEXT,
  "childPolicy" TEXT,
  "seasonalPricingNote" TEXT,
  "costBreakdown" TEXT,
  "supplierCostPoisha" INTEGER,
  "sellingPricePoisha" INTEGER,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TourPackage_code_key" ON "TourPackage"("code");

CREATE TABLE IF NOT EXISTS "TourDeparture" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "departAt" TIMESTAMP(3) NOT NULL,
  "returnAt" TIMESTAMP(3),
  "seats" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TourDeparture_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TourDeparture_packageId_idx" ON "TourDeparture"("packageId");

CREATE TABLE IF NOT EXISTS "TourDestination" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "country" TEXT,
  "city" TEXT,
  "region" TEXT,
  "season" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TourDestination_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_packageId_fkey"
    FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
