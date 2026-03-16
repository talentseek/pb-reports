-- CreateTable
CREATE TABLE "public"."OutreachCampaign" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "instantlyCampaignId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "discountLevel" TEXT,
    "leadsTotal" INTEGER NOT NULL DEFAULT 0,
    "leadsApproved" INTEGER NOT NULL DEFAULT 0,
    "leadsSkipped" INTEGER NOT NULL DEFAULT 0,
    "leadsInReview" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutreachLead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "enrichmentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "businessName" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'auto_approved',
    "instantlyLeadId" TEXT,
    "sentAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachCampaign_instantlyCampaignId_key" ON "public"."OutreachCampaign"("instantlyCampaignId");

-- CreateIndex
CREATE INDEX "OutreachCampaign_status_idx" ON "public"."OutreachCampaign"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachCampaign_reportId_sector_key" ON "public"."OutreachCampaign"("reportId", "sector");

-- CreateIndex
CREATE INDEX "OutreachLead_campaignId_idx" ON "public"."OutreachLead"("campaignId");

-- CreateIndex
CREATE INDEX "OutreachLead_reviewStatus_idx" ON "public"."OutreachLead"("reviewStatus");

-- AddForeignKey
ALTER TABLE "public"."OutreachCampaign" ADD CONSTRAINT "OutreachCampaign_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutreachLead" ADD CONSTRAINT "OutreachLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."OutreachCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutreachLead" ADD CONSTRAINT "OutreachLead_enrichmentId_fkey" FOREIGN KEY ("enrichmentId") REFERENCES "public"."EnrichmentResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
