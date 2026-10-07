"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { palette } from "@/lib/palette";
import { mulberry32 } from "@/lib/random";

const BOX = 36;
const CEILING = 9;

// A few leaves always drifting down somewhere nearby.
function leafGeometry(count: number) {
  const rand = mulberry32(19);
  const colors = ["#c98a3c", "#b5642e", "#d8a64d", "#9c7a3a", "#c7b25a"].map((c) => new Color(c));
  const shape = [
    [0, -0.5],
    [0.32, 0],
    [0, 0.5],
    [-0.32, 0],
  ];
  const position: number[] = [];
  const corner: number[] = [];
  const phase: number[] = [];
  const color: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * BOX;
    const y = rand() * CEILING;
    const z = (rand() - 0.5) * BOX;
    const p = rand() * 100;
    const c = colors[Math.floor(rand() * colors.length)];
    const size = 0.07 + rand() * 0.05;
    for (const [cx, cy] of shape) {
      position.push(x, y, z);
      corner.push(cx * size, cy * size);
      phase.push(p);
      color.push(c.r, c.g, c.b);
    }
    const a = i * 4;
    indices.push(a, a + 1, a + 2, a, a + 2, a + 3);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(position, 3));
  g.setAttribute("corner", new Float32BufferAttribute(corner, 2));
  g.setAttribute("phase", new Float32BufferAttribute(phase, 1));
  g.setAttribute("color", new Float32BufferAttribute(color, 3));
  g.setIndex(indices);
  return g;
}

export function FallingLeaves({ count }: { count: number }) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => leafGeometry(count), [count]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uCenter: { value: new Vector3() },
          uMist: { value: new Color(palette.mist) },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uCenter;
          attribute vec2 corner;
          attribute float phase;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vShade;
          varying float vMist;

          mat3 spin(float a, float b) {
            float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
            mat3 ry = mat3(ca, 0.0, -sa, 0.0, 1.0, 0.0, sa, 0.0, ca);
            mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cb, sb, 0.0, -sb, cb);
            return rx * ry;
          }

          void main() {
            float t = uTime + phase * 7.0;
            vec3 p = position;
            p.y = mod(p.y - t * 0.35, ${CEILING.toFixed(1)});
            p.x += sin(t * 0.6 + phase) * 0.9 + t * 0.25;
            p.z += cos(t * 0.45 + phase * 1.7) * 0.7;
            p.xz = uCenter.xz + mod(p.xz - uCenter.xz + ${(BOX / 2).toFixed(1)}, ${BOX.toFixed(1)}) - ${(BOX / 2).toFixed(1)};
            mat3 r = spin(t * 1.3 + phase, sin(t * 0.9 + phase) * 1.2);
            vec3 offset = r * vec3(corner, 0.0);
            vShade = 0.65 + 0.35 * abs((r * vec3(0.0, 0.0, 1.0)).y);
            vColor = color;
            vec4 mv = viewMatrix * vec4(p + offset, 1.0);
            vMist = 1.0 - exp(-pow(0.03 * -mv.z, 2.0));
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uMist;
          varying vec3 vColor;
          varying float vShade;
          varying float vMist;
          void main() {
            gl_FragColor = vec4(mix(vColor * vShade, uMist, vMist), 1.0);
            #include <colorspace_fragment>
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

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />;
}
