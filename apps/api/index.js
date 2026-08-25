require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const crypto = require("crypto");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;
const isProd = process.env.NODE_ENV === "production";
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : "http://localhost:5173";
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
  path: "/api/auth",
};

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ── Auth helpers ─────────────────────────────────────────────────────────────

function makeAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

async function issueTokens(res, user) {
  const accessToken = makeAccessToken(user);
  const rawRefresh = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawRefresh).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  res.cookie("refresh_token", rawRefresh, {
    ...refreshCookieOptions,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });

  return accessToken;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token" });
  }
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// ── POST /api/auth/register ───────────────────────────────────────────────────
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name.trim(), email.toLowerCase(), hash]
    );
    const user = rows[0];
    const accessToken = await issueTokens(res, user);
    res.status(201).json({ accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const { rows } = await pool.query("SELECT id, name, email, password_hash FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = await issueTokens(res, user);
    res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const raw = req.cookies?.refresh_token;
    if (!raw) return res.status(401).json({ error: "No refresh token" });

    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    const { rows } = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.name, u.email
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );
    const record = rows[0];
    if (!record || new Date(record.expires_at) < new Date()) {
      res.clearCookie("refresh_token", refreshCookieOptions);
      return res.status(401).json({ error: "Refresh token expired or invalid" });
    }

    // Rotate: delete old, issue new
    await pool.query("DELETE FROM refresh_tokens WHERE id = $1", [record.id]);
    const user = { id: record.user_id, name: record.name, email: record.email };
    const accessToken = await issueTokens(res, user);
    res.json({ accessToken, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
app.post("/api/auth/logout", async (req, res) => {
  try {
    const raw = req.cookies?.refresh_token;
    if (raw) {
      const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      await pool.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
    }
    res.clearCookie("refresh_token", { path: "/api/auth" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = $1", [req.user.sub]);
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Cities within each radius band from Irvine, CA
const CITIES_BY_RADIUS = {
  10: [
    "Irvine", "Tustin", "Lake Forest", "Newport Beach", "Costa Mesa",
    "Aliso Viejo", "Laguna Hills", "Mission Viejo",
  ],
  25: [
    "Irvine", "Tustin", "Lake Forest", "Newport Beach", "Costa Mesa",
    "Aliso Viejo", "Laguna Hills", "Mission Viejo",
    "Anaheim", "Orange", "Santa Ana", "Garden Grove", "Huntington Beach",
    "Laguna Niguel", "Rancho Santa Margarita", "Laguna Beach", "Dana Point",
    "Fountain Valley", "Cypress", "Seal Beach", "Brea", "Fullerton",
    "Yorba Linda", "Placentia", "Villa Park",
  ],
  50: [
    "Irvine", "Tustin", "Lake Forest", "Newport Beach", "Costa Mesa",
    "Aliso Viejo", "Laguna Hills", "Mission Viejo",
    "Anaheim", "Orange", "Santa Ana", "Garden Grove", "Huntington Beach",
    "Laguna Niguel", "Rancho Santa Margarita", "Laguna Beach", "Dana Point",
    "Fountain Valley", "Cypress", "Seal Beach", "Brea", "Fullerton",
    "Yorba Linda", "Placentia", "Villa Park",
    "Los Angeles", "Long Beach", "Torrance", "El Segundo", "Manhattan Beach",
    "Redondo Beach", "Inglewood", "Carson", "Downey", "Cerritos", "Lakewood",
    "Pasadena", "Glendale", "Burbank", "Pomona", "Ontario", "Corona",
    "Riverside", "San Bernardino", "Chino", "Chino Hills",
  ],
};

function getCitiesForRadius(radius) {
  const r = parseInt(radius, 10);
  if (r <= 10) return CITIES_BY_RADIUS[10];
  if (r <= 25) return CITIES_BY_RADIUS[25];
  return CITIES_BY_RADIUS[50];
}

// ── GET /api/jobs ────────────────────────────────────────────────────────────
// Query params:
//   search      – full-text filter on title
//   company_id  – filter by company
//   location    – partial match on location_text
//   radius      – miles from Irvine (10 / 25 / 50); also includes remote jobs
//   limit       – default 20, max 100
//   offset      – default 0
app.get("/api/jobs", async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    const rawOffset = parseInt(req.query.offset, 10);

    const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
    const offset = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

    const conditions = ["jp.status = 'active'"];
    const params = [];

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      conditions.push(`jp.title ILIKE $${params.length}`);
    }

    if (req.query.company_id) {
      params.push(parseInt(req.query.company_id, 10));
      conditions.push(`jp.company_id = $${params.length}`);
    }

    if (req.query.location) {
      params.push(`%${req.query.location}%`);
      conditions.push(`jp.location_text ILIKE $${params.length}`);
    }

    if (req.query.employment_type) {
      const types = req.query.employment_type.split(",").map((t) => t.trim()).filter(Boolean);
      if (types.length === 1) {
        params.push(types[0]);
        conditions.push(`jp.employment_type ILIKE $${params.length}`);
      } else if (types.length > 1) {
        const placeholders = types.map((t) => { params.push(t); return `$${params.length}`; });
        conditions.push(`jp.employment_type ILIKE ANY(ARRAY[${placeholders.join(",")}])`);
      }
    }

    if (req.query.radius) {
      const cities = getCitiesForRadius(req.query.radius);
      const cityConditions = cities.map((city) => {
        params.push(`%${city}%`);
        return `jp.location_text ILIKE $${params.length}`;
      });
      // Also include remote jobs in any radius
      params.push("%remote%");
      cityConditions.push(`jp.location_text ILIKE $${params.length}`);
      cityConditions.push(`jp.is_remote = true`);
      conditions.push(`(${cityConditions.join(" OR ")})`);
    }

    if (req.query.tech_stack) {
      const tags = req.query.tech_stack.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        const tagConditions = tags.map((tag) => {
          params.push(`%${tag}%`);
          return `jp.title ILIKE $${params.length}`;
        });
        conditions.push(`(${tagConditions.join(" OR ")})`);
      }
    }

    const where = conditions.join(" AND ");

    const dataParams = [...params, limit, offset];
    const limitParam = `$${dataParams.length - 1}`;
    const offsetParam = `$${dataParams.length}`;

    const { rows } = await pool.query(
      `SELECT
         jp.id,
         jp.title,
         jp.location_text,
         jp.is_remote,
         jp.employment_type,
         jp.department,
         jp.job_url,
         jp.discovered_at,
         jp.posted_at,
         c.id AS company_id,
         c.name AS company_name,
         c.industry,
         s.name AS source_name,
         s.type AS source_type
       FROM job_postings jp
       JOIN companies c ON c.id = jp.company_id
       LEFT JOIN sources s ON s.id = jp.source_id
       WHERE ${where}
       ORDER BY jp.discovered_at DESC NULLS LAST
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      dataParams
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM job_postings jp
       WHERE ${where}`,
      params
    );

    res.json({
      total: parseInt(countRows[0].total, 10),
      limit,
      offset,
      jobs: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/jobs/:id ────────────────────────────────────────────────────────
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         jp.*,
         c.name  AS company_name,
         c.industry,
         c.website_url AS company_website,
         s.name AS source_name,
         s.type AS source_type
       FROM job_postings jp
       JOIN companies c  ON c.id  = jp.company_id
       LEFT JOIN sources s ON s.id = jp.source_id
       WHERE jp.id = $1`,
      [parseInt(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const job = rows[0];

    // Fetch & cache description on first view
    if (!job.description_text && job.job_url) {
      const desc = await fetchJobDescription(job.job_url, job.title, job.company_name);
      if (desc && !desc.startsWith("Position:")) {
        await pool.query(
          `UPDATE job_postings SET description_text = $1, updated_at = NOW() WHERE id = $2`,
          [desc, job.id]
        );
        job.description_text = desc;
      }
    }

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/companies ───────────────────────────────────────────────────────
// Returns all companies with their active job count.
app.get("/api/companies", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.website_url,
         c.careers_url,
         c.industry,
         c.company_size,
         c.location_city,
         c.location_state,
         c.is_target,
         c.notes,
         COUNT(jp.id) FILTER (WHERE jp.status = 'active') AS job_count
       FROM companies c
       LEFT JOIN job_postings jp ON jp.company_id = c.id
       GROUP BY c.id
       ORDER BY job_count DESC, c.name`
    );
    res.json({ companies: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/companies/:id/jobs ──────────────────────────────────────────────
app.get("/api/companies/:id/jobs", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    const { rows } = await pool.query(
      `SELECT
         jp.id,
         jp.title,
         jp.location_text,
         jp.is_remote,
         jp.employment_type,
         jp.department,
         jp.job_url,
         jp.discovered_at,
         jp.posted_at,
         s.name AS source_name
       FROM job_postings jp
       LEFT JOIN sources s ON s.id = jp.source_id
       WHERE jp.company_id = $1 AND jp.status = 'active'
       ORDER BY jp.discovered_at DESC
       LIMIT $2 OFFSET $3`,
      [parseInt(req.params.id), limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM job_postings WHERE company_id = $1 AND status = 'active'`,
      [parseInt(req.params.id)]
    );

    res.json({
      total: parseInt(countRows[0].total),
      limit,
      offset,
      jobs: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/applications ────────────────────────────────────────────────────
app.get("/api/applications", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         a.id, a.job_posting_id, a.status, a.applied_at, a.notes,
         a.created_at, a.updated_at,
         jp.title, jp.location_text, jp.is_remote, jp.employment_type,
         jp.job_url, jp.department,
         c.name AS company_name, c.industry
       FROM job_applications a
       JOIN job_postings jp ON jp.id = a.job_posting_id
       JOIN companies c ON c.id = jp.company_id
       WHERE a.user_id = $1
       ORDER BY a.updated_at DESC`,
      [req.user.sub]
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/applications ───────────────────────────────────────────────────
app.post("/api/applications", requireAuth, async (req, res) => {
  try {
    const { job_posting_id, status = "saved" } = req.body;
    if (!job_posting_id) return res.status(400).json({ error: "job_posting_id is required" });

    const applied_at = status === "applied" ? new Date() : null;
    const { rows } = await pool.query(
      `INSERT INTO job_applications (user_id, job_posting_id, status, applied_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, job_posting_id) WHERE user_id IS NOT NULL
       DO UPDATE SET
         status = EXCLUDED.status,
         applied_at = COALESCE(EXCLUDED.applied_at, job_applications.applied_at),
         updated_at = NOW()
       RETURNING *`,
      [req.user.sub, job_posting_id, status, applied_at]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/applications/:id ──────────────────────────────────────────────
app.patch("/api/applications/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes, applied_at } = req.body;

    const sets = ["updated_at = NOW()"];
    const params = [];

    if (status !== undefined) { params.push(status); sets.push(`status = $${params.length}`); }
    if (notes !== undefined) { params.push(notes); sets.push(`notes = $${params.length}`); }
    if (applied_at !== undefined) { params.push(applied_at); sets.push(`applied_at = $${params.length}`); }

    params.push(id, req.user.sub);
    const { rows } = await pool.query(
      `UPDATE job_applications SET ${sets.join(", ")}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /api/applications/:id ─────────────────────────────────────────────
app.delete("/api/applications/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [parseInt(req.params.id, 10), req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/cv ─────────────────────────────────────────────────────────────
app.post("/api/cv", requireAuth, upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const parsed = await pdfParse(req.file.buffer);
    const rawText = parsed.text.trim();
    if (!rawText) return res.status(400).json({ error: "Could not extract text from PDF" });

    const { rows } = await pool.query(
      `INSERT INTO user_cvs (user_id, filename, raw_text, file_size)
       VALUES ($1, $2, $3, $4) RETURNING id, filename, file_size, created_at`,
      [req.user.sub, req.file.originalname, rawText, req.file.size]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/cv/latest ────────────────────────────────────────────────────────
app.get("/api/cv/latest", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, filename, raw_text, file_size, created_at FROM user_cvs
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ error: "No CV uploaded yet" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Helper: fetch job description from Greenhouse or Lever public API ─────────
async function fetchJobDescription(jobUrl, title, companyName) {
  try {
    if (jobUrl.includes("greenhouse.io")) {
      const match = jobUrl.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
      if (match) {
        const [, boardToken, jobId] = match;
        const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}?questions=false`);
        if (r.ok) {
          const data = await r.json();
          const html = data.content || "";
          return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }
      }
    }
    if (jobUrl.includes("lever.co")) {
      const match = jobUrl.match(/lever\.co\/([^/]+)\/([a-f0-9-]{36})/);
      if (match) {
        const [, company, postingId] = match;
        const r = await fetch(`https://api.lever.co/v0/postings/${company}/${postingId}`);
        if (r.ok) {
          const data = await r.json();
          const lists = (data.lists || []).map((l) => `${l.text}: ${l.content.replace(/<[^>]+>/g, " ")}`).join("\n");
          const desc = (data.description || "").replace(/<[^>]+>/g, " ");
          return `${desc}\n${lists}`.trim();
        }
      }
    }
  } catch (_) { /* fall through */ }
  return `Position: ${title} at ${companyName}. No detailed description available.`;
}

// ── POST /api/jobs/:id/tailor ─────────────────────────────────────────────────
// Tailors the latest CV for this job and stores result in job_applications
app.post("/api/jobs/:id/tailor", requireAuth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = req.user.sub;

    // Load job and application in parallel
    const [{ rows: jobRows }, { rows: cvRows }, { rows: appRows }] = await Promise.all([
      pool.query(
        `SELECT jp.id, jp.title, jp.location_text, jp.employment_type, jp.job_url,
                c.name AS company_name, c.industry
         FROM job_postings jp JOIN companies c ON c.id = jp.company_id
         WHERE jp.id = $1`,
        [jobId]
      ),
      pool.query(`SELECT id, raw_text FROM user_cvs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]),
      pool.query(`SELECT id FROM job_applications WHERE job_posting_id = $1 AND user_id = $2`, [jobId, userId]),
    ]);

    if (!jobRows.length) return res.status(404).json({ error: "Job not found" });
    if (!cvRows.length) return res.status(404).json({ error: "No CV uploaded yet" });

    const job = jobRows[0];
    const cv = cvRows[0];

    const jobDescription = await fetchJobDescription(job.job_url, job.title, job.company_name);

    const prompt = `You are a world-class resume writer. Your mission: rewrite this CV to achieve a 90–100% match score for the job below. Every word must serve this goal.

STEP 1 — Analyze the job description:
- Extract every required skill, tool, responsibility, and qualification.
- Note the exact phrases and keywords used. You MUST use these exact phrases in the CV.

STEP 2 — Rewrite the CV to match:
- SUMMARY: 3-4 sentences that read like the candidate was born for this role. Use the job title, top 3 required skills, and the company name.
- SKILLS: List skills in the exact order they appear in the job description. Include every skill from the JD that the candidate has (based on their background). Put them first.
- EXPERIENCE bullets: For EVERY role, rewrite ALL bullets to address the job's requirements. Each bullet must:
  • Start with a strong action verb (Led, Built, Reduced, Increased, Designed, Managed…)
  • Reference a skill or responsibility from the job description
  • Include a quantified result: %, $, number of users, team size, time saved, revenue impact
  • Sound like direct evidence the candidate can do this job
- If the candidate's background has relevant experience that isn't visible in their original CV, surface it in the bullets.
- Keep factual data: company names, job titles, dates, school names. Do NOT invent employers or degrees.
- The match_score you return MUST be 90 or above. You are rewriting the CV specifically to achieve this — if you score it lower, you haven't rewritten it aggressively enough.

STEP 3 — Apply ALL improvements into full_cv first:
Before writing suggestions, ask yourself: "Is there anything I identified in Step 1 that I haven't already added to full_cv?" If yes, add it now.
- Every gap, every missing keyword, every weak bullet must already be FIXED in the full_cv output.
- The full_cv must already incorporate every improvement — do not leave fixes for the suggestions list.

STEP 4 — Suggestions (only what you CANNOT do automatically):
List 5 things that require the candidate's own action beyond rewriting language — things you cannot infer from their CV:
- Real metrics they need to look up (e.g. "Find the exact revenue impact of [project] and add it to that bullet")
- Certifications or courses worth getting for this role
- Portfolio or GitHub projects to build or highlight
- Specific missing experience that would require them to actually get it
- Networking or application tips specific to this company
Do NOT suggest things like "reorder skills" or "add keyword X" — you must have already done those in the full_cv.

JOB: ${job.title} at ${job.company_name}
INDUSTRY: ${job.industry || "N/A"}
LOCATION: ${job.location_text || "N/A"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S ORIGINAL CV:
${cv.raw_text}

Return a single JSON object with EXACTLY these fields. No markdown, no explanation, only the JSON.

{
  "match_score": <integer 0-100 based on how well the original CV matches the job>,
  "summary": "<2-3 sentence tailored professional summary>",
  "key_skills": ["<skill most relevant to this job>", ...],
  "experience_bullets": ["<rewritten bullet using job keywords>", ...],
  "cover_letter_intro": "<first paragraph of cover letter only>",
  "cover_letter": "<full 4-paragraph cover letter. First person, senior level tone — confident, direct, technically specific. No buzzwords like 'passionate', 'excited to apply', 'leverage', 'synergy'. Open with a specific observation about the company or role, not 'I am writing to'. Show real technical depth. Each paragraph: 1) specific insight about the company, 2) most relevant achievement with numbers, 3) what you would do in this role, 4) brief authentic close. 200-250 words.>",
  "keywords": ["<ATS keyword from job description>", ...],
  "suggestions": [
    "<Something only the candidate can do, e.g. 'Look up the exact revenue impact of [project] and replace the estimate in your bullet with the real number'>",
    "<e.g. 'Earn the [specific certification] — this role lists it as preferred and it would push your score to 100%'>",
    "<e.g. 'Build a public GitHub project demonstrating [specific skill] — the JD asks for portfolio evidence'>",
    "<e.g. 'Find the real team size you managed at [company] and add it — the number I used is an estimate'>",
    "<e.g. 'Research [company name] recent product launches before the interview — the JD hints they need someone who understands X'>"
  ],
  "full_cv": {
    "name": "<candidate full name from CV>",
    "contact": "<email | phone | linkedin | location — extracted from CV>",
    "summary": "<rewritten 3-4 sentence professional summary targeting this job, using its keywords>",
    "experience": [
      {
        "title": "<exact job title from CV>",
        "company": "<exact company name from CV>",
        "period": "<start – end or present>",
        "location": "<city or remote>",
        "bullets": ["<rewritten bullet using action verb + job keywords + quantified impact>", ...]
      }
    ],
    "skills": ["<reordered — most relevant to this job first>", ...],
    "education": [
      {
        "degree": "<degree and field>",
        "school": "<school name>",
        "year": "<graduation year>"
      }
    ],
    "certifications": ["<cert name>", ...]
  }
}`;

    const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama-3.1-8b-instant"];
    let completion;
    for (const model of MODELS) {
      try {
        completion = await groq.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        });
        break;
      } catch (e) {
        if (e.status === 429 && model !== MODELS[MODELS.length - 1]) {
          console.warn(`Rate limited on ${model}, trying next model…`);
          continue;
        }
        throw e;
      }
    }
    const text = completion.choices[0].message.content;

    let tailoredCv;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      tailoredCv = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    // Upsert application with tailored CV
    if (appRows.length) {
      await pool.query(
        `UPDATE job_applications SET tailored_cv = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(tailoredCv), appRows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO job_applications (user_id, job_posting_id, status, tailored_cv)
         VALUES ($1, $2, 'saved', $3)
         ON CONFLICT (user_id, job_posting_id) WHERE user_id IS NOT NULL
         DO UPDATE SET tailored_cv = EXCLUDED.tailored_cv, updated_at = NOW()`,
        [userId, jobId, JSON.stringify(tailoredCv)]
      );
    }

    res.json({ job_id: jobId, tailored_cv: tailoredCv });
  } catch (err) {
    console.error(err);
    if (err.status === 401) {
      return res.status(500).json({ error: "Invalid Groq API key — set GROQ_API_KEY in .env" });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
app.get("/api/stats", requireAuth, async (req, res) => {
  try {
    const [jobStats, appStats, topCompanies, topIndustries] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') AS total_active,
          COUNT(*) FILTER (WHERE status = 'active' AND discovered_at >= NOW() - INTERVAL '7 days') AS new_this_week,
          COUNT(*) FILTER (WHERE status = 'active' AND discovered_at >= NOW() - INTERVAL '1 day') AS new_today
        FROM job_postings
      `),
      pool.query(`SELECT status, COUNT(*) AS count FROM job_applications WHERE user_id = $1 GROUP BY status`, [req.user.sub]),
      pool.query(`
        SELECT c.id, c.name, c.industry, COUNT(jp.id) AS job_count
        FROM companies c
        JOIN job_postings jp ON jp.company_id = c.id AND jp.status = 'active'
        GROUP BY c.id ORDER BY job_count DESC LIMIT 6
      `),
      pool.query(`
        SELECT c.industry, COUNT(jp.id) AS job_count
        FROM job_postings jp
        JOIN companies c ON c.id = jp.company_id
        WHERE jp.status = 'active' AND c.industry IS NOT NULL
        GROUP BY c.industry ORDER BY job_count DESC LIMIT 5
      `),
    ]);

    res.json({
      jobs: {
        total_active: parseInt(jobStats.rows[0].total_active),
        new_this_week: parseInt(jobStats.rows[0].new_this_week),
        new_today: parseInt(jobStats.rows[0].new_today),
      },
      applications: appStats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      top_companies: topCompanies.rows.map((r) => ({ ...r, job_count: parseInt(r.job_count) })),
      top_industries: topIndustries.rows.map((r) => ({ ...r, job_count: parseInt(r.job_count) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
