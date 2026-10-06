"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Color, InstancedMesh, MeshStandardMaterial, Object3D, DoubleSide } from "three";
import { applyFoliage } from "@/lib/foliage";
import { createNettleGeometry } from "@/lib/geometry";
import { useField } from "@/lib/store";

const CAPACITY_HEADROOM = 256;

export function Nettles() {
  const stalks = useField((s) => s.stalks);
  const mesh = useRef<InstancedMesh>(null);
  const [capacity] = useState(() => stalks.length + CAPACITY_HEADROOM);

  const geometry = useMemo(() => createNettleGeometry(), []);
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      side: DoubleSide,
    });
    applyFoliage(m, { sway: 0.22 });
    return m;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new Object3D();
    const tint = new Color();
    stalks.slice(0, capacity).forEach((s, i) => {
      dummy.position.set(s.x, 0, s.z);
      dummy.rotation.set(s.lean, s.rotation, s.lean * 0.6);
      dummy.scale.setScalar(s.height);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const shade = 0.75 + ((i * 2654435761) % 1000) / 1000 * 0.4;
      m.setColorAt(i, tint.setRGB(shade, shade * 0.98, shade * 0.9));
    });
    m.count = Math.min(stalks.length, capacity);
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [stalks, capacity]);

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, capacity]}
      frustumCulled={false}
    />
  );
}
