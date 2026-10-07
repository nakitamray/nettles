"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, HueSaturation, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useState } from "react";
import { ACESFilmicToneMapping } from "three";
import { requestLock } from "@/lib/lock";
import { detectQuality } from "@/lib/quality";
import { palette } from "@/lib/palette";
import { foliageUniforms, SPAWN, SUN_DIRECTION, viewer } from "@/lib/shared";
import { useField } from "@/lib/store";
import { Embers } from "./scene/Embers";
import { FallingLeaves } from "./scene/FallingLeaves";
import { Fence } from "./scene/Fence";
import { Grass } from "./scene/Grass";
import { Ground } from "./scene/Ground";
import { LightShafts } from "./scene/LightShafts";
import { Motes } from "./scene/Motes";
import { Nettles } from "./scene/Nettles";
import { Sky } from "./scene/Sky";
import { Treeline } from "./scene/Treeline";
import { Wanderer } from "./scene/Wanderer";
import { Willows } from "./scene/Willows";

function Wind({ calm }: { calm: boolean }) {
  useFrame(({ clock }) => {
    foliageUniforms.uTime.value = clock.elapsedTime;
    foliageUniforms.uCenter.value.set(viewer.position.x, viewer.position.z);
    foliageUniforms.uSway.value = calm ? 0.35 : 1;
  });
  return null;
}

const sun = SUN_DIRECTION.clone().multiplyScalar(100);

export default function Field() {
  const [quality] = useState(detectQuality);

  const resume = () => {
    const { entered, planting } = useField.getState();
    if (entered && !planting) requestLock();
  };

  return (
    <Canvas
      className="field"
      dpr={quality.dpr}
      onClick={resume}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }}
      camera={{ fov: 66, near: 0.05, far: 600, position: SPAWN.toArray() }}
    >
      <color attach="background" args={[palette.mist]} />
      <fogExp2 attach="fog" args={[palette.mist, 0.03]} />
      <hemisphereLight args={["#fff1d2", "#6b6040", 1.7]} />
      <directionalLight position={sun.toArray()} intensity={2.2} color="#ffe2a8" />

      <Wind calm={quality.reducedMotion} />
      <Sky />
      <Treeline />
      <Ground />
      <Grass count={quality.grass} />
      <Nettles />
      <Willows count={quality.willows} />
      <Fence />
      <Embers />
      <LightShafts />
      <FallingLeaves count={quality.leaves} />
      <Motes count={quality.motes} />
      <Wanderer reducedMotion={quality.reducedMotion} />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={0.9} radius={0.8} />
        <HueSaturation saturation={-0.16} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.22} />
        <Vignette offset={0.3} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  );
}
