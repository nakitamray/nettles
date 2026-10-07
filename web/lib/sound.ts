import { setHush as setAmbienceHush, setMuted as setAmbienceMuted, startAmbience } from "./ambience";
import { playSong, setSongHush, setSongMuted } from "./music";
import { useField } from "./store";

// One place for the rest of the app to talk to: the song when it's
// available, the generated ambience when it isn't.

export function startSound() {
  if (useField.getState().music === "song") playSong();
  else startAmbience();
}

export function setMuted(muted: boolean) {
  setSongMuted(muted);
  setAmbienceMuted(muted);
}

export function setHush(amount: number) {
  setSongHush(amount);
  setAmbienceHush(amount);
}
