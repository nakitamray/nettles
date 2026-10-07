export function requestLock() {
  const canvas = document.querySelector<HTMLCanvasElement>(".field canvas");
  if (!canvas || isTouch()) return;
  try {
    // some browsers return a promise that rejects if called too soon after an exit
    const result = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
    result?.catch?.(() => {});
  } catch {
    // ignore, the pause screen stays up and they can click again
  }
}

function isTouch() {
  return window.matchMedia("(pointer: coarse)").matches;
}
