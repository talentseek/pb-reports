-- CreateTable
CREATE TABLE "public"."EnrichmentResult" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "reportId" TEXT,
    "businessType" TEXT,
    "allTypes" JSONB,
    "chainClassification" TEXT,
    "chainName" TEXT,
    "classificationConfidence" TEXT,
    "classificationMethod" TEXT,
    "ownerName" TEXT,
    "ownerRole" TEXT,
    "ownerEmail" TEXT,
    "ownerPhone" TEXT,
    "ownerLinkedIn" TEXT,
    "companiesHouseNumber" TEXT,
    "companyName" TEXT,
    "companyType" TEXT,
    "sicCodes" JSONB,
    "directors" JSONB,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationResult" TEXT,
    "overallConfidence" TEXT,
    "dataSources" JSONB,
    "layerResults" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "lastEnrichedAt" TIMESTAMP(3),
    "websiteMarkdown" TEXT,
    "websitePages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrichmentResult_status_idx" ON "public"."EnrichmentResult"("status");

-- CreateIndex
CREATE INDEX "EnrichmentResult_chainClassification_idx" ON "public"."EnrichmentResult"("chainClassification");

-- CreateIndex
CREATE INDEX "EnrichmentResult_reportId_idx" ON "public"."EnrichmentResult"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentResult_placeId_reportId_key" ON "public"."EnrichmentResult"("placeId", "reportId");

-- AddForeignKey
ALTER TABLE "public"."EnrichmentResult" ADD CONSTRAINT "EnrichmentResult_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EnrichmentResult" ADD CONSTRAINT "EnrichmentResult_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
