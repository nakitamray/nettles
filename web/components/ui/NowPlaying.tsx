"use client";

import { useEffect, useRef } from "react";
import { startAmbience } from "@/lib/ambience";
import { mountSong, SONG, stopSong, unmountSong } from "@/lib/music";
import { useField } from "@/lib/store";

const SIZE = 200;

export function NowPlaying() {
  const music = useField((s) => s.music);
  const setMusic = useField((s) => s.setMusic);
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (music !== "song" || !slot.current) return;
    // YouTube replaces the element it's given, so hand it a child
    const el = document.createElement("div");
    slot.current.appendChild(el);
    const fallBack = () => {
      setMusic("ambient");
      if (useField.getState().entered) startAmbience();
    };
    void mountSong(el, SIZE, fallBack);
    return unmountSong;
  }, [music, setMusic]);

  if (music !== "song") return null;

  const close = () => {
    stopSong();
    setMusic("ambient");
    if (useField.getState().entered) startAmbience();
  };

  const watch = `https://www.youtube.com/watch?v=${SONG.videoId}`;

  return (
    <aside className="now-playing" aria-label="now playing">
      <div className="now-playing-player" ref={slot} />
      <div className="now-playing-credit">
        <a href={watch} target="_blank" rel="noreferrer">
          {SONG.title.toLowerCase()} <span>by {SONG.artist.toLowerCase()}</span>
        </a>
        <button onClick={close} aria-label="stop the song and use quiet ambience instead">
          ×
        </button>
      </div>
    </aside>
  );
}
