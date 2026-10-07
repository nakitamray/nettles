"use client";

import { startAmbience } from "@/lib/ambience";
import { requestLock } from "@/lib/lock";
import { useField } from "@/lib/store";

export function Threshold() {
  const entered = useField((s) => s.entered);
  const enter = useField((s) => s.enter);

  const go = () => {
    startAmbience();
    enter();
    requestLock();
  };

  return (
    <div className="threshold" data-gone={entered} aria-hidden={entered}>
      <div className="threshold-inner">
        <h1 className="wordmark">Nettles</h1>
        <p className="threshold-line">a quiet field for the things you never got to say.</p>
        <button className="threshold-enter" onClick={go} disabled={entered}>
          step inside
        </button>
        <p className="threshold-small">headphones, if you have them.</p>
      </div>
    </div>
  );
}
