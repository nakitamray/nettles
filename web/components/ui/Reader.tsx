"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setHush } from "@/lib/ambience";
import { hold } from "@/lib/shared";
import { useField } from "@/lib/store";

const REVEAL_MS = 3000;

type Phase = "idle" | "holding" | "fading";

export function Reader() {
  const aimedId = useField((s) => s.aimedId);
  const readingId = useField((s) => s.readingId);
  const touch = useField((s) => s.touch);
  const text = useField((s) => s.stalks.find((x) => x.id === s.readingId)?.text);

  const [phase, setPhase] = useState<Phase>("idle");
  const [rested, setRested] = useState(false);
  const letter = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const read = useRef(false);

  const setReveal = (v: number) => {
    hold.progress = v;
    letter.current?.style.setProperty("--reveal", v.toFixed(4));
  };

  const start = useCallback(() => {
    const { aimedId, locked, touch, planting, readingId, setReading } = useField.getState();
    if (!aimedId || readingId || planting || !(locked || touch)) return;
    hold.active = true;
    read.current = false;
    setReading(aimedId);
    setPhase("holding");
    setReveal(0);
    setHush(1);
    let last = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, hold.progress + (now - last) / REVEAL_MS);
      last = now;
      setReveal(next);
      if (next >= 1) read.current = true;
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  const release = useCallback(() => {
    if (!hold.active) return;
    hold.active = false;
    cancelAnimationFrame(frame.current);
    setHush(0);
    const { readingId, setReading, extinguish } = useField.getState();

    if (read.current && readingId) {
      // read all the way through: let it fade, then the ember goes out
      setPhase("fading");
      extinguish(readingId);
      window.setTimeout(() => {
        setReading(null);
        setPhase("idle");
        setReveal(0);
        setRested(true);
      }, 1500);
      window.setTimeout(() => setRested(false), 5000);
    } else {
      setReading(null);
      setPhase("idle");
      setReveal(0);
    }
  }, []);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (e.button === 0 && document.pointerLockElement) start();
    };
    const up = (e: MouseEvent) => {
      if (e.button === 0) release();
    };
    const keyDown = (e: KeyboardEvent) => {
      if (e.key !== " " || e.repeat || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      start();
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === " ") release();
    };
    const lockChange = () => {
      if (!document.pointerLockElement) release();
    };
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", release);
    document.addEventListener("pointerlockchange", lockChange);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", release);
      document.removeEventListener("pointerlockchange", lockChange);
    };
  }, [start, release]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <>
      <div className="reader" data-phase={phase} aria-live="polite">
        <div className="reader-letter" ref={letter}>
          <p>{readingId && phase !== "idle" ? text : ""}</p>
        </div>
      </div>

      {rested && <p className="rested">read. it can rest now.</p>}

      {touch && (aimedId || phase === "holding") && phase !== "fading" && (
        <button
          className="touch-read"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            start();
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onContextMenu={(e) => e.preventDefault()}
        >
          hold to read
        </button>
      )}
    </>
  );
}
