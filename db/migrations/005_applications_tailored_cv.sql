ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS tailored_cv JSONB;
