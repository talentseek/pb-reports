/*
  Warnings:

  - A unique constraint covering the columns `[shareCode]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Report" ADD COLUMN     "shareCode" TEXT,
ADD COLUMN     "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareExpiresAt" TIMESTAMP(3),
ADD COLUMN     "shareLastViewedAt" TIMESTAMP(3),
ADD COLUMN     "sharePasswordHash" TEXT,
ADD COLUMN     "shareViewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Report_shareCode_key" ON "public"."Report"("shareCode");
