import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { formatIDR } from "@visitflow/utils";
import { Plus, X, Wallet, ChevronRight, Settings2, Trash2, Receipt } from "lucide-react";

interface SalaryComponent {
  id: string; name: string; type: "allowance" | "deduction" | "bonus" | "incentive";
  amountType: "fixed" | "percentage_of_base"; defaultAmount: number; taxable: boolean; isActive: boolean;
}
interface PayrollRun {
  id: string; periodMonth: number; periodYear: number; status: "draft" | "finalized" | "paid";
  payslips?: Array<{ netPay: number }>;
}
interface MyPayslip {
  id: string; netPay: number; grossPay: number; status: string;
  run: { periodMonth: number; periodYear: number; status: string };
}

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const typeLabel: Record<string, string> = { allowance: "Tunjangan", deduction: "Potongan", bonus: "Bonus", incentive: "Insentif" };
const typeColor: Record<string, string> = {
  allowance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deduction: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  bonus: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  incentive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};
const statusLabel: Record<string, string> = { draft: "Draft", finalized: "Difinalisasi", paid: "Sudah Dibayar" };
const statusColor: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  finalized: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function PayrollPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isHr = user?.role === "admin" || user?.role === "super_admin";

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [myPayslips, setMyPayslips] = useState<MyPayslip[]>([]);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComponents, setShowComponents] = useState(false);
  const [showRunForm, setShowRunForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runError, setRunError] = useState("");
  const now = new Date();
  const [runForm, setRunForm] = useState({ periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(), notes: "" });
  const [componentForm, setComponentForm] = useState<{ name: string; type: "allowance" | "deduction" | "bonus" | "incentive"; amountType: "fixed" | "percentage_of_base"; defaultAmount: string; taxable: boolean }>({ name: "", type: "allowance", amountType: "fixed", defaultAmount: "", taxable: true });
  const [savingComponent, setSavingComponent] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isHr) {
        const [runsRes, compRes] = await Promise.all([
          api.get<any>("/payroll/runs"),
          api.get<any>("/payroll/components"),
        ]);
        setRuns(runsRes.data || []);
        setComponents(compRes.data || []);
      } else {
        const res = await api.get<any>("/payroll/payslips/me");
        setMyPayslips(res.data || []);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [isHr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setRunError("");
    try {
      const res = await api.post<any>("/payroll/runs", runForm);
      if (!res.success) { setRunError(res.error || "Gagal membuat payroll run"); setCreating(false); return; }
      setShowRunForm(false);
      navigate(`/payroll/runs/${res.data.id}`);
    } catch (err: any) { setRunError(err.message || "Gagal membuat payroll run"); }
    setCreating(false);
  };

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingComponent(true);
    try {
      await api.post("/payroll/components", { ...componentForm, defaultAmount: Number(componentForm.defaultAmount) || 0 });
      setComponentForm({ name: "", type: "allowance", amountType: "fixed", defaultAmount: "", taxable: true });
      const res = await api.get<any>("/payroll/components");
      setComponents(res.data || []);
    } catch (err: any) { alert(err.message || "Gagal menambah komponen"); }
    setSavingComponent(false);
  };

  const handleDeactivateComponent = async (id: string) => {
    try {
      await api.patch(`/payroll/components/${id}`, { isActive: false });
      setComponents((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  // ---- Non-HR: personal payslip view ----
  if (!isHr) {
    return (
      <div className="page-enter space-y-4 pb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Slip Gaji Saya</h1>
          <p className="text-xs lg:text-sm text-slate-500">{isLoading ? "Memuat..." : `${myPayslips.length} slip gaji`}</p>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && myPayslips.length === 0 && (
          <div className="text-center py-16">
            <Receipt size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Belum ada slip gaji</p>
          </div>
        )}

        <div className="space-y-2">
          {myPayslips.map((p) => (
            <div key={p.id} onClick={() => navigate(`/payroll/payslips/${p.id}`)}
              className="mobile-card cursor-pointer flex items-center justify-between active:bg-surface-50 dark:active:bg-surface-700/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{monthNames[p.run.periodMonth - 1]} {p.run.periodYear}</p>
                <p className="text-xs text-slate-500 mt-0.5">Gaji Bersih: <span className="font-semibold text-emerald-600">{formatIDR(p.netPay)}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>{statusLabel[p.status]}</span>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- HR: full payroll management ----
  return (
    <div className="page-enter space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Payroll</h1>
          <p className="text-xs lg:text-sm text-slate-500">{isLoading ? "Memuat..." : `${runs.length} periode payroll`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowComponents(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 text-sm font-semibold text-slate-600 dark:text-slate-300 active:scale-95 transition-all">
            <Settings2 size={16} /> <span className="hidden sm:inline">Komponen</span>
          </button>
          <button onClick={() => setShowRunForm(true)} className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-brand-500/20">
            <Plus size={18} /> <span className="hidden sm:inline">Jalankan Payroll</span>
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
        Perhitungan PPh21 &amp; BPJS bersifat perkiraan (metode bracket tahunan). Verifikasi dengan konsultan pajak sebelum digunakan untuk pembayaran gaji sesungguhnya.
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && runs.length === 0 && (
        <div className="text-center py-16">
          <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Belum ada payroll run</p>
          <button onClick={() => setShowRunForm(true)} className="mt-3 text-sm text-brand-600 font-semibold">+ Jalankan Payroll Pertama</button>
        </div>
      )}

      <div className="space-y-2">
        {runs.map((run) => {
          const total = (run.payslips || []).reduce((s, p) => s + p.netPay, 0);
          return (
            <div key={run.id} onClick={() => navigate(`/payroll/runs/${run.id}`)}
              className="mobile-card cursor-pointer flex items-center justify-between active:bg-surface-50 dark:active:bg-surface-700/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{monthNames[run.periodMonth - 1]} {run.periodYear}</p>
                {total > 0 && <p className="text-xs text-slate-500 mt-0.5">Total: <span className="font-semibold">{formatIDR(total)}</span></p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[run.status]}`}>{statusLabel[run.status]}</span>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Run Modal */}
      {showRunForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRunForm(false)} />
          <form onSubmit={handleCreateRun} className="relative mobile-sheet lg:rounded-3xl lg:max-w-sm lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Jalankan Payroll</h2>
              <button type="button" onClick={() => setShowRunForm(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>
            {runError && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{runError}</p>}
            <div className="grid grid-cols-2 gap-2.5">
              <select value={runForm.periodMonth} onChange={(e) => setRunForm({ ...runForm, periodMonth: Number(e.target.value) })}
                className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <input type="number" value={runForm.periodYear} onChange={(e) => setRunForm({ ...runForm, periodYear: Number(e.target.value) })}
                className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            </div>
            <input value={runForm.notes} onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })} placeholder="Catatan (opsional)"
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            <p className="text-xs text-slate-500">Slip gaji akan dibuat otomatis untuk semua karyawan aktif berdasarkan gaji pokok, komponen yang di-assign, dan data absensi periode ini.</p>
            <button type="submit" disabled={creating}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25">
              {creating ? "Memproses..." : "Buat & Hitung Payroll"}
            </button>
          </form>
        </div>
      )}

      {/* Components Manager */}
      {showComponents && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowComponents(false)} />
          <div className="relative mobile-sheet lg:rounded-3xl lg:max-w-lg lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Komponen Gaji</h2>
              <button type="button" onClick={() => setShowComponents(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            <div className="space-y-2">
              {components.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Belum ada komponen gaji</p>}
              {components.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColor[c.type]}`}>{typeLabel[c.type]}</span>
                      <span className="text-[10px] text-slate-500">{c.amountType === "percentage_of_base" ? `${c.defaultAmount}% dari gaji pokok` : formatIDR(c.defaultAmount)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeactivateComponent(c.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateComponent} className="space-y-2.5 border-t border-surface-200 dark:border-surface-700 pt-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tambah Komponen Baru</p>
              <input required value={componentForm.name} onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })} placeholder="Nama Komponen (mis. Tunjangan Makan)"
                className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2.5">
                <select value={componentForm.type} onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value as any })}
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  {Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={componentForm.amountType} onChange={(e) => setComponentForm({ ...componentForm, amountType: e.target.value as any })}
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="fixed">Nominal Tetap</option>
                  <option value="percentage_of_base">% dari Gaji Pokok</option>
                </select>
              </div>
              <input required type="number" value={componentForm.defaultAmount} onChange={(e) => setComponentForm({ ...componentForm, defaultAmount: e.target.value })}
                placeholder={componentForm.amountType === "percentage_of_base" ? "Persentase (%)" : "Nominal (Rp)"}
                className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={componentForm.taxable} onChange={(e) => setComponentForm({ ...componentForm, taxable: e.target.checked })} className="rounded" />
                Kena PPh21 (masuk perhitungan pajak)
              </label>
              <button type="submit" disabled={savingComponent}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25">
                {savingComponent ? "Menyimpan..." : "Tambah Komponen"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
