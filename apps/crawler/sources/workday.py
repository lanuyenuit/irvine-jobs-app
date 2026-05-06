import requests

WORKDAY_COMPANIES = [
    {
        "name": "CrowdStrike",
        "company_id": 2,
        "source_id": 2,
        "tenant": "crowdstrike",
        "instance": "wd5",
        "board": "crowdstrikecareers",
    },
    {
        "name": "Alteryx",
        "company_id": 16,
        "source_id": 11,
        "tenant": "alteryx",
        "instance": "wd108",
        "board": "AlteryxCareers",
    },
    {
        "name": "Edwards Lifesciences",
        "company_id": 18,
        "source_id": 12,
        "tenant": "edwards",
        "instance": "wd5",
        "board": "EdwardsCareers",
    },
]

def crawl_workday(tenant, instance, board):
    url = f"https://{tenant}.{instance}.myworkdayjobs.com/wday/cxs/{tenant}/{board}/jobs"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json",
    }
    payload = {"limit": 20, "offset": 0, "searchText": ""}

    res = requests.post(url, headers=headers, json=payload, timeout=30)
    print(f"  Status: {res.status_code}")

    try:
        data = res.json()
    except Exception as e:
        print(f"  JSON error: {e}")
        return []

    jobs_raw = data.get("jobPostings", [])
    print(f"  Raw jobs found: {len(jobs_raw)}")

    jobs = []
    for job in jobs_raw:
        title = job.get("title")
        location = job.get("locationsText", "")
        external_path = job.get("externalPath", "")
        job_url = f"https://{tenant}.{instance}.myworkdayjobs.com/{board}{external_path}"

        jobs.append({
            "title": title,
            "location": location,
            "job_id": external_path,
            "job_seq_no": external_path,
            "url": job_url,
        })

    return jobs


if __name__ == "__main__":
    from db import get_connection, insert_job

    conn = get_connection()

    for company in WORKDAY_COMPANIES:
        print(f"\n--- Crawling {company['name']} (Workday) ---")
        try:
            jobs = crawl_workday(company["tenant"], company["instance"], company["board"])
            for job in jobs:
                insert_job(conn, job, company["company_id"], company["source_id"])
            print(f"Saved {len(jobs)} jobs from {company['name']}")
        except Exception as e:
            print(f"ERROR: {e}")

    conn.close()
    print("\nDone!")
