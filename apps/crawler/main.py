from db import get_connection, insert_job
from sources.blizzard import crawl_blizzard_jobs
from sources.rivian import crawl_rivian_jobs
from sources.greenhouse import crawl_greenhouse, GREENHOUSE_COMPANIES
from sources.lever import crawl_lever, LEVER_COMPANIES
from sources.workday import crawl_workday, WORKDAY_COMPANIES

def run_all():
    conn = get_connection()

    # Blizzard
    print("\n--- Crawling Blizzard ---")
    for job in crawl_blizzard_jobs():
        insert_job(conn, job, company_id=3, source_id=3)

    # Rivian
    print("\n--- Crawling Rivian ---")
    for job in crawl_rivian_jobs():
        insert_job(conn, job, company_id=6, source_id=6)

    # All Greenhouse companies
    for company in GREENHOUSE_COMPANIES:
        print(f"\n--- Crawling {company['name']} (Greenhouse) ---")
        try:
            jobs = crawl_greenhouse(company["slug"])
            for job in jobs:
                insert_job(conn, job, company["company_id"], company["source_id"])
            print(f"Saved {len(jobs)} jobs")
        except Exception as e:
            print(f"ERROR: {e}")

    # All Lever companies
    for company in LEVER_COMPANIES:
        print(f"\n--- Crawling {company['name']} (Lever) ---")
        try:
            jobs = crawl_lever(company["slug"])
            for job in jobs:
                insert_job(conn, job, company["company_id"], company["source_id"])
            print(f"Saved {len(jobs)} jobs")
        except Exception as e:
            print(f"ERROR: {e}")

    # All Workday companies
    for company in WORKDAY_COMPANIES:
        print(f"\n--- Crawling {company['name']} (Workday) ---")
        try:
            jobs = crawl_workday(company["tenant"], company["instance"], company["board"])
            for job in jobs:
                insert_job(conn, job, company["company_id"], company["source_id"])
            print(f"Saved {len(jobs)} jobs")
        except Exception as e:
            print(f"ERROR: {e}")

    conn.close()
    print("\nAll done!")

if __name__ == "__main__":
    run_all()
