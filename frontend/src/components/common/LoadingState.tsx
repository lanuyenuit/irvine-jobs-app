import { Loader2 } from "lucide-react";

export default function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
