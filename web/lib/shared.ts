import { Vector2, Vector3 } from "three";

// Mutable state read inside the render loop. Kept out of React so
// per-frame values don't trigger re-renders.

export const viewer = {
  position: new Vector3(0, 1.6, 14),
  forward: new Vector3(0, 0, -1),
  walkTarget: null as Vector3 | null,
};

export const hold = {
  active: false,
  progress: 0,
};

export const emberGlow = new Map<string, number>();

export const foliageUniforms = {
  uTime: { value: 0 },
  uCenter: { value: new Vector2() },
  uSway: { value: 1 },
};
