import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { ArrowLeft, Phone, Mail, MapPin, Building, Calendar, Edit, Trash } from "lucide-react";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetch() {
      const res = await api.get<any>(`/leads/${id}`);
      setLead(res.data);
      setIsLoading(false);
    }
    fetch();
  }, [id]);

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!lead) return <div className="text-center py-20 text-slate-500">Prospek tidak ditemukan</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate("/leads")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Kembali ke daftar
      </button>

      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-low p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xl">
              {lead.companyName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{lead.companyName}</h1>
              <p className="text-sm text-slate-500">{lead.contactName} · {lead.contactTitle || "-"}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            lead.status === "qualified" ? "bg-green-100 text-green-700" :
            lead.status === "contacted" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
          }`}>
            {lead.status === "new" ? "Baru" : lead.status === "qualified" ? "Qualified" : lead.status === "contacted" ? "Dihubungi" : lead.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {lead.phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={14} /> {lead.phone}</div>}
          {lead.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={14} /> {lead.email}</div>}
          {lead.address && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin size={14} /> {lead.address}</div>}
          {lead.city && <div className="flex items-center gap-2 text-sm text-slate-600"><Building size={14} /> {lead.city}{lead.province ? `, ${lead.province}` : ""}</div>}
          <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar size={14} /> Dibuat {new Date(lead.createdAt).toLocaleDateString("id-ID")}</div>
        </div>

        {lead.notes && (
          <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{lead.notes}</p>
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
          <button onClick={() => navigate(`/visits/new?leadId=${lead.id}`)}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
            Jadwalkan Kunjungan
          </button>
          <button className="px-4 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-slate-600 hover:bg-surface-50">
            <Edit size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
