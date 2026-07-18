import { Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { PackPanel } from "./PackPanel";
import { useAuthStore } from "../../stores/authStore";
import { useUIStore } from "../../stores/uiStore";
import { usePackStore } from "../../stores/packStore";
import { cn } from "../../lib/utils";

export function AppShell() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  const { activePack, closePack, loadPacks } = usePackStore();

  useEffect(() => {
    if (isAuthenticated) loadPacks();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-elevation-mid animate-pulse">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Memuat Pevotrack...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-[4.5rem]",
          activePack && "lg:mr-96", // Shift left when pack panel is open
        )}
      >
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/60 dark:border-surface-700/60">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <img src="/logo-full.png" alt="Pevotrack" className="h-6 object-contain" />
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Pack Detail Panel */}
      {activePack && (
        <PackPanel
          packId={activePack.id}
          packLabel={activePack.label}
          onClose={closePack}
        />
      )}

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
