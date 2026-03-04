-- CreateTable
CREATE TABLE "public"."AppDemo" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "operatorName" TEXT NOT NULL,
    "operatorTagline" TEXT NOT NULL,
    "operatorLogo" TEXT NOT NULL,
    "operatorLogoAlt" TEXT,
    "operatorFont" TEXT NOT NULL DEFAULT 'Arial, sans-serif',
    "brandStripLogo" TEXT,
    "brandStripAlt" TEXT,
    "brandStripBackground" TEXT,
    "colorPrimary" TEXT NOT NULL,
    "colorSecondary" TEXT NOT NULL,
    "colorAccent" TEXT NOT NULL,
    "colorBackground" TEXT NOT NULL DEFAULT '#f0f4ff',
    "colorText" TEXT NOT NULL DEFAULT '#0f172a',
    "colorCardBg" TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.92)',
    "colorCta" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "locationAddress" TEXT NOT NULL,
    "locationPostcode" TEXT NOT NULL,
    "locationPhone" TEXT NOT NULL DEFAULT '',
    "locationCode" TEXT NOT NULL DEFAULT '',
    "locationCity" TEXT NOT NULL,
    "totalSpaces" INTEGER NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "deals" JSONB NOT NULL DEFAULT '[]',
    "partnerView" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AppDemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppDemo_slug_key" ON "public"."AppDemo"("slug");
