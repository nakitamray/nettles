import { create } from "zustand";
import { seedField } from "./seed";
import { loadExtinguished, saveExtinguished } from "./storage";
import type { Stalk } from "./types";

type FieldState = {
  stalks: Stalk[];
  entered: boolean;
  muted: boolean;
  // pointer lock is on, so the mouse steers the view
  locked: boolean;
  touch: boolean;
  planting: boolean;
  music: "song" | "ambient";
  aimedId: string | null;
  readingId: string | null;
  extinguished: Set<string>;
  enter: () => void;
  toggleMute: () => void;
  setLocked: (locked: boolean) => void;
  setTouch: (touch: boolean) => void;
  setPlanting: (open: boolean) => void;
  setMusic: (music: "song" | "ambient") => void;
  aim: (id: string | null) => void;
  setReading: (id: string | null) => void;
  extinguish: (id: string) => void;
  plant: (stalk: Stalk) => void;
  hydrate: () => void;
};

export const useField = create<FieldState>((set, get) => ({
  stalks: seedField(),
  entered: false,
  muted: false,
  locked: false,
  touch: false,
  planting: false,
  music: "song",
  aimedId: null,
  readingId: null,
  extinguished: new Set(),

  enter: () => set({ entered: true }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setLocked: (locked) => set({ locked }),
  setTouch: (touch) => set({ touch }),
  setPlanting: (planting) => set({ planting }),
  setMusic: (music) => set({ music }),
  aim: (id) => {
    if (get().aimedId !== id) set({ aimedId: id });
  },
  setReading: (readingId) => set({ readingId }),

  extinguish: (id) => {
    const next = new Set(get().extinguished);
    next.add(id);
    saveExtinguished([...next]);
    set({ extinguished: next });
  },

  plant: (stalk) => set((s) => ({ stalks: [...s.stalks, stalk] })),

  hydrate: () =>
    set({
      extinguished: new Set(loadExtinguished()),
      touch: window.matchMedia("(pointer: coarse)").matches,
    }),
}));

export function isEmber(stalk: Stalk) {
  return stalk.readable && !!stalk.text;
}
