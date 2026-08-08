-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new_lead', 'contacted', 'qualified', 'converted', 'lost');

-- CreateTable
CREATE TABLE "HajjUmrahDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "packageType" TEXT,
    "year" TEXT,
    "pilgrimName" TEXT,
    "passportNo" TEXT,
    "mahramName" TEXT,
    "packageName" TEXT,
    "departureDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "hotelMakkah" TEXT,
    "hotelMadinah" TEXT,
    "roomType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HajjUmrahDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "institution" TEXT,
    "country" TEXT,
    "courseName" TEXT,
    "degreeLevel" TEXT,
    "intakeTerm" TEXT,
    "applicationRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "hospital" TEXT,
    "country" TEXT,
    "treatment" TEXT,
    "patientName" TEXT,
    "appointmentDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImmigrationDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "country" TEXT,
    "visaCategory" TEXT,
    "applicationRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImmigrationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "policyType" TEXT,
    "provider" TEXT,
    "policyNo" TEXT,
    "coverageNote" TEXT,
    "insuredName" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "joinDate" TIMESTAMP(3),
    "salary" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPayment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "accountId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" TEXT,
    "serviceInterest" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new_lead',
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "relatedType" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "summary" TEXT NOT NULL,
    "byUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "HajjUmrahDetail_applicationId_key" ON "HajjUmrahDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentDetail_applicationId_key" ON "StudentDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalDetail_applicationId_key" ON "MedicalDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ImmigrationDetail_applicationId_key" ON "ImmigrationDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceDetail_applicationId_key" ON "InsuranceDetail"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- AddForeignKey
ALTER TABLE "HajjUmrahDetail" ADD CONSTRAINT "HajjUmrahDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDetail" ADD CONSTRAINT "StudentDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalDetail" ADD CONSTRAINT "MedicalDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImmigrationDetail" ADD CONSTRAINT "ImmigrationDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceDetail" ADD CONSTRAINT "InsuranceDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

