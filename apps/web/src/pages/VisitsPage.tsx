import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { usePackStore } from "../stores/packStore";
import { INDUSTRIES } from "../components/packs/IndustryFields";
import { MapPin, Clock, Calendar, X, Sparkles } from "lucide-react";

interface Visit { id: string; title: string; leadId: string; userId: string; visitType: string; status: string; scheduledDate: string; scheduledStartTime: string | null; durationMinutes: number | null; checkinTime: string | null; checkoutTime: string | null; }
const statusLabels: Record<string, string> = { planned: "Terencana", checked_in: "Check-in", in_progress: "Proses", completed: "Selesai", cancelled: "Batal", no_show: "Tidak Hadir" };
const statusColors: Record<string, string> = { planned: "bg-blue-100 text-blue-700", checked_in: "bg-green-100 text-green-700", in_progress: "bg-yellow-100 text-yellow-700", completed: "bg-slate-100 text-slate-700", cancelled: "bg-red-100 text-red-700", no_show: "bg-orange-100 text-orange-700" };

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", leadId: "", scheduledDate: new Date().toISOString().slice(0, 10), scheduledStartTime: "09:00", visitType: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Get active industry pack for visit templates
  const enabledPacks = usePackStore((s) => s.enabledPacks);
  const activeIndustryId = Object.keys(enabledPacks).find((k) =>
    ["education", "banking", "healthcare", "property", "automotive", "manufacturing", "retail", "saas", "distributor"].includes(k)
  );
  const industrySpec = activeIndustryId ? INDUSTRIES[activeIndustryId] : null;

  // Find selected lead's industry
  const selectedLead = useMemo(() => leads.find(l => l.id === form.leadId), [leads, form.leadId]);
  const leadIndustry = selectedLead?.industry;
  const leadSpec = leadIndustry && INDUSTRIES[leadIndustry] ? INDUSTRIES[leadIndustry] : industrySpec;
  const visitTemplates = leadSpec?.visitTemplates || [];
  const genericTypes = ["scheduled", "cold_call", "follow_up", "presentation", "closing"];

  const fetchVisits = async () => {
    try {
      const params = new URLSearchParams(); if (status) params.set("status", status);
      const res = await api.get<any>(`/visits?${params}`); setVisits(res.data || []);
    } catch (e: any) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchVisits(); }, [status]);
  useEffect(() => { api.get<any>("/leads?perPage=100").then(r => setLeads(r.data || [])).catch(() => {}); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadId) return alert("Pilih prospek terlebih dahulu");
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.visitType) payload.visitType = "scheduled";
      const res = await api.post<any>("/visits", payload);
      setShowForm(false); setForm({ title: "", leadId: "", scheduledDate: new Date().toISOString().slice(0, 10), scheduledStartTime: "09:00", visitType: "" });
      navigate(`/visits/${res.data.id}`);
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kunjungan</h1><p className="text-sm text-slate-500 mt-0.5">{visits.length} kunjungan</p></div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-surface-200 bg-white dark:bg-surface-800 dark:border-surface-700 dark:text-white">
            <option value="">Semua Status</option>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">+ Jadwalkan</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <form onSubmit={handleCreate} className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-high p-6 w-full max-w-md mx-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Jadwalkan Kunjungan</h2>
                {leadSpec && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${leadSpec.bg} ${leadSpec.text}`}>{leadSpec.label}</span>}
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-surface-100"><X size={18} /></button>
            </div>

            <select value={form.leadId} onChange={(e) => setForm({...form, leadId: e.target.value})} required
              className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm">
              <option value="">Pilih Prospek *</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.companyName}{l.industry ? ` (${l.industry})` : ""}{l.city ? ` - ${l.city}` : ""}
                </option>
              ))}
            </select>

            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder={leadSpec ? `Judul ${leadSpec.metrics.visits} *` : "Judul kunjungan *"} required
              className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.scheduledDate} onChange={(e) => setForm({...form, scheduledDate: e.target.value})}
                className="px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />
              <input type="time" value={form.scheduledStartTime} onChange={(e) => setForm({...form, scheduledStartTime: e.target.value})}
                className="px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />
            </div>

            {/* Industry visit templates */}
            {visitTemplates.length > 0 && (
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold ${leadSpec!.text} uppercase tracking-wider flex items-center gap-1`}>
                  <Sparkles size={10} /> Template {leadSpec!.label}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {visitTemplates.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setForm({...form, visitType: t.label, title: t.label})}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full font-medium border transition-all ${
                        form.visitType === t.label
                          ? `${leadSpec!.bg} ${leadSpec!.text} ${leadSpec!.border}`
                          : "bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-slate-500 hover:border-brand-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generic visit type fallback */}
            <select value={form.visitType} onChange={(e) => setForm({...form, visitType: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm">
              <option value="">Tipe Kunjungan</option>
              {visitTemplates.length > 0 && (
                <optgroup label={`--- ${leadSpec!.label} ---`}>
                  {visitTemplates.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                </optgroup>
              )}
              <optgroup label="--- Umum ---">
                {genericTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </optgroup>
            </select>

            <button type="submit" disabled={saving}
              className={`w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50 transition-all ${
                leadSpec ? `bg-gradient-to-r ${leadSpec.gradient} hover:opacity-90` : "bg-brand-600 hover:bg-brand-700"
              }`}>
              {saving ? "Menyimpan..." : "Jadwalkan"}
            </button>
          </form>
        </div>
      )}

      {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      : visits.length === 0 ? <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center text-slate-500">Belum ada kunjungan. Klik "Jadwalkan" untuk membuat.</div>
      : <div className="space-y-3">{visits.map((v) => (
        <div key={v.id} onClick={() => navigate(`/visits/${v.id}`)} className="bg-white dark:bg-surface-800 p-4 rounded-xl shadow-elevation-low hover:shadow-elevation-mid cursor-pointer transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center"><MapPin size={18} className="text-brand-600 dark:text-brand-400" /></div>
              <div><p className="text-sm font-semibold text-slate-900 dark:text-white">{v.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar size={12} /> {v.scheduledDate}</span>{v.scheduledStartTime && <span className="flex items-center gap-1"><Clock size={12} /> {v.scheduledStartTime}</span>}{v.durationMinutes && <span>{v.durationMinutes} menit</span>}</div>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[v.status] || "bg-slate-100"}`}>{statusLabels[v.status] || v.status}</span>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}
