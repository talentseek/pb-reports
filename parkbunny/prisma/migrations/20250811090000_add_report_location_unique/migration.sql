-- Add composite unique constraint for upsert target
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'reportId_postcode'
  ) THEN
    CREATE UNIQUE INDEX "reportId_postcode" ON "ReportLocation" ("reportId","postcode");
  END IF;
END $$;


