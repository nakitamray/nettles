"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useField } from "@/lib/store";
import { Hud } from "./ui/Hud";
import { Pause } from "./ui/Pause";
import { Reader } from "./ui/Reader";
import { Threshold } from "./ui/Threshold";
import { TouchControls } from "./ui/TouchControls";

const Field = dynamic(() => import("./Field"), { ssr: false });

export function Experience() {
  const entered = useField((s) => s.entered);
  const touch = useField((s) => s.touch);
  const hydrate = useField((s) => s.hydrate);

  useEffect(hydrate, [hydrate]);

  return (
    <main className="experience">
      <Field />
      {entered && (
        <>
          <Hud />
          <Reader />
          {touch ? <TouchControls /> : null}
          <Pause />
        </>
      )}
      <Threshold />
    </main>
  );
}
