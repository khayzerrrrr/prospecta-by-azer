import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { usePackStore } from "../stores/packStore";
import { SchoolUpload } from "../components/packs/SchoolUpload";
import { IndustryFields, INDUSTRIES } from "../components/packs/IndustryFields";
import { Plus, X, Search, SlidersHorizontal, ChevronRight, MapPin, GraduationCap, Upload, Building2, Sparkles } from "lucide-react";

interface Lead {
  id: string; companyName: string; contactName: string | null;
  phone: string | null; city: string | null;
  status: string; qualification: string;
  lastContactedAt: string | null; createdAt: string;
}

const qualBadge: Record<string, string> = {
  hot: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warm: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cold: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusColor: Record<string, string> = {
  new: "bg-slate-400", contacted: "bg-blue-400", qualified: "bg-emerald-400", converted: "bg-violet-400",
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const enabledPacks = usePackStore((s) => s.enabledPacks);
  const packCount = Object.keys(enabledPacks).length;
  const eduEnabled = !!enabledPacks["education"];
  const activeIndustryId = Object.keys(enabledPacks).find((k) =>
    ["education", "banking", "healthcare", "property", "automotive", "manufacturing", "retail", "saas", "distributor"].includes(k)
  );
  const industrySpec = activeIndustryId ? INDUSTRIES[activeIndustryId] : null;
  const [showSchoolUpload, setShowSchoolUpload] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [qualificationF, setQualificationF] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({ companyName: "", contactName: "", phone: "", city: "", status: "new", qualification: "cold", latitude: "", longitude: "", level: "", studentCount: "" });
  const [saving, setSaving] = useState(false);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page)); params.set("perPage", "20");
      if (search) params.set("search", search);
      if (statusF) params.set("status", statusF);
      if (qualificationF) params.set("qualification", qualificationF);
      const res = await api.get<any>(`/leads?${params}`);
      setLeads(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (e: any) { console.error(e); }
    setIsLoading(false);
  }, [page, search, statusF, qualificationF]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload: any = { ...form };
      if (form.latitude) payload.latitude = parseFloat(form.latitude);
      if (form.longitude) payload.longitude = parseFloat(form.longitude);
      const enabledPacks = usePackStore.getState().enabledPacks;
      const activeIndustry = Object.keys(enabledPacks).find((k) => enabledPacks[k]?.id && ["education","banking","healthcare","property","automotive","manufacturing","retail","saas","distributor"].includes(k));
      if (activeIndustry) {
        payload.industry = activeIndustry;
        payload.segment = activeIndustry;
        payload.tags = [activeIndustry];
        payload.customFields = JSON.stringify(form);
      }
      await api.post("/leads", payload);
      setShowForm(false);
      setForm({ companyName: "", contactName: "", phone: "", city: "", status: "new", qualification: "cold", latitude: "", longitude: "", level: "", studentCount: "" });
      fetchLeads();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  return (
    <div className="page-enter space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Prospek</h1>
          <p className="text-xs lg:text-sm text-slate-500">{isLoading ? "Memuat..." : `${leads.length} prospek`}</p>
        </div>
        <div className="flex items-center gap-2">
          {eduEnabled && (
            <button onClick={() => setShowSchoolUpload(!showSchoolUpload)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-sm font-semibold transition-all active:scale-95 border border-violet-200 dark:border-violet-800">
              <Upload size={16} /> <span className="hidden sm:inline">Import</span>
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all active:scale-95">
            <Plus size={18} /> <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      {/* Active Packs Banner */}
      {packCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-gradient-to-r from-violet-50 via-brand-50 to-emerald-50 dark:from-violet-900/10 dark:via-brand-900/10 dark:to-emerald-900/10 border border-violet-100 dark:border-violet-800">
          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mr-1">Packs Aktif:</span>
          {Object.entries(enabledPacks).map(([id, info]) => {
            if (["sales-coach","proposal","meeting","analytics-ai","forecast"].includes(id)) return null;
            const colors: Record<string, string> = {
              education: "bg-violet-100 text-violet-700 border-violet-200",
              banking: "bg-emerald-100 text-emerald-700 border-emerald-200",
              healthcare: "bg-red-100 text-red-700 border-red-200",
              property: "bg-amber-100 text-amber-700 border-amber-200",
              automotive: "bg-blue-100 text-blue-700 border-blue-200",
              manufacturing: "bg-slate-100 text-slate-700 border-slate-200",
              retail: "bg-pink-100 text-pink-700 border-pink-200",
              saas: "bg-cyan-100 text-cyan-700 border-cyan-200",
              distributor: "bg-orange-100 text-orange-700 border-orange-200",
            };
            return (
              <span key={id} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${colors[id] || "bg-slate-100 text-slate-600"}`}>
                {(info as any).name || id}
              </span>
            );
          })}
        </div>
      )}

      {/* Search + Filter Bar - Mobile Compact */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari prospek..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border-0 bg-white dark:bg-surface-800 text-slate-900 dark:text-white ring-1 ring-surface-200 dark:ring-surface-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl ring-1 transition-all ${showFilters ? 'bg-brand-50 dark:bg-brand-900/30 ring-brand-500 text-brand-600' : 'bg-white dark:bg-surface-800 ring-surface-200 dark:ring-surface-700 text-slate-500'}`}>
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* School Database Upload (Education Pack) */}
      {eduEnabled && showSchoolUpload && (
        <div className="mobile-card bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-violet-600" />
            <h3 className="text-sm font-bold text-violet-700 dark:text-violet-400">Database Sekolah</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 font-semibold">Edu Pack</span>
          </div>
          <SchoolUpload />
        </div>
      )}

      {/* Expandable Filters */}
      {showFilters && (
        <div className="flex gap-2 flex-wrap animate-[pageIn_0.2s_ease-out]">
          {["", "new", "contacted", "qualified", "converted"].map((s) => (
            <button key={s} onClick={() => { setStatusF(s); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${statusF === s ? 'bg-brand-600 text-white' : 'bg-white dark:bg-surface-800 text-slate-600 dark:text-slate-400 ring-1 ring-surface-200 dark:ring-surface-700'}`}>
              {s || "Semua"}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Lead Cards - Mobile */}
      {!isLoading && leads.length === 0 && (
        <div className="text-center py-16">
          <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Belum ada prospek</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-brand-600 font-semibold">+ Tambah Prospek Pertama</button>
        </div>
      )}

      <div className="space-y-2 lg:space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => navigate(`/leads/${lead.id}`)}
            className="mobile-card cursor-pointer flex items-center gap-3 active:bg-surface-50 dark:active:bg-surface-700/50"
          >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${qualBadge[lead.qualification]?.split(" ")[0] || "bg-slate-400"}`}>
              {lead.companyName.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{lead.companyName}</p>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor[lead.status] || "bg-slate-400"}`} />
              </div>
              <div className="flex items-center gap-3 mt-1">
                {lead.contactName && <span className="text-xs text-slate-500 truncate">{lead.contactName}</span>}
                {lead.city && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin size={10} /> {lead.city}
                  </span>
                )}
              </div>
              {/* Status pills */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${lead.status === "qualified" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {lead.status === "new" ? "Baru" : lead.status === "contacted" ? "Dihubungi" : lead.status === "qualified" ? "Qualified" : lead.status === "converted" ? "Konversi" : lead.status}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${qualBadge[lead.qualification]}`}>
                  {lead.qualification === "hot" ? "Panas" : lead.qualification === "warm" ? "Hangat" : "Dingin"}
                </span>
                {eduEnabled && (lead as any).industry === "education" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 flex items-center gap-1">
                    <GraduationCap size={9} /> Sekolah
                  </span>
                )}
              </div>
            </div>

            <ChevronRight size={18} className="text-slate-300 shrink-0" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-sm rounded-xl bg-white dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 disabled:opacity-40 font-medium">←</button>
          <span className="text-sm text-slate-500 font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-sm rounded-xl bg-white dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-700 disabled:opacity-40 font-medium">→</button>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <form onSubmit={handleCreate} className={`relative mobile-sheet lg:rounded-3xl lg:max-w-lg lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out] ${industrySpec?.border || ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {industrySpec ? (
                  <span className={`text-xs font-bold ${industrySpec.text} uppercase tracking-wider`}>{industrySpec.label} Prospek</span>
                ) : (
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Prospek Baru</h2>
                )}
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700"><X size={20} /></button>
            </div>

            <input
              value={form.companyName}
              onChange={(e) => setForm({...form, companyName: e.target.value})}
              placeholder={industrySpec ? industrySpec.companyPlaceholder : "Nama Perusahaan *"}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.contactName}
                onChange={(e) => setForm({...form, contactName: e.target.value})}
                placeholder={industrySpec ? `Nama ${industrySpec.contactLabel}` : "Nama Kontak"}
                className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {industrySpec ? (
                <select
                  value={form.contactTitle || ""}
                  onChange={(e) => setForm({...form, contactTitle: e.target.value})}
                  className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">Jabatan</option>
                  {industrySpec.contactRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input value={form.contactTitle || ""} onChange={(e) => setForm({...form, contactTitle: e.target.value})} placeholder="Jabatan" className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="No HP / Telepon" className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              <button type="button" onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setForm({...form, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude)});
                  });
                }
              }} className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-xs text-slate-500 hover:ring-brand-400 transition-all">
                <MapPin size={14} /> Get Lokasi GPS
              </button>
            </div>
            {(form.latitude && form.longitude) && (
              <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                📍 {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
              </p>
            )}

            <IndustryFields form={form} setForm={setForm} />

            <button type="submit" disabled={saving}
              className={`w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all ${industrySpec ? `bg-gradient-to-r ${industrySpec.gradient} hover:opacity-90` : "bg-brand-600 hover:bg-brand-700"}`}>
              {saving ? "Menyimpan..." : `Simpan ${industrySpec ? industrySpec.label : ""} Prospek`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
