import { Search } from "lucide-react";

interface LeadFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  qualification: string;
  onQualificationChange: (v: string) => void;
}

const statuses = ["", "new", "contacted", "qualified", "unqualified", "converted"];
const qualifications = ["", "hot", "warm", "cold"];

export function LeadFilters({ search, onSearchChange, status, onStatusChange, qualification, onQualificationChange }: LeadFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari perusahaan atau kontak..."
          className="pl-9 pr-4 py-2 text-sm rounded-lg border border-surface-200 bg-white dark:bg-surface-800 dark:border-surface-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-surface-200 bg-white dark:bg-surface-800 dark:border-surface-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Semua Status</option>
        {statuses.filter(Boolean).map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>

      <select
        value={qualification}
        onChange={(e) => onQualificationChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-surface-200 bg-white dark:bg-surface-800 dark:border-surface-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Semua Kualifikasi</option>
        {qualifications.filter(Boolean).map((q) => (
          <option key={q} value={q}>{q === "hot" ? "Panas" : q === "warm" ? "Hangat" : "Dingin"}</option>
        ))}
      </select>
    </div>
  );
}
