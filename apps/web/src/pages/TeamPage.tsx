import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Users, UserPlus, Mail, Phone } from "lucide-react";

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    api.get<any>("/analytics/team-performance").then((r) => setTeam(r.data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tim</h1>
          <p className="text-sm text-slate-500 mt-0.5">{team.length} anggota tim</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
          <UserPlus size={16} /> Tambah Anggota
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((agent) => (
          <div key={agent.id} className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-elevation-low">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-lg">
                {agent.fullName?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{agent.fullName}</p>
                <p className="text-xs text-slate-500">{agent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-slate-500">Target</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{agent.dailyTarget}/hari</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-slate-500">Kunjungan</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{agent.completedVisits}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-slate-500">Deal</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{agent.totalDeals}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                <p className="text-xs text-slate-500">Nilai</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {new Intl.NumberFormat("id-ID", { notation: "compact", currency: "IDR" }).format(agent.totalValue)}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Pencapaian</span><span>{agent.completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(agent.completionRate, 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
