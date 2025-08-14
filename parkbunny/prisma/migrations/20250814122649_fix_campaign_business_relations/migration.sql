/*
  Warnings:

  - You are about to drop the column `placeId` on the `CampaignBusiness` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campaignId,reportLocationPlaceId]` on the table `CampaignBusiness` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reportLocationPlaceId` to the `CampaignBusiness` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CampaignBusiness" DROP CONSTRAINT "CampaignBusiness_placeId_fkey";

-- DropIndex
DROP INDEX "public"."CampaignBusiness_campaignId_placeId_key";

-- AlterTable
ALTER TABLE "public"."CampaignBusiness" DROP COLUMN "placeId",
ADD COLUMN     "reportLocationPlaceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBusiness_campaignId_reportLocationPlaceId_key" ON "public"."CampaignBusiness"("campaignId", "reportLocationPlaceId");

-- AddForeignKey
ALTER TABLE "public"."CampaignBusiness" ADD CONSTRAINT "CampaignBusiness_reportLocationPlaceId_fkey" FOREIGN KEY ("reportLocationPlaceId") REFERENCES "public"."ReportLocationPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
