import { cn } from "../../lib/utils";

interface Lead {
  id: string; companyName: string; contactName: string | null;
  phone: string | null; city: string | null;
  status: string; qualification: string;
  lastContactedAt: string | null; createdAt: string;
}

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}

const statusLabels: Record<string, string> = {
  new: "Baru", contacted: "Dihubungi", qualified: "Qualified",
  unqualified: "Tidak Qualified", converted: "Konversi",
};

const qualColors: Record<string, string> = {
  hot: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warm: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export function LeadTable({ leads, isLoading, onSelect }: LeadTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-low p-8">
        <div className="space-y-3 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-100 dark:bg-surface-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-low p-12 text-center">
        <p className="text-slate-500">Belum ada prospek. Tambahkan prospek pertama Anda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-low overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Perusahaan</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Kontak</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Kota</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Kualifikasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead.id)}
                className="hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{lead.companyName}</p>
                  <p className="text-xs text-slate-500 md:hidden">{lead.contactName || "-"}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{lead.contactName || "-"}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{lead.city || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-surface-100 text-slate-700 dark:bg-surface-700 dark:text-slate-300">
                    {statusLabels[lead.status] || lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={cn("inline-flex px-2 py-0.5 text-xs font-medium rounded-full", qualColors[lead.qualification] || "bg-slate-100 text-slate-700")}>
                    {lead.qualification === "hot" ? "Panas" : lead.qualification === "warm" ? "Hangat" : "Dingin"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
