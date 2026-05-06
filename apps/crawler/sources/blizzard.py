import requests
import json

def crawl_blizzard_jobs():
    url = "https://careers.blizzard.com/global/en/search-results"

    res = requests.get(
        url,
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=30
    )

    html = res.text

    # Save raw HTML for debugging
    with open("blizzard_response.html", "w", encoding="utf-8") as f:
        f.write(html)

    print("Status:", res.status_code)

    # Try to find the script block containing eagerLoadRefineSearch
    marker = "eagerLoadRefineSearch"
    start_idx = html.find(marker)

    if start_idx == -1:
        print("Could not find eagerLoadRefineSearch")
        return []

    # Find the first { after the marker
    brace_start = html.find("{", start_idx)
    if brace_start == -1:
        print("Could not find opening brace")
        return []

    # Walk through text and find the matching closing brace
    brace_count = 0
    brace_end = -1

    for i in range(brace_start, len(html)):
        char = html[i]

        if char == "{":
            brace_count += 1
        elif char == "}":
            brace_count -= 1
            if brace_count == 0:
                brace_end = i
                break

    if brace_end == -1:
        print("Could not find closing brace")
        return []

    json_text = html[brace_start:brace_end + 1]

    # Optional: save extracted JSON text
    with open("blizzard_extracted.json", "w", encoding="utf-8") as f:
        f.write(json_text)

    try:
        data = json.loads(json_text)
    except Exception as e:
        print("JSON parse error:", e)
        print(json_text[:1000])
        return []

    # Try a few possible paths
    jobs_raw = []

    if "data" in data and "jobs" in data["data"]:
        jobs_raw = data["data"]["jobs"]
    elif "jobs" in data:
        jobs_raw = data["jobs"]
    elif "eagerLoadRefineSearch" in data:
        inner = data["eagerLoadRefineSearch"]
        if isinstance(inner, dict):
            jobs_raw = inner.get("data", {}).get("jobs", [])

    print("Raw jobs found:", len(jobs_raw))

    jobs = []

    for job in jobs_raw:
        title = job.get("title")
        location = (
            job.get("cityState")
            or job.get("location")
            or job.get("cityStateCountry")
        )
        job_id = job.get("jobId")
        job_seq_no = job.get("jobSeqNo")

        job_url = None
        if job_seq_no:
            job_url = f"https://careers.blizzard.com/global/en/job/{job_seq_no}"
        elif job_id:
            job_url = f"https://careers.blizzard.com/global/en/search-results?keywords={job_id}"

        jobs.append({
            "title": title,
            "location": location,
            "job_id": job_id,
            "job_seq_no": job_seq_no,
            "url": job_url,
            "employment_type": job.get("type"),
        })

    return jobs


if __name__ == "__main__":
    from db import get_connection, insert_job

    conn = get_connection()
    jobs = crawl_blizzard_jobs()

    for job in jobs:
        insert_job(conn, job, company_id=3, source_id=3)

    conn.close()
    print(f"Saved {len(jobs)} jobs to database.")