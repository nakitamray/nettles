"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { FIELD_RADIUS } from "@/lib/seed";
import { viewer } from "@/lib/shared";
import { useField } from "@/lib/store";
import { emberTop } from "./Embers";

const EYE = 1.6;
const SPEED = 2.4;
const LOOK = 0.0032;
const BOUND = FIELD_RADIUS + 25;

function shortestAngle(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function Wanderer({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(-0.04);
  const keys = useRef(new Set<string>());
  const travelled = useRef(0);

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging || useField.getState().focusedId) return;
      yaw.current += (e.clientX - lastX) * LOOK;
      pitch.current = MathUtils.clamp(pitch.current + (e.clientY - lastY) * LOOK, -0.7, 0.55);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => {
      dragging = false;
    };

    const typing = (e: KeyboardEvent) =>
      e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
    const keyDown = (e: KeyboardEvent) => {
      if (!typing(e)) keys.current.add(e.key.toLowerCase());
    };
    const keyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const pos = viewer.position;
    const { focusedId, stalks } = useField.getState();
    const focused = focusedId ? stalks.find((s) => s.id === focusedId) : undefined;
    const ease = reducedMotion ? 8 : 2.2;

    if (focused) {
      const top = emberTop(focused);
      const away = new Vector3(pos.x - top.x, 0, pos.z - top.z);
      if (away.lengthSq() < 0.01) away.set(0, 0, 1);
      away.normalize().multiplyScalar(2.1);
      const stand = new Vector3(top.x + away.x, 0, top.z + away.z);
      pos.x = MathUtils.damp(pos.x, stand.x, ease, delta);
      pos.z = MathUtils.damp(pos.z, stand.z, ease, delta);
      pos.y = MathUtils.damp(pos.y, 1.45, ease, delta);

      const look = top.clone().sub(pos);
      const wantYaw = Math.atan2(-look.x, -look.z);
      const wantPitch = Math.asin(MathUtils.clamp(look.y / look.length(), -1, 1));
      yaw.current += shortestAngle(yaw.current, wantYaw) * (1 - Math.exp(-ease * 1.4 * delta));
      pitch.current = MathUtils.damp(pitch.current, wantPitch, ease * 1.4, delta);
    } else {
      const k = keys.current;
      const forward = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
      const strafe = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
      const step = new Vector3();

      if (forward || strafe) {
        viewer.walkTarget = null;
        step.set(-Math.sin(yaw.current) * forward, 0, -Math.cos(yaw.current) * forward);
        step.add(new Vector3(Math.cos(yaw.current) * strafe, 0, -Math.sin(yaw.current) * strafe));
        step.normalize().multiplyScalar(SPEED * delta);
      } else if (viewer.walkTarget) {
        const to = new Vector3(viewer.walkTarget.x - pos.x, 0, viewer.walkTarget.z - pos.z);
        const dist = to.length();
        if (dist < 0.4) viewer.walkTarget = null;
        else {
          step.copy(to.normalize().multiplyScalar(Math.min(SPEED * delta * Math.min(1, dist / 1.5 + 0.3), dist)));
          const wantYaw = Math.atan2(-to.x, -to.z);
          yaw.current += shortestAngle(yaw.current, wantYaw) * (1 - Math.exp(-1.2 * delta));
        }
      }

      pos.add(step);
      const r = Math.hypot(pos.x, pos.z);
      if (r > BOUND) {
        pos.x *= BOUND / r;
        pos.z *= BOUND / r;
      }
      travelled.current += step.length();
      const bob = reducedMotion ? 0 : Math.sin(travelled.current * 2.2) * 0.035;
      pos.y = MathUtils.damp(pos.y, EYE + bob, 6, delta);
    }

    camera.position.copy(pos);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    camera.getWorldDirection(viewer.forward);
  });

  return null;
}
