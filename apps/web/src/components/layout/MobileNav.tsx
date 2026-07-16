import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, MapPin, KanbanSquare, Plus } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";

const allItems = [
  { to: "/", icon: LayoutDashboard, label: "Home", roles: ["super_admin", "admin", "manager", "agent"] },
  { to: "/leads", icon: Users, label: "Prospek", roles: ["super_admin", "admin", "manager", "agent"] },
  { id: "add" as const, icon: Plus, label: "Baru", roles: ["super_admin", "admin", "manager", "agent"] },
  { to: "/visits", icon: MapPin, label: "Kunjungan", roles: ["super_admin", "admin", "manager", "agent"] },
  { to: "/pipeline", icon: KanbanSquare, label: "Pipeline", roles: ["super_admin", "admin", "manager", "agent"] },
];

const allQuickActions = [
  { label: "Prospek Baru", href: "/leads", roles: ["super_admin", "admin", "manager", "agent"] },
  { label: "Kunjungan Baru", href: "/visits", roles: ["super_admin", "admin", "manager", "agent"] },
  { label: "Deal Baru", href: "/pipeline", roles: ["super_admin", "admin", "manager", "agent"] },
];

export function MobileNav() {
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role) || "agent";

  const mobileItems = allItems.filter((item) => item.roles.includes(role));
  const quickActions = allQuickActions.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Quick Action Overlay */}
      {fabOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setFabOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => { setFabOpen(false); window.location.href = action.href; }}
                className="px-5 py-3 rounded-2xl bg-white dark:bg-surface-800 shadow-elevation-high text-sm font-semibold text-slate-800 dark:text-white whitespace-nowrap hover:scale-105 active:scale-95 transition-transform"
              >
                {action.label}
              </button>
            ))}
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center cursor-pointer" onClick={() => setFabOpen(false)}>
              <Plus size={24} className="text-white rotate-45 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-t border-surface-200/60 dark:border-surface-700/60 pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            {mobileItems.map((item) => {
              if (item.id === "add") {
                return (
                  <button
                    key="add"
                    onClick={() => setFabOpen(!fabOpen)}
                    className="relative -mt-6 flex flex-col items-center"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-elevation-high transition-all duration-200 ${fabOpen ? 'bg-brand-700 rotate-45 scale-90' : 'bg-brand-600 hover:bg-brand-700 active:scale-95'}`}>
                      <Plus size={24} className="text-white transition-transform" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 mt-1">Baru</span>
                  </button>
                );
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="relative flex flex-col items-center gap-1 px-2 py-1 min-w-[56px]"
                >
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
