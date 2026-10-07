"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, Mesh, RepeatWrapping, SRGBColorSpace } from "three";
import { mulberry32 } from "@/lib/random";

const SIZE = 600;
const TILE = 12;

// Mossy earth scattered with fallen leaves.
function groundTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#615c3a";
  g.fillRect(0, 0, size, size);
  const rand = mulberry32(42);

  const wrapped = (draw: (x: number, y: number) => void, x: number, y: number) => {
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) draw(x + dx, y + dy);
  };

  for (let i = 0; i < 2200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 12;
    g.fillStyle = rand() < 0.5 ? `rgba(120, 122, 66, ${rand() * 0.25})` : `rgba(40, 36, 20, ${rand() * 0.25})`;
    wrapped((px, py) => {
      g.beginPath();
      g.arc(px, py, r, 0, Math.PI * 2);
      g.fill();
    }, x, y);
  }

  const leaves = ["#9a6e3e", "#a88a52", "#7f6440", "#a39257", "#8a6a3c"];
  for (let i = 0; i < 1600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 2 + rand() * 3.5;
    const rot = rand() * Math.PI;
    g.fillStyle = leaves[Math.floor(rand() * leaves.length)];
    g.globalAlpha = 0.25 + rand() * 0.35;
    wrapped((px, py) => {
      g.beginPath();
      g.ellipse(px, py, len, len * 0.45, rot, 0, Math.PI * 2);
      g.fill();
    }, x, y);
  }
  g.globalAlpha = 1;

  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(SIZE / TILE, SIZE / TILE);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function Ground() {
  const mesh = useRef<Mesh>(null);
  const texture = useMemo(() => groundTexture(), []);

  useFrame(({ camera }) => {
    if (!mesh.current) return;
    mesh.current.position.x = Math.round(camera.position.x / TILE) * TILE;
    mesh.current.position.z = Math.round(camera.position.z / TILE) * TILE;
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[SIZE, SIZE]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  );
}
