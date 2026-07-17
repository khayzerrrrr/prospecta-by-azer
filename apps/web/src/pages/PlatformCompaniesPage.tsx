import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { INDUSTRIES } from "@visitflow/shared/industries";
import { Plus, X, Copy, Check, Building2, RefreshCw, ShieldAlert } from "lucide-react";

interface Company {
  id: string; name: string; slug: string; industry: string | null;
  subscriptionStatus: string; isActive: boolean; claimCode: string | null; isClaimed: boolean;
}

const statusColor: Record<string, string> = {
  trial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
const statusLabel: Record<string, string> = { trial: "Trial", active: "Aktif", suspended: "Suspended", cancelled: "Batal" };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-slate-500 hover:text-brand-600 transition-colors">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

export default function PlatformCompaniesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "" });
  const [justCreated, setJustCreated] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/companies");
      setCompanies(res.data || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, []);

  useEffect(() => { if (role === "master_account") fetchCompanies(); }, [fetchCompanies, role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post<any>("/companies", { name: form.name, industry: form.industry || undefined });
      setJustCreated(res.data);
      setForm({ name: "", industry: "" });
      fetchCompanies();
    } catch (err: any) { alert(err.message || "Gagal membuat perusahaan"); }
    setSaving(false);
  };

  const handleRegenerateCode = async (id: string) => {
    try {
      const res = await api.post<any>(`/companies/${id}/regenerate-code`);
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, claimCode: res.data.claimCode } : c));
    } catch (err: any) { alert(err.message); }
  };

  if (role !== "master_account") {
    return (
      <div className="text-center py-20">
        <ShieldAlert size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Halaman ini khusus untuk Platform Master</p>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Perusahaan</h1>
          <p className="text-xs lg:text-sm text-slate-500">{isLoading ? "Memuat..." : `${companies.length} perusahaan terdaftar`}</p>
        </div>
        <button onClick={() => { setShowForm(true); setJustCreated(null); }} className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-brand-500/20">
          <Plus size={18} /> <span className="hidden sm:inline">Perusahaan Baru</span>
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && companies.length === 0 && (
        <div className="text-center py-16">
          <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Belum ada perusahaan terdaftar</p>
        </div>
      )}

      <div className="space-y-2">
        {companies.map((c) => (
          <div key={c.id} className="mobile-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.name}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[c.subscriptionStatus]}`}>{statusLabel[c.subscriptionStatus]}</span>
                  {c.industry && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{INDUSTRIES[c.industry]?.label || c.industry}</span>}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.isClaimed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                    {c.isClaimed ? "Sudah Diklaim" : "Menunggu Klaim"}
                  </span>
                </div>
              </div>
            </div>
            {!c.isClaimed && c.claimCode && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Kode Klaim</p>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider">{c.claimCode}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <CopyButton text={c.claimCode} />
                  <button onClick={() => handleRegenerateCode(c.id)} className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-slate-500 hover:text-brand-600 transition-colors">
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative mobile-sheet lg:rounded-3xl lg:max-w-sm lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{justCreated ? "Perusahaan Dibuat" : "Perusahaan Baru"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            {justCreated ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <b>{justCreated.name}</b> berhasil dibuat. Bagikan kode klaim ini ke perusahaan lewat WA/email supaya mereka bisa daftar sebagai Admin Perusahaan:
                </p>
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700">
                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-white tracking-wider">{justCreated.claimCode}</p>
                  <CopyButton text={justCreated.claimCode || ""} />
                </div>
                <button onClick={() => { setShowForm(false); setJustCreated(null); }} className="w-full py-3 rounded-xl text-white font-semibold active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700">
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama Perusahaan"
                  className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="">Umum (tanpa industri spesifik)</option>
                  {Object.entries(INDUSTRIES).map(([id, spec]) => <option key={id} value={id}>{spec.label}</option>)}
                </select>
                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25">
                  {saving ? "Membuat..." : "Buat Perusahaan"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
