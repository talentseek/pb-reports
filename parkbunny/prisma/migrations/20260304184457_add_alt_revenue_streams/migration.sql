-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."StreamType" ADD VALUE 'TESLA_DEMO';
ALTER TYPE "public"."StreamType" ADD VALUE 'WE_BUY_ANY_CAR';
ALTER TYPE "public"."StreamType" ADD VALUE 'GIANT_WASHING_MACHINE';
ALTER TYPE "public"."StreamType" ADD VALUE 'DOG_GROOMING';
ALTER TYPE "public"."StreamType" ADD VALUE 'NHS_MRI_SCANNER';
ALTER TYPE "public"."StreamType" ADD VALUE 'FILM_CREW_HOSTING';
ALTER TYPE "public"."StreamType" ADD VALUE 'ELECTRIC_BIKE_BAY';
ALTER TYPE "public"."StreamType" ADD VALUE 'WATERLESS_CAR_WASH';
ALTER TYPE "public"."StreamType" ADD VALUE 'DIGITAL_SIGNAGE';
