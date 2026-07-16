import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { ChevronLeft, ChevronRight, MapPin, Clock, ArrowUpRight, UserPlus, TrendingUp, Eye, X, Check, Loader2 } from "lucide-react";

interface Visit {
  id: string; title: string; scheduledDate: string;
  scheduledStartTime: string | null; status: string; visitType: string;
  leadId: string; description?: string; meetingNotes?: string;
  checkinTime?: string; checkoutTime?: string; durationMinutes?: number;
}

const statusDot: Record<string, string> = {
  planned: "bg-amber-400",
  checked_in: "bg-blue-500",
  in_progress: "bg-brand-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
  no_show: "bg-slate-400",
};

const statusLabel: Record<string, string> = {
  planned: "Terencana", checked_in: "Check-in", in_progress: "Proses",
  completed: "Selesai", cancelled: "Batal", no_show: "No Show",
};

const visitTypeLabel: Record<string, string> = {
  cold_call: "Cold Call", scheduled: "Terjadwal", follow_up: "Follow-up",
  presentation: "Presentasi", closing: "Closing",
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState("");

  useEffect(() => {
    api.get<any>("/visits?perPage=200").then((r) => setVisits(r.data || []));
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  const dateVisits = (date: string) => visits.filter((v) => v.scheduledDate === date);
  const selectedVisits = selectedDate ? dateVisits(selectedDate) : [];

  // Today's stats
  const today = new Date().toISOString().slice(0, 10);
  const todayVisits = dateVisits(today);
  const todayCompleted = todayVisits.filter((v) => v.status === "completed").length;

  const openVisitActions = (visit: Visit) => {
    setActiveVisit(visit);
    setShowActionPanel(true);
    setPromoted("");
  };

  const promoteToPipeline = async () => {
    if (!activeVisit) return;
    setPromoting(true);
    try {
      await api.post("/pipeline/deals", {
        name: activeVisit.title,
        value: 0,
        stageId: "",
        leadId: activeVisit.leadId,
        notes: activeVisit.meetingNotes || "",
      });
      setPromoted("pipeline");
    } catch (e: any) { alert(e.message); }
    setPromoting(false);
  };

  const promoteToLead = () => {
    navigate(`/leads/${activeVisit?.leadId || ""}`);
  };

  const viewVisitDetail = () => {
    if (activeVisit) navigate(`/visits/${activeVisit.id}`);
  };

  return (
    <div className="page-enter space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Kalender Kunjungan</h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">History & jadwal harian</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500">Hari Ini</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{todayCompleted}/{todayVisits.length} selesai</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Clock size={18} className="text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-4 lg:p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); }}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white">{monthNames[currentMonth]} {currentYear}</h2>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); }}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 mb-2">
            {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayVisits = dateVisits(date);
              const isToday = date === today;
              const isSelected = date === selectedDate;
              const completedCount = dayVisits.filter((v) => v.status === "completed").length;
              return (
                <button key={day} onClick={() => setSelectedDate(date)}
                  className={`p-1.5 lg:p-2 rounded-xl text-sm transition-all relative flex flex-col items-center ${
                    isSelected ? "bg-brand-600 text-white shadow-elevation-mid" :
                    isToday ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-300 font-bold" :
                    "hover:bg-surface-100 dark:hover:bg-surface-700 text-slate-700 dark:text-slate-300"
                  }`}>
                  <span className="text-xs lg:text-sm">{day}</span>
                  {dayVisits.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {completedCount > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`} />}
                      {dayVisits.length > completedCount && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-amber-400"}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Selesai</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Terencana</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Proses</span>
          </div>
        </div>

        {/* Selected Date Visits */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-4 lg:p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            {selectedDate
              ? new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
              : "Pilih Tanggal"}
          </h3>

          {!selectedDate && (
            <div className="text-center py-8">
              <MapPin size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Klik tanggal untuk melihat kunjungan</p>
            </div>
          )}

          {selectedDate && selectedVisits.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Tidak ada kunjungan di tanggal ini</p>
            </div>
          )}

          {selectedVisits.length > 0 && (
            <div className="space-y-2">
              {selectedVisits.map((v) => (
                <button
                  key={v.id}
                  onClick={() => openVisitActions(v)}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700/50 active:bg-surface-100 transition-colors group"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusDot[v.status] || "bg-slate-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{v.title}</p>
                      <ArrowUpRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500">{v.scheduledStartTime || ""} {visitTypeLabel[v.visitType] || v.visitType}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        v.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        v.status === "checked_in" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {statusLabel[v.status] || v.status}
                      </span>
                    </div>
                    {v.durationMinutes && <p className="text-[10px] text-slate-400 mt-0.5">Durasi: {v.durationMinutes} menit</p>}
                    {v.meetingNotes && <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 italic">"{v.meetingNotes.slice(0, 80)}"</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Panel — appears when a visit is clicked */}
      {showActionPanel && activeVisit && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowActionPanel(false)} />
          <div className="relative mobile-sheet lg:rounded-3xl lg:max-w-md lg:mx-4 lg:relative lg:bottom-auto p-6 space-y-4 animate-[pageIn_0.25s_ease-out]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aksi Kunjungan</h3>
              <button onClick={() => setShowActionPanel(false)} className="p-2 rounded-xl hover:bg-surface-100"><X size={20} /></button>
            </div>

            {/* Visit summary */}
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 space-y-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{activeVisit.title}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${statusDot[activeVisit.status]}`} />
                {statusLabel[activeVisit.status]} · {activeVisit.scheduledStartTime}
              </div>
              {activeVisit.meetingNotes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{activeVisit.meetingNotes.slice(0, 100)}"</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button onClick={viewVisitDetail}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-left">
                <Eye size={18} className="text-slate-500" />
                <div><p className="text-sm font-semibold text-slate-900 dark:text-white">Lihat Detail</p><p className="text-[11px] text-slate-500">Buka halaman lengkap kunjungan</p></div>
              </button>

              <button onClick={promoteToLead}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-left">
                <UserPlus size={18} className="text-brand-500" />
                <div><p className="text-sm font-semibold text-slate-900 dark:text-white">Lihat Prospek</p><p className="text-[11px] text-slate-500">Buka data prospek terkait</p></div>
              </button>

              <button onClick={promoteToPipeline} disabled={promoting}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-left disabled:opacity-50">
                {promoting ? <Loader2 size={18} className="animate-spin text-violet-500" /> :
                 promoted === "pipeline" ? <Check size={18} className="text-emerald-500" /> :
                 <TrendingUp size={18} className="text-violet-500" />}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {promoted === "pipeline" ? "Berhasil Ditambahkan!" : "Promote ke Pipeline"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {promoted === "pipeline" ? "Deal berhasil dibuat" : "Konversi kunjungan jadi deal"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly summary */}
      {selectedVisits.length > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-900 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}
          </span>
          <span className="text-slate-500">{selectedVisits.length} kunjungan</span>
          <span className="text-emerald-600 font-medium">{selectedVisits.filter((v) => v.status === "completed").length} selesai</span>
          <span className="text-amber-600 font-medium">{selectedVisits.filter((v) => v.status === "planned").length} terjadwal</span>
        </div>
      )}
    </div>
  );
}
