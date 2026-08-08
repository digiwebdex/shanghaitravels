-- V6 production hardening: performance indexes on the busiest tables.
-- Postgres does not auto-index foreign keys; these were sequential scans.
-- Additive & idempotent (IF NOT EXISTS); no data change. Tables are small today
-- so plain CREATE INDEX is instant.

-- Application (case spine) — branch-scoped lists, customer joins, status queues, agent/corporate filters
CREATE INDEX IF NOT EXISTS "Application_customerId_idx" ON "Application"("customerId");
CREATE INDEX IF NOT EXISTS "Application_branchId_idx" ON "Application"("branchId");
CREATE INDEX IF NOT EXISTS "Application_status_idx" ON "Application"("status");
CREATE INDEX IF NOT EXISTS "Application_agentId_idx" ON "Application"("agentId");
CREATE INDEX IF NOT EXISTS "Application_corporateClientId_idx" ON "Application"("corporateClientId");
CREATE INDEX IF NOT EXISTS "Application_assignedTo_idx" ON "Application"("assignedTo");
CREATE INDEX IF NOT EXISTS "Application_createdAt_idx" ON "Application"("createdAt");
CREATE INDEX IF NOT EXISTS "Application_deletedAt_idx" ON "Application"("deletedAt");

-- Invoice
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "Invoice_applicationId_idx" ON "Invoice"("applicationId");
CREATE INDEX IF NOT EXISTS "Invoice_branchId_idx" ON "Invoice"("branchId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_dueAt_idx" ON "Invoice"("dueAt");
CREATE INDEX IF NOT EXISTS "Invoice_createdAt_idx" ON "Invoice"("createdAt");
CREATE INDEX IF NOT EXISTS "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");

-- Customer (branchId filtered on nearly every query)
CREATE INDEX IF NOT EXISTS "Customer_branchId_idx" ON "Customer"("branchId");
CREATE INDEX IF NOT EXISTS "Customer_status_idx" ON "Customer"("status");
CREATE INDEX IF NOT EXISTS "Customer_createdAt_idx" ON "Customer"("createdAt");
CREATE INDEX IF NOT EXISTS "Customer_deletedAt_idx" ON "Customer"("deletedAt");

-- Passport (OCR / verify lookups by passport number; expiry reports)
CREATE INDEX IF NOT EXISTS "Passport_customerId_idx" ON "Passport"("customerId");
CREATE INDEX IF NOT EXISTS "Passport_passportNo_idx" ON "Passport"("passportNo");
CREATE INDEX IF NOT EXISTS "Passport_expiryDate_idx" ON "Passport"("expiryDate");

-- AuditLog (append-only, fastest-growing; every audit query full-scanned)
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Notification (retry cron polls status=pending every 15 min)
CREATE INDEX IF NOT EXISTS "Notification_status_idx" ON "Notification"("status");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_relatedType_relatedId_idx" ON "Notification"("relatedType", "relatedId");

-- ApplicationEvent (loaded on every case detail)
CREATE INDEX IF NOT EXISTS "ApplicationEvent_applicationId_idx" ON "ApplicationEvent"("applicationId");

-- Task
CREATE INDEX IF NOT EXISTS "Task_applicationId_idx" ON "Task"("applicationId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_assignedTo_idx" ON "Task"("assignedTo");
CREATE INDEX IF NOT EXISTS "Task_deletedAt_idx" ON "Task"("deletedAt");
