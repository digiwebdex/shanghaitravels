-- V5 Phase 2 — invoice lifecycle. ADDITIVE ONLY (no data change, no drops/renames).
-- New InvoiceStatus states + optional lifecycle timestamps on Invoice.

ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'generated';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'viewed';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'overdue';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'refunded';

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "approvedAt"  TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "approvedBy"  TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sentAt"      TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "viewedAt"    TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT;
