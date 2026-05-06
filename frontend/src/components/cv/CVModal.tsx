import { X, Download } from "lucide-react";
import CVDocument from "./CVDocument";
import type { FullCV } from "../../types/cv";
import type { Job } from "../../types/job";
import { downloadTailoredCV } from "../../utils/downloadCV";
import type { TailoredCV } from "../../types/cv";

interface Props {
  cv: FullCV;
  tailored?: TailoredCV;
  job?: Job;
  onClose: () => void;
}

export default function CVModal({ cv, tailored, job, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white px-6 py-3">
          <span className="text-sm font-semibold text-slate-700">
            {tailored ? "Tailored CV Preview" : "CV Preview"}
          </span>
          <div className="flex items-center gap-2">
            {tailored && job && (
              <button
                type="button"
                onClick={() => downloadTailoredCV(job, tailored)}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CV content */}
        <div className="overflow-hidden rounded-b-3xl">
          <CVDocument cv={cv} />
        </div>
      </div>
    </div>
  );
}
