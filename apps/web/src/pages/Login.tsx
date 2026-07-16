import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { usePackStore } from "../stores/packStore";
import { api } from "../services/api";
import { GraduationCap, Store, Heart, Home, Car, Factory, ShoppingBag, Cloud, Truck, Check, Loader2, Rocket, ChevronRight, ArrowLeft } from "lucide-react";

type Step = "industry" | "installing" | "login";

const industries = [
  { id: "education", name: "Education", icon: GraduationCap, desc: "Sekolah & Universitas", gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", text: "text-violet-700 dark:text-violet-400" },
  { id: "banking", name: "Banking", icon: Store, desc: "Bank & Finance", gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400" },
  { id: "healthcare", name: "Healthcare", icon: Heart, desc: "RS, Klinik & Farmasi", gradient: "from-rose-500 to-pink-600", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800", text: "text-rose-700 dark:text-rose-400" },
  { id: "property", name: "Property", icon: Home, desc: "Developer & Agen", gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400" },
  { id: "automotive", name: "Automotive", icon: Car, desc: "Dealer & Otomotif", gradient: "from-blue-500 to-sky-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400" },
  { id: "manufacturing", name: "Manufacturing", icon: Factory, desc: "Pabrik & Supplier", gradient: "from-slate-500 to-gray-600", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-800", text: "text-slate-700 dark:text-slate-400" },
  { id: "retail", name: "Retail", icon: ShoppingBag, desc: "Toko & Ritel", gradient: "from-pink-500 to-fuchsia-600", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-200 dark:border-pink-800", text: "text-pink-700 dark:text-pink-400" },
  { id: "saas", name: "SaaS", icon: Cloud, desc: "Software & Tech", gradient: "from-cyan-500 to-sky-600", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800", text: "text-cyan-700 dark:text-cyan-400" },
  { id: "distributor", name: "Distributor", icon: Truck, desc: "Distribusi & Logistik", gradient: "from-orange-500 to-amber-600", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-400" },
];

export default function Login() {
  const [step, setStep] = useState<Step>("industry");
  const [selected, setSelected] = useState<string | null>(null);
  const [installStep, setInstallStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const { loadPacks } = usePackStore();
  const navigate = useNavigate();

  const industry = industries.find((i) => i.id === selected);

  const handleSelect = async (id: string) => {
    setSelected(id);
    setStep("installing");
    setInstallStep(0);

    // Step 1-2: Use public onboard endpoint (no auth needed)
    await new Promise((r) => setTimeout(r, 500));
    setInstallStep(1);
    try {
      await fetch(`/api/packs/onboard/industry/${id}`, { method: "POST", headers: { "Content-Type": "application/json" } });
    } catch {}

    await new Promise((r) => setTimeout(r, 500));
    setInstallStep(2);

    // Step 3: Done
    await new Promise((r) => setTimeout(r, 400));
    setInstallStep(3);

    // Go to login
    await new Promise((r) => setTimeout(r, 600));
    setStep("login");
  };

  const handleSkip = () => setStep("login");

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

  const installLabels = ["Menginstall pack...", "Mengkonfigurasi...", "Siap digunakan!"];
  const currentInstallLabel = installLabels[installStep] || "";

  // ─── Step: Industry Selection ───
  if (step === "industry") {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-800 shadow-elevation-mid flex items-center justify-center mx-auto mb-4 ring-1 ring-surface-200">
              <img src="/logo.png" alt="Prospecta" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pilih Industri Anda</h1>
            <p className="text-sm text-slate-500 mt-1">Prospecta akan menyesuaikan modul dan fitur sesuai industri Anda</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {industries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => handleSelect(ind.id)}
                className={`${ind.bg} ${ind.border} border rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ind.gradient} flex items-center justify-center text-white mb-3 shadow-elevation-mid group-hover:shadow-elevation-high transition-shadow`}>
                  <ind.icon size={20} />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{ind.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{ind.desc}</p>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2">
              Lewati, gunakan standar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step: Installing ───
  if (step === "installing" && industry) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${industry.gradient} flex items-center justify-center text-white mx-auto mb-4 shadow-elevation-high`}>
              <industry.icon size={36} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{industry.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Menyiapkan modul industri</p>
          </div>

          <div className="space-y-3 mb-8">
            {installLabels.map((label, i) => {
              const done = i < installStep;
              const active = i === installStep;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-surface-800 shadow-elevation-low">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    done ? "bg-emerald-500 text-white" : active ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600" : "bg-surface-100 dark:bg-surface-700 text-slate-400"
                  }`}>
                    {done ? <Check size={16} /> : active ? <Loader2 size={16} className="animate-spin" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-sm font-medium ${done ? "text-emerald-600" : active ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                    {label}
                  </span>
                  {done && <Check size={14} className="text-emerald-500 ml-auto" />}
                </div>
              );
            })}
          </div>

          {installStep >= 3 && (
            <button onClick={() => setStep("login")} className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              Lanjut ke Login <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Step: Login ───
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Active industry badge */}
        {industry && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${industry.bg} ${industry.border} border mb-4`}>
            <industry.icon size={14} className={industry.text} />
            <span className={`text-[11px] font-semibold ${industry.text}`}>{industry.name}</span>
            <button onClick={() => { setSelected(null); setStep("industry"); }} className="text-[10px] text-slate-400 hover:text-slate-600 ml-1">Ganti</button>
          </div>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-800 shadow-elevation-mid flex items-center justify-center mb-2 ring-1 ring-surface-200">
            <img src="/logo.png" alt="Prospecta" className="w-9 h-9 object-contain" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Prospecta</h1>
          <p className="text-[11px] text-slate-400">by Azer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full bg-white dark:bg-surface-800 p-5 rounded-2xl shadow-elevation-mid space-y-4 ring-1 ring-surface-200/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Masuk ke akun Anda</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{industry ? `Modul ${industry.name} siap` : "CRM Manajemen Kunjungan Lapangan"}</p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">{error}</div>
          )}

          <div className="space-y-2.5">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder:text-slate-400"
              placeholder="admin@visitflow.dev" required autoComplete="email"
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder:text-slate-400"
              placeholder="••••••••" required autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={isLoading}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white ${
              industry ? `bg-gradient-to-r ${industry.gradient} hover:opacity-90` : "bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800"
            }`}>
            {isLoading ? "Masuk..." : industry ? <><Rocket size={14} /> Masuk ke {industry.name}</> : "Masuk"}
          </button>

          {/* Demo accounts */}
          <div className="pt-2 border-t border-surface-100 dark:border-surface-700">
            <p className="text-[10px] text-slate-400 text-center mb-2">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { role: "Admin", mail: "admin@visitflow.dev" },
                { role: "Manager", mail: "manager@visitflow.dev" },
                { role: "Agent", mail: "agent@visitflow.dev" },
              ].map(({ role, mail }) => (
                <button key={role} type="button" onClick={() => setEmail(mail)}
                  className={`text-[10px] py-1.5 rounded-lg font-medium transition-all active:scale-95 ${
                    email === mail ? "bg-slate-100 dark:bg-surface-700 text-slate-900 dark:text-white ring-1 ring-slate-300" : "bg-surface-50 dark:bg-surface-900 text-slate-500 hover:bg-surface-100"
                  }`}>
                  {role}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">password: password123</p>
          </div>
        </form>

        <p className="text-[10px] text-slate-400 mt-5">Prospecta by Azer v1.0 · Bun + Elysia + React</p>
      </div>
    </div>
  );
}
