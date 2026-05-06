import type { TailoredCV } from "../types/cv";
import type { Job } from "../types/job";

export function downloadTailoredCV(job: Job, tailored: TailoredCV) {
  const fcv = tailored.full_cv;
  const html = fcv ? buildFullCV(fcv) : buildSummaryCV(job, tailored);
  openPrintWindow(html);
}

export function downloadCoverLetter(job: Job, tailored: TailoredCV, senderName: string, senderContact: string) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const text = tailored.cover_letter || tailored.cover_letter_intro;
  openPrintWindow(buildLetterHTML(senderName, senderContact, today, job, text));
}

function openPrintWindow(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function buildFullCV(fcv: NonNullable<TailoredCV["full_cv"]>): string {
  const expHtml = (fcv.experience ?? []).map((e) => `
    <div class="exp-item">
      <div class="exp-header">
        <div>
          <div class="exp-title">${e.title}</div>
          <div class="exp-company">${e.company}${e.location ? " · " + e.location : ""}</div>
        </div>
        <div class="exp-period">${e.period}</div>
      </div>
      <ul>${(e.bullets ?? []).map((b) => `<li>${b}</li>`).join("")}</ul>
    </div>`).join("");

  const eduHtml = (fcv.education ?? []).map((e) => `
    <div class="edu-item">
      <div>
        <span class="exp-title">${e.degree}</span>
        <span class="exp-company"> · ${e.school}</span>
      </div>
      <span class="exp-period">${e.year}</span>
    </div>`).join("");

  const certsHtml = fcv.certifications?.length
    ? `<div class="section"><div class="section-title">Certifications</div><div class="tags">${fcv.certifications.map((c) => `<span class="tag">${c}</span>`).join("")}</div></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${fcv.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #fff; padding: 48px 56px; max-width: 860px; margin: auto; font-size: 13px; line-height: 1.5; }

  .header { border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 20px; }
  .name { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; color: #0f172a; text-transform: uppercase; }
  .contact { margin-top: 4px; color: #475569; font-size: 12px; }

  .section { margin-bottom: 18px; }
  .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 10px; }

  .summary-text { color: #334155; line-height: 1.75; }

  .exp-item { margin-bottom: 12px; }
  .exp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
  .exp-title { font-weight: 600; color: #0f172a; }
  .exp-company { color: #475569; font-size: 12px; }
  .exp-period { color: #64748b; font-size: 11px; white-space: nowrap; margin-left: 12px; }
  ul { padding-left: 16px; }
  li { color: #334155; margin-bottom: 3px; }

  .edu-item { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }

  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { background: #f1f5f9; color: #475569; font-size: 11px; padding: 3px 10px; border-radius: 2px; border: 1px solid #e2e8f0; }

  .ref-note { color: #475569; font-style: italic; }

  @media print {
    body { padding: 0; }
    @page { margin: 0.65in 0.75in; size: letter; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="name">${fcv.name}</div>
    <div class="contact">${fcv.contact}</div>
  </div>

  ${fcv.summary ? `<div class="section"><div class="section-title">Professional Summary</div><p class="summary-text">${fcv.summary}</p></div>` : ""}

  ${fcv.experience?.length ? `<div class="section"><div class="section-title">Professional Experience</div>${expHtml}</div>` : ""}

  ${fcv.skills?.length ? `<div class="section"><div class="section-title">Technical Skills</div><div class="tags">${fcv.skills.map((s) => `<span class="tag">${s}</span>`).join("")}</div></div>` : ""}

  ${fcv.education?.length ? `<div class="section"><div class="section-title">Education</div>${eduHtml}</div>` : ""}

  ${certsHtml}

  <div class="section">
    <div class="section-title">References</div>
    <p class="ref-note">Available upon request.</p>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function buildLetterHTML(senderName: string, senderContact: string, date: string, job: Job, text: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Cover Letter – ${senderName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #fff; padding: 72px 80px; max-width: 800px; margin: auto; font-size: 13px; line-height: 1.75; }

  .sender-name { font-size: 15px; font-weight: 700; color: #0f172a; }
  .sender-contact { color: #475569; font-size: 12px; margin-top: 2px; }

  .date { margin-top: 28px; color: #1e293b; }

  .recipient { margin-top: 28px; }
  .recipient-name { font-weight: 600; }
  .recipient-company { color: #334155; }
  .recipient-location { color: #64748b; font-size: 12px; }

  .salutation { margin-top: 28px; }

  .body { margin-top: 16px; color: #1e293b; white-space: pre-wrap; line-height: 1.85; }

  .closing { margin-top: 36px; }
  .sig-name { margin-top: 32px; font-weight: 700; color: #0f172a; }

  @media print {
    body { padding: 0; }
    @page { margin: 0.9in 1in; size: letter; }
  }
</style>
</head>
<body>
  <div class="sender-name">${senderName}</div>
  <div class="sender-contact">${senderContact}</div>

  <div class="date">${date}</div>

  <div class="recipient">
    <div class="recipient-name">Hiring Manager</div>
    <div class="recipient-company">${job.company_name}</div>
    ${job.location_text ? `<div class="recipient-location">${job.location_text}</div>` : ""}
  </div>

  <p class="salutation">Dear Hiring Manager,</p>

  <p class="body">${text}</p>

  <div class="closing">
    <p>Sincerely,</p>
    <p class="sig-name">${senderName}</p>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function buildSummaryCV(job: Job, tailored: TailoredCV): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Tailored CV</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 48px 56px; max-width: 860px; margin: auto; font-size: 13px; }
  h1 { font-size: 20px; font-weight: 700; }
  .meta { color: #64748b; font-size: 12px; margin-top: 4px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 18px 0; }
  h2 { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #0f172a; margin-bottom: 8px; }
  p { color: #334155; line-height: 1.7; }
  ul { padding-left: 16px; } li { color: #334155; margin-bottom: 3px; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { background: #f1f5f9; color: #475569; font-size: 11px; padding: 3px 10px; border-radius: 2px; }
  .section { margin-bottom: 18px; }
  .ref-note { color: #475569; font-style: italic; }
  @media print { body { padding: 0; } @page { margin: 0.65in; size: letter; } }
</style>
</head>
<body>
  <h1>${job.title}</h1>
  <p class="meta">${job.company_name}${job.location_text ? " · " + job.location_text : ""}</p>
  <hr />
  <div class="section"><h2>Professional Summary</h2><p>${tailored.summary}</p></div>
  <div class="section"><h2>Key Skills</h2><div class="tags">${tailored.key_skills.map((s) => `<span class="tag">${s}</span>`).join("")}</div></div>
  <div class="section"><h2>Experience Highlights</h2><ul>${tailored.experience_bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>
  <div class="section"><h2>ATS Keywords</h2><div class="tags">${tailored.keywords.map((k) => `<span class="tag">${k}</span>`).join("")}</div></div>
  <div class="section"><h2>References</h2><p class="ref-note">Available upon request.</p></div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}
