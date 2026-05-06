CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,      -- auto-incrementing unique ID for each row
    company VARCHAR(255),       -- e.g. "Blizzard", "Rivian"
    title VARCHAR(255),         -- job title
    location VARCHAR(255),      -- city/state
    job_id VARCHAR(255),        -- the company's own ID for the job
    job_seq_no VARCHAR(255),    -- used to build the apply URL
    url TEXT,                   -- full link to apply
    created_at TIMESTAMP DEFAULT NOW(),  -- when we saved it
    UNIQUE(job_id, company)     -- no duplicate jobs from same company
);