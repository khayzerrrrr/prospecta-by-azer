import { useState, useRef, useEffect } from "react";
import { Camera, MapPin, Plus, X, ChevronRight, Save, Navigation, Loader2, Check, User, Phone, Building } from "lucide-react";

interface EduVisit {
  visitNumber: number;
  picName: string;
  picPhone: string;
  picRole: string;
  unitType: string;
  studentCount: string;
  productOffered: string;
  picResponse: string;
  photoData: string | null;
  photoFile: File | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
}

const unitTypes = ["TK/PAUD", "SD/MI", "SMP/MTs", "SMA/MA", "SMK"];
const bizTypes = ["Sales BUKU", "Program Sekolah", "Software Sekolah", "Pengadaan Barang"];

const productByBiz: Record<string, string[]> = {
  "Sales BUKU": ["Buku Paket K13", "Buku Kurikulum Merdeka", "Buku Penunjang", "LKS/Modul", "Buku Perpustakaan", "Buku Digital/e-Book", "Alat Peraga"],
  "Program Sekolah": ["Pelatihan Guru", "Workshop Siswa", "Bimbingan Belajar", "Program Olimpiade", "English Camp", "Coding Class", "Leadership Training"],
  "Software Sekolah": ["Sistem Administrasi", "E-Learning/LMS", "Absensi Digital", "Raport Online", "PPDB Online", "Perpustakaan Digital", "Ujian Online/CBT"],
  "Pengadaan Barang": ["Meja & Kursi", "Komputer/Laptop", "LCD Proyektor", "Alat Lab IPA", "Seragam Sekolah", "ATK & Perlengkapan", "AC & Kipas Angin"],
};

const responseOptions = [
  "Sangat Tertarik - Minta Penawaran",
  "Tertarik - Mau Demo/Sample Lanjutan",
  "Cukup Tertarik - Butuh Review Internal",
  "Kurang Tertarik - Budget/Prioritas Lain",
  "Tidak Tertarik - Sudah Ada Vendor",
  "Follow-up Dijanjikan (tgl)",
];

export function EduVisitForm({ leadName, onSave }: { leadName: string; onSave: (visits: EduVisit[]) => void }) {
  const [visits, setVisits] = useState<EduVisit[]>([]);
  const [currentVisit, setCurrentVisit] = useState<EduVisit>(emptyVisit(1));
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof EduVisit, value: any) => {
    setCurrentVisit((v) => ({ ...v, [field]: value }));
  };

  const capturePhoto = () => {
    cameraRef.current?.click();
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("photoData", reader.result as string);
    reader.readAsDataURL(file);
    update("photoFile", file);
  };

  const getGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("GPS tidak didukung di browser ini");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("latitude", pos.coords.latitude);
        update("longitude", pos.coords.longitude);
        // Reverse geocode — use simple fallback
        update("address", `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setGpsLoading(false);
      },
      (err) => {
        alert("Gagal mendapatkan lokasi: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const addVisit = () => {
    if (!currentVisit.picName || !currentVisit.picResponse) {
      alert("Nama PIC dan Tanggapan wajib diisi");
      return;
    }
    const visit = { ...currentVisit, timestamp: new Date().toISOString() };
    setVisits((prev) => [...prev, visit]);
    setCurrentVisit(emptyVisit(visits.length + 2));
  };

  const handleSaveAll = () => {
    const allVisits = currentVisit.picName ? [...visits, { ...currentVisit, visitNumber: visits.length + 1, timestamp: new Date().toISOString() }] : visits;
    if (allVisits.length === 0) { alert("Minimal 1 visit harus diisi"); return; }
    setSaving(true);
    setTimeout(() => {
      onSave(allVisits);
      setSaving(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
        <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shrink-0">
          <Building size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-violet-900 dark:text-violet-200">{leadName}</p>
          <p className="text-[11px] text-violet-600 dark:text-violet-400">B2B · Buku / Program / Software / Pengadaan</p>
        </div>
      </div>

      {/* Visit Timeline */}
      {visits.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ChevronRight size={10} /> Riwayat Visit
          </p>
          {visits.map((v, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 text-xs">
              <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{v.visitNumber}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">{v.picName} · {v.picRole}</p>
                <p className="text-slate-500 mt-0.5">{v.picPhone} · {v.unitType} · {v.productOffered}</p>
                <p className={`text-[11px] mt-0.5 font-medium ${
                  v.picResponse.includes("Sangat") ? "text-emerald-600" :
                  v.picResponse.includes("Tertarik") ? "text-brand-600" :
                  v.picResponse.includes("Cukup") ? "text-amber-600" :
                  "text-slate-500"
                }`}>↳ {v.picResponse}</p>
                {v.photoData && (
                  <img src={v.photoData} className="w-12 h-12 rounded-lg object-cover mt-1 ring-1 ring-surface-200" alt="Visit" />
                )}
              </div>
              <button onClick={() => setVisits((p) => p.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-50 text-red-400"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Current Visit Form */}
      <div className="border-t border-violet-100 dark:border-violet-800 pt-3">
        <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3">
          Visit #{visits.length + 1} — Data PIC & Kunjungan
        </p>

        {/* PIC Info */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Nama PIC *</label>
            <input value={currentVisit.picName} onChange={(e) => update("picName", e.target.value)}
              placeholder="Nama lengkap yang ditemui"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Jabatan PIC</label>
            <input value={currentVisit.picRole} onChange={(e) => update("picRole", e.target.value)}
              placeholder="Kepala Sekolah / Wakasek / Guru"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">No HP PIC *</label>
            <input value={currentVisit.picPhone} onChange={(e) => update("picPhone", e.target.value)}
              type="tel" placeholder="0812-3456-7890"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          </div>
        </div>

        {/* GPS + Address */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Alamat (dari GPS)</label>
          <div className="flex gap-2">
            <input value={currentVisit.address} onChange={(e) => update("address", e.target.value)}
              placeholder="Klik GPS untuk auto-detect"
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" />
            <button type="button" onClick={getGPS} disabled={gpsLoading}
              className="px-3 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50 shrink-0">
              {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              GPS
            </button>
          </div>
          {currentVisit.latitude && (
            <p className="text-[10px] text-violet-500 mt-1">
              📍 {currentVisit.latitude.toFixed(6)}, {currentVisit.longitude?.toFixed(6)}
            </p>
          )}
        </div>

        {/* Camera Photo */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Foto Langsung (Kamera)</label>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
          {currentVisit.photoData ? (
            <div className="relative inline-block">
              <img src={currentVisit.photoData} className="w-24 h-24 rounded-xl object-cover ring-1 ring-surface-200" alt="Captured" />
              <button onClick={() => { update("photoData", null); update("photoFile", null); }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X size={10} /></button>
            </div>
          ) : (
            <button type="button" onClick={capturePhoto}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
              <Camera size={16} /> Buka Kamera
            </button>
          )}
        </div>

        {/* Unit Type & Student Count */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Jenis Unit *</label>
            <select value={currentVisit.unitType} onChange={(e) => update("unitType", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none">
              <option value="">Pilih unit</option>
              {unitTypes.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Jml Siswa (opsional)</label>
            <input value={currentVisit.studentCount} onChange={(e) => update("studentCount", e.target.value)}
              type="number" placeholder="1200"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none" />
          </div>
        </div>

        {/* Business Type */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Jenis Bisnis *</label>
          <select value={currentVisit.productOffered ? bizTypes.find((b) => productByBiz[b]?.includes(currentVisit.productOffered)) || "" : ""}
            onChange={(e) => { update("productOffered", ""); /* reset product when biz type changes */ }}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none">
            <option value="">Pilih jenis bisnis</option>
            {bizTypes.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Product Offered — dynamic based on biz type */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Produk/Program Ditawarkan</label>
          <select value={currentVisit.productOffered} onChange={(e) => update("productOffered", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none">
            <option value="">Pilih produk</option>
            {Object.entries(productByBiz).flatMap(([biz, products]) => products.map((p) => (
              <option key={`${biz}-${p}`} value={p}>{biz} → {p}</option>
            )))}
          </select>
        </div>

        {/* PIC Response */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-violet-700 dark:text-violet-400 mb-1">Tanggapan PIC *</label>
          <select value={currentVisit.picResponse} onChange={(e) => update("picResponse", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 ring-1 ring-surface-200 dark:ring-surface-700 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none">
            <option value="">Pilih tanggapan</option>
            {responseOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button type="button" onClick={addVisit}
            className="flex-1 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-violet-200 transition-colors">
            <Plus size={14} /> Tambah Visit #{visits.length + 1}
          </button>
          <button type="button" onClick={handleSaveAll} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Menyimpan..." : "Simpan Semua Visit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function emptyVisit(num: number): EduVisit {
  return {
    visitNumber: num,
    picName: "",
    picPhone: "",
    picRole: "",
    unitType: "",
    studentCount: "",
    productOffered: "",
    picResponse: "",
    photoData: null,
    photoFile: null,
    address: "",
    latitude: null,
    longitude: null,
    timestamp: "",
  };
}
