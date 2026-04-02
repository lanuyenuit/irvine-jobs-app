# Architecture

## Overview

The system collects company and job data from Irvine-related sources, normalizes the data, scores each opportunity, and exposes it through an API and dashboard.

## High-Level Flow

1. Seed companies are collected manually
2. Worker jobs fetch company websites and job postings
3. Parsed data is normalized into a common schema
4. Scoring logic ranks jobs and companies
5. API serves the normalized and scored data
6. Web app displays prioritized opportunities

## Components

### 1. Web App
- shows prioritized jobs and companies
- supports filtering by role, location, tech stack, and score

### 2. API
- returns companies, jobs, sources, and scores
- supports filtering and sorting

### 3. Worker
- collects and parses data
- updates database
- computes scores

### 4. Database
Stores:
- companies
- job postings
- company-source links
- crawl history
- scoring results

## Initial Scoring Strategy

Use a rule-based scoring system:
- location match
- title match
- stack match
- role seniority match
- freshness of posting
- career page availability

## Future Extensions

- LLM-based job summarization
- semantic matching between resume and job description
- company hiring trend detection
- alerts for new openings