// Everything here is synthesized in the browser, no audio files.

const LEVEL = 0.55;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let hush: GainNode | null = null;
let hymnTimer: number | undefined;

function brownNoise(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

function lfo(context: AudioContext, rate: number, depth: number, target: AudioParam) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.frequency.value = rate;
  gain.gain.value = depth;
  osc.connect(gain).connect(target);
  osc.start();
}

function hymn(context: AudioContext, out: AudioNode) {
  const now = context.currentTime;
  const chords = [
    [220, 329.63, 440],
    [196, 293.66, 392],
    [174.61, 261.63, 349.23],
  ];
  const chord = chords[Math.floor(Math.random() * chords.length)];
  const swell = context.createGain();
  swell.gain.setValueAtTime(0, now);
  swell.gain.linearRampToValueAtTime(0.035, now + 5);
  swell.gain.linearRampToValueAtTime(0, now + 13);
  swell.connect(out);
  for (const freq of chord) {
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 10;
    osc.connect(swell);
    osc.start(now);
    osc.stop(now + 14);
  }
}

function scheduleHymn() {
  hymnTimer = window.setTimeout(() => {
    if (ctx && hush) hymn(ctx, hush);
    scheduleHymn();
  }, 22000 + Math.random() * 30000);
}

export function startDrone() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const context = new AudioContext();
  ctx = context;

  master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  master.gain.linearRampToValueAtTime(LEVEL, context.currentTime + 6);

  hush = context.createGain();
  hush.connect(master);

  const pad = context.createBiquadFilter();
  pad.type = "lowpass";
  pad.frequency.value = 380;
  pad.Q.value = 0.8;
  pad.connect(hush);
  lfo(context, 0.045, 160, pad.frequency);

  const voices: [number, OscillatorType, number][] = [
    [55, "sawtooth", 0.16],
    [82.41, "triangle", 0.12],
    [110, "sawtooth", 0.05],
    [164.81, "triangle", 0.035],
  ];
  voices.forEach(([freq, type, level], i) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = (i - 1.5) * 5;
    gain.gain.value = level;
    osc.connect(gain).connect(pad);
    osc.start();
  });

  const wind = context.createBufferSource();
  wind.buffer = brownNoise(context, 6);
  wind.loop = true;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 520;
  band.Q.value = 0.6;
  const windGain = context.createGain();
  windGain.gain.value = 0.32;
  wind.connect(band).connect(windGain).connect(hush);
  lfo(context, 0.07, 320, band.frequency);
  lfo(context, 0.11, 0.18, windGain.gain);
  wind.start();

  scheduleHymn();

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

export function setMuted(muted: boolean) {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ctx.currentTime, 0.4);
}

// The field goes quiet while you hold a letter open.
export function setHush(amount: number) {
  if (!ctx || !hush) return;
  hush.gain.setTargetAtTime(1 - amount * 0.85, ctx.currentTime, 0.6);
}

export function stopDrone() {
  window.clearTimeout(hymnTimer);
  void ctx?.close();
  ctx = null;
  master = null;
  hush = null;
}
