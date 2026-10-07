"use client";

import { useState } from "react";
import { requestLock } from "@/lib/lock";
import { viewer } from "@/lib/shared";
import { useField } from "@/lib/store";

const MAX = 1200;

export function PlantForm({ onPlanted }: { onPlanted: () => void }) {
  const plant = useField((s) => s.plant);
  const setPlanting = useField((s) => s.setPlanting);
  const [text, setText] = useState("");
  const [readable, setReadable] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    // Until the backend places it by meaning, it grows right in front of you.
    const ahead = viewer.forward.clone().setY(0).normalize().multiplyScalar(2.6);
    plant({
      id: `p${Date.now()}`,
      x: viewer.position.x + ahead.x,
      z: viewer.position.z + ahead.z,
      height: 1.2 + Math.random() * 0.3,
      rotation: Math.random() * Math.PI * 2,
      lean: (Math.random() - 0.5) * 0.2,
      readable,
      text: readable ? body : undefined,
    });

    setPlanting(false);
    onPlanted();
    requestLock();
  };

  return (
    <form className="plant" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
      <label htmlFor="letter" className="plant-title">
        set something down
      </label>
      <textarea
        id="letter"
        value={text}
        maxLength={MAX}
        rows={7}
        autoFocus
        placeholder="whatever you've been carrying..."
        onChange={(e) => setText(e.target.value)}
      />
      <p className="plant-count">
        {text.length} / {MAX}
      </p>

      <fieldset className="plant-choice">
        <legend className="sr-only">how should it grow</legend>
        <label data-on={readable}>
          <input type="radio" name="kind" checked={readable} onChange={() => setReadable(true)} />
          <span className="choice-name">let it glow</span>
          <span className="choice-note">someone wandering by might read it, once.</span>
        </label>
        <label data-on={!readable}>
          <input type="radio" name="kind" checked={!readable} onChange={() => setReadable(false)} />
          <span className="choice-name">bury it</span>
          <span className="choice-note">it stays in the field. no one reads it.</span>
        </label>
      </fieldset>

      <div className="plant-actions">
        <button type="button" className="quiet" onClick={() => setPlanting(false)}>
          not yet
        </button>
        <button type="submit" disabled={!text.trim()}>
          plant it
        </button>
      </div>
      <p className="plant-fine">prototype: this stays in your browser for now.</p>
    </form>
  );
}
