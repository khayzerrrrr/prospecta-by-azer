import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";

const inputClass = "w-full px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder:text-slate-400";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: "", claimCode: "", fullName: "", jobTitle: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await api.post<any>("/auth/claim-company", form);
      const { user, tokens } = res.data;
      localStorage.setItem("access_token", tokens.accessToken);
      localStorage.setItem("refresh_token", tokens.refreshToken);
      useAuthStore.setState({ user, token: tokens.accessToken, isAuthenticated: true, isLoading: false });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-800 shadow-elevation-mid flex items-center justify-center mb-2 ring-1 ring-surface-200">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg">P</div>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Pevotrack</h1>
          <p className="text-[11px] text-slate-400">Platform Manajemen Bisnis</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-elevation-mid space-y-4 ring-1 ring-surface-200/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daftar sebagai Admin Perusahaan</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Butuh nama perusahaan &amp; kode klaim dari tim kami</p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">{error}</div>
          )}

          <div className="space-y-2.5">
            <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Nama Perusahaan" required className={inputClass} />
            <input value={form.claimCode} onChange={(e) => update("claimCode", e.target.value.toUpperCase())} placeholder="Kode Klaim" required className={`${inputClass} font-mono tracking-wider`} />
          </div>

          <div className="pt-1 border-t border-surface-100 dark:border-surface-700 space-y-2.5">
            <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Nama Lengkap" required className={inputClass} />
            <input value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} placeholder="Jabatan (mis. Direktur Utama)" className={inputClass} />
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email" required autoComplete="email" className={inputClass} />
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Password (min. 6 karakter)" required minLength={6} autoComplete="new-password" className={inputClass} />
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white bg-brand-600 hover:bg-brand-700">
            {isLoading ? "Mendaftar..." : "Daftar & Masuk"}
          </button>

          <div className="pt-1 text-center">
            <Link to="/login" className="text-xs text-slate-500 hover:underline">Sudah punya akun? Masuk</Link>
          </div>
        </form>

        <p className="text-[10px] text-slate-400 mt-5">Pevotrack v2.0 · Bun + Elysia + React</p>
      </div>
    </div>
  );
}
