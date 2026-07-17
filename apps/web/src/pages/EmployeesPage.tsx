import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatIDR, initials } from "@visitflow/utils";
import {
  Plus, X, Search, Building2, MapPin as MapPinIcon, Camera, ChevronRight,
  Wallet, CreditCard, ShieldCheck, User as UserIcon, Mail, Phone,
} from "lucide-react";

interface Employee {
  id: string;
  employeeType: "office" | "field";
  employmentStatus: string;
  baseSalary: number;
  taxStatus: string;
  bpjsKesehatanEnrolled: boolean;
  bpjsKetenagakerjaanEnrolled: boolean;
  user: { id: string; email: string; fullName: string; phone: string | null; role: string; isActive: boolean; avatarUrl: string | null };
}

function Avatar({ name, url, size = 44 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-gradient-to-br from-brand-500 to-indigo-600"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}

const typeBadge: Record<string, string> = {
  office: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  field: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};
const typeLabel: Record<string, string> = { office: "Staff Kantor", field: "Staff Lapangan" };

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "office" | "field">("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultForm = () => ({
    email: "", password: "", fullName: "", phone: "", role: "agent",
    employeeType: "field" as "office" | "field",
    baseSalary: "", bankName: "", bankAccountNumber: "", bankAccountName: "",
    taxStatus: "TK/0", npwp: "", bpjsKesehatanEnrolled: false, bpjsKetenagakerjaanEnrolled: false,
    joinDate: new Date().toISOString().slice(0, 10),
  });
  const [form, setForm] = useState(defaultForm());

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/employees");
      setEmployees(res.data || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const filtered = employees.filter((e) => {
    if (typeFilter && e.employeeType !== typeFilter) return false;
    if (search && !e.user.fullName.toLowerCase().includes(search.toLowerCase()) && !e.user.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const officeCount = employees.filter((e) => e.employeeType === "office").length;
  const fieldCount = employees.filter((e) => e.employeeType === "field").length;

  const handlePhotoPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form, baseSalary: form.baseSalary ? Number(form.baseSalary) : 0 };
      if (photoPreview) payload.avatarUrl = photoPreview;
      await api.post("/employees", payload);
      setShowForm(false);
      setForm(defaultForm());
      setPhotoPreview(null);
      fetchEmployees();
    } catch (err: any) { alert(err.message || "Gagal menambah karyawan"); }
    setSaving(false);
  };

  return (
    <div className="page-enter space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Karyawan</h1>
          <p className="text-xs lg:text-sm text-slate-500">{isLoading ? "Memuat..." : `${employees.length} karyawan · ${officeCount} kantor · ${fieldCount} lapangan`}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-brand-500/20">
          <Plus size={18} /> <span className="hidden sm:inline">Tambah Karyawan</span>
        </button>
      </div>

      {/* Search + Type Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border-0 bg-white dark:bg-surface-800 text-slate-900 dark:text-white ring-1 ring-surface-200 dark:ring-surface-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(["", "office", "field"] as const).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${typeFilter === t ? "bg-brand-600 text-white" : "bg-white dark:bg-surface-800 text-slate-600 dark:text-slate-400 ring-1 ring-surface-200 dark:ring-surface-700"}`}>
            {t === "" ? "Semua" : typeLabel[t]}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[72px] bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <UserIcon size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Belum ada karyawan</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-brand-600 font-semibold">+ Tambah Karyawan Pertama</button>
        </div>
      )}

      {/* Employee list */}
      <div className="space-y-2">
        {filtered.map((emp) => (
          <div key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)}
            className="mobile-card cursor-pointer flex items-center gap-3 active:bg-surface-50 dark:active:bg-surface-700/50">
            <Avatar name={emp.user.fullName} url={emp.user.avatarUrl} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{emp.user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{emp.user.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeBadge[emp.employeeType]}`}>{typeLabel[emp.employeeType]}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{formatIDR(emp.baseSalary)}</span>
                {!emp.user.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Nonaktif</span>}
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 shrink-0" />
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form onSubmit={handleCreate} className="relative mobile-sheet lg:rounded-3xl lg:max-w-lg lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-5 animate-[pageIn_0.25s_ease-out]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Karyawan Baru</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            {/* Photo picker */}
            <div className="flex justify-center">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group">
                <Avatar name={form.fullName || "?"} url={photoPreview} size={84} />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center ring-2 ring-white dark:ring-surface-800">
                  <Camera size={13} className="text-white" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoPick(f); }} />
            </div>

            {/* Employee type toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(["field", "office"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, employeeType: t })}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${form.employeeType === t ? "bg-brand-600 text-white shadow-md" : "bg-surface-50 dark:bg-surface-900 text-slate-500 ring-1 ring-surface-200 dark:ring-surface-700"}`}>
                  {typeLabel[t]}
                </button>
              ))}
            </div>

            {/* Section: Akun */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><UserIcon size={11} /> Akun</p>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nama Lengkap *"
                className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2.5">
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email *"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="No HP"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password *"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            {/* Section: HR & Gaji */}
            <div className="space-y-2.5 border-t border-surface-200 dark:border-surface-700 pt-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Wallet size={11} /> Penggajian</p>
              <div className="grid grid-cols-2 gap-2.5">
                <input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} placeholder="Gaji Pokok (Rp)"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <select value={form.taxStatus} onChange={(e) => setForm({ ...form, taxStatus: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                  {["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"].map((s) => <option key={s} value={s}>{s} (PTKP)</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={form.bpjsKesehatanEnrolled} onChange={(e) => setForm({ ...form, bpjsKesehatanEnrolled: e.target.checked })} className="rounded" />
                  BPJS Kesehatan
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={form.bpjsKetenagakerjaanEnrolled} onChange={(e) => setForm({ ...form, bpjsKetenagakerjaanEnrolled: e.target.checked })} className="rounded" />
                  BPJS Ketenagakerjaan
                </label>
              </div>
            </div>

            {/* Section: Bank */}
            <div className="space-y-2.5 border-t border-surface-200 dark:border-surface-700 pt-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><CreditCard size={11} /> Rekening Bank (Opsional)</p>
              <div className="grid grid-cols-2 gap-2.5">
                <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Nama Bank"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                <input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} placeholder="No. Rekening"
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25">
              {saving ? "Menyimpan..." : "Simpan Karyawan"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
