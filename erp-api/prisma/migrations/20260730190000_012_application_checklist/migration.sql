-- Per-case checklist items with audit attribution (Phase A stabilization)
CREATE TABLE "ApplicationChecklistItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3),
    "checkedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicationChecklistItem_applicationId_itemKey_key" ON "ApplicationChecklistItem"("applicationId", "itemKey");
CREATE INDEX "ApplicationChecklistItem_applicationId_idx" ON "ApplicationChecklistItem"("applicationId");

ALTER TABLE "ApplicationChecklistItem" ADD CONSTRAINT "ApplicationChecklistItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
