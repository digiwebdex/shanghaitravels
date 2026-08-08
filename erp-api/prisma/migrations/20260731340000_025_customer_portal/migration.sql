-- Phase F1 — Customer Portal

CREATE TABLE IF NOT EXISTS "CustomerUser" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "emailVerifiedAt" TIMESTAMP(3),
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerUser_email_key" ON "CustomerUser"("email");
CREATE INDEX IF NOT EXISTS "CustomerUser_customerId_idx" ON "CustomerUser"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerUser_phone_idx" ON "CustomerUser"("phone");

CREATE TABLE IF NOT EXISTS "CustomerRefreshToken" (
  "id" TEXT PRIMARY KEY,
  "customerUserId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "userAgent" TEXT,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerRefreshToken_tokenHash_key" ON "CustomerRefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "CustomerRefreshToken_customerUserId_idx" ON "CustomerRefreshToken"("customerUserId");

CREATE TABLE IF NOT EXISTS "CustomerAuthCode" (
  "id" TEXT PRIMARY KEY,
  "customerUserId" TEXT,
  "email" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CustomerAuthCode_email_purpose_idx" ON "CustomerAuthCode"("email", "purpose");
CREATE INDEX IF NOT EXISTS "CustomerAuthCode_customerUserId_idx" ON "CustomerAuthCode"("customerUserId");

CREATE TABLE IF NOT EXISTS "CustomerFamilyMember" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "relationship" TEXT,
  "dob" TIMESTAMP(3),
  "passportNo" TEXT,
  "nationality" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CustomerFamilyMember_customerId_idx" ON "CustomerFamilyMember"("customerId");

CREATE TABLE IF NOT EXISTS "CustomerSavedTraveller" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "passportNo" TEXT,
  "nationality" TEXT,
  "dob" TIMESTAMP(3),
  "phone" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CustomerSavedTraveller_customerId_idx" ON "CustomerSavedTraveller"("customerId");

CREATE TABLE IF NOT EXISTS "CustomerEmergencyContact" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "relationship" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CustomerEmergencyContact_customerId_idx" ON "CustomerEmergencyContact"("customerId");

CREATE TABLE IF NOT EXISTS "CustomerSupportRequest" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "applicationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "CustomerSupportRequest_customerId_idx" ON "CustomerSupportRequest"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerSupportRequest_status_idx" ON "CustomerSupportRequest"("status");

CREATE TABLE IF NOT EXISTS "DocumentVersion" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "fileName" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");
CREATE INDEX IF NOT EXISTS "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

DO $$ BEGIN
  ALTER TABLE "CustomerUser" ADD CONSTRAINT "CustomerUser_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerRefreshToken" ADD CONSTRAINT "CustomerRefreshToken_customerUserId_fkey"
    FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerAuthCode" ADD CONSTRAINT "CustomerAuthCode_customerUserId_fkey"
    FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerFamilyMember" ADD CONSTRAINT "CustomerFamilyMember_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerSavedTraveller" ADD CONSTRAINT "CustomerSavedTraveller_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerEmergencyContact" ADD CONSTRAINT "CustomerEmergencyContact_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerSupportRequest" ADD CONSTRAINT "CustomerSupportRequest_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
