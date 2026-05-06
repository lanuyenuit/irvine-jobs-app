import requests

LEVER_COMPANIES = [
    {"name": "Endpoint",   "company_id": 10, "source_id": 7, "slug": "endpointclinical"},
    {"name": "Chargezoom", "company_id": 12, "source_id": 8, "slug": "chargezoom"},
]

def crawl_lever(slug):
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    print(f"  Status: {res.status_code}")
    jobs_raw = res.json()

    jobs = []
    for job in jobs_raw:
        categories = job.get("categories") or {}
        location = categories.get("location", "")
        employment_type = categories.get("commitment")
        jobs.append({
            "title": job.get("text"),
            "location": location,
            "job_id": job.get("id"),
            "job_seq_no": job.get("id"),
            "url": job.get("hostedUrl"),
            "employment_type": employment_type,
        })
    return jobs
