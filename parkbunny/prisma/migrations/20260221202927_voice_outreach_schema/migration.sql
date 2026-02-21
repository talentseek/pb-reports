/*
  Warnings:

  - A unique constraint covering the columns `[vapiCallId]` on the table `CampaignBusiness` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `CampaignBusiness` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CallStatus" AS ENUM ('PENDING', 'QUEUED', 'IN_PROGRESS', 'LEAD_CAPTURED', 'CALLBACK_BOOKED', 'NOT_INTERESTED', 'VOICEMAIL', 'GATEKEEPER_BLOCKED', 'NO_ANSWER', 'INVALID_NUMBER', 'FAILED', 'CTPS_BLOCKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."CampaignStatus" ADD VALUE 'CALLING';
ALTER TYPE "public"."CampaignStatus" ADD VALUE 'PAUSED';
ALTER TYPE "public"."CampaignStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "carparkName" TEXT NOT NULL DEFAULT 'the car park',
ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "public"."CampaignBusiness" ADD COLUMN     "callAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "callDuration" INTEGER,
ADD COLUMN     "callStatus" "public"."CallStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "callSummary" TEXT,
ADD COLUMN     "callbackTime" TEXT,
ADD COLUMN     "extractedEmail" TEXT,
ADD COLUMN     "extractedName" TEXT,
ADD COLUMN     "extractedPhone" TEXT,
ADD COLUMN     "lastCallAt" TIMESTAMP(3),
ADD COLUMN     "nextCallAt" TIMESTAMP(3),
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "transcript" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vapiCallId" TEXT;

-- CreateTable
CREATE TABLE "public"."VoiceConfig" (
    "id" TEXT NOT NULL,
    "twilioSid" TEXT NOT NULL,
    "twilioAuthToken" TEXT NOT NULL,
    "vapiApiKey" TEXT NOT NULL,
    "vapiAssistantId" TEXT NOT NULL,
    "vapiPhoneNumId" TEXT NOT NULL,
    "callingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxConcurrent" INTEGER NOT NULL DEFAULT 1,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBusiness_vapiCallId_key" ON "public"."CampaignBusiness"("vapiCallId");

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."ReportLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
