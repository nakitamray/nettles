"use client";

import { startDrone } from "@/lib/drone";
import { useField } from "@/lib/store";

export function Threshold() {
  const entered = useField((s) => s.entered);
  const enter = useField((s) => s.enter);

  const go = () => {
    startDrone();
    enter();
  };

  return (
    <div className="threshold" data-gone={entered} aria-hidden={entered}>
      <div className="threshold-inner">
        <h1 className="wordmark">Nettles</h1>
        <p className="threshold-line">a field for the letters you never sent.</p>
        <button className="threshold-enter" onClick={go} disabled={entered}>
          enter the field
        </button>
        <p className="threshold-small">sound on, if you can.</p>
      </div>
    </div>
  );
}
