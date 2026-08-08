-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "OcrDocType" AS ENUM ('passport', 'national_id', 'visa', 'air_ticket', 'photo', 'other');

-- CreateEnum
CREATE TYPE "OcrSource" AS ENUM ('staff', 'agent', 'customer', 'public');

-- CreateTable
CREATE TABLE "OcrScan" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "source" "OcrSource" NOT NULL,
    "docType" "OcrDocType" NOT NULL DEFAULT 'passport',
    "status" "OcrStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "applicationId" TEXT,
    "customerId" TEXT,
    "documentId" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "rawText" TEXT,
    "fields" JSONB,
    "confidence" DOUBLE PRECISION,
    "error" TEXT,
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OcrScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OcrScan_status_idx" ON "OcrScan"("status");

-- CreateIndex
CREATE INDEX "OcrScan_applicationId_idx" ON "OcrScan"("applicationId");

-- CreateIndex
CREATE INDEX "OcrScan_customerId_idx" ON "OcrScan"("customerId");

