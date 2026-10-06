"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, Mesh, RepeatWrapping, SRGBColorSpace } from "three";
import { mulberry32 } from "@/lib/random";
import { viewer } from "@/lib/shared";
import { useField } from "@/lib/store";

const SIZE = 600;
const TILE = 12;

function dirtTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#1e2218";
  g.fillRect(0, 0, size, size);
  const rand = mulberry32(42);
  for (let i = 0; i < 2600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 7;
    const light = rand() < 0.5;
    g.fillStyle = light ? `rgba(92, 96, 70, ${rand() * 0.18})` : `rgba(8, 9, 6, ${rand() * 0.3})`;
    // draw wrapped so the tile has no seams
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        g.beginPath();
        g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(SIZE / TILE, SIZE / TILE);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function Ground() {
  const mesh = useRef<Mesh>(null);
  const texture = useMemo(() => dirtTexture(), []);

  useFrame(({ camera }) => {
    if (!mesh.current) return;
    mesh.current.position.x = Math.round(camera.position.x / TILE) * TILE;
    mesh.current.position.z = Math.round(camera.position.z / TILE) * TILE;
  });

  const walk = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6 || useField.getState().focusedId) return;
    viewer.walkTarget = e.point.clone();
  };

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} onClick={walk}>
      <planeGeometry args={[SIZE, SIZE]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  );
}
