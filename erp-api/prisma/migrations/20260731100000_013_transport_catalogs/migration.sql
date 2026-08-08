-- Phase B3: transport booking fields + supplier catalogs (non-breaking / additive).
ALTER TABLE "TransportDetail" ADD COLUMN IF NOT EXISTS "serviceKind" TEXT;
ALTER TABLE "TransportDetail" ADD COLUMN IF NOT EXISTS "routeName" TEXT;
ALTER TABLE "TransportDetail" ADD COLUMN IF NOT EXISTS "confirmationNo" TEXT;

CREATE TABLE IF NOT EXISTS "TransportVehicleType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "capacity" INTEGER,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TransportVehicleType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransportRoute" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);
