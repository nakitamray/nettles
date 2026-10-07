import type { Material } from "three";
import { foliageUniforms } from "./shared";

type FoliageOptions = {
  // how far (in meters) the tip of a full height plant moves in a gust
  sway: number;
  // grass patches wrap around the viewer instead of ending at the edge
  wrap?: number;
  // hanging willow strands carry their own per-vertex sway weight
  weighted?: boolean;
};

const f = (n: number) => n.toFixed(2);

export function applyFoliage(material: Material, { sway, wrap, weighted }: FoliageOptions) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = foliageUniforms.uTime;
    shader.uniforms.uCenter = foliageUniforms.uCenter;
    shader.uniforms.uSway = foliageUniforms.uSway;

    const wrapChunk = wrap
      ? `
        vec2 base = instanceMatrix[3].xz;
        vec2 wrapped = uCenter + mod(base - uCenter + ${f(wrap / 2)}, ${f(wrap)}) - ${f(wrap / 2)};
        mvPosition.xz += wrapped - base;
      `
      : "";

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform float uSway;
        uniform vec2 uCenter;
        ${weighted ? "attribute float aSway;" : ""}`,
      )
      .replace(
        "#include <project_vertex>",
        `
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        ${wrapChunk}
        float h = ${weighted ? "aSway" : "clamp(transformed.y, 0.0, 1.0)"};
        vec2 wp = mvPosition.xz;
        float gust = sin(uTime * 0.31 + wp.x * 0.041 + wp.y * 0.027) * 0.5 + 0.5;
        gust *= sin(uTime * 0.13 + wp.y * 0.019) * 0.35 + 0.65;
        float flutter = sin(uTime * 1.7 + wp.x * 0.9 + wp.y * 0.7) * 0.6
                      + sin(uTime * 2.9 + wp.y * 1.6) * 0.25;
        vec2 windDir = vec2(0.92, 0.39);
        mvPosition.xz += windDir * (gust * 0.85 + flutter * 0.2) * ${f(sway)} * uSway * h * h;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
        `,
      );
  };
  material.customProgramCacheKey = () => `foliage-${sway}-${wrap ?? 0}-${weighted ? 1 : 0}`;
}
