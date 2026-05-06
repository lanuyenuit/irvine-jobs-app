-- Add missing columns to job_postings
ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS department VARCHAR(255),
  ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

-- Add missing columns to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS industry VARCHAR(255),
  ADD COLUMN IF NOT EXISTS company_size VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS location_state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS careers_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_target BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON job_postings(employment_type);
