import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { api } from "../../services/api";
import { WS_URL } from "../../services/config";
import { MapPin, Navigation, Clock, Route, Wifi, WifiOff, Radio } from "lucide-react";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LeadStop {
  id: string; companyName: string; latitude: number; longitude: number;
  address: string; city: string; status: string;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export function AgentMap() {
  const [stops, setStops] = useState<LeadStop[]>([]);
  const [todayVisitCount, setTodayVisitCount] = useState(0);
  const [routeOrder, setRouteOrder] = useState<LeadStop[]>([]);
  const [optimized, setOptimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tracking] = useState(true); // Always active
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const trackingInterval = useRef<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const visits = await api.get<any>(`/visits?dateFrom=${today}&dateTo=${today}&perPage=50`);
        setTodayVisitCount((visits.data || []).length);

        const leads = await api.get<any>("/leads?perPage=50&status=qualified");
        const withCoords = (leads.data || []).filter((l: any) => l.latitude && l.longitude);
        setStops(withCoords.slice(0, 20));
      } catch {}
      setLoading(false);
    }
    load();

    const reportPosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setCurrentPos([latitude, longitude]);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "location_update", payload: { latitude, longitude } }));
      }
    };

    // Auto-connect WebSocket first so the first GPS fix has somewhere to send to
    try {
      const token = localStorage.getItem("access_token");
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      wsRef.current = ws;
    } catch {}

    // Auto-start GPS tracking
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(reportPosition, () => {}, { enableHighAccuracy: true });
      trackingInterval.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(reportPosition, () => {}, { enableHighAccuracy: true, timeout: 5000 });
      }, 15000);
    }

    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const optimizeRoute = () => {
    if (stops.length < 2) return;
    const remaining = [...stops];
    const ordered: LeadStop[] = [];
    let current = remaining.shift()!;
    ordered.push(current);
    while (remaining.length > 0) {
      let nearest = 0, minDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = Math.sqrt(Math.pow(current.latitude - remaining[i]!.latitude, 2) + Math.pow(current.longitude - remaining[i]!.longitude, 2));
        if (d < minDist) { minDist = d; nearest = i; }
      }
      current = remaining.splice(nearest, 1)[0]!;
      ordered.push(current);
    }
    setRouteOrder(ordered);
    setOptimized(true);
  };

  const displayStops = optimized ? routeOrder : stops;
  const positions: [number, number][] = displayStops.map((s) => [s.latitude, s.longitude]);
  const center: [number, number] = currentPos || (stops.length > 0 ? [stops[0]!.latitude, stops[0]!.longitude] : [-6.2088, 106.8456]);

  if (loading) {
    return (
      <div className="mobile-card h-40 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Start/Stop */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Route size={15} className="text-brand-600" />
            Kunjungan Harian
          </h3>
          <p className="text-[11px] text-slate-500">
            {stops.length} prospek · {todayVisitCount} terjadwal
            {tracking && <span className="ml-2 text-emerald-600 font-medium flex items-center gap-1"><Radio size={10} className="animate-pulse" />Live</span>}
          </p>
        </div>
        <button onClick={optimizeRoute} disabled={stops.length < 2}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-surface-700 text-xs font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-surface-200 dark:ring-surface-600 disabled:opacity-40 active:scale-95 transition-all">
          <Navigation size={12} /> {optimized ? "Rute Siap" : "Optimasi"}
        </button>
      </div>

      {/* Live status bar — always visible */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-xs">
        <div className="flex items-center gap-1.5">
          {wsConnected ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-amber-500" />}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            {wsConnected ? "Live Tracking Aktif" : "GPS Aktif (Offline)"}
          </span>
        </div>
        {currentPos && (
          <span className="text-slate-500 ml-auto font-mono text-[10px]">
            {currentPos[0].toFixed(4)}, {currentPos[1].toFixed(4)}
          </span>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700" style={{ height: 280 }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {currentPos && <RecenterMap center={currentPos} />}
          {/* Agent position */}
          {tracking && currentPos && (
            <Marker position={currentPos} icon={L.divIcon({
              className: "",
              html: `<div style="width:24px;height:24px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(16,185,129,0.6);animation:pulse 2s infinite"></div>`,
              iconSize: [24, 24],
            })}>
              <Popup><span className="text-xs font-bold">📍 Posisi Anda</span></Popup>
            </Marker>
          )}
          {/* Lead stops */}
          {displayStops.map((stop, idx) => (
            <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">{optimized ? `${idx + 1}. ` : ""}{stop.companyName}</p>
                  <p className="text-slate-500">{stop.address || stop.city}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {optimized && positions.length > 1 && (
            <Polyline positions={positions} color="#2563eb" weight={3} opacity={0.7} />
          )}
        </MapContainer>
      </div>

      {/* Route order list */}
      {optimized && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock size={10} /> Urutan Rute Hari Ini
          </p>
          {routeOrder.slice(0, 8).map((stop, idx) => (
            <div key={stop.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-900 text-xs">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
              <span className="truncate text-slate-700 dark:text-slate-300">{stop.companyName}</span>
              <span className="text-[10px] text-slate-400 ml-auto shrink-0">{stop.city}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
