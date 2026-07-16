import { NavLink } from "react-router-dom";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import { usePackStore } from "../../stores/packStore";
import {
  LayoutDashboard, Users, MapPin, Calendar, KanbanSquare,
  Route, ClipboardCheck, BarChart3, Map, Settings, ChevronLeft,
  ChevronDown, Sparkles, Building2, Zap, Bot, FileText, Mic,
  TrendingUp, Brain, Store, GraduationCap, Heart, Home, Car,
  Factory, ShoppingBag, Cloud, Truck,
} from "lucide-react";

// ── Role-based visibility ──
const roleLabel: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", manager: "Manager", agent: "Agent",
};
const roleColor: Record<string, string> = {
  super_admin: "bg-red-500", admin: "bg-brand-500", manager: "bg-amber-500", agent: "bg-emerald-500",
};

// ── Core Modules ──
const coreModules = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["super_admin", "admin", "manager", "agent"] },
  { to: "/leads", icon: Users, label: "CRM", roles: ["super_admin", "admin", "manager", "agent"], description: "Prospek & Kontak" },
  { to: "/pipeline", icon: KanbanSquare, label: "Pipeline", roles: ["super_admin", "admin", "manager", "agent"], description: "Deal Tracking" },
  { to: "/visits", icon: MapPin, label: "Kunjungan", roles: ["super_admin", "admin", "manager", "agent"], description: "GPS Check-in" },
  { to: "/calendar", icon: Calendar, label: "Kalender", roles: ["super_admin", "admin", "manager", "agent"] },
  { to: "/routes", icon: Route, label: "Rute", roles: ["super_admin", "admin", "manager", "agent"] },
  { to: "/follow-ups", icon: ClipboardCheck, label: "Follow-up", roles: ["super_admin", "admin", "manager"] },
  { to: "/analytics", icon: BarChart3, label: "Analitik", roles: ["super_admin", "admin", "manager"] },
  { to: "/team", icon: Users, label: "Tim", roles: ["super_admin", "admin", "manager"] },
  { to: "/settings", icon: Settings, label: "Pengaturan", roles: ["super_admin", "admin"] },
];

// ── Industry Packs ──
const industryPacks = [
  { id: "education", icon: GraduationCap, label: "Education", color: "text-violet-400" },
  { id: "banking", icon: Store, label: "Banking", color: "text-emerald-400" },
  { id: "healthcare", icon: Heart, label: "Healthcare", color: "text-red-400" },
  { id: "property", icon: Home, label: "Property", color: "text-amber-400" },
  { id: "automotive", icon: Car, label: "Automotive", color: "text-blue-400" },
  { id: "manufacturing", icon: Factory, label: "Manufacturing", color: "text-slate-400" },
  { id: "retail", icon: ShoppingBag, label: "Retail", color: "text-pink-400" },
  { id: "saas", icon: Cloud, label: "SaaS", color: "text-cyan-400" },
  { id: "distributor", icon: Truck, label: "Distributor", color: "text-orange-400" },
];

// ── AI Packs ──
const aiPacks = [
  { id: "sales-coach", icon: Brain, label: "Sales Coach AI", color: "text-violet-400", badge: "New" },
  { id: "proposal", icon: FileText, label: "Proposal AI", color: "text-blue-400" },
  { id: "meeting", icon: Mic, label: "Meeting AI", color: "text-emerald-400" },
  { id: "analytics-ai", icon: TrendingUp, label: "Analytics AI", color: "text-amber-400" },
  { id: "forecast", icon: Bot, label: "Forecast AI", color: "text-rose-400", badge: "Soon" },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "agent";

  const [coreExpanded, setCoreExpanded] = useState(true);
  const [industryExpanded, setIndustryExpanded] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const { activePack, openPack, closePack } = usePackStore();
  const activeIndustry = activePack?.type === "industry" ? activePack.id : null;
  const activeAi = activePack?.type === "ai" ? activePack.id : null;

  const handleIndustryClick = (id: string, label: string, color: string) => {
    if (activeIndustry === id) { closePack(); return; }
    openPack("industry", id, label, color);
  };
  const handleAiClick = (id: string, label: string, color: string) => {
    if (activeAi === id) { closePack(); return; }
    openPack("ai", id, label, color);
  };

  const enabledPacks = usePackStore((s) => s.enabledPacks);
  const isPackEnabled = (prefix: string, id: string) => !!enabledPacks[id];

  const visibleCore = coreModules.filter((m) => m.roles.includes(role));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-surface-900 text-white transition-all duration-200 flex flex-col overflow-hidden",
        sidebarOpen ? "w-64" : "w-[4.5rem]",
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center h-14 px-4 border-b border-white/10 shrink-0", sidebarOpen ? "justify-between" : "justify-center")}>
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Prospecta" className="w-7 h-7 object-contain" />
            <div>
              <span className="text-base font-bold tracking-tight text-white leading-tight block">Prospecta</span>
              <span className="text-[10px] text-blue-300 leading-tight block -mt-0.5">by Azer</span>
            </div>
          </div>
        ) : (
          <img src="/logo.png" alt="Prospecta" className="w-6 h-6 object-contain" />
        )}
        {sidebarOpen && (
          <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-white/10 transition-colors">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-4 scrollbar-thin">
        {/* ─── Core Section ─── */}
        <div>
          {sidebarOpen && (
            <button
              onClick={() => setCoreExpanded(!coreExpanded)}
              className="flex items-center justify-between w-full px-2 py-1 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span>Core</span>
              <ChevronDown size={12} className={cn("transition-transform", coreExpanded && "rotate-180")} />
            </button>
          )}
          {coreExpanded && (
            <div className="space-y-0.5">
              {visibleCore.map(({ to, icon: Icon, label, description }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all group",
                      isActive
                        ? "bg-brand-600/20 text-brand-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                      !sidebarOpen && "justify-center px-2",
                    )
                  }
                >
                  <Icon size={18} />
                  {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <span className="block leading-tight">{label}</span>
                      {description && <span className="text-[10px] text-slate-500 leading-tight">{description}</span>}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* ─── Industry Packs Section ─── */}
        <div>
          {sidebarOpen && (
            <button
              onClick={() => setIndustryExpanded(!industryExpanded)}
              className="flex items-center justify-between w-full px-2 py-1 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Building2 size={11} />
                <span>Industry Packs</span>
              </div>
              <ChevronDown size={12} className={cn("transition-transform", industryExpanded && "rotate-180")} />
            </button>
          )}
          {(industryExpanded || !sidebarOpen) && (
            <div className="space-y-0.5">
              {industryPacks.map(({ id, icon: Icon, label, color }) => (
                <button
                  key={id}
                  onClick={() => handleIndustryClick(id, label, color)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all w-full text-left",
                    activeIndustry === id
                      ? "bg-white/10 text-white"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300",
                    !sidebarOpen && "justify-center px-2",
                  )}
                >
                  <Icon size={15} className={cn(color, (activeIndustry === id || isPackEnabled("industry", id)) && "opacity-100")} />
                  {sidebarOpen && <span className="flex-1">{label}</span>}
                  {sidebarOpen && isPackEnabled("industry", id) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── AI Packs Section ─── */}
        <div>
          {sidebarOpen && (
            <button
              onClick={() => setAiExpanded(!aiExpanded)}
              className="flex items-center justify-between w-full px-2 py-1 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-brand-400" />
                <span className="text-brand-400">AI Packs</span>
              </div>
              <ChevronDown size={12} className={cn("transition-transform", aiExpanded && "rotate-180")} />
            </button>
          )}
          {(aiExpanded || !sidebarOpen) && (
            <div className="space-y-0.5">
              {aiPacks.map(({ id, icon: Icon, label, color, badge }) => (
                <button
                  key={id}
                  onClick={() => handleAiClick(id, label, color)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all w-full text-left",
                    activeAi === id
                      ? "bg-brand-600/20 text-brand-300"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300",
                    !sidebarOpen && "justify-center px-2",
                  )}
                >
                  <Icon size={15} className={cn(color, (activeAi === id || isPackEnabled("ai", id)) && "opacity-100")} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{label}</span>
                      {isPackEnabled("ai", id) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                      {badge && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold",
                          badge === "New" ? "bg-brand-500/20 text-brand-300" : "bg-slate-700 text-slate-400"
                        )}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-white/10 shrink-0">
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.fullName || "User"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${roleColor[role]}`} />
                <span className="text-[10px] text-slate-500">{roleLabel[role]}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.fullName?.charAt(0) || "U"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
