-- CreateEnum
CREATE TYPE "Category" AS ENUM ('DEVELOPMENT', 'SECURITY', 'DATA_ANALYTICS', 'AI_ML', 'TESTING', 'INTEGRATION');

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'DEVELOPMENT',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE INDEX "skills_visibility_category_idx" ON "skills"("visibility", "category");
