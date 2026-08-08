-- Phase B5: Hajj & Umrah catalogs + booking detail fields (additive / non-breaking).

ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "packageCode" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "packageCategory" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "groupCode" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "groupName" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "leaderName" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "dob" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "mahramRelation" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "healthNotes" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "visaStatus" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "visaNo" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "passportStatus" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "flightNo" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "airline" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "transportNote" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "roomAllocation" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "occupancyNote" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "inclusions" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "exclusions" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "paymentPlanNote" TEXT;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "supplierCostPoisha" INTEGER;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "sellingPricePoisha" INTEGER;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "paidPoisha" INTEGER;
ALTER TABLE "HajjUmrahDetail" ADD COLUMN IF NOT EXISTS "confirmationNo" TEXT;

CREATE TABLE IF NOT EXISTS "HajjUmrahPackage" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "season" TEXT,
  "year" TEXT,
  "durationDays" INTEGER,
  "departureCity" TEXT,
  "hotelMakkah" TEXT,
  "hotelMadinah" TEXT,
  "roomType" TEXT,
  "occupancyNote" TEXT,
  "inclusions" TEXT,
  "exclusions" TEXT,
  "capacity" INTEGER,
  "supplierCostPoisha" INTEGER,
  "sellingPricePoisha" INTEGER,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "HajjUmrahPackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HajjUmrahPackage_code_key" ON "HajjUmrahPackage"("code");

CREATE TABLE IF NOT EXISTS "HajjPilgrim" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "passportNo" TEXT,
  "nationality" TEXT,
  "gender" TEXT,
  "dob" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "mahramName" TEXT,
  "mahramRelation" TEXT,
  "healthNotes" TEXT,
  "emergencyContact" TEXT,
  "emergencyPhone" TEXT,
  "visaStatus" TEXT,
  "visaNo" TEXT,
  "passportStatus" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "HajjPilgrim_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HajjPilgrim_code_key" ON "HajjPilgrim"("code");

CREATE TABLE IF NOT EXISTS "HajjGroup" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "packageId" TEXT,
  "season" TEXT,
  "year" TEXT,
  "leaderName" TEXT,
  "leaderPhone" TEXT,
  "capacity" INTEGER,
  "enrolled" INTEGER,
  "flightNo" TEXT,
  "airline" TEXT,
  "transportNote" TEXT,
  "hotelMakkah" TEXT,
  "hotelMadinah" TEXT,
  "roomingNote" TEXT,
  "status" TEXT NOT NULL DEFAULT 'forming',
  "departAt" TIMESTAMP(3),
  "returnAt" TIMESTAMP(3),
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "HajjGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HajjGroup_code_key" ON "HajjGroup"("code");
CREATE INDEX IF NOT EXISTS "HajjGroup_packageId_idx" ON "HajjGroup"("packageId");
