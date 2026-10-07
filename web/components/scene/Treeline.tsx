"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Object3D, ShaderMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createBroadleafGeometry, createFirGeometry } from "@/lib/geometry";
import { palette } from "@/lib/palette";
import { mulberry32 } from "@/lib/random";

type RingProps = {
  radius: number;
  color: string;
  count: number;
  seed: number;
  height: number;
  gaps: number;
};

// Flat silhouettes that sink into a band of ground mist.
function silhouette(color: string) {
  return new ShaderMaterial({
    fog: false,
    uniforms: {
      uColor: { value: new Color(color) },
      uMist: { value: new Color(palette.mist) },
    },
    vertexShader: /* glsl */ `
      varying float vHeight;
      void main() {
        vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vHeight = world.y;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uMist;
      varying float vHeight;
      void main() {
        float mist = smoothstep(10.0, 0.0, vHeight) * 0.7;
        gl_FragColor = vec4(mix(uColor, uMist, mist), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

function Ring({ radius, color, count, seed, height, gaps }: RingProps) {
  const firs = useRef<InstancedMesh>(null);
  const broad = useRef<InstancedMesh>(null);
  const firGeometry = useMemo(() => createFirGeometry(), []);
  const broadGeometry = useMemo(() => createBroadleafGeometry(), []);
  const material = useMemo(() => silhouette(color), [color]);

  useLayoutEffect(() => {
    const rand = mulberry32(seed);
    const dummy = new Object3D();
    let f = 0;
    let b = 0;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.02;
      const r = radius + (rand() - 0.5) * radius * 0.15;
      const openness = Math.sin(a * 3 + seed) * 0.6 + Math.sin(a * 7 + seed * 2) * 0.4;
      if (openness > 1 - gaps) continue;
      dummy.position.set(Math.cos(a) * r, -1, Math.sin(a) * r);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      const s = height * (0.55 + rand() * 0.8);
      dummy.scale.set(s * (0.8 + rand() * 0.5), s, s * (0.8 + rand() * 0.5));
      dummy.updateMatrix();
      if (rand() < 0.3) firs.current?.setMatrixAt(f++, dummy.matrix);
      else broad.current?.setMatrixAt(b++, dummy.matrix);
    }
    if (firs.current) {
      firs.current.count = f;
      firs.current.instanceMatrix.needsUpdate = true;
    }
    if (broad.current) {
      broad.current.count = b;
      broad.current.instanceMatrix.needsUpdate = true;
    }
  }, [count, radius, seed, height, gaps]);

  return (
    <>
      <instancedMesh ref={firs} args={[firGeometry, material, count]} frustumCulled={false} />
      <instancedMesh ref={broad} args={[broadGeometry, material, count]} frustumCulled={false} />
    </>
  );
}

function chapelGeometry() {
  const nave = new BoxGeometry(6, 4.5, 11);
  nave.translate(0, 2.25, 0);
  const roof = new CylinderGeometry(0.01, 4.4, 3, 4, 1, false, Math.PI / 4);
  roof.scale(1, 1, 2.6);
  roof.translate(0, 6, 0);
  const tower = new BoxGeometry(3, 10, 3);
  tower.translate(0, 5, 6.5);
  const spire = new ConeGeometry(2, 8, 4);
  spire.rotateY(Math.PI / 4);
  spire.translate(0, 14, 6.5);
  const parts: BufferGeometry[] = [nave, roof, tower, spire].map((g) => (g.index ? g.toNonIndexed() : g));
  return mergeGeometries(parts)!;
}

// A little white chapel out in the haze. Like the trees, you never reach it.
function Chapel() {
  const geometry = useMemo(() => chapelGeometry(), []);
  const material = useMemo(() => silhouette(palette.chapel), []);
  return (
    <instancedMesh
      args={[geometry, material, 1]}
      position={[-150, -1, -170]}
      rotation-y={0.5}
      frustumCulled={false}
    />
  );
}

// The trees travel with you, so the field never quite reaches them.
export function Treeline() {
  const group = useRef<Group>(null);
  useFrame(({ camera }) => {
    group.current?.position.set(camera.position.x, 0, camera.position.z);
  });

  return (
    <group ref={group}>
      <Ring radius={270} color={palette.treeFar} count={260} seed={3} height={20} gaps={0.35} />
      <Ring radius={175} color={palette.treeNear} count={170} seed={9} height={11} gaps={0.75} />
      <Chapel />
    </group>
  );
}
