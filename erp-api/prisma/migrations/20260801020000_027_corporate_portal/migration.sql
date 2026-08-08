-- Phase H1 Corporate Portal
ALTER TABLE "CorporateClient" ADD COLUMN IF NOT EXISTS "billingAddress" TEXT;
ALTER TABLE "CorporateClient" ADD COLUMN IF NOT EXISTS "preferredServices" TEXT;
ALTER TABLE "CorporateClient" ADD COLUMN IF NOT EXISTS "billingCustomerId" TEXT;

ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "corporateClientId" TEXT;
CREATE INDEX IF NOT EXISTS "Application_corporateClientId_idx" ON "Application"("corporateClientId");

CREATE TABLE IF NOT EXISTS "CorporateUser" (
    "id" TEXT NOT NULL,
    "corporateClientId" TEXT NOT NULL,
    "employeeId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "status" TEXT NOT NULL DEFAULT 'active',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "CorporateUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CorporateUser_email_key" ON "CorporateUser"("email");
CREATE INDEX IF NOT EXISTS "CorporateUser_corporateClientId_idx" ON "CorporateUser"("corporateClientId");
CREATE INDEX IF NOT EXISTS "CorporateUser_employeeId_idx" ON "CorporateUser"("employeeId");

CREATE TABLE IF NOT EXISTS "CorporateRefreshToken" (
    "id" TEXT NOT NULL,
    "corporateUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CorporateRefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CorporateRefreshToken_tokenHash_key" ON "CorporateRefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "CorporateRefreshToken_corporateUserId_idx" ON "CorporateRefreshToken"("corporateUserId");

CREATE TABLE IF NOT EXISTS "CorporateAuthCode" (
    "id" TEXT NOT NULL,
    "corporateUserId" TEXT,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CorporateAuthCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CorporateAuthCode_email_purpose_idx" ON "CorporateAuthCode"("email", "purpose");
CREATE INDEX IF NOT EXISTS "CorporateAuthCode_corporateUserId_idx" ON "CorporateAuthCode"("corporateUserId");

CREATE TABLE IF NOT EXISTS "CorporateEmployee" (
    "id" TEXT NOT NULL,
    "corporateClientId" TEXT NOT NULL,
    "code" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "managerEmployeeId" TEXT,
    "passportNo" TEXT,
    "nationality" TEXT,
    "dob" TIMESTAMP(3),
    "isFrequentTraveller" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "CorporateEmployee_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CorporateEmployee_corporateClientId_idx" ON "CorporateEmployee"("corporateClientId");
CREATE INDEX IF NOT EXISTS "CorporateEmployee_department_idx" ON "CorporateEmployee"("department");

CREATE TABLE IF NOT EXISTS "CorporateEmployeeEmergency" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "CorporateEmployeeEmergency_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CorporateEmployeeEmergency_employeeId_idx" ON "CorporateEmployeeEmergency"("employeeId");

CREATE TABLE IF NOT EXISTS "CorporateApprovalChain" (
    "id" TEXT NOT NULL,
    "corporateClientId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CorporateApprovalChain_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CorporateApprovalChain_corporateClientId_idx" ON "CorporateApprovalChain"("corporateClientId");

CREATE TABLE IF NOT EXISTS "CorporateApprovalStep" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "levelNo" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CorporateApprovalStep_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CorporateApprovalStep_chainId_levelNo_key" ON "CorporateApprovalStep"("chainId", "levelNo");
CREATE INDEX IF NOT EXISTS "CorporateApprovalStep_chainId_idx" ON "CorporateApprovalStep"("chainId");

CREATE TABLE IF NOT EXISTS "CorporateTravelRequest" (
    "id" TEXT NOT NULL,
    "corporateClientId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "destination" TEXT,
    "departAt" TIMESTAMP(3),
    "returnAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "chainId" TEXT,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "CorporateTravelRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CorporateTravelRequest_corporateClientId_idx" ON "CorporateTravelRequest"("corporateClientId");
CREATE INDEX IF NOT EXISTS "CorporateTravelRequest_employeeId_idx" ON "CorporateTravelRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "CorporateTravelRequest_status_idx" ON "CorporateTravelRequest"("status");
CREATE INDEX IF NOT EXISTS "CorporateTravelRequest_applicationId_idx" ON "CorporateTravelRequest"("applicationId");

CREATE TABLE IF NOT EXISTS "CorporateTravelApproval" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "levelNo" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "decidedByUserId" TEXT,
    "note" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CorporateTravelApproval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CorporateTravelApproval_requestId_levelNo_key" ON "CorporateTravelApproval"("requestId", "levelNo");
CREATE INDEX IF NOT EXISTS "CorporateTravelApproval_requestId_idx" ON "CorporateTravelApproval"("requestId");

CREATE TABLE IF NOT EXISTS "CorporateSupportRequest" (
    "id" TEXT NOT NULL,
    "corporateClientId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "CorporateSupportRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CorporateSupportRequest_corporateClientId_idx" ON "CorporateSupportRequest"("corporateClientId");
CREATE INDEX IF NOT EXISTS "CorporateSupportRequest_status_idx" ON "CorporateSupportRequest"("status");

CREATE TABLE IF NOT EXISTS "CorporateAnnouncement" (
    "id" TEXT NOT NULL,
    "corporateClientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "CorporateAnnouncement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CorporateAnnouncement_corporateClientId_idx" ON "CorporateAnnouncement"("corporateClientId");

-- FKs (ignore if already present)
DO $$ BEGIN
  ALTER TABLE "CorporateUser" ADD CONSTRAINT "CorporateUser_corporateClientId_fkey" FOREIGN KEY ("corporateClientId") REFERENCES "CorporateClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateUser" ADD CONSTRAINT "CorporateUser_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "CorporateEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateRefreshToken" ADD CONSTRAINT "CorporateRefreshToken_corporateUserId_fkey" FOREIGN KEY ("corporateUserId") REFERENCES "CorporateUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateAuthCode" ADD CONSTRAINT "CorporateAuthCode_corporateUserId_fkey" FOREIGN KEY ("corporateUserId") REFERENCES "CorporateUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateEmployee" ADD CONSTRAINT "CorporateEmployee_corporateClientId_fkey" FOREIGN KEY ("corporateClientId") REFERENCES "CorporateClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateEmployeeEmergency" ADD CONSTRAINT "CorporateEmployeeEmergency_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "CorporateEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateApprovalChain" ADD CONSTRAINT "CorporateApprovalChain_corporateClientId_fkey" FOREIGN KEY ("corporateClientId") REFERENCES "CorporateClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateApprovalStep" ADD CONSTRAINT "CorporateApprovalStep_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "CorporateApprovalChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateTravelRequest" ADD CONSTRAINT "CorporateTravelRequest_corporateClientId_fkey" FOREIGN KEY ("corporateClientId") REFERENCES "CorporateClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateTravelRequest" ADD CONSTRAINT "CorporateTravelRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "CorporateEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateTravelApproval" ADD CONSTRAINT "CorporateTravelApproval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CorporateTravelRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateSupportRequest" ADD CONSTRAINT "CorporateSupportRequest_corporateClientId_fkey" FOREIGN KEY ("corporateClientId") REFERENCES "CorporateClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporateAnnouncement" ADD CONSTRAINT "CorporateAnnouncement_corporateClientId_fkey" FOREIGN KEY ("corporateClientId") REFERENCES "CorporateClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
