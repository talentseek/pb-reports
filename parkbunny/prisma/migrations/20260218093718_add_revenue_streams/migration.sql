-- CreateEnum
CREATE TYPE "public"."StreamType" AS ENUM ('LOCKER', 'CAR_WASH', 'EV_CHARGING', 'FARMERS_MARKET');

-- CreateTable
CREATE TABLE "public"."RevenueStream" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "streamType" "public"."StreamType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ratePerSite" INTEGER,
    "rateMin" INTEGER,
    "rateMax" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RevenueStreamExclusion" (
    "id" TEXT NOT NULL,
    "revenueStreamId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueStreamExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevenueStream_reportId_streamType_key" ON "public"."RevenueStream"("reportId", "streamType");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueStreamExclusion_revenueStreamId_locationId_key" ON "public"."RevenueStreamExclusion"("revenueStreamId", "locationId");

-- AddForeignKey
ALTER TABLE "public"."RevenueStream" ADD CONSTRAINT "RevenueStream_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RevenueStreamExclusion" ADD CONSTRAINT "RevenueStreamExclusion_revenueStreamId_fkey" FOREIGN KEY ("revenueStreamId") REFERENCES "public"."RevenueStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RevenueStreamExclusion" ADD CONSTRAINT "RevenueStreamExclusion_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."ReportLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
