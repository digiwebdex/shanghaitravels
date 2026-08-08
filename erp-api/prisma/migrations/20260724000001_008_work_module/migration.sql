-- AlterEnum
ALTER TYPE "ServiceType" ADD VALUE 'work';

-- CreateTable
CREATE TABLE "WorkDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "employerName" TEXT,
    "jobTitle" TEXT,
    "country" TEXT DEFAULT 'China',
    "workPermitNo" TEXT,
    "visaType" TEXT DEFAULT 'Z',
    "contractMonths" INTEGER,
    "departureDate" TIMESTAMP(3),
    "agencyRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkDetail_applicationId_key" ON "WorkDetail"("applicationId");

-- AddForeignKey
ALTER TABLE "WorkDetail" ADD CONSTRAINT "WorkDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

