import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../../services/api";
import { WS_URL } from "../../services/config";
import { Users, MapPin, Radio, Clock, Navigation, Wifi, WifiOff } from "lucide-react";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface AgentLocation {
  id: string;
  name: string;
  role: string;
  lat: number | null;
  lng: number | null;
  lastUpdate: string;
  visitsToday: number;
  live: boolean;
}

const agentColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function ManagerLiveMap() {
  const [agents, setAgents] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchAgents = async () => {
    try {
      const users = await api.get<any>("/analytics/team-performance");
      const perfData = users.data || [];

      const today = new Date().toISOString().slice(0, 10);
      const visits = await api.get<any>(`/visits?dateFrom=${today}&dateTo=${today}&perPage=100`);
      const visitData = visits.data || [];

      setAgents((prev) => {
        const prevById = new Map(prev.map((a) => [a.id, a]));
        // /analytics/team-performance already only returns agents — no
        // "role" field comes back on each row, so filtering on it here
        // was always a no-op that silently hid idle (0-visit) agents.
        return perfData
          .map((a: any) => {
            const agentVisits = visitData.filter((v: any) => v.userId === a.id);
            const lastVisit = agentVisits[agentVisits.length - 1];
            const existing = prevById.get(a.id);
            // Prefer a live WS position already held in state; otherwise fall
            // back to today's last check-in location; otherwise unpositioned.
            return {
              id: a.id,
              name: a.fullName,
              role: "agent",
              lat: existing?.lat ?? lastVisit?.checkinLat ?? null,
              lng: existing?.lng ?? lastVisit?.checkinLng ?? null,
              lastUpdate: existing?.lastUpdate ?? lastVisit?.checkinTime ?? new Date().toISOString(),
              visitsToday: agentVisits.length,
              live: existing?.live ?? false,
            };
          });
      });
      setActiveCount(visitData.length > 0 ? new Set(visitData.map((v: any) => v.userId)).size : 0);
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000); // Refresh roster every 30s

    // Live position updates over WebSocket — teammates' location_update
    // messages are broadcast to everyone in the same company.
    try {
      const token = localStorage.getItem("access_token");
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "agent_location") {
            setAgents((prev) => prev.map((a) => a.id === msg.userId
              ? { ...a, lat: msg.latitude, lng: msg.longitude, lastUpdate: msg.timestamp, live: true }
              : a));
          }
        } catch {}
      };
      wsRef.current = ws;
    } catch {}

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, []);

  const positioned = agents.filter((a) => a.lat != null && a.lng != null);
  const center: [number, number] = positioned.length > 0
    ? [positioned[0]!.lat!, positioned[0]!.lng!]
    : [-6.2088, 106.8456];

  if (loading) {
    return (
      <div className="mobile-card h-40 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={15} className="text-brand-600" />
            Live Tracking Tim
          </h3>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            {agents.length} agent · {activeCount} aktif hari ini
            <span className={`ml-2 font-medium flex items-center gap-1 ${wsConnected ? "text-emerald-600" : "text-amber-600"}`}>
              {wsConnected ? <Wifi size={9} /> : <WifiOff size={9} />}
              {wsConnected ? <><Radio size={9} className="animate-pulse" /> Live</> : "Offline"}
            </span>
          </p>
        </div>
        <button onClick={fetchAgents}
          className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-slate-400 transition-colors">
          <Navigation size={14} />
        </button>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700" style={{ height: 320 }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {positioned.map((agent, i) => {
            const color = agentColors[i % agentColors.length]!;
            return (
              <Marker
                key={agent.id}
                position={[agent.lat!, agent.lng!]}
                icon={L.divIcon({
                  className: "",
                  html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold">${agent.name.charAt(0)}</div>`,
                  iconSize: [28, 28],
                })}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[120px]">
                    <p className="font-bold text-sm">{agent.name}</p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> {agent.lat!.toFixed(4)}, {agent.lng!.toFixed(4)}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {new Date(agent.lastUpdate).toLocaleTimeString("id-ID")}
                    </p>
                    <p className="font-medium text-brand-600">
                      {agent.visitsToday} kunjungan hari ini {agent.live && "· posisi live"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Agent list */}
      <div className="space-y-1">
        {agents.map((agent, i) => {
          const color = agentColors[i % agentColors.length]!;
          return (
            <div key={agent.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 text-xs">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
                {agent.name.charAt(0)}
              </div>
              <span className="font-medium text-slate-900 dark:text-white flex-1 truncate">{agent.name}</span>
              {agent.live && <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5"><Radio size={8} className="animate-pulse" />live</span>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${agent.visitsToday > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500"}`}>
                {agent.visitsToday} visit
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
