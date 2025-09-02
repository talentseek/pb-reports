-- AlterTable
ALTER TABLE "public"."Place" ADD COLUMN     "allEmails" JSONB,
ADD COLUMN     "allPhones" JSONB,
ADD COLUMN     "businessDetails" JSONB,
ADD COLUMN     "contactPeople" JSONB,
ADD COLUMN     "siteData" JSONB;
