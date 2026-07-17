import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import {
  Camera, MapPin, CheckCircle2, LogIn, LogOut, Clock, RotateCcw,
  AlertTriangle, Building2, Navigation, X,
} from "lucide-react";

interface AttendanceRecord {
  id: string; date: string; status: string;
  checkinTime: string | null; checkinDistanceMeters: number | null; checkinPhotoUrl: string | null;
  checkoutTime: string | null;
}

type CameraState = "idle" | "starting" | "live" | "captured" | "error";

export default function AttendancePage() {
  const user = useAuthStore((s) => s.user);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeType, setEmployeeType] = useState<"office" | "field" | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<"checkin" | "checkout" | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      const [todayRes, historyRes, meRes] = await Promise.all([
        api.get<any>("/attendance/today"),
        // This page is "my attendance" — always scope to self, regardless
        // of role (admin/manager otherwise get the whole company's records).
        api.get<any>(`/attendance?dateFrom=${fromDate}&userId=${user?.id}`),
        api.get<any>("/employees/me").catch(() => null),
      ]);
      setToday(todayRes.data);
      setHistory((historyRes.data || []).sort((a: any, b: any) => b.date.localeCompare(a.date)));
      if (meRes) setEmployeeType(meRes.data.employeeType);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const openCamera = async (action: "checkin" | "checkout") => {
    setPendingAction(action);
    setShowCamera(true);
    setPhoto(null);
    setGpsError(null);
    setCameraState("starting");

    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setGpsError("Tidak bisa mendapatkan lokasi GPS — pastikan izin lokasi diaktifkan"),
      { enableHighAccuracy: true, timeout: 10000 },
    );

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("live");
    } catch {
      setCameraState("error");
    }
  };

  const closeCamera = () => {
    stopCamera();
    setShowCamera(false);
    setCameraState("idle");
    setPhoto(null);
    setPendingAction(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.8));
    setCameraState("captured");
    stopCamera();
  };

  const retake = async () => {
    setPhoto(null);
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraState("live");
    } catch { setCameraState("error"); }
  };

  const submit = async () => {
    if (!coords || !pendingAction) return;
    setSubmitting(true);
    try {
      const endpoint = pendingAction === "checkin" ? "/attendance/checkin" : "/attendance/checkout";
      const res = await api.post<any>(endpoint, { ...coords, photo });
      if (!res.success) throw new Error(res.error);
      closeCamera();
      load();
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan absensi");
    }
    setSubmitting(false);
  };

  useEffect(() => () => stopCamera(), []);

  const hasCheckedIn = !!today?.checkinTime;
  const hasCheckedOut = !!today?.checkoutTime;

  return (
    <div className="page-enter space-y-4 pb-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Absensi</h1>
        <p className="text-xs lg:text-sm text-slate-500">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Status card */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-elevation-high transition-all ${
        hasCheckedOut ? "bg-gradient-to-br from-slate-600 to-slate-800"
        : hasCheckedIn ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800"
        : "bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800"
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-sm">
              {hasCheckedOut ? "Selesai Hari Ini" : hasCheckedIn ? "Sedang Bekerja" : "Belum Absen"}
            </span>
            {employeeType && (
              <span className="flex items-center gap-1 text-xs text-white/70">
                {employeeType === "office" ? <Building2 size={12} /> : <Navigation size={12} />}
                {employeeType === "office" ? "Staff Kantor" : "Staff Lapangan"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-white/60 text-xs mb-1">Check-in</p>
              <p className="text-2xl font-bold">{today?.checkinTime ? new Date(today.checkinTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
              {today?.checkinDistanceMeters != null && (
                <p className="text-[11px] text-white/60 mt-0.5">{Math.round(today.checkinDistanceMeters)}m dari kantor</p>
              )}
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Check-out</p>
              <p className="text-2xl font-bold">{today?.checkoutTime ? new Date(today.checkoutTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
            </div>
          </div>

          {!hasCheckedIn && (
            <button onClick={() => openCamera("checkin")} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-brand-700 font-bold text-lg active:scale-[0.98] transition-all shadow-lg">
              <LogIn size={20} /> Check-in Sekarang
            </button>
          )}
          {hasCheckedIn && !hasCheckedOut && (
            <button onClick={() => openCamera("checkout")} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-emerald-700 font-bold text-lg active:scale-[0.98] transition-all shadow-lg">
              <LogOut size={20} /> Check-out Sekarang
            </button>
          )}
          {hasCheckedOut && (
            <div className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/10 text-white font-semibold">
              <CheckCircle2 size={20} /> Absensi hari ini selesai
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Clock size={15} /> Riwayat 7 Hari</h3>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white dark:bg-surface-800 rounded-2xl animate-pulse" />)}</div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Belum ada riwayat absensi</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="mobile-card flex items-center gap-3">
                {h.checkinPhotoUrl ? (
                  <img src={h.checkinPhotoUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0"><Clock size={16} className="text-slate-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{new Date(h.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</p>
                  <p className="text-xs text-slate-500">
                    {h.checkinTime ? new Date(h.checkinTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                    {" – "}
                    {h.checkoutTime ? new Date(h.checkoutTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${h.status === "present" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {h.status === "present" ? "Hadir" : h.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 text-white shrink-0">
            <h2 className="font-semibold">{pendingAction === "checkin" ? "Check-in" : "Check-out"}</h2>
            <button onClick={closeCamera} className="p-2 rounded-full hover:bg-white/10"><X size={22} /></button>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {cameraState === "error" && (
              <div className="text-center text-white/80 px-6">
                <AlertTriangle size={40} className="mx-auto mb-3 text-amber-400" />
                <p className="font-medium">Tidak bisa mengakses kamera</p>
                <p className="text-sm text-white/50 mt-1">Pastikan izin kamera diaktifkan di browser kamu</p>
              </div>
            )}
            {(cameraState === "starting" || cameraState === "live") && (
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            )}
            {cameraState === "captured" && photo && (
              <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
            )}

            {/* GPS status overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white flex items-center gap-1.5">
              <MapPin size={12} className={coords ? "text-emerald-400" : "text-amber-400"} />
              {coords ? "Lokasi terdeteksi" : gpsError || "Mencari lokasi..."}
            </div>
          </div>

          <div className="p-6 shrink-0 flex items-center justify-center gap-4">
            {cameraState === "live" && (
              <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 active:scale-90 transition-transform">
                <Camera size={26} className="text-slate-900" />
              </button>
            )}
            {cameraState === "captured" && (
              <>
                <button onClick={retake} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 text-white font-medium active:scale-95 transition-transform">
                  <RotateCcw size={16} /> Ambil Ulang
                </button>
                <button onClick={submit} disabled={submitting || !coords}
                  className="flex-1 max-w-[220px] flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-600 text-white font-bold disabled:opacity-50 active:scale-95 transition-transform">
                  {submitting ? "Menyimpan..." : pendingAction === "checkin" ? "Konfirmasi Check-in" : "Konfirmasi Check-out"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
