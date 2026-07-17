import { create } from "zustand";
import { api } from "../services/api";

interface PackInfo {
  id: string;
  name: string;
  enabled: boolean;
  features: string[];
  templates: string[];
  config: any;
}

interface PackState {
  // AI packs only — industry packs were retired (see IndustryFields.tsx /
  // company.service.ts: industry is now fixed once per company at
  // provisioning, not a self-service marketplace toggle).
  activePack: { id: string; label: string; color: string } | null;
  enabledPacks: Record<string, PackInfo>;
  isLoading: boolean;

  openPack: (id: string, label: string, color: string) => void;
  closePack: () => void;
  loadPacks: () => Promise<void>;
  isPackEnabled: (packId: string) => boolean;
  getPackInfo: (packId: string) => PackInfo | undefined;
}

export const usePackStore = create<PackState>((set, get) => ({
  activePack: null,
  enabledPacks: {},
  isLoading: false,

  openPack: (id, label, color) => {
    const current = get().activePack;
    if (current?.id === id) {
      set({ activePack: null });
      return;
    }
    set({ activePack: { id, label, color } });
  },

  closePack: () => set({ activePack: null }),

  loadPacks: async () => {
    set({ isLoading: true });
    try {
      const ai = await api.get<any>("/packs/ai");
      const enabled: Record<string, PackInfo> = {};
      (ai.data || []).forEach((p: any) => {
        if (p.enabled) {
          enabled[p.id] = {
            id: p.id,
            name: p.name,
            enabled: true,
            features: p.features || p.capabilities || [],
            templates: p.templates || [],
            config: p.config || {},
          };
        }
      });
      set({ enabledPacks: enabled, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  isPackEnabled: (packId: string) => {
    return !!get().enabledPacks[packId];
  },

  getPackInfo: (packId: string) => {
    return get().enabledPacks[packId];
  },
}));
