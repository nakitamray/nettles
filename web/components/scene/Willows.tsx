"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { DoubleSide, InstancedMesh, MeshStandardMaterial, Object3D } from "three";
import { applyFoliage } from "@/lib/foliage";
import { seedWillows, type Willow } from "@/lib/seed";
import { createStrandTexture, createWillow } from "@/lib/willow";

const VARIANTS = 3;

function Variant({ seed, willows }: { seed: number; willows: Willow[] }) {
  const trunks = useRef<InstancedMesh>(null);
  const leaves = useRef<InstancedMesh>(null);
  const parts = useMemo(() => createWillow(seed), [seed]);

  const bark = useMemo(() => new MeshStandardMaterial({ color: "#2f281f", roughness: 1 }), []);
  const foliage = useMemo(() => {
    const m = new MeshStandardMaterial({
      map: createStrandTexture(),
      vertexColors: true,
      alphaTest: 0.45,
      side: DoubleSide,
      roughness: 0.9,
    });
    applyFoliage(m, { sway: 0.55, weighted: true });
    return m;
  }, []);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    willows.forEach((w, i) => {
      dummy.position.set(w.x, 0, w.z);
      dummy.rotation.set(0, w.rotation, 0);
      dummy.scale.setScalar(w.scale);
      dummy.updateMatrix();
      trunks.current?.setMatrixAt(i, dummy.matrix);
      leaves.current?.setMatrixAt(i, dummy.matrix);
    });
    for (const mesh of [trunks.current, leaves.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [willows]);

  return (
    <>
      <instancedMesh ref={trunks} args={[parts.trunk, bark, willows.length]} />
      <instancedMesh ref={leaves} args={[parts.leaves, foliage, willows.length]} frustumCulled={false} />
    </>
  );
}

export function Willows({ count }: { count: number }) {
  const groups = useMemo(() => {
    const all = seedWillows(count);
    return Array.from({ length: VARIANTS }, (_, v) => all.filter((_, i) => i % VARIANTS === v));
  }, [count]);

  return (
    <>
      {groups.map((willows, v) => (
        <Variant key={v} seed={31 + v * 17} willows={willows} />
      ))}
    </>
  );
}
