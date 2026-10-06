"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useField } from "@/lib/store";
import { Hud } from "./ui/Hud";
import { Planting } from "./ui/Planting";
import { Reader } from "./ui/Reader";
import { Threshold } from "./ui/Threshold";

const Field = dynamic(() => import("./Field"), { ssr: false });

export function Experience() {
  const entered = useField((s) => s.entered);
  const hydrate = useField((s) => s.hydrate);

  useEffect(hydrate, [hydrate]);

  return (
    <main className="experience">
      <Field />
      {entered && (
        <>
          <Hud />
          <Planting />
          <Reader />
        </>
      )}
      <Threshold />
    </main>
  );
}
