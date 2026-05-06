# Irvine Job Intelligence

An AI-powered system for discovering, tracking, and prioritizing job opportunities in Irvine for a frontend/fullstack developer profile.

## Problem

Job searching is noisy and fragmented. Relevant opportunities are spread across company career pages, job boards, and local business directories. Many promising Irvine-based companies are easy to miss.

## Goal

Build a system that:
- collects job and company data from Irvine-related sources
- identifies companies relevant to my skill set
- scores opportunities based on fit, location, tech stack, and hiring signals
- helps prioritize where to apply first

## Target User

The initial user is myself: a frontend/fullstack developer targeting jobs in Irvine and nearby areas.

## MVP

The MVP focuses on:
1. collecting data from a small set of sources
2. storing companies and job postings
3. tagging jobs by role, stack, and location
4. scoring each opportunity for relevance
5. showing a simple dashboard for prioritization
6. As a job seeker targeting Irvine,
I want to see which companies and job postings best match my profile,
so that I can decide where to apply first.
7. - curated Irvine company database
- career page/job source tracking
- basic job ingestion
- fit scoring
- dashboard with ranked opportunities
8. A user opens the dashboard, filters by "Frontend / Fullstack", sees top Irvine companies and open roles, and gets a prioritized shortlist for application.

## Non-Goals (for MVP)

- automatic job application submission
- full browser automation across many websites
- advanced multi-agent architecture
- resume generation automation
- outreach automation

## Repo Structure

```txt
apps/
  web/       frontend dashboard
  api/       backend API
  worker/    crawlers, ingestion, scoring jobs

packages/
  shared/    shared types and utilities
  scoring/   scoring logic

docs/
  architecture.md
  sources.md
  scope.md
  roadmap.md

data/
  seed/
  sample/# job-intelligence
