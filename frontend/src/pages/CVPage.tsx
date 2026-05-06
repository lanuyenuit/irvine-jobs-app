import { useEffect, useRef, useState } from "react";
import { Upload, FileText, CheckCircle, Eye } from "lucide-react";
import Header from "../components/layouts/Header";
import { uploadCV, getLatestCV } from "../api/cvApi";
import type { CV } from "../types/cv";

export default function CVPage() {
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLatestCV()
      .then(setCV)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      await uploadCV(file);
      const full = await getLatestCV();
      setCV(full);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Resume</h1>
        <p className="mt-2 text-sm text-slate-500">
          Upload your PDF — it'll be automatically tailored when you save a job.
        </p>

        <div className="mt-8 space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-12 transition-colors",
              dragging
                ? "border-indigo-400 bg-indigo-50"
                : "border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Upload className={`h-10 w-10 ${uploading ? "animate-bounce text-indigo-400" : "text-slate-400"}`} />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                {uploading ? "Uploading and extracting text…" : "Drop your PDF here or click to browse"}
              </p>
              <p className="mt-1 text-xs text-slate-400">PDF up to 10 MB</p>
            </div>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          {/* Current CV card */}
          {!loading && cv && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* Info bar */}
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{cv.filename}</p>
                  <p className="text-xs text-slate-400">
                    {cv.file_size ? `${Math.round(cv.file_size / 1024)} KB · ` : ""}
                    Uploaded {new Date(cv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showPreview ? "Hide" : "Preview"}
                  </button>
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                </div>
              </div>

              {/* Document preview */}
              {showPreview && (
                <div className="border-t border-slate-100">
                  <CVRawPreview text={cv.raw_text} />
                </div>
              )}
            </div>
          )}

          {!loading && !cv && (
            <p className="text-center text-sm text-slate-400">No CV uploaded yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function CVRawPreview({ text }: { text: string }) {
  const lines = text?.split("\n").filter((l) => l.trim()) ?? [];

  return (
    <div className="rounded-b-3xl bg-white px-10 py-8 font-serif text-[13px] text-slate-800">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        // Heuristic: short ALL CAPS or title-case short lines = section heading
        const isHeading =
          trimmed.length < 40 &&
          (trimmed === trimmed.toUpperCase() || /^[A-Z][a-zA-Z\s&]+$/.test(trimmed));

        if (isHeading && i > 0) {
          return (
            <div key={i} className="mb-3 mt-5 border-b border-slate-200 pb-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                {trimmed}
              </h2>
            </div>
          );
        }
        return (
          <p key={i} className={`leading-relaxed text-slate-700 ${trimmed.startsWith("•") || trimmed.startsWith("-") ? "pl-4" : ""}`}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
