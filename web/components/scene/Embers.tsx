"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
  Mesh,
  PlaneGeometry,
  PointLight,
  ShaderMaterial,
  Vector3,
} from "three";
import { palette } from "@/lib/palette";
import { emberGlow, hold, viewer } from "@/lib/shared";
import { isEmber, useField } from "@/lib/store";
import type { Stalk } from "@/lib/types";

const glowGeometry = new PlaneGeometry(1, 1.5);

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // billboard: keep the quad facing the camera
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    p.y *= 0.72;
    p.x += sin(vUv.y * 6.0 + uTime * 1.3 + uSeed) * 0.025 * vUv.y;
    float d = length(p);
    float core = exp(-d * d * 260.0);
    float halo = exp(-d * d * 22.0) * 0.35;
    float flicker = 0.9 + 0.1 * sin(uTime * 3.1 + uSeed) * sin(uTime * 1.7 + uSeed * 2.0);
    float a = (core * 2.2 + halo) * uIntensity * flicker;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export function emberTop(stalk: Stalk) {
  return new Vector3(stalk.x, stalk.height * 1.02 + 0.22, stalk.z);
}

function Ember({ stalk }: { stalk: Stalk }) {
  const group = useRef<Group>(null);
  const glow = useRef<Mesh>(null);
  const base = useMemo(() => emberTop(stalk), [stalk]);
  const seed = useMemo(() => (parseInt(stalk.id.replace(/\D/g, ""), 10) || 0) * 1.37, [stalk.id]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uColor: { value: new Color(palette.ember) },
          uIntensity: { value: 0 },
          uTime: { value: 0 },
          uSeed: { value: seed },
        },
      }),
    [seed],
  );
  const intensity = useRef(0);

  useFrame(({ clock }, delta) => {
    const { focusedId, extinguished } = useField.getState();
    const out = extinguished.has(stalk.id);
    const focused = focusedId === stalk.id;
    let target = out ? 0 : 1;
    if (focused && !out) target = hold.active ? 1.4 + hold.progress * 1.2 : 1.25;
    intensity.current = MathUtils.damp(intensity.current, target, out ? 0.9 : 2.5, delta);
    emberGlow.set(stalk.id, intensity.current);

    const uniforms = (glow.current?.material as ShaderMaterial | undefined)?.uniforms;
    if (uniforms) {
      uniforms.uIntensity.value = intensity.current;
      uniforms.uTime.value = clock.elapsedTime;
    }
    if (group.current) {
      group.current.position.set(base.x, base.y + Math.sin(clock.elapsedTime * 0.8 + seed) * 0.06, base.z);
    }
  });

  const open = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const { focusedId, extinguished, focus } = useField.getState();
    if (e.delta > 6 || focusedId || extinguished.has(stalk.id)) return;
    viewer.walkTarget = null;
    focus(stalk.id);
  };

  const hover = (on: boolean) => {
    const { extinguished, focusedId } = useField.getState();
    document.body.style.cursor = on && !focusedId && !extinguished.has(stalk.id) ? "pointer" : "";
  };

  return (
    <group ref={group} position={base}>
      <mesh ref={glow} geometry={glowGeometry} material={material} frustumCulled={false} />
      <mesh onClick={open} onPointerOver={() => hover(true)} onPointerOut={() => hover(false)}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

const LIGHTS = 4;

// Only a handful of real lights, handed to whichever embers are closest.
function EmberLights({ embers }: { embers: Stalk[] }) {
  const lights = useRef<(PointLight | null)[]>([]);
  const color = useMemo(() => new Color(palette.ember), []);

  useFrame(() => {
    const nearest = embers
      .map((s) => ({ s, d: (s.x - viewer.position.x) ** 2 + (s.z - viewer.position.z) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, LIGHTS);
    lights.current.forEach((light, i) => {
      if (!light) return;
      const pick = nearest[i];
      if (!pick) {
        light.intensity = 0;
        return;
      }
      light.position.copy(emberTop(pick.s));
      light.intensity = (emberGlow.get(pick.s.id) ?? 0) * 2.2;
    });
  });

  return (
    <>
      {Array.from({ length: LIGHTS }, (_, i) => (
        <pointLight
          key={i}
          ref={(l) => {
            lights.current[i] = l;
          }}
          color={color}
          distance={9}
          decay={1.6}
          intensity={0}
        />
      ))}
    </>
  );
}

export function Embers() {
  const stalks = useField((s) => s.stalks);
  const embers = useMemo(() => stalks.filter(isEmber), [stalks]);

  return (
    <>
      {embers.map((s) => (
        <Ember key={s.id} stalk={s} />
      ))}
      <EmberLights embers={embers} />
    </>
  );
}
