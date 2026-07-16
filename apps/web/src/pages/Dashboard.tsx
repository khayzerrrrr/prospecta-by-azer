import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { usePackStore } from "../stores/packStore";
import { api } from "../services/api";
import { MapPin, TrendingUp, DollarSign, ClipboardCheck, Calendar, ArrowRight, Plus, Shield, Target, Sparkles, Lightbulb, ChevronRight, GraduationCap, Store, Heart, Home, Car, Factory, ShoppingBag, Cloud, Truck, CheckCircle2, Circle } from "lucide-react";
import { AgentMap } from "../components/dashboard/AgentMap";
import { ManagerLiveMap } from "../components/dashboard/ManagerLiveMap";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Summary { todayVisits: number; monthVisits: number; pipelineValue: number; conversionRate: number; pendingFollowUps: number }

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", manager: "Manager", agent: "Agent",
};
const roleGreeting: Record<string, string> = {
  super_admin: "Seluruh sistem dalam kendali Anda",
  admin: "Kelola tim dan strategi kunjungan",
  manager: "Pantau performa tim Anda hari ini",
  agent: "Siap menjalankan kunjungan hari ini?",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "agent";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [salesCoachEnabled, setSalesCoachEnabled] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const s = await api.get<any>("/analytics/summary");
        const t = await api.get<any>("/analytics/visit-trends");
        if (s.data) setSummary(s.data);
        if (t.data) setTrends(t.data.slice(-14));

        // Check if Sales Coach AI is enabled
        if (role === "agent") {
          const packs = await api.get<any>("/packs/ai");
          const coach = (packs.data || []).find((p: any) => p.id === "sales-coach");
          if (coach?.enabled) {
            setSalesCoachEnabled(true);
            const insights = await api.get<any>("/packs/ai/sales-coach/analyze");
            setAiInsights(insights.data);
          }
        }
      } catch {}
    }
    fetch();
  }, [role]);

  // Different KPI sets per role
  const statsByRole: Record<string, { label: string; value: string; icon: any; color: string; bg: string; text: string; onClick?: () => void }[]> = {
    super_admin: [
      { label: "Total Kunjungan", value: String(summary?.monthVisits ?? "0"), icon: MapPin, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
      { label: "Pipeline Value", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary?.pipelineValue ?? 0), icon: DollarSign, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
      { label: "Konversi", value: `${summary?.conversionRate ?? 0}%`, icon: TrendingUp, color: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
      { label: "Agent Aktif", value: "3", icon: Shield, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", onClick: () => navigate("/team") },
    ],
    admin: [
      { label: "Kunjungan Bulan Ini", value: String(summary?.monthVisits ?? "0"), icon: MapPin, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
      { label: "Pipeline Value", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary?.pipelineValue ?? 0), icon: DollarSign, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
      { label: "Konversi", value: `${summary?.conversionRate ?? 0}%`, icon: TrendingUp, color: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
      { label: "Follow-up", value: String(summary?.pendingFollowUps ?? "0"), icon: ClipboardCheck, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", onClick: () => navigate("/follow-ups") },
    ],
    manager: [
      { label: "Kunjungan Tim", value: String(summary?.monthVisits ?? "0"), icon: MapPin, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
      { label: "Pipeline Tim", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary?.pipelineValue ?? 0), icon: DollarSign, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
      { label: "Konversi Tim", value: `${summary?.conversionRate ?? 0}%`, icon: TrendingUp, color: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
      { label: "Follow-up Tim", value: String(summary?.pendingFollowUps ?? "0"), icon: ClipboardCheck, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
    ],
    agent: [
      { label: "Target Hari Ini", value: "5 kunjungan", icon: Target, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
      { label: "Selesai Bulan Ini", value: String(summary?.monthVisits ?? "0"), icon: MapPin, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
      { label: "Deal Aktif", value: "0", icon: DollarSign, color: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", onClick: () => navigate("/pipeline") },
      { label: "Follow-up Saya", value: String(summary?.pendingFollowUps ?? "0"), icon: ClipboardCheck, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", onClick: () => navigate("/follow-ups") },
    ],
  };

  const stats = statsByRole[role] || statsByRole.agent!;

  // Get installed industry packs for the banner
  const enabledPacks = usePackStore((s) => s.enabledPacks);
  const industryIcons: Record<string, any> = {
    education: GraduationCap, banking: Store, healthcare: Heart, property: Home,
    automotive: Car, manufacturing: Factory, retail: ShoppingBag, saas: Cloud, distributor: Truck,
  };
  const industryColors: Record<string, string> = {
    education: "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400",
    banking: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400",
    healthcare: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400",
    property: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",
    automotive: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
    manufacturing: "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-400",
    retail: "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-400",
    saas: "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-400",
    distributor: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
  };
  const installedIndustries = Object.keys(enabledPacks).filter(k => industryIcons[k]);

  return (
    <div className="page-enter space-y-5">
      {/* Mobile greeting */}
      <div className="lg:hidden">
        <p className="text-sm text-slate-500 font-medium">Selamat datang, {user?.fullName?.split(" ")[0]}</p>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-semibold">
            {roleLabel[role]}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{roleGreeting[role]}</p>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-semibold uppercase tracking-wide">
              {roleLabel[role]}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{roleGreeting[role]}</p>
        </div>
        <button onClick={() => navigate("/visits")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all active:scale-95">
          <Calendar size={16} /> Jadwalkan Kunjungan
        </button>
      </div>

      {/* Installed Industry Packs Banner */}
      <div className="rounded-2xl bg-white dark:bg-surface-800 shadow-elevation-low border border-surface-200 dark:border-surface-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand-500" />
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Industry Packs</h3>
          </div>
          {installedIndustries.length > 0 ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              {installedIndustries.length} Aktif
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              Belum diinstal
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(industryIcons).map(([id, Icon]) => {
            const installed = !!enabledPacks[id];
            return (
              <div
                key={id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  installed
                    ? industryColors[id]
                    : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-surface-700/50 opacity-60"
                }`}
              >
                {installed ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                )}
                <Icon size={16} className={installed ? "shrink-0" : "shrink-0 opacity-50"} />
                <span className="capitalize truncate">{id}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map(({ label, value, icon: Icon, bg, text, onClick }) => (
          <div key={label} className={`mobile-card group ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
            <div className="flex flex-col gap-2 lg:gap-3">
              <div className={`${bg} w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={text} />
              </div>
              <div>
                <p className="text-[11px] lg:text-xs text-slate-500 font-medium leading-tight">{label}</p>
                <p className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Schedule — manager/admin only */}
      {role !== "agent" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 mobile-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {role === "manager" ? "Aktivitas Tim (14 Hari)" : "Aktivitas Kunjungan (14 Hari)"}
            </h3>
            <button onClick={() => navigate("/analytics")} className="lg:hidden flex items-center gap-1 text-xs text-brand-600 font-medium">
              Detail <ArrowRight size={12} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={30} />
              <Tooltip />
              <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={2} dot={false} name="Rencana" />
              <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Selesai" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Schedule */}
        <div className="mobile-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {"Jadwal Hari Ini"}
            </h3>
            <button onClick={() => navigate("/visits")} className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {[
              { name: "PT Maju Bersama", time: "09:00", type: "Presentation", color: "bg-blue-500" },
              { name: "CV Santosa Jaya", time: "11:00", type: "Follow-up", color: "bg-amber-500" },
              { name: "UD Sumber Rezeki", time: "14:00", type: "Cold Call", color: "bg-slate-400" },
            ].map((visit) => (
              <div key={visit.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/50 active:bg-surface-100 transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${visit.color} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{visit.name}</p>
                  <p className="text-[11px] text-slate-500">{visit.time} · {visit.type}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Agent: Map + Daily Route */}
      {role === "agent" && (
        <div className="space-y-4">
          <AgentMap />

          {/* Sales Coach AI Panel */}
          {salesCoachEnabled && aiInsights && (
            <div className="mobile-card bg-gradient-to-br from-violet-50 to-brand-50 dark:from-violet-900/20 dark:to-brand-900/20 border border-violet-100 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-violet-500" />
                <h3 className="text-sm font-bold text-violet-700 dark:text-violet-400">Sales Coach AI</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-semibold">AI</span>
              </div>
              <div className="space-y-2">
                {aiInsights.insights?.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
              {aiInsights.nextActions && (
                <div className="mt-3 pt-3 border-t border-violet-100 dark:border-violet-800">
                  <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-2">Next Actions</p>
                  {aiInsights.nextActions.slice(0, 2).map((action: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 py-0.5">
                      <ChevronRight size={10} className="text-violet-400" />
                      {action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/leads")} className="mobile-card flex items-center gap-3 cursor-pointer bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800">
              <MapPin size={20} className="text-brand-600" />
              <div className="text-left">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">Kunjungan Baru</p>
                <p className="text-[11px] text-brand-500">Mulai check-in sekarang</p>
              </div>
            </button>
            <button onClick={() => navigate("/pipeline")} className="mobile-card flex items-center gap-3 cursor-pointer bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <TrendingUp size={20} className="text-emerald-600" />
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Update Pipeline</p>
                <p className="text-[11px] text-emerald-500">Pindahkan deal Anda</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Manager/Admin: Live Map Tracking */}
      {(role === "manager" || role === "admin" || role === "super_admin") && (
        <div className="space-y-4">
          <ManagerLiveMap />
          <button onClick={() => navigate("/analytics")} className="mobile-card flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-brand-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Lihat Performa Tim</p>
                <p className="text-[11px] text-slate-500">Analitik lengkap & leaderboard</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300" />
          </button>
        </div>
      )}

      {/* Mobile FAB */}
      <button onClick={() => navigate("/visits")} className="lg:hidden fixed bottom-24 right-4 w-14 h-14 rounded-2xl bg-brand-600 shadow-elevation-high flex items-center justify-center text-white active:scale-95 transition-transform z-30">
        <Calendar size={24} />
      </button>
    </div>
  );
}
