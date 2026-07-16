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
  activePack: { type: "industry" | "ai"; id: string; label: string; color: string } | null;
  enabledPacks: Record<string, PackInfo>;
  isLoading: boolean;

  openPack: (type: "industry" | "ai", id: string, label: string, color: string) => void;
  closePack: () => void;
  loadPacks: () => Promise<void>;
  isPackEnabled: (packId: string) => boolean;
  getPackInfo: (packId: string) => PackInfo | undefined;
}

export const usePackStore = create<PackState>((set, get) => ({
  activePack: null,
  enabledPacks: {},
  isLoading: false,

  openPack: (type, id, label, color) => {
    const current = get().activePack;
    if (current?.id === id && current?.type === type) {
      set({ activePack: null });
      return;
    }
    set({ activePack: { type, id, label, color } });
  },

  closePack: () => set({ activePack: null }),

  loadPacks: async () => {
    set({ isLoading: true });
    try {
      const [ind, ai] = await Promise.all([
        api.get<any>("/packs/industry"),
        api.get<any>("/packs/ai"),
      ]);
      const enabled: Record<string, PackInfo> = {};
      [...(ind.data || []), ...(ai.data || [])].forEach((p: any) => {
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
