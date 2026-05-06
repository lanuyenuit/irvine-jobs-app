import requests

GREENHOUSE_COMPANIES = [
    {"name": "Anduril", "company_id": 1, "source_id": 1, "slug": "andurilindustries"},
    {"name": "Viant",   "company_id": 4, "source_id": 4, "slug": "vianttechnology"},
]

def crawl_greenhouse(slug):
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
    res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    print(f"  Status: {res.status_code}")
    data = res.json()
    jobs_raw = data.get("jobs", [])

    jobs = []
    for job in jobs_raw:
        location = job.get("location", {}).get("name", "")
        metadata = job.get("metadata") or []
        employment_type = next(
            (m.get("value") for m in metadata if m.get("name") == "Employment Type"),
            None,
        )
        jobs.append({
            "title": job.get("title"),
            "location": location,
            "job_id": str(job.get("id", "")),
            "job_seq_no": str(job.get("id", "")),
            "url": job.get("absolute_url"),
            "employment_type": employment_type,
        })
    return jobs
