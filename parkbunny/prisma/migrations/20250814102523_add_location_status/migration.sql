-- CreateEnum
CREATE TYPE "public"."LocationStatus" AS ENUM ('PENDING', 'LIVE');

-- AlterTable
ALTER TABLE "public"."ReportLocation" ADD COLUMN     "status" "public"."LocationStatus" NOT NULL DEFAULT 'PENDING';
