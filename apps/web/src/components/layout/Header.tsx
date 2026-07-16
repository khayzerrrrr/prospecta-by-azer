import { useAuthStore } from "../../stores/authStore";
import { useUIStore } from "../../stores/uiStore";
import { Search, Bell, Sun, Moon, LogOut, Menu, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", manager: "Manager", agent: "Agent",
};
const roleColor: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  admin: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  agent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const role = user?.role || "agent";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-surface-50 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari apa saja..."
            className="w-72 lg:w-96 pl-10 pr-4 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-slate-500">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-slate-500 relative">
          <Bell size={18} />
        </button>

        {/* Role badge */}
        <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleColor[role]}`}>
          <Shield size={11} />
          {roleLabel[role]}
        </span>

        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-surface-200 dark:border-surface-700">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{user?.fullName || "User"}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-slate-400">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
