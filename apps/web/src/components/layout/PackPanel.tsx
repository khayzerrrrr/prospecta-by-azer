import { useState, useEffect } from "react";
import { X, Sparkles, Check, Download, Loader2, RefreshCw, Settings, Rocket } from "lucide-react";
import { usePackStore } from "../../stores/packStore";
import { api } from "../../services/api";

interface PackPanelProps { packId: string; packLabel: string; onClose: () => void; }

// Static class maps (no dynamic Tailwind — JIT-safe). AI packs only —
// industry packs were retired: a company's industry is now fixed once by
// master_account at provisioning, not a self-service marketplace toggle.
const themeClasses: Record<string, { bg: string; border: string; text: string; btn: string; badge: string }> = {
  "sales-coach":   { bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", text: "text-violet-700 dark:text-violet-400", btn: "bg-violet-600 hover:bg-violet-700", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400" },
  "proposal":      { bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-800", text: "text-indigo-700 dark:text-indigo-400", btn: "bg-indigo-600 hover:bg-indigo-700", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
  "meeting":       { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-700", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  "analytics-ai":  { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", btn: "bg-amber-600 hover:bg-amber-700", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  "forecast":      { bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800", text: "text-rose-700 dark:text-rose-400", btn: "bg-rose-600 hover:bg-rose-700", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" },
};

const headerGradients: Record<string, string> = {
  "sales-coach": "from-violet-500 to-purple-600", proposal: "from-indigo-500 to-blue-600",
  meeting: "from-emerald-500 to-green-600", "analytics-ai": "from-amber-500 to-yellow-600",
  forecast: "from-rose-500 to-red-600",
};

const aiDetails: Record<string, { description: string; capabilities: string[]; status: "active" | "coming_soon" }> = {
  "sales-coach": { description: "AI coaching real-time.", capabilities: ["Analisa percakapan visit", "Rekomendasi next action", "Score performa agent", "Objection handling"], status: "active" },
  proposal: { description: "Generate proposal otomatis.", capabilities: ["Auto-generate template", "Custom pricing", "Brand-consistent output", "PDF export"], status: "active" },
  meeting: { description: "AI meeting assistant.", capabilities: ["Transkrip real-time", "Auto summary & action items", "Sentiment analysis", "Follow-up generation"], status: "active" },
  "analytics-ai": { description: "AI predictive analytics.", capabilities: ["Predictive forecast", "Anomaly detection", "Churn scoring", "Next-best-action"], status: "active" },
  forecast: { description: "AI revenue forecasting.", capabilities: ["Revenue 12 bulan", "Seasonal analysis", "Capacity planning", "Scenario simulation"], status: "coming_soon" },
};

export function PackPanel({ packId, packLabel, onClose }: PackPanelProps) {
  const [step, setStep] = useState<"idle" | "installing" | "configuring" | "done">("idle");
  const [loading, setLoading] = useState(true);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const { loadPacks } = usePackStore();
  const data = aiDetails[packId];
  const cls = themeClasses[packId] || themeClasses["sales-coach"]!;
  const headerGrad = headerGradients[packId] || "from-brand-500 to-brand-700";

  useEffect(() => {
    async function check() {
      try {
        const res = await api.get<any>(`/packs/ai/${packId}`);
        if (res.data?.enabled) { setAlreadyInstalled(true); setStep("done"); }
      } catch {}
      setLoading(false);
    }
    check();
  }, []);

  const handleInstall = async () => {
    if (alreadyInstalled) return;
    setStep("installing");
    await new Promise(r => setTimeout(r, 600));
    await api.post(`/packs/ai/${packId}/toggle`);
    setStep("configuring");
    await new Promise(r => setTimeout(r, 500));
    await api.post(`/packs/ai/${packId}/configure`, { installed: true, installedAt: new Date().toISOString() });
    await new Promise(r => setTimeout(r, 400));
    setStep("done");
    setAlreadyInstalled(true);
    await loadPacks();
    setTimeout(() => { window.location.reload(); }, 1500);
  };

  if (!data) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-surface-800 shadow-elevation-high border-l border-surface-200 dark:border-surface-700 animate-[pageIn_0.2s_ease-out] overflow-y-auto">
      {/* Themed Header */}
      <div className={`sticky top-0 bg-gradient-to-r ${headerGrad} px-5 py-4 flex items-center justify-between z-10 text-white`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold">{packLabel}</h2>
            <p className="text-[11px] text-white/70">AI Pack</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X size={18} /></button>
      </div>

      <div className="p-5 space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{data.description}</p>

        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${data.status === "active" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${data.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
          {data.status === "active" ? "Tersedia" : "Segera Hadir"}
        </span>

        {/* Install Progress */}
        {step !== "idle" && (
          <div className={`${cls.bg} rounded-2xl p-4 border ${cls.border}`}>
            <p className={`text-xs font-bold ${cls.text} uppercase tracking-wider mb-3`}>
              {step === "done" ? "Instalasi Berhasil" : "Proses Instalasi"}
            </p>
            <div className="space-y-3">
              {[
                { key: "installing", label: "Menginstall pack...", icon: Download },
                { key: "configuring", label: "Mengkonfigurasi modul...", icon: Settings },
                { key: "done", label: "Instalasi selesai! Me-refresh...", icon: Check },
              ].map((s, i) => {
                const isActive = step === s.key;
                const isDone = (step === "configuring" && i === 0) || (step === "done" && i < 2);
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isDone ? "bg-emerald-500 text-white" : isActive ? `ring-2 ${cls.text}` : "bg-surface-200 dark:bg-surface-700 text-slate-400"
                    }`}>
                      {isDone ? <Check size={14} /> : isActive ? <Loader2 size={14} className="animate-spin" /> : <s.icon size={14} />}
                    </div>
                    <span className={`text-sm ${isDone ? "text-emerald-600 font-medium" : isActive ? "text-slate-900 dark:text-white font-medium" : "text-slate-400"}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {step === "done" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                <RefreshCw size={12} className="animate-spin" /> Halaman akan di-refresh...
              </div>
            )}
          </div>
        )}

        {/* Installed Modules */}
        {step === "done" && (
          <div className={`${cls.bg} rounded-2xl p-4 border ${cls.border}`}>
            <p className={`text-xs font-bold ${cls.text} uppercase tracking-wider mb-2`}>Modul Terpasang</p>
            <div className="space-y-1.5">
              {["Panel AI di dashboard", "Analisis & insights otomatis", "Generate konten AI", "Integrasi API AI"].map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className={`w-1 h-1 rounded-full ${cls.text.replace("text-", "bg-").split(" ")[0]}`} /> {m}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Kemampuan AI</h3>
          <div className="space-y-2">
            {data.capabilities.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" /> <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Install Button */}
        <button
          onClick={handleInstall}
          disabled={loading || step !== "idle" || alreadyInstalled}
          className={`w-full py-3 rounded-xl text-white text-sm font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
            alreadyInstalled ? "bg-emerald-500 cursor-default" :
            step !== "idle" ? "bg-slate-400 cursor-default" :
            cls.btn
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> :
           alreadyInstalled ? <><Check size={16} /> Pack Sudah Terpasang</> :
           step !== "idle" ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> :
           <><Rocket size={16} /> Install Pack Sekarang</>}
        </button>
      </div>
    </div>
  );
}
