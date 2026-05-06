-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create sources table (job board platforms)
CREATE TABLE IF NOT EXISTS sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50), -- e.g., 'greenhouse', 'lever', 'workday', 'custom'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    source_id INTEGER REFERENCES sources(id),
    external_job_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    location_text VARCHAR(255),
    job_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, external_job_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_source ON job_postings(source_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON job_postings(location_text);

-- Seed companies data
INSERT INTO companies (id, name, website_url) VALUES
    (1, 'Anduril', 'https://www.anduril.com'),
    (2, 'Viant', 'https://www.viantinc.com'),
    (3, 'Blizzard', 'https://www.blizzard.com'),
    (4, 'Endpoint', 'https://www.endpoint.com'),
    (5, 'Chargezoom', 'https://www.chargezoom.com'),
    (6, 'Rivian', 'https://www.rivian.com'),
    (7, 'CrowdStrike', 'https://www.crowdstrike.com'),
    (8, 'Alteryx', 'https://www.alteryx.com'),
    (9, 'Edwards Lifesciences', 'https://www.edwards.com')
ON CONFLICT (name) DO NOTHING;

-- Seed sources data
INSERT INTO sources (id, name, type) VALUES
    (1, 'Greenhouse - Anduril', 'greenhouse'),
    (2, 'Greenhouse - Viant', 'greenhouse'),
    (3, 'Blizzard API', 'custom'),
    (4, 'Lever - Endpoint', 'lever'),
    (5, 'Lever - Chargezoom', 'lever'),
    (6, 'Rivian API', 'custom'),
    (7, 'Workday - CrowdStrike', 'workday'),
    (8, 'Workday - Alteryx', 'workday'),
    (9, 'Workday - Edwards', 'workday')
ON CONFLICT (name) DO NOTHING;
