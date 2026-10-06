import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "./random";

const flat = (g: BufferGeometry) => (g.index ? g.toNonIndexed() : g);

function paint(geometry: BufferGeometry, color: (y: number) => Color) {
  const pos = geometry.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = color(pos.getY(i));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

// Serrated, heart-ish nettle leaf in the XY plane, base at the origin.
function leaf(length: number, width: number) {
  const teeth = 7;
  const right: Vector2[] = [];
  for (let k = 0; k <= teeth * 2; k++) {
    const t = k / (teeth * 2);
    const w = width * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - t * 0.25);
    const tooth = k % 2 ? 1.14 : 0.9;
    right.push(new Vector2(w * tooth, t * length));
  }
  const left = right
    .slice(1, -1)
    .reverse()
    .map((p) => new Vector2(-p.x, p.y));
  return new ShapeGeometry(new Shape([...right, ...left]));
}

export function createNettleGeometry() {
  const stemLow = new Color("#3a2f2a");
  const stemHigh = new Color("#3d4a2c");
  const leafColor = new Color("#3a4a2d");
  const leafTip = new Color("#59683f");

  const stem = new CylinderGeometry(0.006, 0.017, 1, 5, 6, true);
  stem.translate(0, 0.5, 0);
  paint(stem, (y) => stemLow.clone().lerp(stemHigh, y));

  const parts: BufferGeometry[] = [stem];
  const nodes = 6;
  for (let i = 0; i < nodes; i++) {
    const t = i / (nodes - 1);
    const y = 0.3 + t * 0.66;
    const size = 0.27 * (1 - t * 0.55);
    for (const side of [1, -1]) {
      const g = leaf(size, size * 0.42);
      g.rotateZ(-Math.PI / 2);
      g.rotateX(-Math.PI / 2);
      g.rotateZ(-0.25 + t * 0.9);
      if (side < 0) g.rotateY(Math.PI);
      g.rotateY(i * (Math.PI / 2) + 0.2 * i);
      g.translate(0, y, 0);
      paint(g, () => leafColor.clone().lerp(leafTip, t));
      parts.push(g);
    }
  }

  return mergeGeometries(parts.map(flat))!;
}

export function createBladeGeometry() {
  const g = new PlaneGeometry(0.05, 1, 1, 4);
  g.translate(0, 0.5, 0);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * (1 - y * 0.92));
    pos.setZ(i, y * y * 0.12);
  }
  g.computeVertexNormals();
  const base = new Color("#1b2016");
  const tip = new Color("#767a58");
  return paint(g, (y) => base.clone().lerp(tip, Math.pow(y, 1.4)));
}

export function createFirGeometry() {
  const parts: BufferGeometry[] = [];
  const trunk = new CylinderGeometry(0.06, 0.09, 0.3, 5);
  trunk.translate(0, 0.15, 0);
  parts.push(trunk);
  for (let i = 0; i < 4; i++) {
    const r = 0.32 - i * 0.065;
    const cone = new ConeGeometry(r, 0.42, 7, 1, true);
    cone.translate(0, 0.38 + i * 0.19, 0);
    parts.push(cone);
  }
  return mergeGeometries(parts.map(flat))!;
}

export function createBroadleafGeometry() {
  const rand = mulberry32(7);
  const trunk = new CylinderGeometry(0.04, 0.07, 0.45, 5);
  trunk.translate(0, 0.22, 0);
  const crowns: BufferGeometry[] = [trunk];
  for (let i = 0; i < 3; i++) {
    const crown = new IcosahedronGeometry(0.28 + rand() * 0.1, 1);
    const pos = crown.getAttribute("position");
    for (let v = 0; v < pos.count; v++) {
      // hash the position so shared corners move together and faces don't split
      const h = Math.sin(pos.getX(v) * 127.1 + pos.getY(v) * 311.7 + pos.getZ(v) * 74.7 + i) * 43758.5453;
      const k = 0.85 + (h - Math.floor(h)) * 0.3;
      pos.setXYZ(v, pos.getX(v) * k, pos.getY(v) * k, pos.getZ(v) * k);
    }
    crown.translate((rand() - 0.5) * 0.3, 0.62 + rand() * 0.2, (rand() - 0.5) * 0.3);
    crowns.push(crown);
  }
  return mergeGeometries(crowns.map(flat))!;
}
