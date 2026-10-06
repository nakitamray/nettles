"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BackSide, Color, Mesh, ShaderMaterial } from "three";
import { palette } from "@/lib/palette";

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  uniform vec3 uGlow;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = max(dir.y, 0.0);
    vec3 color = mix(uHorizon, uZenith, pow(h, 0.55));

    // low sun buried somewhere behind the overcast
    vec3 sunDir = normalize(vec3(-0.55, 0.08, -0.83));
    float sun = max(dot(dir, sunDir), 0.0);
    color += uGlow * pow(sun, 6.0) * 0.32 * (1.0 - h);

    vec2 uv = dir.xz / (dir.y + 0.25);
    float clouds = fbm(uv * 1.6 + vec2(uTime * 0.004, uTime * 0.002));
    color = mix(color, color * 0.72, smoothstep(0.45, 0.8, clouds) * smoothstep(0.02, 0.3, h));

    // below the horizon just fade into the fog
    color = mix(color, uHorizon, smoothstep(0.0, -0.05, dir.y));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function Sky() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uHorizon: { value: new Color(palette.horizon) },
          uZenith: { value: new Color(palette.zenith) },
          uGlow: { value: new Color(palette.glow) },
          uTime: { value: 0 },
        },
      }),
    [],
  );

  useFrame(({ camera, clock }) => {
    const sky = mesh.current;
    if (!sky) return;
    sky.position.copy(camera.position);
    (sky.material as ShaderMaterial).uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  );
}
