import type { FullCV } from "../../types/cv";

interface Props {
  cv: FullCV;
}

export default function CVDocument({ cv }: Props) {
  return (
    <div className="cv-document bg-white font-serif text-[13px] leading-relaxed text-slate-800 px-10 py-10">
      {/* Header */}
      <div className="border-b-2 border-indigo-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{cv.name}</h1>
        <p className="mt-1 text-[12px] text-slate-500">{cv.contact}</p>
      </div>

      {/* Summary */}
      {cv.summary && (
        <Section title="Professional Summary">
          <p className="text-slate-700 leading-[1.75]">{cv.summary}</p>
        </Section>
      )}

      {/* Experience */}
      {cv.experience?.length > 0 && (
        <Section title="Experience">
          <div className="space-y-5">
            {cv.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 text-[13.5px]">{exp.title}</div>
                    <div className="text-[12px] text-slate-500">
                      {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-[11px] text-slate-400 mt-0.5">{exp.period}</div>
                </div>
                {exp.bullets?.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-4">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="relative text-slate-700 before:absolute before:-left-3 before:content-['–']">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {cv.skills?.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {cv.skills.map((s) => (
              <span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-[11.5px] text-slate-600">
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {cv.education?.length > 0 && (
        <Section title="Education">
          <div className="space-y-2">
            {cv.education.map((e, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <div>
                  <span className="font-semibold text-slate-900">{e.degree}</span>
                  <span className="text-slate-500"> · {e.school}</span>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">{e.year}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {cv.certifications && cv.certifications.length > 0 && (
        <Section title="Certifications">
          <ul className="space-y-1 pl-4">
            {cv.certifications.map((c, i) => (
              <li key={i} className="relative text-slate-700 before:absolute before:-left-3 before:content-['–']">
                {c}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-3 border-b border-slate-200 pb-1">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600">{title}</h2>
      </div>
      {children}
    </div>
  );
}
