import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ClipboardCheck, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function FollowUpsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Fetch from visits with nextSteps or follow-ups tracking
    api.get<any>("/visits").then((r) => {
      const withNextSteps = (r.data || []).filter((v: any) => v.nextSteps && v.status !== "completed");
      setItems(withNextSteps);
      setIsLoading(false);
    });
  }, [filter]);

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700", urgent: "bg-red-200 text-red-800",
    medium: "bg-amber-100 text-amber-700", low: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Follow-up</h1>
          <p className="text-sm text-slate-500 mt-0.5">{items.length} tugas follow-up</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-surface-200 bg-white dark:bg-surface-800 dark:border-surface-700 dark:text-white">
            <option value="pending">Pending</option>
            <option value="all">Semua</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-12 text-center">
          <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Tidak ada follow-up</p>
          <p className="text-xs text-slate-400 mt-1">Tambahkan "langkah selanjutnya" saat check-out kunjungan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.id || i} className="bg-white dark:bg-surface-800 p-4 rounded-xl shadow-elevation-low">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${i % 3 === 0 ? "bg-red-100 text-red-600" : i % 3 === 1 ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                  {i % 3 === 0 ? <AlertCircle size={18} /> : i % 3 === 1 ? <Clock size={18} /> : <ClipboardCheck size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.nextSteps?.slice(0, 100)}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{item.scheduledDate}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.status === "completed" ? "Selesai" : "Menunggu"}
                    </span>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Tandai selesai">
                  <CheckCircle size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
