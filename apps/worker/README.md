# API

Backend service for exposing companies, jobs, scores, and filters.# Data Model v0.1

## Goal
This schema supports the MVP for the AI-powered Irvine Job Intelligence System.

It is designed to:
- store target companies
- track where jobs are discovered
- store job postings
- store job scoring results
- track crawl/import runs

---

## Main entities

### companies
Stores the master list of companies we want to monitor.

### job_sources
Stores source endpoints or job boards associated with a company.

### crawl_runs
Tracks each ingestion/crawl execution for observability and debugging.

### job_postings
Stores normalized job postings collected from sources.

### job_scores
Stores derived scoring results for each job posting.

### company_tags
Stores optional manual tags used for filtering and enrichment.

---

## Relationships

- One company has many job sources
- One company has many job postings
- One job source has many job postings
- One crawl run can create many job postings
- One job posting can have many score records

---

## Design principles

1. Keep raw data separate from derived scoring
2. Allow multiple sources per company
3. Preserve crawl history for debugging
4. Keep schema simple enough for MVP but extensible later

---

## Future tables (not in v0.1)
- user_preferences
- applications
- recruiter_contacts
- company_enrichment
- skill_taxonomy