import { X, Download } from "lucide-react";
import type { TailoredCV } from "../../types/cv";
import type { Job } from "../../types/job";
import { downloadCoverLetter } from "../../utils/downloadCV";

interface Props {
  tailored: TailoredCV;
  job: Job;
  senderName: string;
  senderContact: string;
  onClose: () => void;
}

export default function CoverLetterModal({ tailored, job, senderName, senderContact, onClose }: Props) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const text = tailored.cover_letter || tailored.cover_letter_intro;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white px-6 py-3">
          <span className="text-sm font-semibold text-slate-700">Cover Letter Preview</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCoverLetter(job, tailored, senderName, senderContact)}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Letter content */}
        <div className="px-12 py-10 font-serif text-[13px] leading-relaxed text-slate-800">
          {/* Sender */}
          <div className="mb-6">
            <p className="font-semibold text-slate-900">{senderName}</p>
            <p className="text-slate-500 text-[12px]">{senderContact}</p>
          </div>

          {/* Date */}
          <p className="mb-6 text-slate-700">{today}</p>

          {/* Recipient */}
          <div className="mb-6">
            <p className="font-semibold text-slate-900">Hiring Manager</p>
            <p className="text-slate-700">{job.company_name}</p>
            {job.location_text && <p className="text-slate-500 text-[12px]">{job.location_text}</p>}
          </div>

          {/* Salutation */}
          <p className="mb-4 text-slate-800">Dear Hiring Manager,</p>

          {/* Body */}
          <p className="whitespace-pre-wrap leading-[1.8] text-slate-700">{text}</p>

          {/* Closing */}
          <div className="mt-8">
            <p className="text-slate-800">Sincerely,</p>
            <p className="mt-6 font-semibold text-slate-900">{senderName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
