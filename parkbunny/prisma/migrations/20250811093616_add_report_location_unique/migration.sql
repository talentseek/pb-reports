/*
  Warnings:

  - A unique constraint covering the columns `[reportId,postcode]` on the table `ReportLocation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReportLocation_reportId_postcode_key" ON "public"."ReportLocation"("reportId", "postcode");
