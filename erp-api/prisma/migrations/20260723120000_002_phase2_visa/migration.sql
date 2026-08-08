-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('open', 'in_progress', 'done', 'cancelled');

-- CreateTable
CREATE TABLE "VisaDetail" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "embassy" TEXT,
    "entryType" TEXT,
    "durationDays" INTEGER,
    "applicationNo" TEXT,
    "appointmentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "decisionAt" TIMESTAMP(3),
    "visaNumber" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisaDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "applicationId" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT NOT NULL,
    "priority" "CasePriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisaDetail_applicationId_key" ON "VisaDetail"("applicationId");

-- AddForeignKey
ALTER TABLE "VisaDetail" ADD CONSTRAINT "VisaDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

