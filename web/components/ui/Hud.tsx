"use client";

import { useEffect } from "react";
import { setMuted } from "@/lib/ambience";
import { useField } from "@/lib/store";

export function Hud() {
  const muted = useField((s) => s.muted);
  const toggleMute = useField((s) => s.toggleMute);
  const locked = useField((s) => s.locked);
  const touch = useField((s) => s.touch);
  const aimedId = useField((s) => s.aimedId);
  const readingId = useField((s) => s.readingId);

  useEffect(() => setMuted(muted), [muted]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m" && !(e.target instanceof HTMLTextAreaElement)) toggleMute();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [toggleMute]);

  const active = locked || touch;

  return (
    <div className="hud" data-reading={!!readingId}>
      <span className="hud-mark">nettles</span>
      <button className="hud-sound" onClick={toggleMute} aria-label={muted ? "turn sound on" : "turn sound off"}>
        {muted ? "sound off" : "sound on"}
      </button>

      {active && <div className="crosshair" data-aimed={!!aimedId} />}

      {active && aimedId && !readingId && (
        <p className="aim-hint">{touch ? "hold the button to read" : "hold click to read"}</p>
      )}
    </div>
  );
}
