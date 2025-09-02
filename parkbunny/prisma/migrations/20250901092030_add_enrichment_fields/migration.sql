-- CreateEnum
CREATE TYPE "public"."EnrichmentStatus" AS ENUM ('NOT_ENRICHED', 'ENRICHING', 'ENRICHED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('CREATED', 'ENRICHING', 'ENRICHED', 'READY_TO_LAUNCH', 'LAUNCHED');

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "status" "public"."CampaignStatus" NOT NULL DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "public"."Place" ADD COLUMN     "email" TEXT,
ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "enrichmentStatus" "public"."EnrichmentStatus" NOT NULL DEFAULT 'NOT_ENRICHED',
ADD COLUMN     "socialLinks" JSONB;
