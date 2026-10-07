import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  type Curve,
  Float32BufferAttribute,
  SRGBColorSpace,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "./random";

// Ring-by-ring tube so the radius can taper (TubeGeometry can't).
function taperedTube(curve: Curve<Vector3>, r0: number, r1: number, segments = 10, radial = 7) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const up = new Vector3(0, 1, 0);
  const side = new Vector3();
  const binormal = new Vector3();
  const n = new Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    side.crossVectors(tangent, Math.abs(tangent.y) > 0.95 ? new Vector3(1, 0, 0) : up).normalize();
    binormal.crossVectors(tangent, side).normalize();
    // flare at the base, like roots gripping the ground
    const r = (r0 + (r1 - r0) * t) * (1 + Math.max(0, 0.12 - t) * 6);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      n.copy(side).multiplyScalar(Math.cos(a)).addScaledVector(binormal, Math.sin(a));
      positions.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      normals.push(n.x, n.y, n.z);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  g.setIndex(indices);
  return g;
}

type Strand = { top: Vector3; length: number; yaw: number; out: Vector3; tint: Color };

function strandRibbon({ top, length, yaw, out, tint }: Strand, segments = 6) {
  const width = 0.5;
  const positions: number[] = [];
  const uvs: number[] = [];
  const sway: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const dx = Math.cos(yaw) * width * 0.5;
  const dz = Math.sin(yaw) * width * 0.5;
  const tip = tint.clone().offsetHSL(0.01, 0.05, 0.1);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // strands bow outward a little before falling straight
    const bow = Math.sin(Math.min(t * 2, 1) * Math.PI * 0.5) * 0.35;
    const cx = top.x + out.x * bow;
    const cz = top.z + out.z * bow;
    const y = top.y - t * length;
    positions.push(cx - dx, y, cz - dz, cx + dx, y, cz + dz);
    uvs.push(0, 1 - t, 1, 1 - t);
    const w = Math.pow(t, 1.4) * Math.min(1.3, length / 4);
    sway.push(w, w);
    const c = tint.clone().lerp(tip, t);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  g.setAttribute("aSway", new Float32BufferAttribute(sway, 1));
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  return g;
}

export function createWillow(seed: number) {
  const rand = mulberry32(seed);
  const height = 4.2 + rand() * 0.8;

  const trunkCurve = new CatmullRomCurve3([
    new Vector3(0, -0.2, 0),
    new Vector3(0.35, height * 0.35, 0.1),
    new Vector3(-0.25, height * 0.7, 0.2),
    new Vector3(0.1, height, 0),
  ]);
  const wood: BufferGeometry[] = [taperedTube(trunkCurve, 0.42, 0.2, 12, 9)];
  const strands: BufferGeometry[] = [];
  const greens = ["#8e9a4c", "#a3a656", "#7d8c45", "#b4ad62", "#96a352"];

  const limbs = 6 + Math.floor(rand() * 3);
  for (let l = 0; l < limbs; l++) {
    const a = (l / limbs) * Math.PI * 2 + rand() * 0.6;
    const dir = new Vector3(Math.cos(a), 0, Math.sin(a));
    const start = trunkCurve.getPointAt(0.68 + rand() * 0.3);
    const reach = 3.6 + rand() * 1.8;
    const lift = 1.4 + rand() * 1.2;
    const limb = new CatmullRomCurve3([
      start,
      start.clone().addScaledVector(dir, reach * 0.3).add(new Vector3(0, lift, 0)),
      start.clone().addScaledVector(dir, reach * 0.7).add(new Vector3(0, lift * 0.95, 0)),
      start.clone().addScaledVector(dir, reach).add(new Vector3(0, lift * 0.45, 0)),
    ]);
    wood.push(taperedTube(limb, 0.11, 0.025, 8, 6));

    const count = 46 + Math.floor(rand() * 16);
    for (let s = 0; s < count; s++) {
      const t = 0.08 + rand() * 0.92;
      // start a touch above the limb so the leaves hide the bark
      const top = limb.getPointAt(t).add(new Vector3((rand() - 0.5) * 0.9, 0.12 + rand() * 0.2, (rand() - 0.5) * 0.9));
      // longest strands nearly brush the grass
      const length = top.y * (0.55 + rand() * 0.42);
      const tint = new Color(greens[Math.floor(rand() * greens.length)]).offsetHSL(0, 0, (rand() - 0.5) * 0.06);
      strands.push(strandRibbon({ top, length, yaw: rand() * Math.PI, out: dir, tint }));
    }
  }

  const trunk = mergeGeometries(wood)!;
  const leaves = mergeGeometries(strands)!;
  leaves.computeVertexNormals();
  return { trunk, leaves };
}

// A single hanging strand of narrow willow leaves, white so vertex colors tint it.
export function createStrandTexture() {
  const w = 64;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  const rand = mulberry32(77);

  g.strokeStyle = "rgba(210, 205, 180, 0.9)";
  g.lineWidth = 1.5;
  g.beginPath();
  for (let y = 0; y <= h; y += 8) {
    const x = w / 2 + Math.sin(y * 0.03) * 3;
    if (y === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();

  for (let y = 6; y < h - 4; y += 7 + rand() * 5) {
    const side = rand() < 0.5 ? -1 : 1;
    const len = 18 + rand() * 14;
    const angle = side * (0.35 + rand() * 0.5);
    const x = w / 2 + Math.sin(y * 0.03) * 3;
    const shade = 200 + Math.floor(rand() * 55);
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.fillStyle = `rgb(${shade}, ${shade}, ${shade - 10})`;
    g.beginPath();
    g.ellipse(0, len / 2, 3 + rand() * 1.6, len / 2, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
