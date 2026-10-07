export type Quality = {
  grass: number;
  motes: number;
  leaves: number;
  willows: number;
  dpr: [number, number];
  reducedMotion: boolean;
};

export function detectQuality(): Quality {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const low = coarse || memory < 4;
  return {
    grass: low ? 14000 : 42000,
    motes: low ? 160 : 420,
    leaves: low ? 60 : 160,
    willows: low ? 30 : 64,
    dpr: low ? [1, 1.5] : [1, 2],
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}
