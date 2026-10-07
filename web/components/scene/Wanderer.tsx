"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { FIELD_RADIUS } from "@/lib/seed";
import { hold, viewer, virtualKeys } from "@/lib/shared";
import { isEmber, useField } from "@/lib/store";
import { emberTop } from "./Embers";

const EYE = 1.6;
const SPEED = 2.6;
const MOUSE = 0.0022;
const TOUCH = 0.0045;
const BOUND = FIELD_RADIUS + 25;
const REACH = 7;

function shortestAngle(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function Wanderer({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(-0.02);
  const keys = useRef(new Set<string>());
  const velocity = useRef(new Vector3());
  const travelled = useRef(0);

  useEffect(() => {
    const el = gl.domElement;
    const look = (dx: number, dy: number, k: number) => {
      if (hold.active) return;
      yaw.current -= dx * k;
      pitch.current = MathUtils.clamp(pitch.current - dy * k, -1.35, 1.35);
    };

    let lockedAt = 0;
    const lockChange = () => {
      const locked = document.pointerLockElement === el;
      lockedAt = performance.now();
      useField.getState().setLocked(locked);
      if (!locked) keys.current.clear();
    };
    const mouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      // Chrome sometimes reports one huge jump right as the pointer locks
      if (performance.now() - lockedAt < 120) return;
      if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return;
      look(e.movementX, e.movementY, MOUSE);
    };

    // phones: drag anywhere on the field to look around
    let touchId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    const touchDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || touchId !== null) return;
      touchId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const touchMove = (e: PointerEvent) => {
      if (e.pointerId !== touchId) return;
      look(lastX - e.clientX, lastY - e.clientY, TOUCH);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const touchUp = (e: PointerEvent) => {
      if (e.pointerId === touchId) touchId = null;
    };

    const typing = (e: KeyboardEvent) =>
      e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
    const keyDown = (e: KeyboardEvent) => {
      if (!typing(e)) keys.current.add(e.key.toLowerCase());
    };
    const keyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();

    document.addEventListener("pointerlockchange", lockChange);
    document.addEventListener("mousemove", mouseMove);
    el.addEventListener("pointerdown", touchDown);
    window.addEventListener("pointermove", touchMove);
    window.addEventListener("pointerup", touchUp);
    window.addEventListener("pointercancel", touchUp);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => {
      document.removeEventListener("pointerlockchange", lockChange);
      document.removeEventListener("mousemove", mouseMove);
      el.removeEventListener("pointerdown", touchDown);
      window.removeEventListener("pointermove", touchMove);
      window.removeEventListener("pointerup", touchUp);
      window.removeEventListener("pointercancel", touchUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const pos = viewer.position;
    const state = useField.getState();
    const reading = state.readingId ? state.stalks.find((s) => s.id === state.readingId) : undefined;

    // walking
    const k = keys.current;
    const pressed = (...names: string[]) => names.some((n) => k.has(n) || virtualKeys.has(n));
    const canWalk = !reading && (state.locked || state.touch) && !state.planting;
    const forward = canWalk ? Number(pressed("w", "arrowup")) - Number(pressed("s", "arrowdown")) : 0;
    const strafe = canWalk ? Number(pressed("d", "arrowright")) - Number(pressed("a", "arrowleft")) : 0;

    const want = new Vector3(
      -Math.sin(yaw.current) * forward + Math.cos(yaw.current) * strafe,
      0,
      -Math.cos(yaw.current) * forward - Math.sin(yaw.current) * strafe,
    );
    if (want.lengthSq() > 0) want.normalize().multiplyScalar(SPEED);
    velocity.current.lerp(want, 1 - Math.exp(-6 * delta));
    const step = velocity.current.clone().multiplyScalar(delta);
    pos.add(step);

    const r = Math.hypot(pos.x, pos.z);
    if (r > BOUND) {
      pos.x *= BOUND / r;
      pos.z *= BOUND / r;
    }
    travelled.current += step.length();
    const bob = reducedMotion ? 0 : Math.sin(travelled.current * 2.4) * 0.03;
    pos.y = MathUtils.damp(pos.y, EYE + bob, 8, delta);

    // while a letter is open, the view settles on its ember
    if (reading) {
      const look = emberTop(reading).sub(pos);
      const wantYaw = Math.atan2(-look.x, -look.z);
      const wantPitch = Math.asin(MathUtils.clamp(look.y / look.length(), -1, 1));
      const ease = reducedMotion ? 10 : 3;
      yaw.current += shortestAngle(yaw.current, wantYaw) * (1 - Math.exp(-ease * delta));
      pitch.current = MathUtils.damp(pitch.current, wantPitch, ease, delta);
    }

    camera.position.copy(pos);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    camera.getWorldDirection(viewer.forward);

    // whichever readable ember sits closest to the middle of the view
    if (!reading) {
      let best: string | null = null;
      let bestScore = Infinity;
      const to = new Vector3();
      for (const s of state.stalks) {
        if (!isEmber(s) || state.extinguished.has(s.id)) continue;
        to.copy(emberTop(s)).sub(pos);
        const dist = to.length();
        if (dist > REACH) continue;
        const along = to.dot(viewer.forward);
        if (along <= 0) continue;
        const off = Math.sqrt(Math.max(0, dist * dist - along * along));
        if (off > 0.55 + dist * 0.08) continue;
        const score = off / dist;
        if (score < bestScore) {
          bestScore = score;
          best = s.id;
        }
      }
      state.aim(best);
    }
  });

  return null;
}
