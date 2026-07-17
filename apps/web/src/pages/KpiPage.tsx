import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { initials } from "@visitflow/utils";
import { X, Target, Settings2, Trash2, ChevronRight, Save } from "lucide-react";

interface KpiDefinition {
  id: string; name: string; description: string | null; unit: string;
  targetValue: number; weight: number; appliesTo: "all" | "office" | "field"; isActive: boolean;
}
interface KpiScore {
  id: string; employeeProfileId: string; kpiDefinitionId: string; targetValue: number; actualValue: number;
  achievementPercent: number; notes: string | null; definition: KpiDefinition;
}
interface Employee {
  id: string; employeeType: "office" | "field";
  user: { id: string; fullName: string; avatarUrl: string | null; isActive: boolean };
}

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const appliesLabel: Record<string, string> = { all: "Semua", office: "Staff Kantor", field: "Staff Lapangan" };

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 bg-gradient-to-br from-brand-500 to-indigo-600">
      {initials(name)}
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 100) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function KpiPage() {
  const user = useAuthStore((s) => s.user);
  const isHr = user?.role === "admin" || user?.role === "super_admin";
  const canScore = user?.role !== "agent";
  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());

  const [definitions, setDefinitions] = useState<KpiDefinition[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scores, setScores] = useState<KpiScore[]>([]);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showDefinitions, setShowDefinitions] = useState(false);
  const [defForm, setDefForm] = useState<{ name: string; unit: string; targetValue: string; weight: string; appliesTo: "all" | "office" | "field" }>({ name: "", unit: "", targetValue: "", weight: "100", appliesTo: "all" });
  const [savingDef, setSavingDef] = useState(false);

  const [scoringEmployee, setScoringEmployee] = useState<Employee | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [savingScores, setSavingScores] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const defsRes = await api.get<any>("/kpi/definitions");
      setDefinitions(defsRes.data || []);

      if (canScore) {
        const [empRes, scoresRes] = await Promise.all([
          api.get<any>("/employees"),
          api.get<any>(`/kpi/scores?periodMonth=${periodMonth}&periodYear=${periodYear}`),
        ]);
        setEmployees(empRes.data || []);
        setScores(scoresRes.data || []);
      } else {
        const meRes = await api.get<any>("/employees/me").catch(() => null);
        if (meRes?.data) {
          setMyProfileId(meRes.data.id);
          const scoresRes = await api.get<any>(`/kpi/scores?periodMonth=${periodMonth}&periodYear=${periodYear}`);
          setScores(scoresRes.data || []);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [periodMonth, periodYear, canScore]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const employeeSummaries = useMemo(() => {
    return employees.filter((e) => e.user.isActive).map((emp) => {
      const applicable = definitions.filter((d) => d.isActive && (d.appliesTo === "all" || d.appliesTo === emp.employeeType));
      const empScores = scores.filter((s) => s.employeeProfileId === emp.id);
      const totalWeight = applicable.reduce((s, d) => s + d.weight, 0);
      const overall = totalWeight > 0
        ? applicable.reduce((s, d) => {
            const sc = empScores.find((x) => x.kpiDefinitionId === d.id);
            return s + (sc ? sc.achievementPercent : 0) * d.weight;
          }, 0) / totalWeight
        : 0;
      return { employee: emp, applicable, scores: empScores, overall: Math.round(overall * 10) / 10 };
    });
  }, [employees, definitions, scores]);

  const myApplicable = useMemo(() => definitions.filter((d) => d.isActive), [definitions]);
  const myOverall = useMemo(() => {
    const totalWeight = myApplicable.reduce((s, d) => s + d.weight, 0);
    if (totalWeight === 0) return 0;
    const sum = myApplicable.reduce((s, d) => {
      const sc = scores.find((x) => x.kpiDefinitionId === d.id);
      return s + (sc ? sc.achievementPercent : 0) * d.weight;
    }, 0);
    return Math.round((sum / totalWeight) * 10) / 10;
  }, [myApplicable, scores]);

  const handleCreateDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDef(true);
    try {
      await api.post("/kpi/definitions", {
        name: defForm.name, unit: defForm.unit,
        targetValue: Number(defForm.targetValue) || 0, weight: Number(defForm.weight) || 100,
        appliesTo: defForm.appliesTo,
      });
      setDefForm({ name: "", unit: "", targetValue: "", weight: "100", appliesTo: "all" });
      const res = await api.get<any>("/kpi/definitions");
      setDefinitions(res.data || []);
    } catch (err: any) { alert(err.message || "Gagal menambah KPI"); }
    setSavingDef(false);
  };

  const handleDeactivateDefinition = async (id: string) => {
    try {
      await api.patch(`/kpi/definitions/${id}`, { isActive: false });
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const openScoring = (emp: Employee) => {
    const summary = employeeSummaries.find((s) => s.employee.id === emp.id);
    const inputs: Record<string, string> = {};
    summary?.applicable.forEach((d) => {
      const sc = summary.scores.find((x) => x.kpiDefinitionId === d.id);
      inputs[d.id] = sc ? String(sc.actualValue) : "";
    });
    setScoreInputs(inputs);
    setScoringEmployee(emp);
  };

  const handleSaveScores = async () => {
    if (!scoringEmployee) return;
    setSavingScores(true);
    try {
      const summary = employeeSummaries.find((s) => s.employee.id === scoringEmployee.id);
      for (const d of summary?.applicable || []) {
        const val = scoreInputs[d.id];
        if (val === undefined || val === "") continue;
        await api.post("/kpi/scores", {
          employeeProfileId: scoringEmployee.id, kpiDefinitionId: d.id,
          periodMonth, periodYear, targetValue: d.targetValue, actualValue: Number(val),
        });
      }
      setScoringEmployee(null);
      const scoresRes = await api.get<any>(`/kpi/scores?periodMonth=${periodMonth}&periodYear=${periodYear}`);
      setScores(scoresRes.data || []);
    } catch (err: any) { alert(err.message || "Gagal menyimpan skor"); }
    setSavingScores(false);
  };

  return (
    <div className="page-enter space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">KPI</h1>
          <p className="text-xs lg:text-sm text-slate-500">{monthNames[periodMonth - 1]} {periodYear}</p>
        </div>
        {isHr && (
          <button onClick={() => setShowDefinitions(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 text-sm font-semibold text-slate-600 dark:text-slate-300 active:scale-95 transition-all">
            <Settings2 size={16} /> <span className="hidden sm:inline">Kelola KPI</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
          {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Personal view (agent) */}
      {!canScore && !isLoading && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-6 shadow-elevation-high">
            <p className="text-white/70 text-xs">Skor KPI Keseluruhan</p>
            <p className="text-3xl font-bold mt-1">{myOverall}%</p>
          </div>
          {myApplicable.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Belum ada KPI yang ditetapkan</p>}
          <div className="space-y-2">
            {myApplicable.map((d) => {
              const sc = scores.find((s) => s.kpiDefinitionId === d.id);
              return (
                <div key={d.id} className="mobile-card">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.name}</p>
                    <span className={`text-sm font-bold ${scoreColor(sc?.achievementPercent || 0)}`}>{sc ? `${sc.achievementPercent}%` : "-"}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Target: {d.targetValue} {d.unit} {sc ? `· Aktual: ${sc.actualValue} ${d.unit}` : "· Belum dinilai"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HR/manager view */}
      {canScore && !isLoading && (
        <div className="space-y-2">
          {employeeSummaries.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Belum ada karyawan</p>}
          {employeeSummaries.map(({ employee, applicable, overall }) => (
            <div key={employee.id} onClick={() => openScoring(employee)}
              className="mobile-card cursor-pointer flex items-center gap-3 active:bg-surface-50 dark:active:bg-surface-700/50">
              <Avatar name={employee.user.fullName} url={employee.user.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{employee.user.fullName}</p>
                <p className="text-xs text-slate-500">{applicable.length} KPI</p>
              </div>
              <span className={`text-sm font-bold ${scoreColor(overall)}`}>{applicable.length > 0 ? `${overall}%` : "-"}</span>
              <ChevronRight size={18} className="text-slate-300 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Definitions manager */}
      {showDefinitions && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDefinitions(false)} />
          <div className="relative mobile-sheet lg:rounded-3xl lg:max-w-lg lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kelola KPI</h2>
              <button type="button" onClick={() => setShowDefinitions(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            <div className="space-y-2">
              {definitions.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Belum ada KPI</p>}
              {definitions.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Target {d.targetValue} {d.unit} · Bobot {d.weight} · {appliesLabel[d.appliesTo]}</p>
                  </div>
                  <button onClick={() => handleDeactivateDefinition(d.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateDefinition} className="space-y-2.5 border-t border-surface-200 dark:border-surface-700 pt-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tambah KPI Baru</p>
              <input required value={defForm.name} onChange={(e) => setDefForm({ ...defForm, name: e.target.value })} placeholder="Nama KPI (mis. Jumlah Kunjungan)"
                className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2.5">
                <input required value={defForm.unit} onChange={(e) => setDefForm({ ...defForm, unit: e.target.value })} placeholder="Satuan (mis. kunjungan)"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <input required type="number" value={defForm.targetValue} onChange={(e) => setDefForm({ ...defForm, targetValue: e.target.value })} placeholder="Target"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input required type="number" value={defForm.weight} onChange={(e) => setDefForm({ ...defForm, weight: e.target.value })} placeholder="Bobot"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <select value={defForm.appliesTo} onChange={(e) => setDefForm({ ...defForm, appliesTo: e.target.value as any })}
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="all">Semua Karyawan</option>
                  <option value="office">Staff Kantor</option>
                  <option value="field">Staff Lapangan</option>
                </select>
              </div>
              <button type="submit" disabled={savingDef}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25">
                {savingDef ? "Menyimpan..." : "Tambah KPI"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scoring modal */}
      {scoringEmployee && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setScoringEmployee(null)} />
          <div className="relative mobile-sheet lg:rounded-3xl lg:max-w-md lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={scoringEmployee.user.fullName} url={scoringEmployee.user.avatarUrl} />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{scoringEmployee.user.fullName}</h2>
                  <p className="text-xs text-slate-500">{monthNames[periodMonth - 1]} {periodYear}</p>
                </div>
              </div>
              <button type="button" onClick={() => setScoringEmployee(null)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {(employeeSummaries.find((s) => s.employee.id === scoringEmployee.id)?.applicable || []).map((d) => (
                <div key={d.id}>
                  <label className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><Target size={11} /> {d.name} (target {d.targetValue} {d.unit})</label>
                  <input type="number" value={scoreInputs[d.id] || ""} onChange={(e) => setScoreInputs({ ...scoreInputs, [d.id]: e.target.value })}
                    placeholder={`Aktual (${d.unit})`}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                </div>
              ))}
            </div>

            <button onClick={handleSaveScores} disabled={savingScores}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25">
              <Save size={16} /> {savingScores ? "Menyimpan..." : "Simpan Skor"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
