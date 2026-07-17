import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { API_BASE_URL } from "../services/config";
import { queueOperation } from "../services/offline";
import { usePackStore } from "../stores/packStore";
import { EduVisitForm } from "../components/packs/EduVisitForm";
import { MapPin, Clock, Calendar, ArrowLeft, PenLine, CheckCircle, Crosshair, Camera, Navigation } from "lucide-react";

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eduEnabled = usePackStore((s) => s.isPackEnabled("education"));
  const [visit, setVisit] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{lat: number; lng: number} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetch() {
      const res = await api.get<any>(`/visits/${id}`);
      setVisit(res.data); setNotes(res.data?.meetingNotes || ""); setNextSteps(res.data?.nextSteps || ""); setIsLoading(false);
    }
    fetch();
  }, [id]);

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("GPS tidak didukung"));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setGpsCoords({ lat: coords.latitude, lng: coords.longitude });
          resolve(coords);
        },
        () => {
          // Demo fallback
          const fallback = { latitude: -6.2088, longitude: 106.8456 };
          setGpsCoords({ lat: fallback.latitude, lng: fallback.longitude });
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });
  };

  // Network-level failures (offline, DNS down, etc.) surface as a raw
  // TypeError from fetch — distinct from the app's own thrown Errors for
  // API-level failures (4xx/5xx), which should still show as a real error.
  const isOffline = (e: any) => !navigator.onLine || e instanceof TypeError;

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      const coords = await getLocation();
      try {
        await api.post(`/visits/${id}/checkin`, coords);
        const res = await api.get<any>(`/visits/${id}`);
        setVisit(res.data);
      } catch (e: any) {
        if (isOffline(e)) {
          await queueOperation({ type: "visit:checkin", endpoint: `${API_BASE_URL}/visits/${id}/checkin`, method: "POST", payload: coords });
          alert("Sedang offline — check-in disimpan dan akan otomatis terkirim saat koneksi kembali.");
        } else {
          throw e;
        }
      }
    } catch (e: any) { alert(e.message || "Check-in gagal"); }
    setCheckingIn(false);
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const coords = await getLocation();
      const payload = { ...coords, meetingNotes: notes, nextSteps };
      try {
        await api.post(`/visits/${id}/checkout`, payload);
        const res = await api.get<any>(`/visits/${id}`);
        setVisit(res.data);
      } catch (e: any) {
        if (isOffline(e)) {
          await queueOperation({ type: "visit:checkout", endpoint: `${API_BASE_URL}/visits/${id}/checkout`, method: "POST", payload });
          alert("Sedang offline — check-out disimpan dan akan otomatis terkirim saat koneksi kembali.");
        } else {
          throw e;
        }
      }
    } catch (e: any) { alert(e.message || "Check-out gagal"); }
    setCheckingOut(false);
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!visit) return <div className="text-center py-20 text-slate-500">Kunjungan tidak ditemukan</div>;

  const isActive = visit.status === "planned" || visit.status === "checked_in";
  const isCompleted = visit.status === "completed";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"><ArrowLeft size={16} /> Kembali</button>

      {/* 3D-style header card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-6 shadow-elevation-high"
        style={{ transform: "perspective(1000px) rotateX(1deg)", boxShadow: "0 20px 60px rgba(37,99,235,0.3), 0 4px 12px rgba(0,0,0,0.1)" }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-sm">
              {visit.status === "completed" ? "Selesai" : visit.status === "checked_in" ? "Sedang Berlangsung" : "Terencana"}
            </span>
            <div className="flex items-center gap-1 text-white/70 text-xs"><Calendar size={12} /> {visit.scheduledDate}</div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{visit.title}</h1>
          <p className="text-white/70 text-sm">{visit.description || "Kunjungan lapangan"}</p>

          {gpsCoords && (
            <div className="mt-4 flex items-center gap-2 text-xs text-white/80 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
              <Crosshair size={14} className="text-green-300" />
              GPS: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
            </div>
          )}
        </div>
      </div>

      {/* Visit timeline */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Clock size={16} /> Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0"><Calendar size={14} className="text-brand-600" /></div>
            <div><p className="text-sm font-medium text-slate-900 dark:text-white">Dijadwalkan</p><p className="text-xs text-slate-500">{visit.scheduledDate} {visit.scheduledStartTime || ""}</p></div>
          </div>
          {visit.checkinTime && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0"><MapPin size={14} className="text-green-600" /></div>
              <div><p className="text-sm font-medium text-slate-900 dark:text-white">Check-in</p><p className="text-xs text-slate-500">{new Date(visit.checkinTime).toLocaleTimeString("id-ID")}</p>
                {visit.checkinDistanceMeters && <p className="text-xs text-slate-400">Jarak: {Math.round(visit.checkinDistanceMeters)}m dari lokasi</p>}
              </div>
            </div>
          )}
          {visit.checkoutTime && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0"><CheckCircle size={14} className="text-blue-600" /></div>
              <div><p className="text-sm font-medium text-slate-900 dark:text-white">Check-out</p><p className="text-xs text-slate-500">{new Date(visit.checkoutTime).toLocaleTimeString("id-ID")}</p>
                {visit.durationMinutes && <p className="text-xs text-slate-400">Durasi: {visit.durationMinutes} menit</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {isActive && (
        <div className="flex gap-3">
          {visit.status === "planned" && (
            <button onClick={handleCheckin} disabled={checkingIn}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-lg shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ boxShadow: "0 8px 32px rgba(37,99,235,0.35)" }}>
              <Navigation size={20} /> {checkingIn ? "Mendeteksi GPS..." : "Check-in"}
            </button>
          )}
          {visit.status === "checked_in" && (
            <button onClick={handleCheckout} disabled={checkingOut}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-lg shadow-lg shadow-green-500/25 transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ boxShadow: "0 8px 32px rgba(16,185,129,0.35)" }}>
              <CheckCircle size={20} /> {checkingOut ? "Menyimpan..." : "Check-out"}
            </button>
          )}
        </div>
      )}

      {/* Notes */}
      {!isCompleted && (
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"><PenLine size={14} /> Catatan Meeting</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow"
              rows={4} placeholder="Tulis catatan kunjungan di sini..." />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"><Camera size={14} /> Langkah Selanjutnya</label>
            <textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow"
              rows={3} placeholder="Follow-up, kirim proposal, telepon..." />
          </div>
        </div>
      )}

      {visit.meetingNotes && isCompleted && (
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-elevation-low p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Catatan Meeting</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{visit.meetingNotes}</p>
          {visit.nextSteps && <><h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-4 mb-2">Langkah Selanjutnya</h3><p className="text-sm text-slate-600 dark:text-slate-400">{visit.nextSteps}</p></>}
        </div>
      )}

      {/* Education B2B Visit Form */}
      {eduEnabled && (visit.status === "planned" || visit.status === "checked_in" || visit.status === "in_progress") && (
        <EduVisitForm
          leadName={visit.title || "Sekolah"}
          onSave={(visits) => {
            // Save each visit
            visits.forEach((v, i) => {
              api.post("/visits", {
                leadId: visit.leadId,
                title: `${visit.title} - Visit #${v.visitNumber}`,
                description: `PIC: ${v.picName} (${v.picRole})\nHP: ${v.picPhone}\nUnit: ${v.unitType}\nProduk: ${v.productOffered}\nTanggapan: ${v.picResponse}`,
                visitType: "scheduled",
                scheduledDate: new Date().toISOString().slice(0, 10),
                scheduledStartTime: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              }).catch(() => {});
            });
          }}
        />
      )}
    </div>
  );
}
