import requests

def crawl_rivian_jobs():
    base_url = "https://careers.rivian.com/api/jobs"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    all_jobs = []
    page = 1
    
    # Paginate through all results
    while True:
        params = {"location": "Irvine", "page": page}
        res = requests.get(base_url, headers=headers, params=params, timeout=30)
        print(f"  Page {page} Status:", res.status_code)
        
        if res.status_code != 200:
            break
        
        try:
            data = res.json()
        except Exception as e:
            print("JSON parse error:", e)
            break
        
        jobs_raw = data.get("jobs", [])
        if not jobs_raw:
            break
        
        # Filter for Irvine location
        page_jobs = []
        for job_wrapper in jobs_raw:
            job = job_wrapper.get("data", {})
            
            # Check if job is in Irvine
            city = job.get("city", "")
            if city.lower() != "irvine":
                continue
            
            title = job.get("title", "")
            state = job.get("state", "")
            location = f"{city}, {state}" if city and state else city or state
            job_id = str(job.get("req_id", "") or job.get("slug", ""))
            job_url = f"https://careers.rivian.com/jobs/{job_id}" if job_id else None

            page_jobs.append({
                "title": title,
                "location": location,
                "job_id": job_id,
                "job_seq_no": job_id,
                "url": job_url,
                "employment_type": job.get("employment_type"),
            })
        
        print(f"    Found {len(page_jobs)} Irvine jobs on this page")
        all_jobs.extend(page_jobs)
        page += 1
        
        # Safety limit to avoid infinite loop
        if page > 100:
            print("  Reached safety limit of 100 pages")
            break
    
    print(f"  Total Irvine jobs found: {len(all_jobs)}")
    return all_jobs


if __name__ == "__main__":
    from db import get_connection, insert_job

    conn = get_connection()
    jobs = crawl_rivian_jobs()

    for job in jobs:
        insert_job(conn, job, company_id=6, source_id=6)

    conn.close()
    print(f"Saved {len(jobs)} jobs to database.")
