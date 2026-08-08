-- V6.x: agent soft-delete actor (additive, nullable)
ALTER TABLE "Agent" ADD COLUMN "deletedBy" TEXT;
