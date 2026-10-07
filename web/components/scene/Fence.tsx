"use client";

import { useMemo } from "react";
import { BufferGeometry, CatmullRomCurve3, Line, LineBasicMaterial, Vector3 } from "three";
import { mulberry32 } from "@/lib/random";

type Post = { position: Vector3; tilt: [number, number]; height: number; metal: boolean };

export function Fence() {
  const { posts, wires } = useMemo(() => {
    const rand = mulberry32(5);
    const path = new CatmullRomCurve3([
      new Vector3(-34, 0, 4),
      new Vector3(-12, 0, 8.5),
      new Vector3(8, 0, 7),
      new Vector3(30, 0, 0),
    ]);
    const n = 22;
    const posts: Post[] = [];
    for (let i = 0; i < n; i++) {
      const p = path.getPoint(i / (n - 1));
      posts.push({
        position: p,
        tilt: [(rand() - 0.5) * 0.18, (rand() - 0.5) * 0.18],
        height: 1.15 + rand() * 0.25,
        metal: rand() < 0.25,
      });
    }

    const material = new LineBasicMaterial({ color: "#5a4e3c" });
    const wires = [0.55, 0.95].map((h) => {
      const points: Vector3[] = [];
      for (let i = 0; i < n - 1; i++) {
        const a = posts[i].position;
        const b = posts[i + 1].position;
        for (let k = 0; k < 8; k++) {
          const t = k / 8;
          const sag = Math.sin(Math.PI * t) * 0.07;
          points.push(new Vector3().lerpVectors(a, b, t).setY(h - sag));
        }
      }
      points.push(posts[n - 1].position.clone().setY(h));
      return new Line(new BufferGeometry().setFromPoints(points), material);
    });

    return { posts, wires };
  }, []);

  return (
    <group>
      {posts.map((post, i) => (
        <mesh
          key={i}
          position={[post.position.x, post.height / 2, post.position.z]}
          rotation={[post.tilt[0], 0, post.tilt[1]]}
        >
          <cylinderGeometry
            args={post.metal ? [0.022, 0.022, post.height, 6] : [0.06, 0.075, post.height, 7]}
          />
          <meshStandardMaterial color={post.metal ? "#b8b09a" : "#6b5a44"} roughness={0.95} />
        </mesh>
      ))}
      {wires.map((wire, i) => (
        <primitive key={i} object={wire} />
      ))}
    </group>
  );
}
