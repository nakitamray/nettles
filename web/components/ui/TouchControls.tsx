"use client";

import { virtualKeys } from "@/lib/shared";
import { useField } from "@/lib/store";

function WalkButton({ dir, label, children }: { dir: string; label: string; children: React.ReactNode }) {
  const press = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    virtualKeys.add(dir);
  };
  const lift = () => virtualKeys.delete(dir);
  return (
    <button
      className="walk-button"
      aria-label={label}
      onPointerDown={press}
      onPointerUp={lift}
      onPointerCancel={lift}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function TouchControls() {
  const readingId = useField((s) => s.readingId);
  const planting = useField((s) => s.planting);
  const setPlanting = useField((s) => s.setPlanting);

  if (planting) return null;

  return (
    <div className="touch-controls" data-hidden={!!readingId}>
      <div className="walk-pad">
        <WalkButton dir="w" label="walk forward">
          ↑
        </WalkButton>
        <WalkButton dir="s" label="step back">
          ↓
        </WalkButton>
      </div>
      <button className="touch-plant" onClick={() => setPlanting(true)}>
        plant something
      </button>
    </div>
  );
}
