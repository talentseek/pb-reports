-- CreateTable
CREATE TABLE "public"."ReportLocation" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "radiusMeters" INTEGER,
    "params" JSONB,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Place" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "types" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "priceLevel" INTEGER,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "address" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportLocationPlace" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "groupedCategory" TEXT,
    "matchedKeyword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportLocationPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Place_placeId_key" ON "public"."Place"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportLocationPlace_locationId_placeId_key" ON "public"."ReportLocationPlace"("locationId", "placeId");

-- AddForeignKey
ALTER TABLE "public"."ReportLocation" ADD CONSTRAINT "ReportLocation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportLocationPlace" ADD CONSTRAINT "ReportLocationPlace_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."ReportLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportLocationPlace" ADD CONSTRAINT "ReportLocationPlace_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
