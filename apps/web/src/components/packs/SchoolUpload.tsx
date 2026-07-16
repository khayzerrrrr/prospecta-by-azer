import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, FileText, X, Check, Database, Download } from "lucide-react";
import { api } from "../../services/api";

interface SchoolRecord {
  schoolName: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  principalName: string;
  level: string;
  studentCount: string;
  latitude: string;
  longitude: string;
}

export function SchoolUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SchoolRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): SchoolRecord[] => {
    const lines = text.split("\n").filter(Boolean);
    const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const record: any = {};
      headers.forEach((h, i) => { record[h] = values[i] || ""; });
      return {
        schoolName: record.school_name || record.schoolname || record.nama_sekolah || "",
        address: record.address || record.alamat || "",
        city: record.city || record.kota || "",
        province: record.province || record.provinsi || "",
        phone: record.phone || record.telepon || record.telp || "",
        email: record.email || "",
        principalName: record.principal || record.kepala_sekolah || record.contact_name || "",
        level: record.level || record.jenjang || record.jenjang_sekolah || "",
        studentCount: record.student_count || record.jumlah_siswa || record.siswa || "",
        latitude: record.latitude || record.lat || "",
        longitude: record.longitude || record.lng || record.lon || "",
      };
    });
  };

  const parseMarkdown = (text: string): SchoolRecord[] => {
    const records: SchoolRecord[] = [];
    const sections = text.split(/^## /m).filter(Boolean);

    for (const section of sections) {
      const lines = section.split("\n");
      const name = lines[0]!.trim();
      if (!name || name.startsWith("#")) continue;

      const record: any = {
        schoolName: name,
        address: "", city: "", province: "", phone: "", email: "",
        principalName: "", level: "", studentCount: "", latitude: "", longitude: "",
      };

      for (const line of lines) {
        const match = line.match(/^\s*-\s*\*\*([^:]+)\*\*:\s*(.+)/);
        if (match) {
          const key = match[1]!.trim().toLowerCase().replace(/\s+/g, "_");
          const val = match[2]!.trim();
          const keyMap: Record<string, string> = {
            alamat: "address", address: "address",
            kota: "city", city: "city",
            provinsi: "province", province: "province",
            telepon: "phone", telp: "phone", phone: "phone",
            email: "email",
            kepala_sekolah: "principalName", principal: "principalName", contact_name: "principalName",
            jenjang: "level", level: "level",
            jumlah_siswa: "studentCount", siswa: "studentCount", student_count: "studentCount",
            latitude: "latitude", lat: "latitude",
            longitude: "longitude", lng: "longitude", lon: "longitude",
          };
          const mapped = keyMap[key] || key;
          record[mapped] = val;
        }
      }

      records.push(record);
    }

    return records;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");

    const text = await f.text();
    let records: SchoolRecord[] = [];

    if (f.name.endsWith(".csv")) {
      records = parseCSV(text);
    } else if (f.name.endsWith(".md")) {
      records = parseMarkdown(text);
    } else {
      setError("Format tidak didukung. Gunakan .csv atau .md");
      return;
    }

    setPreview(records.slice(0, 10));
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);

    try {
      const res = await api.post<any>("/packs/industry/education/import-schools", {
        schools: preview.map((r) => ({
          schoolName: r.schoolName,
          principalName: r.principalName,
          phone: r.phone,
          email: r.email,
          address: r.address,
          city: r.city,
          province: r.province,
          level: r.level,
          studentCount: r.studentCount,
          latitude: r.latitude || undefined,
          longitude: r.longitude || undefined,
        })),
      });
      setImported(res.data?.imported || preview.length);
    } catch (e: any) {
      setError(e.message);
    }

    setImporting(false);
    setPreview([]);
    setFile(null);
  };

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-all bg-surface-50/50 dark:bg-surface-900/50"
      >
        <input ref={fileRef} type="file" accept=".csv,.md" onChange={handleFile} className="hidden" />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            {file.name.endsWith(".csv") ? <FileSpreadsheet size={36} className="text-emerald-500" /> : <FileText size={36} className="text-violet-500" />}
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-slate-500">{preview.length} sekolah terdeteksi</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview([]); }} className="text-xs text-red-500 hover:underline">Hapus file</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Upload Database Sekolah</p>
            <p className="text-xs text-slate-500">CSV atau Markdown (.md) — drag & drop atau klik</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
          <X size={14} /> {error}
        </div>
      )}

      {/* Success */}
      {imported > 0 && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
          <Check size={14} /> {imported} sekolah berhasil diimpor ke database!
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={12} /> Preview ({preview.length} dari {file ? "file" : "0"})
            </h3>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold disabled:opacity-50 transition-all"
            >
              <Download size={12} />
              {importing ? "Mengimpor..." : "Import ke CRM"}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900">
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Sekolah</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Kota</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Jenjang</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Siswa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                {preview.map((s, i) => (
                  <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900 dark:text-white">{s.schoolName || "-"}</p>
                      <p className="text-[10px] text-slate-500">{s.principalName || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{s.city || "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{s.level || "-"}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{s.studentCount || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Format guide */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-400 mb-2">Format file yang didukung</summary>
        <div className="space-y-3 pl-2">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">CSV Format:</p>
            <pre className="bg-surface-100 dark:bg-surface-900 p-2 rounded-lg text-[10px] overflow-x-auto">
{`school_name,address,city,province,phone,email,principal_name,level,student_count,latitude,longitude
SMA Negeri 1,Jl. Merdeka 10,Jakarta Pusat,DKI Jakarta,021-123456,info@sman1.sch.id,Drs. Ahmad,SMA,1200,-6.2088,106.8456`}
            </pre>
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Markdown Format:</p>
            <pre className="bg-surface-100 dark:bg-surface-900 p-2 rounded-lg text-[10px] overflow-x-auto">
{`## SMA Negeri 1 Jakarta
- **Alamat**: Jl. Merdeka 10
- **Kota**: Jakarta Pusat
- **Provinsi**: DKI Jakarta
- **Telepon**: 021-123456
- **Email**: info@sman1.sch.id
- **Kepala Sekolah**: Drs. Ahmad
- **Jenjang**: SMA
- **Jumlah Siswa**: 1200
- **Latitude**: -6.2088
- **Longitude**: 106.8456

## SMP Negeri 5 Bandung
- **Alamat**: Jl. Diponegoro 50
- **Kota**: Bandung
- **Jenjang**: SMP
- **Jumlah Siswa**: 850`}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}
