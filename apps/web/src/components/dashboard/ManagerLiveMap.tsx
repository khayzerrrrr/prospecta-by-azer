import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../../services/api";
import { Users, MapPin, Radio, Clock, Navigation } from "lucide-react";
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
  lat: number;
  lng: number;
  lastUpdate: string;
  visitsToday: number;
}

const agentColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function ManagerLiveMap() {
  const [agents, setAgents] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  const fetchAgents = async () => {
    try {
      const users = await api.get<any>("/analytics/team-performance");
      const perfData = users.data || [];

      // Map to locations (simulated for demo — real data comes from WebSocket)
      const today = new Date().toISOString().slice(0, 10);
      const visits = await api.get<any>(`/visits?dateFrom=${today}&dateTo=${today}&perPage=100`);
      const visitData = visits.data || [];

      const locations: AgentLocation[] = perfData
        .filter((a: any) => a.role === "agent" || a.completedVisits > 0)
        .map((a: any, i: number) => {
          // Get agent's today visit locations or use default
          const agentVisits = visitData.filter((v: any) => v.userId === a.id);
          const lastVisit = agentVisits[agentVisits.length - 1];

          return {
            id: a.id,
            name: a.fullName,
            role: "agent",
            lat: lastVisit?.checkinLat || (-6.2 + (Math.random() * 0.1 - 0.05)),
            lng: lastVisit?.checkinLng || (106.8 + (Math.random() * 0.1 - 0.05)),
            lastUpdate: lastVisit?.checkinTime || new Date().toISOString(),
            visitsToday: agentVisits.length,
          };
        });

      setAgents(locations);
      setActiveCount(locations.filter((a) => a.visitsToday > 0).length);
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const center: [number, number] = agents.length > 0
    ? [agents[0]!.lat, agents[0]!.lng]
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
          <p className="text-[11px] text-slate-500">
            {agents.length} agent · {activeCount} aktif hari ini
            <span className="ml-2 text-emerald-600 font-medium flex items-center gap-1">
              <Radio size={9} className="animate-pulse" /> Live
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
          {agents.map((agent, i) => {
            const color = agentColors[i % agentColors.length]!;
            return (
              <Marker
                key={agent.id}
                position={[agent.lat, agent.lng]}
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
                      <MapPin size={10} /> {agent.lat.toFixed(4)}, {agent.lng.toFixed(4)}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {new Date(agent.lastUpdate).toLocaleTimeString("id-ID")}
                    </p>
                    <p className="font-medium text-brand-600">
                      {agent.visitsToday} kunjungan hari ini
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
