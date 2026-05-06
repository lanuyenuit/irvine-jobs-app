import { SearchX } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 shadow-sm text-center">
      <SearchX className="mb-4 h-10 w-10 text-slate-300" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
