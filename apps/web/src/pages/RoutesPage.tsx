import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Route, Plus, X, Check } from "lucide-react";

interface RouteData { id: string; name: string; date: string; status: string; totalDistanceKm: number | null; estimatedDurationMinutes: number | null; }

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const r = await api.get<any>("/routes"); setRoutes(r.data || []); setIsLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/routes", form);
      setShowForm(false); setForm({ name: "", date: new Date().toISOString().slice(0, 10) });
      fetch();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const handleOptimize = async (id: string) => {
    try {
      await api.post(`/routes/${id}/optimize`);
      fetch();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Perencanaan Rute</h1><p className="text-sm text-slate-500 mt-0.5">{routes.length} rute</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"><Plus size={16} /> Buat Rute</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={handleCreate} className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-high p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Buat Rute</h2><button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-surface-100"><X size={18} /></button></div>
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Nama rute *" required className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />
            <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-50">{saving ? "Menyimpan..." : "Buat Rute"}</button>
          </form>
        </div>
      )}

      {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      : routes.length === 0 ? <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center"><Route size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500">Belum ada rute</p></div>
      : <div className="space-y-3">{routes.map((route) => (
        <div key={route.id} className="bg-white dark:bg-surface-800 p-4 rounded-xl shadow-elevation-low">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"><Route size={18} className="text-indigo-600" /></div><div><p className="text-sm font-semibold text-slate-900 dark:text-white">{route.name}</p><p className="text-xs text-slate-500">{route.date}</p></div></div>
            <div className="text-right text-xs text-slate-500">{route.totalDistanceKm && <p>{route.totalDistanceKm} km</p>}{route.estimatedDurationMinutes && <p>{route.estimatedDurationMinutes} menit</p>}</div>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
            <button onClick={() => handleOptimize(route.id)} className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 font-medium hover:bg-brand-100 flex items-center gap-1"><Check size={12} /> Optimalkan</button>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}
