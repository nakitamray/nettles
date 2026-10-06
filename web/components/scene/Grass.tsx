"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { DoubleSide, InstancedMesh, MeshStandardMaterial, Object3D } from "three";
import { applyFoliage } from "@/lib/foliage";
import { createBladeGeometry } from "@/lib/geometry";
import { mulberry32 } from "@/lib/random";

const PATCH = 70;

export function Grass({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => createBladeGeometry(), []);
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({ vertexColors: true, roughness: 1, side: DoubleSide });
    applyFoliage(m, { sway: 0.16, wrap: PATCH });
    return m;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const rand = mulberry32(11);
    const dummy = new Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set((rand() - 0.5) * PATCH, 0, (rand() - 0.5) * PATCH);
      dummy.rotation.set((rand() - 0.5) * 0.4, rand() * Math.PI * 2, 0);
      const tall = rand() < 0.08;
      dummy.scale.set(1, tall ? 0.8 + rand() * 0.5 : 0.25 + rand() * 0.45, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count]);

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />;
}
