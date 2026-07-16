import { useAuthStore } from "../stores/authStore";
import { User, Mail, Shield, MapPin, Target } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profil</h1>

      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-low p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-2xl">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.fullName || "User"}</h2>
            <p className="text-sm text-slate-500">{user?.email || "-"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <div className="flex items-center gap-2 mb-2"><Shield size={14} className="text-brand-500" /><p className="text-xs text-slate-500">Role</p></div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{user?.role || "-"}</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <div className="flex items-center gap-2 mb-2"><Mail size={14} className="text-brand-500" /><p className="text-xs text-slate-500">Email</p></div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.email || "-"}</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <div className="flex items-center gap-2 mb-2"><MapPin size={14} className="text-brand-500" /><p className="text-xs text-slate-500">Territory</p></div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.territoryId ? "Ditugaskan" : "Belum ditugaskan"}</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
            <div className="flex items-center gap-2 mb-2"><Target size={14} className="text-brand-500" /><p className="text-xs text-slate-500">User ID</p></div>
            <p className="text-sm font-mono text-slate-600 dark:text-slate-400 truncate text-xs">{user?.id || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
