import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-800 shadow-elevation-mid flex items-center justify-center mb-2 ring-1 ring-surface-200">
            <img src="/logo-full.png" alt="Pevotrack" className="h-8 object-contain" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Pevotrack</h1>
          <p className="text-[11px] text-slate-400">Platform Manajemen Bisnis</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-elevation-mid space-y-4 ring-1 ring-surface-200/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Masuk ke akun Anda</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">CRM Manajemen Kunjungan Lapangan</p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">{error}</div>
          )}

          <div className="space-y-2.5">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder:text-slate-400"
              placeholder="nama@perusahaan.com" required autoComplete="email"
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder:text-slate-400"
              placeholder="••••••••" required autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800">
            {isLoading ? "Masuk..." : "Masuk"}
          </button>

          <div className="pt-2 border-t border-surface-100 dark:border-surface-700 text-center">
            <Link to="/signup" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">
              Daftar sebagai Admin Perusahaan
            </Link>
          </div>
        </form>

        <p className="text-[10px] text-slate-400 mt-5">Pevotrack v2.0 · Bun + Elysia + React</p>
      </div>
    </div>
  );
}
