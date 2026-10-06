import { create } from "zustand";
import { seedField } from "./seed";
import { loadExtinguished, saveExtinguished } from "./storage";
import type { Stalk } from "./types";

type FieldState = {
  stalks: Stalk[];
  entered: boolean;
  muted: boolean;
  focusedId: string | null;
  extinguished: Set<string>;
  enter: () => void;
  toggleMute: () => void;
  focus: (id: string | null) => void;
  extinguish: (id: string) => void;
  plant: (stalk: Stalk) => void;
  hydrate: () => void;
};

export const useField = create<FieldState>((set, get) => ({
  stalks: seedField(),
  entered: false,
  muted: false,
  focusedId: null,
  extinguished: new Set(),

  enter: () => set({ entered: true }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  focus: (id) => set({ focusedId: id }),

  extinguish: (id) => {
    const next = new Set(get().extinguished);
    next.add(id);
    saveExtinguished([...next]);
    set({ extinguished: next });
  },

  plant: (stalk) => set((s) => ({ stalks: [...s.stalks, stalk] })),

  hydrate: () => set({ extinguished: new Set(loadExtinguished()) }),
}));

export function isEmber(stalk: Stalk) {
  return stalk.readable && !!stalk.text;
}
