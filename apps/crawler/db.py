import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_CONFIG

def get_connection():
    return psycopg2.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        dbname=DB_CONFIG["dbname"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        cursor_factory=RealDictCursor
    )

def normalize_employment_type(raw):
    if not raw:
        return None
    s = raw.strip().lower()
    if "full" in s or s == "regular":
        return "Full-time"
    if "part" in s:
        return "Part-time"
    if "contract" in s or "contractor" in s:
        return "Contract"
    if "temp" in s:
        return "Contract"
    if "intern" in s:
        return "Internship"
    return raw.strip().title()

def insert_job(conn, job, company_id, source_id):
    cur = conn.cursor()
    employment_type = normalize_employment_type(job.get("employment_type"))

    # Backfill employment_type on existing rows for this job
    if employment_type:
        cur.execute(
            """UPDATE job_postings
               SET employment_type = %s, updated_at = NOW()
               WHERE company_id = %s AND external_job_id = %s
                 AND employment_type IS NULL""",
            (employment_type, company_id, job["job_id"]),
        )

    cur.execute(
        """INSERT INTO job_postings (
               company_id, source_id, external_job_id,
               title, location_text, job_url, employment_type
           )
           VALUES (%s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (company_id, external_job_id) DO UPDATE
             SET title = EXCLUDED.title,
                 location_text = EXCLUDED.location_text,
                 job_url = EXCLUDED.job_url,
                 employment_type = COALESCE(EXCLUDED.employment_type, job_postings.employment_type),
                 updated_at = NOW()""",
        (
            company_id,
            source_id,
            job["job_id"],
            job["title"],
            job["location"],
            job["url"],
            employment_type,
        ),
    )
    conn.commit()
    cur.close()
