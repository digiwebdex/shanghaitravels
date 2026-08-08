-- V8 Visa: additive passport collection/delivery timestamps
ALTER TABLE "VisaDetail" ADD COLUMN IF NOT EXISTS "collectedAt" TIMESTAMP(3);
ALTER TABLE "VisaDetail" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
