import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatIDR, initials } from "@visitflow/utils";
import { ArrowLeft, Wallet } from "lucide-react";

interface Payslip {
  id: string; baseSalary: number; totalAllowance: number; totalDeduction: number; totalBonus: number; totalIncentive: number;
  bpjsKesehatanEmployee: number; bpjsKesehatanEmployer: number; bpjsKetenagakerjaanEmployee: number; bpjsKetenagakerjaanEmployer: number;
  grossPay: number; pph21: number; netPay: number;
  daysPresent: number; daysAbsent: number; daysLate: number;
  componentsBreakdown: Array<{ name: string; type: string; amount: number }>;
  status: string; paidAt: string | null;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  run?: { periodMonth: number; periodYear: number };
}

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const statusLabel: Record<string, string> = { draft: "Draft", finalized: "Difinalisasi", paid: "Sudah Dibayar" };

function Row({ label, value, negative, muted }: { label: string; value: number; negative?: boolean; muted?: boolean }) {
  if (value === 0 && muted) return null;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${negative ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
        {negative && value > 0 ? "-" : ""}{formatIDR(value)}
      </span>
    </div>
  );
}

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayslip = useCallback(async () => {
    try {
      const res = await api.get<any>(`/payroll/payslips/${id}`);
      setPayslip(res.data);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [id]);

  useEffect(() => { fetchPayslip(); }, [fetchPayslip]);

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!payslip) return <div className="text-center py-20 text-slate-500">Slip gaji tidak ditemukan</div>;

  const allowances = payslip.componentsBreakdown.filter((c) => c.type === "allowance");
  const bonuses = payslip.componentsBreakdown.filter((c) => c.type === "bonus" || c.type === "incentive");
  const deductions = payslip.componentsBreakdown.filter((c) => c.type === "deduction");

  return (
    <div className="page-enter space-y-5 max-w-xl mx-auto pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"><ArrowLeft size={16} /> Kembali</button>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-6 shadow-elevation-high">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs">Slip Gaji</p>
              <h1 className="text-lg font-bold">{payslip.user.fullName}</h1>
              {payslip.run && <p className="text-white/70 text-sm">{monthNames[payslip.run.periodMonth - 1]} {payslip.run.periodYear}</p>}
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold shrink-0">{statusLabel[payslip.status]}</span>
          </div>
          <div className="mt-5 pt-5 border-t border-white/20">
            <p className="text-white/60 text-xs">Gaji Bersih (Take Home Pay)</p>
            <p className="text-3xl font-bold mt-1">{formatIDR(payslip.netPay)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2"><Wallet size={16} /> Pendapatan</h3>
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          <Row label="Gaji Pokok" value={payslip.baseSalary} />
          {allowances.map((a, i) => <Row key={i} label={a.name} value={a.amount} />)}
          {bonuses.map((b, i) => <Row key={i} label={b.name} value={b.amount} />)}
        </div>
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-surface-200 dark:border-surface-700">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Total Gross</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{formatIDR(payslip.grossPay)}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Potongan</h3>
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          {deductions.map((d, i) => <Row key={i} label={d.name} value={d.amount} negative />)}
          <Row label="BPJS Kesehatan (Karyawan)" value={payslip.bpjsKesehatanEmployee} negative muted />
          <Row label="BPJS Ketenagakerjaan (Karyawan)" value={payslip.bpjsKetenagakerjaanEmployee} negative muted />
          <Row label="PPh21" value={payslip.pph21} negative muted />
        </div>
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-surface-200 dark:border-surface-700">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Total Potongan</span>
          <span className="text-sm font-bold text-red-600 dark:text-red-400">
            -{formatIDR(payslip.totalDeduction + payslip.bpjsKesehatanEmployee + payslip.bpjsKetenagakerjaanEmployee + payslip.pph21)}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Kehadiran Periode Ini</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-lg font-bold text-emerald-600">{payslip.daysPresent}</p><p className="text-xs text-slate-500">Hadir</p></div>
          <div><p className="text-lg font-bold text-amber-600">{payslip.daysLate}</p><p className="text-xs text-slate-500">Terlambat</p></div>
          <div><p className="text-lg font-bold text-red-600">{payslip.daysAbsent}</p><p className="text-xs text-slate-500">Absen</p></div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center px-4">
        Perhitungan PPh21 &amp; BPJS bersifat perkiraan otomatis dan belum diverifikasi akuntan pajak.
      </p>
    </div>
  );
}
