"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, HueSaturation, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useState } from "react";
import { ACESFilmicToneMapping } from "three";
import { detectQuality } from "@/lib/quality";
import { palette } from "@/lib/palette";
import { foliageUniforms, viewer } from "@/lib/shared";
import { Embers } from "./scene/Embers";
import { Fence } from "./scene/Fence";
import { Grass } from "./scene/Grass";
import { Ground } from "./scene/Ground";
import { Motes } from "./scene/Motes";
import { Nettles } from "./scene/Nettles";
import { Sky } from "./scene/Sky";
import { Treeline } from "./scene/Treeline";
import { Wanderer } from "./scene/Wanderer";

function Wind({ calm }: { calm: boolean }) {
  useFrame(({ clock }) => {
    foliageUniforms.uTime.value = clock.elapsedTime;
    foliageUniforms.uCenter.value.set(viewer.position.x, viewer.position.z);
    foliageUniforms.uSway.value = calm ? 0.35 : 1;
  });
  return null;
}

export default function Field() {
  const [quality] = useState(detectQuality);

  return (
    <Canvas
      className="field"
      dpr={quality.dpr}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }}
      camera={{ fov: 62, near: 0.05, far: 600, position: viewer.position.toArray() }}
    >
      <color attach="background" args={[palette.horizon]} />
      <fogExp2 attach="fog" args={[palette.horizon, 0.024]} />
      <hemisphereLight args={["#9a9784", "#14160f", 0.9]} />
      <directionalLight position={[-60, 18, -90]} intensity={0.5} color="#d8c7a2" />

      <Wind calm={quality.reducedMotion} />
      <Sky />
      <Treeline />
      <Ground />
      <Grass count={quality.grass} />
      <Nettles />
      <Fence />
      <Embers />
      <Motes count={quality.motes} />
      <Wanderer reducedMotion={quality.reducedMotion} />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={1.1} radius={0.75} />
        <HueSaturation saturation={-0.32} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.55} />
        <Vignette offset={0.22} darkness={0.82} />
      </EffectComposer>
    </Canvas>
  );
}
