import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatIDR, initials } from "@visitflow/utils";
import { ArrowLeft, Camera, Wallet, CreditCard, Save, Power, Plus, X, Tag, Briefcase } from "lucide-react";
import { JOB_TITLE_PRESETS, getJobTitleLevel } from "@visitflow/shared/constants/job-titles";

const DEPARTMENTS = [
  { value: "", label: "Umum / belum ditentukan" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operasional" },
];

function Avatar({ name, url, size = 88 }: { name: string; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-gradient-to-br from-brand-500 to-indigo-600" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  );
}

const typeLabel: Record<string, string> = { office: "Staff Kantor", field: "Staff Lapangan" };

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignedComponents, setAssignedComponents] = useState<any[]>([]);
  const [allComponents, setAllComponents] = useState<any[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ componentId: "", amountOverride: "" });

  const fetchComponents = async () => {
    try {
      const [assignedRes, allRes] = await Promise.all([
        api.get<any>(`/payroll/employees/${id}/components`),
        api.get<any>("/payroll/components"),
      ]);
      setAssignedComponents(assignedRes.data || []);
      setAllComponents((allRes.data || []).filter((c: any) => c.isActive));
    } catch { /* non-HR roles get 403 here, which is fine — section stays empty */ }
  };

  const handleAssignComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.componentId) return;
    try {
      await api.post(`/payroll/employees/${id}/components`, {
        componentId: assignForm.componentId,
        amountOverride: assignForm.amountOverride ? Number(assignForm.amountOverride) : undefined,
      });
      setShowAssign(false);
      setAssignForm({ componentId: "", amountOverride: "" });
      fetchComponents();
    } catch (e: any) { alert(e.message || "Gagal assign komponen"); }
  };

  const handleUnassignComponent = async (componentId: string) => {
    try {
      await api.delete(`/payroll/employees/${id}/components/${componentId}`);
      fetchComponents();
    } catch (e: any) { alert(e.message); }
  };

  const [form, setForm] = useState({
    employeeType: "field", employmentStatus: "active", baseSalary: "",
    jobTitle: "", department: "",
    taxStatus: "TK/0", npwp: "", bankName: "", bankAccountNumber: "", bankAccountName: "",
    bpjsKesehatanEnrolled: false, bpjsKetenagakerjaanEnrolled: false, phone: "",
  });

  useEffect(() => {
    api.get<any>(`/employees/${id}`).then((res) => {
      const e = res.data;
      setEmployee(e);
      setForm({
        employeeType: e.employeeType, employmentStatus: e.employmentStatus,
        baseSalary: String(e.baseSalary || 0), jobTitle: e.user.jobTitle || "", department: e.department || "",
        taxStatus: e.taxStatus || "TK/0",
        npwp: e.npwp || "", bankName: e.bankName || "", bankAccountNumber: e.bankAccountNumber || "",
        bankAccountName: e.bankAccountName || "", bpjsKesehatanEnrolled: e.bpjsKesehatanEnrolled,
        bpjsKetenagakerjaanEnrolled: e.bpjsKetenagakerjaanEnrolled, phone: e.user.phone || "",
      });
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
    fetchComponents();
  }, [id]);

  const handlePhotoPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { ...form, baseSalary: Number(form.baseSalary) };
      if (photoPreview) payload.avatarUrl = photoPreview;
      const res = await api.patch<any>(`/employees/${id}`, payload);
      setEmployee(res.data);
      setPhotoPreview(null);
    } catch (e: any) { alert(e.message || "Gagal menyimpan"); }
    setSaving(false);
  };

  const toggleActive = async () => {
    setSaving(true);
    try {
      const res = await api.patch<any>(`/employees/${id}`, { isActive: !employee.user.isActive });
      setEmployee(res.data);
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!employee) return <div className="text-center py-20 text-slate-500">Karyawan tidak ditemukan</div>;

  return (
    <div className="page-enter space-y-6 max-w-2xl mx-auto pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"><ArrowLeft size={16} /> Kembali</button>

      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-6 shadow-elevation-high">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="relative group shrink-0">
            <Avatar name={employee.user.fullName} url={photoPreview || employee.user.avatarUrl} />
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
              <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center ring-2 ring-brand-700">
              <Camera size={13} className="text-brand-700" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoPick(f); }} />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{employee.user.fullName}</h1>
            <p className="text-white/70 text-sm truncate">{employee.user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">{typeLabel[employee.employeeType]}</span>
              <span className={`px-2.5 py-0.5 rounded-full backdrop-blur-sm text-xs font-semibold ${employee.user.isActive ? "bg-emerald-400/30" : "bg-red-400/30"}`}>
                {employee.user.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Jabatan & Departemen section */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Briefcase size={16} /> Jabatan & Departemen</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Jabatan</label>
            <input list="job-title-presets" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="mis. Staff"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            <datalist id="job-title-presets">
              {JOB_TITLE_PRESETS.map((jt) => <option key={jt} value={jt} />)}
            </datalist>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Departemen</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
              {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        {getJobTitleLevel(form.jobTitle) > 1 && (
          <p className="text-xs text-brand-600 dark:text-brand-400">Jabatan ini bisa melihat data karyawan dengan jabatan di bawahnya (hierarchy of control).</p>
        )}
      </div>

      {/* HR & Payroll section */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Wallet size={16} /> Penggajian & Pajak</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Gaji Pokok</label>
            <input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Status Pajak (PTKP)</label>
            <select value={form.taxStatus} onChange={(e) => setForm({ ...form, taxStatus: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
              {["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">NPWP (Opsional)</label>
          <input value={form.npwp} onChange={(e) => setForm({ ...form, npwp: e.target.value })} placeholder="xx.xxx.xxx.x-xxx.xxx"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        <div className="flex items-center gap-5 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={form.bpjsKesehatanEnrolled} onChange={(e) => setForm({ ...form, bpjsKesehatanEnrolled: e.target.checked })} className="rounded" />
            BPJS Kesehatan
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={form.bpjsKetenagakerjaanEnrolled} onChange={(e) => setForm({ ...form, bpjsKetenagakerjaanEnrolled: e.target.checked })} className="rounded" />
            BPJS Ketenagakerjaan
          </label>
        </div>
      </div>

      {/* Salary components section */}
      {allComponents.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Tag size={16} /> Komponen Gaji</h3>
            <button onClick={() => setShowAssign(true)} className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
              <Plus size={16} />
            </button>
          </div>
          {assignedComponents.length === 0 && <p className="text-xs text-slate-500">Belum ada komponen gaji untuk karyawan ini</p>}
          <div className="space-y-2">
            {assignedComponents.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{a.component.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.amountOverride != null ? formatIDR(a.amountOverride) : a.component.amountType === "percentage_of_base" ? `${a.component.defaultAmount}% gaji pokok` : formatIDR(a.component.defaultAmount)}
                  </p>
                </div>
                <button onClick={() => handleUnassignComponent(a.componentId)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank section */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard size={16} /> Rekening Bank</h3>
        <div className="grid grid-cols-2 gap-3">
          <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Nama Bank"
            className="px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          <input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} placeholder="No. Rekening"
            className="px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        <input value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} placeholder="Nama Pemilik Rekening"
          className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={toggleActive} disabled={saving}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 ${employee.user.isActive ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
          <Power size={16} /> {employee.user.isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/25">
          <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssign(false)} />
          <form onSubmit={handleAssignComponent} className="relative mobile-sheet lg:rounded-3xl lg:max-w-sm lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Komponen Gaji</h2>
              <button type="button" onClick={() => setShowAssign(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>
            <select required value={assignForm.componentId} onChange={(e) => setAssignForm({ ...assignForm, componentId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
              <option value="">Pilih komponen...</option>
              {allComponents.filter((c) => !assignedComponents.some((a) => a.componentId === c.id)).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input type="number" value={assignForm.amountOverride} onChange={(e) => setAssignForm({ ...assignForm, amountOverride: e.target.value })}
              placeholder="Nominal khusus (opsional, kosongkan untuk default)"
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold active:scale-[0.98] transition-all bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25">
              Tambahkan
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
