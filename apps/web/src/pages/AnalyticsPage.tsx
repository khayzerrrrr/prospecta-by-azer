import { useState, useEffect } from "react";
import { api } from "../services/api";
import { usePackStore } from "../stores/packStore";
import { TrendingUp, MapPin, DollarSign, Target, Sparkles, Brain, Bot } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Summary { todayVisits: number; monthVisits: number; pipelineValue: number; conversionRate: number; pendingFollowUps: number }

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary>({ todayVisits: 0, monthVisits: 0, pipelineValue: 0, conversionRate: 0, pendingFollowUps: 0 });
  const [trends, setTrends] = useState<{ date: string; planned: number; completed: number }[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [predictive, setPredictive] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const analyticsEnabled = usePackStore((s) => s.isPackEnabled("analytics-ai"));
  const forecastEnabled = usePackStore((s) => s.isPackEnabled("forecast"));

  useEffect(() => {
    async function fetch() {
      const [s, t, p] = await Promise.all([
        api.get<any>("/analytics/summary"),
        api.get<any>("/analytics/visit-trends"),
        api.get<any>("/analytics/team-performance"),
      ]);
      if (s.data) setSummary(s.data);
      if (t.data) setTrends(t.data);
      if (p.data) setTeam(p.data);

      // AI Predictive Analytics
      if (analyticsEnabled || forecastEnabled) {
        try {
          const pred = await api.get<any>("/packs/ai/analytics-ai/predict");
          if (pred.data) setPredictive(pred.data);
        } catch {}
      }

      setIsLoading(false);
    }
    fetch();
  }, []);

  const cards = [
    { label: "Kunjungan Bulan Ini", value: String(summary.monthVisits), icon: MapPin, color: "bg-brand-500" },
    { label: "Pipeline Value", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary.pipelineValue), icon: DollarSign, color: "bg-emerald-500" },
    { label: "Konversi", value: `${summary.conversionRate}%`, icon: TrendingUp, color: "bg-violet-500" },
    { label: "Follow-up Pending", value: String(summary.pendingFollowUps), icon: Target, color: "bg-amber-500" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analitik</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Laporan performa kunjungan dan pipeline
          {(analyticsEnabled || forecastEnabled) && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-semibold">AI Active</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-surface-800 p-5 rounded-xl shadow-elevation-low">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
              </div>
              <div className={`${color} p-2 rounded-lg text-white`}><Icon size={18} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Predictive Analytics */}
      {analyticsEnabled && predictive && (
        <div className="mobile-card bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border border-violet-100 dark:border-violet-800">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-violet-500" />
            <h3 className="text-sm font-bold text-violet-700 dark:text-violet-400">AI Predictive Analytics</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 font-semibold">Analytics AI</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/60 dark:bg-surface-800/60 rounded-xl p-4">
              <p className="text-[11px] text-slate-500">Pipeline Value</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(predictive.totalPipelineValue)}
              </p>
            </div>
            <div className="bg-white/60 dark:bg-surface-800/60 rounded-xl p-4">
              <p className="text-[11px] text-slate-500">Active Deals</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{predictive.activeDeals}</p>
            </div>
            <div className="bg-white/60 dark:bg-surface-800/60 rounded-xl p-4">
              <p className="text-[11px] text-slate-500">Avg Deal Value</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(predictive.avgDealValue)}
              </p>
            </div>
          </div>
          {predictive.monthlyForecast && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={predictive.monthlyForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={40} />
                <Tooltip />
                <Bar dataKey="value" fill="#a78bfa" radius={[4,4,0,0]} name="Actual" />
                <Bar dataKey="predicted" fill="#7c3aed" radius={[4,4,0,0]} name="Predicted" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-3 italic flex items-center gap-1">
            <Sparkles size={11} /> {predictive.recommendation}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-surface-800 p-6 rounded-xl shadow-elevation-low">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Tren Kunjungan (30 Hari)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={2} dot={false} name="Terencana" />
            <Line type="monotone" dataKey="completed" stroke="#14b8a6" strokeWidth={2} dot={false} name="Selesai" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast AI */}
      {forecastEnabled && predictive && (
        <div className="mobile-card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">AI Revenue Forecast</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 font-semibold">Forecast AI</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 ml-auto">Beta</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{predictive.recommendation}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/60 dark:bg-surface-800/60 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500">Q3 Forecast</p>
              <p className="text-sm font-bold text-amber-600">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format((predictive.totalPipelineValue || 0) * 1.15)}</p>
            </div>
            <div className="bg-white/60 dark:bg-surface-800/60 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500">Q4 Forecast</p>
              <p className="text-sm font-bold text-amber-600">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format((predictive.totalPipelineValue || 0) * 1.3)}</p>
            </div>
            <div className="bg-white/60 dark:bg-surface-800/60 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500">Growth Rate</p>
              <p className="text-sm font-bold text-emerald-600">+15-20%</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-low overflow-hidden">
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Performa Tim</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-700">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Agent</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Kunjungan</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Target</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Deal</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Nilai</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Pencapaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {team.map((agent) => (
                <tr key={agent.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xs font-bold">{agent.fullName?.charAt(0)}</div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{agent.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{agent.completedVisits} / {agent.monthlyTarget}</td>
                  <td className="px-4 py-3 text-sm">{agent.dailyTarget}/hari</td>
                  <td className="px-4 py-3 text-sm">{agent.totalDeals} deal</td>
                  <td className="px-4 py-3 text-sm font-medium">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(agent.totalValue)}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-24 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(agent.completionRate, 100)}%` }} /></div><span className="text-xs text-slate-500">{agent.completionRate}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
