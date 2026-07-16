import { useState } from "react";
import { useUIStore } from "../stores/uiStore";
import { Settings, Sun, Moon, Monitor, Bell, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const [notifications, setNotifications] = useState(true);
  const [gpsRadius, setGpsRadius] = useState(500);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan</h1>

      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-low divide-y divide-surface-100 dark:divide-surface-700">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Monitor size={18} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tampilan</h3>
          </div>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  theme === t
                    ? "bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300"
                    : "border-surface-200 dark:border-surface-700 text-slate-600 hover:bg-surface-50"
                }`}>
                {t === "light" ? <><Sun size={14} className="inline mr-1" /> Terang</> :
                 t === "dark" ? <><Moon size={14} className="inline mr-1" /> Gelap</> :
                 <><Monitor size={14} className="inline mr-1" /> Sistem</>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Notifikasi</p>
                <p className="text-xs text-slate-500">Terima pengingat kunjungan dan follow-up</p>
              </div>
            </div>
            <button onClick={() => setNotifications(!notifications)}
              className={`w-11 h-6 rounded-full transition-colors ${notifications ? "bg-brand-600" : "bg-surface-300"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${notifications ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={18} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Radius Check-in GPS</h3>
          </div>
          <div className="flex items-center gap-3">
            <input type="range" min="100" max="1000" step="100" value={gpsRadius} onChange={(e) => setGpsRadius(Number(e.target.value))}
              className="flex-1 accent-brand-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16 text-right">{gpsRadius}m</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Database</p>
              <p className="text-xs text-slate-500">SQLite · data/visitflow.db</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
