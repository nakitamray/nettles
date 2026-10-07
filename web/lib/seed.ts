import { placeholderLetters } from "./letters";
import { gaussian, mulberry32 } from "./random";
import type { Stalk } from "./types";

export const FIELD_RADIUS = 140;

export type Willow = { x: number; z: number; scale: number; rotation: number };

export function seedWillows(count: number): Willow[] {
  const rand = mulberry32(404);
  // a couple of trees right where you arrive, so you start underneath them
  const willows: Willow[] = [
    { x: 4.5, z: 11, scale: 1.15, rotation: 2.2 },
    { x: -8, z: 5, scale: 1, rotation: 0.4 },
  ];
  let tries = 0;
  while (willows.length < count && tries++ < 5000) {
    const r = 14 + Math.sqrt(rand()) * (FIELD_RADIUS - 14);
    const a = rand() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (willows.some((w) => Math.hypot(w.x - x, w.z - z) < 13)) continue;
    willows.push({ x, z, scale: 0.8 + rand() * 0.5, rotation: rand() * Math.PI * 2 });
  }
  return willows;
}

// Stand-in for the UMAP layout: stalks bunch up in loose clusters the way
// similar letters will once coordinates come from the embeddings.
export function seedField(count = 2400): Stalk[] {
  const rand = mulberry32(1987);
  const stalks: Stalk[] = [];

  const clusters = [{ x: 0, z: -10, spread: 9 }];
  for (let i = 0; i < 10; i++) {
    clusters.push({
      x: (rand() - 0.5) * 230,
      z: (rand() - 0.5) * 230,
      spread: 7 + rand() * 18,
    });
  }

  const stalk = (id: string, x: number, z: number): Stalk => ({
    id,
    x,
    z,
    height: 0.85 + rand() * 0.75,
    rotation: rand() * Math.PI * 2,
    lean: (rand() - 0.5) * 0.3,
    readable: false,
  });

  let i = 0;
  while (stalks.length < count) {
    let x: number;
    let z: number;
    if (rand() < 0.78) {
      const c = clusters[Math.floor(rand() * clusters.length)];
      x = c.x + gaussian(rand) * c.spread;
      z = c.z + gaussian(rand) * c.spread;
    } else {
      const r = Math.sqrt(rand()) * FIELD_RADIUS;
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
    }
    if (Math.hypot(x, z) > FIELD_RADIUS) continue;
    stalks.push(stalk(`s${i++}`, x, z));
  }

  // Embers spiral out from where you start so a few are always close by.
  placeholderLetters.forEach((text, n) => {
    const angle = n * 2.39996 + 1.2;
    const r = 7 + n * 3.4;
    const s = stalk(`e${n}`, Math.cos(angle) * r, Math.sin(angle) * r - 6);
    s.height = 1.25 + rand() * 0.35;
    s.readable = true;
    s.text = text;
    stalks.push(s);
  });

  return stalks;
}
