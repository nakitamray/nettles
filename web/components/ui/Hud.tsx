"use client";

import { useEffect, useState } from "react";
import { setMuted } from "@/lib/drone";
import { useField } from "@/lib/store";

export function Hud() {
  const entered = useField((s) => s.entered);
  const muted = useField((s) => s.muted);
  const toggleMute = useField((s) => s.toggleMute);
  const focusedId = useField((s) => s.focusedId);
  const [hint, setHint] = useState(true);

  useEffect(() => setMuted(muted), [muted]);

  useEffect(() => {
    if (!entered) return;
    const t = window.setTimeout(() => setHint(false), 12000);
    return () => window.clearTimeout(t);
  }, [entered]);

  if (!entered) return null;

  return (
    <div className="hud" data-dim={!!focusedId}>
      <span className="hud-mark">nettles</span>
      <button className="hud-sound" onClick={toggleMute} aria-label={muted ? "turn sound on" : "turn sound off"}>
        {muted ? "sound off" : "sound on"}
      </button>
      <p className="hud-hint" data-show={hint && !focusedId}>
        drag to look around. click the ground to walk, or use wasd.
        <br />
        the ones that glow can be read.
      </p>
    </div>
  );
}
