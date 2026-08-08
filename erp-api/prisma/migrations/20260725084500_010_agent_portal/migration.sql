-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "agentId" TEXT;

-- CreateTable
CREATE TABLE "AgentUser" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AgentUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRefreshToken" (
    "id" TEXT NOT NULL,
    "agentUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentUser_email_key" ON "AgentUser"("email");

-- CreateIndex
CREATE INDEX "AgentUser_agentId_idx" ON "AgentUser"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentRefreshToken_tokenHash_key" ON "AgentRefreshToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "AgentUser" ADD CONSTRAINT "AgentUser_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRefreshToken" ADD CONSTRAINT "AgentRefreshToken_agentUserId_fkey" FOREIGN KEY ("agentUserId") REFERENCES "AgentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

