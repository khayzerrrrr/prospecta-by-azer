import { useState, useEffect } from "react";
import { api } from "../services/api";
import { MoveRight, Plus, X } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { INDUSTRIES } from "@visitflow/shared/industries";

interface Stage { id: string; name: string; order: number; color: string; emoji: string | null; probability: number }

export default function PipelinePage() {
  // Cosmetic theming only — real stages always come from the database
  // (seeded per-industry at company provisioning time), never overridden
  // client-side. See rbac.ts plan notes: synthetic stage IDs used to violate
  // deals.stage_id's FK constraint the moment a deal was moved.
  const companyIndustry = useAuthStore((s) => s.user?.industry);
  const industrySpec = companyIndustry ? INDUSTRIES[companyIndustry] : null;

  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", stageId: "", value: "0", leadId: "" });
  const [saving, setSaving] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [s, d, l] = await Promise.all([
        api.get<any>("/pipeline/stages"),
        api.get<any>("/pipeline/deals"),
        api.get<any>("/leads?perPage=100"),
      ]);

      setStages((s.data || []).sort((a: Stage, b: Stage) => a.order - b.order));
      setDeals(d.data || []);
      setLeads(l.data || []);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post("/pipeline/deals", { ...form, value: parseInt(form.value) || 0 });
      setShowForm(false); setForm({ name: "", stageId: stages[0]?.id || "", value: "0", leadId: "" });
      fetchData();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const moveDeal = async (dealId: string, newStageId: string) => {
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stageId: newStageId } : d));
    try { await api.patch(`/pipeline/deals/${dealId}`, { stageId: newStageId }); } catch {}
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalValue = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  return (
    <div className="page-enter space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Pipeline</h1>
            {industrySpec && <span className={`text-[11px] px-2 py-0.5 rounded-full ${industrySpec.bg} ${industrySpec.text} font-semibold`}>{industrySpec.label}</span>}
          </div>
          <p className="text-xs lg:text-sm text-slate-500">{deals.length} deal · {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalValue)}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-95 ${industrySpec ? `bg-gradient-to-r ${industrySpec.gradient}` : "bg-brand-600 hover:bg-brand-700"}`}>
          <Plus size={18} /> <span className="hidden sm:inline">Deal</span>
        </button>
      </div>

      {/* Mobile: Stage tabs + deal list */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {stages.map((stage) => {
            const count = deals.filter((d) => d.stageId === stage.id).length;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${activeStage === stage.id ? 'text-white shadow-elevation-mid' : 'bg-white dark:bg-surface-800 text-slate-600 dark:text-slate-400 ring-1 ring-surface-200 dark:ring-surface-700'}`}
                style={activeStage === stage.id ? { backgroundColor: stage.color } : {}}
              >
                {stage.emoji} {stage.name}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeStage === stage.id ? 'bg-white/20 text-white' : 'bg-surface-100 dark:bg-surface-700'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Active stage deals */}
        {activeStage && (() => {
          const stage = stages.find((s) => s.id === activeStage)!;
          const stageDeals = deals.filter((d) => d.stageId === activeStage);
          return (
            <div className="space-y-2 animate-[pageIn_0.2s_ease-out]">
              {stageDeals.map((deal) => (
                <div key={deal.id} className="mobile-card">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{deal.name}</p>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(deal.value) || 0)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {stages.filter((s) => s.id !== stage.id).slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => moveDeal(deal.id, s.id)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-slate-600 dark:text-slate-400 font-medium active:bg-brand-100 active:text-brand-700 transition-colors flex items-center gap-1"
                      >
                        <MoveRight size={10} /> {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {stageDeals.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400">Belum ada deal di tahap ini</p>
                  <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-brand-600 font-semibold">+ Tambah Deal</button>
                </div>
              )}
            </div>
          );
        })()}

        {!activeStage && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Pilih tahap pipeline di atas</p>
          </div>
        )}
      </div>

      {/* Desktop: Kanban columns */}
      <div className="hidden lg:flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stageId === stage.id);
          return (
            <div key={stage.id} className="flex-shrink-0 w-72 bg-surface-100 dark:bg-surface-800/50 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stage.emoji} {stage.name}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 bg-white dark:bg-surface-800 px-2 py-0.5 rounded-full">{stageDeals.length}</span>
              </div>
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="bg-white dark:bg-surface-800 p-3 rounded-xl border-0 ring-1 ring-surface-200 dark:ring-surface-700 hover:shadow-elevation-mid transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{deal.name}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(deal.value) || 0)}
                    </span>
                    <div className="flex gap-1 mt-2 pt-2 border-t border-surface-100 dark:border-surface-700">
                      {stages.filter((s) => s.id !== stage.id).slice(0, 3).map((s) => (
                        <button key={s.id} onClick={() => moveDeal(deal.id, s.id)} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-slate-500 hover:bg-brand-100 hover:text-brand-700 transition-colors">
                          → {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Deal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form onSubmit={handleCreate} className={`relative mobile-sheet lg:rounded-3xl lg:max-w-md lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 ${industrySpec?.border || ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {industrySpec ? `${industrySpec.label} Deal Baru` : "Deal Baru"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-surface-100"><X size={20} /></button>
            </div>
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Nama Deal *" required className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            <input type="number" value={form.value} onChange={(e) => setForm({...form, value: e.target.value})} placeholder="Nilai (IDR)" className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            <select value={form.stageId} onChange={(e) => setForm({...form, stageId: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-900 border-0 ring-1 ring-surface-200 dark:ring-surface-700 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
              {stages.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </select>
            <button type="submit" disabled={saving}
              className={`w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all ${industrySpec ? `bg-gradient-to-r ${industrySpec.gradient}` : "bg-brand-600 hover:bg-brand-700"}`}>
              {saving ? "Menyimpan..." : "Simpan Deal"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
