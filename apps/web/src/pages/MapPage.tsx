import { useState, useEffect } from "react";
import { api } from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, Navigation, X, Crosshair } from "lucide-react";
import L from "leaflet";

const markerIcon = (color: string) => L.divIcon({
  className: "custom-marker",
  html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -30],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function MapPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([-6.2088, 106.8456]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    api.get<any>("/leads?perPage=100").then((r) => {
      const withCoords = (r.data || []).filter((l: any) => l.latitude && l.longitude);
      setLeads(withCoords);
      if (withCoords.length > 0) setCenter([withCoords[0].latitude, withCoords[0].longitude]);
    });
  }, []);

  const goToGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setCenter([pos.coords.latitude, pos.coords.longitude]); setGpsLoading(false); },
        () => { setGpsLoading(false); alert("GPS tidak tersedia"); },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  };

  const qualColor = (q: string) => q === "hot" ? "#EF4444" : q === "warm" ? "#F59E0B" : "#3B82F6";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Peta Wilayah</h1>
          <p className="text-sm text-slate-500 mt-0.5">{leads.length} prospek di peta</p>
        </div>
        <button onClick={goToGPS} disabled={gpsLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm text-sm font-medium hover:shadow-md transition-shadow">
          <Crosshair size={16} className="text-brand-600" /> {gpsLoading ? "Mencari..." : "Lokasi Saya"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
          {leads.map((lead) => (
            <button key={lead.id} onClick={() => { setSelectedLead(lead); setCenter([lead.latitude!, lead.longitude!]); }}
              className={`w-full text-left p-3 rounded-xl transition-all border ${
                selectedLead?.id === lead.id
                  ? "bg-brand-50 dark:bg-brand-900/30 border-brand-500 shadow-elevation-low"
                  : "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:shadow-md"
              }`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{lead.companyName}</p>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                  style={{ backgroundColor: qualColor(lead.qualification) + "20", color: qualColor(lead.qualification) }}>
                  {lead.qualification === "hot" ? "Panas" : lead.qualification === "warm" ? "Hangat" : "Dingin"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={10} /> {lead.address || lead.city || "Jakarta"}</p>
              {lead.contactName && <p className="text-xs text-slate-400 mt-0.5">{lead.contactName}</p>}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-elevation-mid border border-surface-200 dark:border-surface-700" style={{ height: "70vh", minHeight: "500px" }}>
          <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController center={center} />
            {leads.map((lead) => (
              <Marker key={lead.id} position={[lead.latitude!, lead.longitude!]} icon={markerIcon(qualColor(lead.qualification))}
                eventHandlers={{ click: () => setSelectedLead(lead) }}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{lead.companyName}</p>
                    <p className="text-xs text-slate-500">{lead.contactName}</p>
                    <p className="text-xs text-slate-400">{lead.address || lead.city}</p>
                    <p className="text-xs mt-1"><span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: qualColor(lead.qualification) + "20", color: qualColor(lead.qualification) }}>{lead.qualification}</span></p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        .leaflet-container { background: #1e293b; font-family: 'Inter', sans-serif; }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
      `}</style>
    </div>
  );
}
