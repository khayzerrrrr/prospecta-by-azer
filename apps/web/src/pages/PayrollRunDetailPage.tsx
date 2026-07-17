import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatIDR, initials } from "@visitflow/utils";
import { ArrowLeft, ChevronRight, CheckCircle2, Banknote } from "lucide-react";

interface Payslip {
  id: string; netPay: number; grossPay: number; status: string;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
}
interface Run {
  id: string; periodMonth: number; periodYear: number; status: "draft" | "finalized" | "paid"; notes: string | null;
  payslips: Payslip[];
}

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const statusLabel: Record<string, string> = { draft: "Draft", finalized: "Difinalisasi", paid: "Sudah Dibayar" };

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 bg-gradient-to-br from-brand-500 to-indigo-600">
      {initials(name)}
    </div>
  );
}

export default function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<Run | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchRun = useCallback(async () => {
    try {
      const res = await api.get<any>(`/payroll/runs/${id}`);
      setRun(res.data);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [id]);

  useEffect(() => { fetchRun(); }, [fetchRun]);

  const handleFinalize = async () => {
    setProcessing(true);
    try {
      const res = await api.post<any>(`/payroll/runs/${id}/finalize`);
      setRun(res.data);
    } catch (e: any) { alert(e.message); }
    setProcessing(false);
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const res = await api.post<any>(`/payroll/runs/${id}/pay`);
      setRun(res.data);
    } catch (e: any) { alert(e.message); }
    setProcessing(false);
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!run) return <div className="text-center py-20 text-slate-500">Payroll run tidak ditemukan</div>;

  const totalNet = run.payslips.reduce((s, p) => s + p.netPay, 0);
  const totalGross = run.payslips.reduce((s, p) => s + p.grossPay, 0);

  return (
    <div className="page-enter space-y-5 max-w-2xl mx-auto pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"><ArrowLeft size={16} /> Kembali</button>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-6 shadow-elevation-high">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{monthNames[run.periodMonth - 1]} {run.periodYear}</h1>
              <p className="text-white/70 text-sm mt-0.5">{run.payslips.length} karyawan</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">{statusLabel[run.status]}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/20">
            <div>
              <p className="text-white/60 text-xs">Total Gross</p>
              <p className="text-lg font-bold mt-0.5">{formatIDR(totalGross)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Total Net Pay</p>
              <p className="text-lg font-bold mt-0.5">{formatIDR(totalNet)}</p>
            </div>
          </div>
        </div>
      </div>

      {run.status !== "paid" && (
        <div className="flex gap-3">
          {run.status === "draft" && (
            <button onClick={handleFinalize} disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/25">
              <CheckCircle2 size={16} /> {processing ? "Memproses..." : "Finalisasi Payroll"}
            </button>
          )}
          {run.status === "finalized" && (
            <button onClick={handlePay} disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25">
              <Banknote size={16} /> {processing ? "Memproses..." : "Tandai Sudah Dibayar"}
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {run.payslips.map((p) => (
          <div key={p.id} onClick={() => navigate(`/payroll/payslips/${p.id}`)}
            className="mobile-card cursor-pointer flex items-center gap-3 active:bg-surface-50 dark:active:bg-surface-700/50">
            <Avatar name={p.user.fullName} url={p.user.avatarUrl} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.user.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{formatIDR(p.netPay)}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
