"use client";

import { useState } from "react";
import { viewer } from "@/lib/shared";
import { useField } from "@/lib/store";

const MAX = 1200;

export function Planting() {
  const plant = useField((s) => s.plant);
  const focusedId = useField((s) => s.focusedId);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [readable, setReadable] = useState(true);
  const [planted, setPlanted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;

    // Until the backend places it by meaning, it goes in the ground right in front of you.
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

    setText("");
    setOpen(false);
    setPlanted(true);
    window.setTimeout(() => setPlanted(false), 3200);
  };

  if (focusedId) return null;

  return (
    <>
      {!open && (
        <button className="plant-open" onClick={() => setOpen(true)}>
          plant something
        </button>
      )}

      {planted && <p className="plant-done">planted.</p>}

      {open && (
        <form className="plant" onSubmit={submit}>
          <label htmlFor="letter" className="plant-title">
            say the thing you never said
          </label>
          <textarea
            id="letter"
            value={text}
            maxLength={MAX}
            rows={7}
            autoFocus
            onChange={(e) => setText(e.target.value)}
          />
          <p className="plant-count">
            {text.length} / {MAX}
          </p>

          <fieldset className="plant-choice">
            <legend className="sr-only">how should it grow</legend>
            <label data-on={readable}>
              <input type="radio" name="kind" checked={readable} onChange={() => setReadable(true)} />
              <span className="choice-name">ember</span>
              <span className="choice-note">it glows. a stranger might read it, once.</span>
            </label>
            <label data-on={!readable}>
              <input type="radio" name="kind" checked={!readable} onChange={() => setReadable(false)} />
              <span className="choice-name">buried</span>
              <span className="choice-note">it stays dark. nobody reads it.</span>
            </label>
          </fieldset>

          <div className="plant-actions">
            <button type="button" className="quiet" onClick={() => setOpen(false)}>
              not yet
            </button>
            <button type="submit" disabled={!text.trim()}>
              plant it
            </button>
          </div>
          <p className="plant-fine">prototype: this stays in your browser for now.</p>
        </form>
      )}
    </>
  );
}
