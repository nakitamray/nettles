"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setHush } from "@/lib/drone";
import { hold } from "@/lib/shared";
import { useField } from "@/lib/store";

const REVEAL_MS = 3000;

type Phase = "waiting" | "holding" | "fading" | "gone";

export function Reader() {
  const focusedId = useField((s) => s.focusedId);
  const stalk = useField((s) => s.stalks.find((x) => x.id === s.focusedId));
  if (!focusedId || !stalk?.text) return null;
  // keyed so every ember opens with a clean slate
  return <Letter key={focusedId} id={focusedId} text={stalk.text} />;
}

function Letter({ id, text }: { id: string; text: string }) {
  const focus = useField((s) => s.focus);
  const extinguish = useField((s) => s.extinguish);

  const [phase, setPhase] = useState<Phase>("waiting");
  const letter = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const read = useRef(false);

  const setReveal = (v: number) => {
    hold.progress = v;
    letter.current?.style.setProperty("--reveal", v.toFixed(4));
  };

  const start = useCallback(() => {
    if (phase === "fading" || phase === "gone" || hold.active) return;
    hold.active = true;
    setPhase("holding");
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
  }, [phase]);

  const release = useCallback(() => {
    if (!hold.active) return;
    hold.active = false;
    cancelAnimationFrame(frame.current);
    setHush(0);

    if (read.current) {
      setPhase("fading");
      extinguish(id);
      window.setTimeout(() => setPhase("gone"), 1600);
      window.setTimeout(() => focus(null), 2600);
    } else {
      setPhase("waiting");
      setReveal(0);
    }
  }, [extinguish, focus, id]);

  const leave = useCallback(() => {
    if (hold.active) return;
    focus(null);
  }, [focus]);

  useEffect(() => {
    hold.active = false;
    hold.progress = 0;
    return () => {
      hold.active = false;
      hold.progress = 0;
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        start();
      }
      if (e.key === "Escape") leave();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === " ") release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
    };
  }, [start, release, leave]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div
      className="reader"
      data-phase={phase}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="reader-letter" ref={letter} aria-live="polite">
        <p>{phase === "holding" || phase === "fading" ? text : ""}</p>
      </div>

      <p className="reader-hint">
        {phase === "waiting" && "press and hold to read"}
        {phase === "gone" && "it's gone now."}
      </p>

      {phase === "waiting" && (
        <button className="reader-back" onClick={leave}>
          step back
        </button>
      )}
    </div>
  );
}
