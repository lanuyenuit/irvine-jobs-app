CREATE TABLE IF NOT EXISTS job_applications (
  id             SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  status         VARCHAR(50) NOT NULL DEFAULT 'saved',
  applied_at     TIMESTAMP,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_posting_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
