import { Plus } from "lucide-react";
import type { Company } from "../../types/company";

export interface DiscoverFilters {
  search: string;
  location: string;
  company_id: string;
  employmentTypes: string[];
  techStack: string[];
  locationRadius: number;
  minMatchScore: number;
}

interface SideBarFiltersProps {
  filters: DiscoverFilters;
  setFilters: React.Dispatch<React.SetStateAction<DiscoverFilters>>;
  companies: Company[];
  setOffset: React.Dispatch<React.SetStateAction<number>>;
}

const TECH_OPTIONS = ["React", "Next.js", "TypeScript"];

export default function SideBarFilters({
  filters,
  setFilters,
  companies,
  setOffset,
}: SideBarFiltersProps) {
  function updateField<K extends keyof DiscoverFilters>(
    key: K,
    value: DiscoverFilters[K]
  ) {
    setOffset(0);
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleTextChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    updateField(name as keyof DiscoverFilters, value as never);
  }

  function toggleEmploymentType(type: string) {
    const exists = filters.employmentTypes.includes(type);

    updateField(
      "employmentTypes",
      exists
        ? filters.employmentTypes.filter((item) => item !== type)
        : [...filters.employmentTypes, type]
    );
  }

  function toggleTech(tag: string) {
    const exists = filters.techStack.includes(tag);

    updateField(
      "techStack",
      exists
        ? filters.techStack.filter((item) => item !== tag)
        : [...filters.techStack, tag]
    );
  }

  function resetFilters() {
    setOffset(0);
    setFilters({
      search: "",
      location: "",
      company_id: "",
      employmentTypes: [],
      techStack: [],
      locationRadius: 0,
      minMatchScore: 70,
    });
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-[#F2F4F6] p-6 shadow-sm">
      <p className="mb-8 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Discovery Filters
      </p>

      <div className="space-y-7">
        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Search
          </label>
          <input
            name="search"
            type="text"
            value={filters.search}
            onChange={handleTextChange}
            placeholder="Frontend, React, QA..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Company */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Company
          </label>
          <select
            name="company_id"
            value={filters.company_id}
            onChange={handleTextChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All companies</option>
            {companies.map((company) => (
              <option key={company.id} value={String(company.id)}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Location
          </label>
          <input
            name="location"
            type="text"
            value={filters.location}
            onChange={handleTextChange}
            placeholder="Irvine, CA"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Employment Type */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Employment Type
          </h3>

          <div className="space-y-3">
            {["Full-time", "Part-time", "Contract"].map((type) => {
              const checked = filters.employmentTypes.includes(type);

              return (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleEmploymentType(type)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{type}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Tech Stack
          </h3>

          <div className="flex flex-wrap gap-2">
            {TECH_OPTIONS.map((tag) => {
              const active = filters.techStack.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTech(tag)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300",
                  ].join(" ")}
                >
                  {tag}
                </button>
              );
            })}

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Location Radius */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Radius from Irvine
            </h3>
            <span className="text-sm font-semibold text-indigo-600">
              {filters.locationRadius === 0 ? "Any" : `${filters.locationRadius} mi`}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={filters.locationRadius}
            onChange={(e) => updateField("locationRadius", Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
          />

          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Any</span>
            <span>10 mi</span>
            <span>25 mi</span>
            <span>50 mi</span>
          </div>
        </div>

        {/* Match Score */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Min Match Score
          </h3>

          <div className="mb-2 text-3xl font-semibold tracking-tight text-indigo-600">
            {filters.minMatchScore}%
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minMatchScore}
            onChange={(e) => updateField("minMatchScore", Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
          />
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={resetFilters}
          className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
}