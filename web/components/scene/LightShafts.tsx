"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { palette } from "@/lib/palette";
import { mulberry32 } from "@/lib/random";
import { SUN_DIRECTION } from "@/lib/shared";

const RANGE = 70;

// Long slanted quads that turn to face you around the sun's axis,
// so they read as light falling through the mist.
function shaftGeometry(count: number) {
  const rand = mulberry32(8);
  const corner: number[] = [];
  const base: number[] = [];
  const size: number[] = [];
  const seed: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * RANGE;
    const z = (rand() - 0.5) * RANGE;
    const width = 1.5 + rand() * 4.5;
    const length = 18 + rand() * 16;
    const s = rand() * 100;
    for (const [cx, cy] of [
      [-0.5, 0],
      [0.5, 0],
      [-0.5, 1],
      [0.5, 1],
    ]) {
      corner.push(cx, cy);
      base.push(x, 0, z);
      size.push(width, length);
      seed.push(s);
    }
    const a = i * 4;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(base, 3));
  g.setAttribute("corner", new Float32BufferAttribute(corner, 2));
  g.setAttribute("size", new Float32BufferAttribute(size, 2));
  g.setAttribute("seed", new Float32BufferAttribute(seed, 1));
  g.setIndex(indices);
  return g;
}

export function LightShafts({ count = 22 }: { count?: number }) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => shaftGeometry(count), [count]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSun: { value: SUN_DIRECTION.clone() },
          uColor: { value: new Color(palette.sun) },
          uCenter: { value: new Vector3() },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uSun;
          uniform vec3 uCenter;
          attribute vec2 corner;
          attribute vec2 size;
          attribute float seed;
          varying vec2 vCorner;
          varying float vSeed;
          varying float vFade;
          void main() {
            vec3 base = position;
            base.xz = uCenter.xz + mod(base.xz - uCenter.xz + ${(RANGE / 2).toFixed(1)}, ${RANGE.toFixed(1)}) - ${(RANGE / 2).toFixed(1)};
            vec3 toCam = normalize(cameraPosition - base);
            vec3 side = normalize(cross(uSun, toCam));
            vec3 world = base + uSun * corner.y * size.y + side * corner.x * size.x;
            vCorner = corner;
            vSeed = seed;
            float dist = length(base.xz - cameraPosition.xz);
            vFade = smoothstep(${(RANGE / 2).toFixed(1)}, 14.0, dist) * smoothstep(1.5, 6.0, dist);
            gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uColor;
          varying vec2 vCorner;
          varying float vSeed;
          varying float vFade;
          void main() {
            float across = 1.0 - abs(vCorner.x) * 2.0;
            float beam = pow(max(across, 0.0), 1.6);
            float streaks = 0.75 + 0.25 * sin(vCorner.x * 9.0 + vSeed + uTime * 0.2);
            float along = smoothstep(0.0, 0.25, vCorner.y) * smoothstep(1.0, 0.55, vCorner.y);
            float breathe = 0.7 + 0.3 * sin(uTime * 0.15 + vSeed);
            float a = beam * streaks * along * breathe * vFade * 0.075;
            gl_FragColor = vec4(uColor * a, a);
          }
        `,
      }),
    [],
  );

  useFrame(({ camera, clock }) => {
    const m = mesh.current?.material as ShaderMaterial | undefined;
    if (!m) return;
    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uCenter.value.set(camera.position.x, 0, camera.position.z);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
}
