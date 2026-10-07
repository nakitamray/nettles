import { Vector2, Vector3 } from "three";

// Mutable state read inside the render loop. Kept out of React so
// per-frame values don't trigger re-renders.

export const SPAWN = new Vector3(0, 1.6, 16);

export const viewer = {
  position: SPAWN.clone(),
  forward: new Vector3(0, 0, -1),
};

// on-screen walk buttons on phones feed into the same key set as WASD
export const virtualKeys = new Set<string>();

export const hold = {
  active: false,
  progress: 0,
};

export const emberGlow = new Map<string, number>();

export const SUN_DIRECTION = new Vector3(-0.5, 0.42, -0.76).normalize();

export const foliageUniforms = {
  uTime: { value: 0 },
  uCenter: { value: new Vector2() },
  uSway: { value: 1 },
};
