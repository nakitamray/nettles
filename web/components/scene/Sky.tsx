"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BackSide, Color, Mesh, ShaderMaterial } from "three";
import { palette } from "@/lib/palette";
import { SUN_DIRECTION } from "@/lib/shared";

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uMist;
  uniform vec3 uSky;
  uniform vec3 uHigh;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
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
    vec3 color = mix(uMist, uSky, smoothstep(0.0, 0.25, h));
    color = mix(color, uHigh, smoothstep(0.3, 1.0, h));

    // a soft sun smothered in haze
    float sun = max(dot(dir, uSunDir), 0.0);
    color += uSunColor * (pow(sun, 3.0) * 0.25 + pow(sun, 40.0) * 0.6 + pow(sun, 600.0) * 1.5);

    vec2 uv = dir.xz / (dir.y + 0.3);
    float clouds = fbm(uv * 1.4 + vec2(uTime * 0.003, uTime * 0.0015));
    color = mix(color, color * 1.06, smoothstep(0.5, 0.8, clouds) * smoothstep(0.05, 0.35, h));

    color = mix(color, uMist, smoothstep(0.0, -0.05, dir.y));
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
          uMist: { value: new Color(palette.mist) },
          uSky: { value: new Color(palette.sky) },
          uHigh: { value: new Color(palette.skyHigh) },
          uSunColor: { value: new Color(palette.sun) },
          uSunDir: { value: SUN_DIRECTION.clone() },
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
