-- AlterTable
ALTER TABLE "security_scans" ADD COLUMN "riskLevel" TEXT;
ALTER TABLE "security_scans" ADD COLUMN "blockExecution" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "security_scans_riskLevel_idx" ON "security_scans"("riskLevel");

-- CreateTable
CREATE TABLE "security_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "systemPrompt" TEXT NOT NULL,
    "rulesJson" JSONB NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "additionalSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "security_configs_name_key" ON "security_configs"("name");
