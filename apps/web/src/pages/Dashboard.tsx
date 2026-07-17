import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { api } from "../services/api";
import { getJobTitleLevel } from "@visitflow/shared/constants/job-titles";
import { MapPin, TrendingUp, DollarSign, ClipboardCheck, Calendar, ArrowRight, Plus, Shield, Target, Sparkles, Lightbulb, ChevronRight, Fingerprint, Wallet, UserCog, Users } from "lucide-react";
import { AgentMap } from "../components/dashboard/AgentMap";
import { ManagerLiveMap } from "../components/dashboard/ManagerLiveMap";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Summary { todayVisits: number; monthVisits: number; pipelineValue: number; conversionRate: number; pendingFollowUps: number }

const roleLabel: Record<string, string> = {
  master_account: "Platform Master", super_admin: "Admin Perusahaan", admin: "Admin", manager: "Manager", agent: "Agent",
};

// Dashboard "variant" is a separate concern from role (which governs data
// access) — it decides which widget set is most useful to show. Priority:
// executive (admin/super_admin/jobTitle level 4+) > team (manager/level 3)
// > sales/hr department > generic fallback.
type Variant = "executive" | "team" | "sales" | "hr" | "generic";

function resolveVariant(role: string, jobTitle: string | null, department: string | null): Variant {
  const level = getJobTitleLevel(jobTitle);
  if (role === "admin" || role === "super_admin" || level >= 4) return "executive";
  if (role === "manager" || level === 3) return "team";
  if (department === "hr") return "hr";
  if (department === "sales" || role === "agent") return "sales";
  return "generic";
}

const variantGreeting: Record<Variant, string> = {
  executive: "Seluruh sistem dalam kendali Anda",
  team: "Pantau performa tim Anda hari ini",
  sales: "Siap menjalankan kunjungan hari ini?",
  hr: "Kelola kehadiran, payroll & KPI tim",
  generic: "Selamat bekerja hari ini",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "agent";
  const variant = useMemo(() => resolveVariant(role, user?.jobTitle ?? null, user?.department ?? null), [role, user?.jobTitle, user?.department]);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [salesCoachEnabled, setSalesCoachEnabled] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [myPayslips, setMyPayslips] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCrmData() {
      try {
        const s = await api.get<any>("/analytics/summary");
        const t = await api.get<any>("/analytics/visit-trends");
        if (s.data) setSummary(s.data);
        if (t.data) setTrends(t.data.slice(-14));

        if (variant === "sales") {
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
    if (variant === "executive" || variant === "team" || variant === "sales") fetchCrmData();
  }, [variant]);

  useEffect(() => {
    async function fetchPersonalData() {
      try {
        const [today, payslips] = await Promise.all([
          api.get<any>("/attendance/today").catch(() => null),
          api.get<any>("/payroll/payslips/me").catch(() => null),
        ]);
        if (today?.data) setTodayAttendance(today.data);
        if (payslips?.data) setMyPayslips(payslips.data);
      } catch {}
    }
    if (variant === "hr" || variant === "generic") fetchPersonalData();
  }, [variant]);

  const statsByVariant: Record<"executive" | "team" | "sales", { label: string; value: string; icon: any; bg: string; text: string; onClick?: () => void }[]> = {
    executive: [
      { label: "Kunjungan Bulan Ini", value: String(summary?.monthVisits ?? "0"), icon: MapPin, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
      { label: "Pipeline Value", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary?.pipelineValue ?? 0), icon: DollarSign, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
      { label: "Konversi", value: `${summary?.conversionRate ?? 0}%`, icon: TrendingUp, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
      { label: "Karyawan", value: "Kelola", icon: UserCog, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", onClick: () => navigate("/employees") },
    ],
    team: [
      { label: "Kunjungan Tim", value: String(summary?.monthVisits ?? "0"), icon: MapPin, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
      { label: "Pipeline Tim", value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(summary?.pipelineValue ?? 0), icon: DollarSign, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
      { label: "Konversi Tim", value: `${summary?.conversionRate ?? 0}%`, icon: TrendingUp, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
      { label: "Follow-up Tim", value: String(summary?.pendingFollowUps ?? "0"), icon: ClipboardCheck, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
    ],
    sales: [
      { label: "Target Hari Ini", value: "5 kunjungan", icon: Target, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
      { label: "Selesai Bulan Ini", value: String(summary?.monthVisits ?? "0"), icon: MapPin, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
      { label: "Deal Aktif", value: "0", icon: DollarSign, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", onClick: () => navigate("/pipeline") },
      { label: "Follow-up Saya", value: String(summary?.pendingFollowUps ?? "0"), icon: ClipboardCheck, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", onClick: () => navigate("/follow-ups") },
    ],
  };

  const stats = variant === "hr" || variant === "generic" ? [] : statsByVariant[variant];

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
        <p className="text-xs text-slate-400 mt-0.5">{variantGreeting[variant]}</p>
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
          <p className="text-sm text-slate-500 mt-0.5">{variantGreeting[variant]}</p>
        </div>
        {(variant === "executive" || variant === "team" || variant === "sales") && (
          <button onClick={() => navigate("/visits")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all active:scale-95">
            <Calendar size={16} /> Jadwalkan Kunjungan
          </button>
        )}
      </div>

      {/* Stats Grid — executive/team/sales only */}
      {stats.length > 0 && (
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
      )}

      {/* Chart — executive/team only */}
      {(variant === "executive" || variant === "team") && (
        <div className="mobile-card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            {variant === "team" ? "Aktivitas Tim (14 Hari)" : "Aktivitas Kunjungan (14 Hari)"}
          </h3>
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
      )}

      {/* Sales: Map + Sales Coach + quick actions */}
      {variant === "sales" && (
        <div className="space-y-4">
          <AgentMap />

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

      {/* HR: attendance overview + payroll/KPI shortcuts */}
      {variant === "hr" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate("/attendance")} className="mobile-card flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><Fingerprint size={20} className="text-blue-600" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Absensi</p>
              <p className="text-[11px] text-slate-500">Kelola kehadiran tim</p>
            </div>
          </button>
          <button onClick={() => navigate("/payroll")} className="mobile-card flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center"><Wallet size={20} className="text-emerald-600" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Payroll</p>
              <p className="text-[11px] text-slate-500">Jalankan & pantau gaji</p>
            </div>
          </button>
          <button onClick={() => navigate("/employees")} className="mobile-card flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center"><Users size={20} className="text-violet-600" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Karyawan</p>
              <p className="text-[11px] text-slate-500">Kelola data karyawan</p>
            </div>
          </button>
        </div>
      )}

      {/* Generic: own attendance + own payslip + own KPI */}
      {variant === "generic" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate("/attendance")} className="mobile-card flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><Fingerprint size={20} className="text-blue-600" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Absensi Saya</p>
              <p className="text-[11px] text-slate-500">{todayAttendance?.checkinTime ? "Sudah check-in" : "Belum absen"}</p>
            </div>
          </button>
          <button onClick={() => navigate("/payroll")} className="mobile-card flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center"><Wallet size={20} className="text-emerald-600" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Slip Gaji</p>
              <p className="text-[11px] text-slate-500">{myPayslips.length} slip tersedia</p>
            </div>
          </button>
          <button onClick={() => navigate("/kpi")} className="mobile-card flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center"><Target size={20} className="text-violet-600" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">KPI Saya</p>
              <p className="text-[11px] text-slate-500">Lihat skor performa</p>
            </div>
          </button>
        </div>
      )}

      {/* Executive/Team: Live Map Tracking */}
      {(variant === "executive" || variant === "team") && (
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
