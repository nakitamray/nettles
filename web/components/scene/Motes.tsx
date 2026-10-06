"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from "three";
import { mulberry32 } from "@/lib/random";

const BOX = 30;

// Seed fluff drifting through the air around you.
export function Motes({ count }: { count: number }) {
  const points = useRef<Points>(null);

  const geometry = useMemo(() => {
    const rand = mulberry32(21);
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(rand() - 0.5) * BOX, rand() * 6, (rand() - 0.5) * BOX], i * 3);
      phase[i] = rand() * 100;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("phase", new BufferAttribute(phase, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uCenter: { value: new Vector3() } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uCenter;
          attribute float phase;
          varying float vFade;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.2 + phase) * 1.5 + uTime * 0.35;
            p.z += cos(uTime * 0.17 + phase * 1.3) * 1.5 + uTime * 0.15;
            p.y = mod(p.y + uTime * 0.08 + sin(uTime * 0.5 + phase) * 0.2, 6.0);
            p.xz = uCenter.xz + mod(p.xz - uCenter.xz + ${(BOX / 2).toFixed(1)}, ${BOX.toFixed(1)}) - ${(BOX / 2).toFixed(1)};
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = 26.0 / -mv.z;
            vFade = smoothstep(${(BOX / 2).toFixed(1)}, 4.0, length(p.xz - uCenter.xz)) * (0.6 + 0.4 * sin(uTime + phase));
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vFade;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * vFade * 0.35;
            gl_FragColor = vec4(vec3(0.95, 0.92, 0.82), a);
          }
        `,
      }),
    [],
  );

  useFrame(({ camera, clock }) => {
    const uniforms = (points.current?.material as ShaderMaterial | undefined)?.uniforms;
    if (!uniforms) return;
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uCenter.value.set(camera.position.x, 0, camera.position.z);
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
