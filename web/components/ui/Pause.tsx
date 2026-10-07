"use client";

import { useEffect, useState } from "react";
import { requestLock } from "@/lib/lock";
import { useField } from "@/lib/store";
import { PlantForm } from "./PlantForm";

const CONTROLS: [string, string][] = [
  ["mouse", "look around"],
  ["w", "walk"],
  ["s", "step back"],
  ["a / d", "drift to the side"],
  ["hold click", "read a glowing letter"],
  ["esc", "pause"],
];

export function Pause() {
  const locked = useField((s) => s.locked);
  const touch = useField((s) => s.touch);
  const planting = useField((s) => s.planting);
  const readingId = useField((s) => s.readingId);
  const setPlanting = useField((s) => s.setPlanting);
  const [planted, setPlanted] = useState(false);

  useEffect(() => {
    if (!planted) return;
    const t = window.setTimeout(() => setPlanted(false), 3200);
    return () => window.clearTimeout(t);
  }, [planted]);

  const paused = !touch && !locked && !readingId;
  const visible = planting || paused;

  return (
    <>
      {planted && <p className="plant-done">planted.</p>}
      {visible && (
        <div className="pause" onClick={() => !planting && requestLock()}>
          {planting ? (
            <PlantForm onPlanted={() => setPlanted(true)} />
          ) : (
            <div className="pause-card">
              <p className="pause-title">the field will wait for you.</p>
              <p className="pause-resume">click anywhere to keep wandering</p>
              <dl className="pause-keys">
                {CONTROLS.map(([key, what]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{what}</dd>
                  </div>
                ))}
              </dl>
              <button
                className="pause-plant"
                onClick={(e) => {
                  e.stopPropagation();
                  setPlanting(true);
                }}
              >
                plant something
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
