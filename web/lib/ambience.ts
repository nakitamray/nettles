// Plays /audio/ambience.mp3 on a loop if the file exists. Otherwise falls
// back to a soft pad synthesized in the browser.

const TRACK = "/audio/ambience.mp3";
const LEVEL = 0.6;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let hush: GainNode | null = null;
let timers: number[] = [];

function noiseBuffer(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3;
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

function every(min: number, max: number, fn: () => void) {
  const tick = () => {
    timers.push(window.setTimeout(() => {
      fn();
      tick();
    }, min + Math.random() * (max - min)));
  };
  tick();
}

// D major, open and warm
const PAD = [146.83, 220, 293.66, 369.99];
const CHIMES = [587.33, 659.25, 739.99, 880, 987.77, 1174.66];

function chime(context: AudioContext, out: AudioNode) {
  const now = context.currentTime;
  const freq = CHIMES[Math.floor(Math.random() * CHIMES.length)];
  const env = context.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.03, now + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 4);
  env.connect(out);
  for (const [mult, level] of [[1, 1], [2.01, 0.25]]) {
    const osc = context.createOscillator();
    const g = context.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    g.gain.value = level;
    osc.connect(g).connect(env);
    osc.start(now);
    osc.stop(now + 4.2);
  }
}

function bird(context: AudioContext, out: AudioNode) {
  const notes = 2 + Math.floor(Math.random() * 3);
  const pan = context.createStereoPanner();
  pan.pan.value = Math.random() * 1.6 - 0.8;
  pan.connect(out);
  for (let i = 0; i < notes; i++) {
    const at = context.currentTime + i * (0.13 + Math.random() * 0.08);
    const osc = context.createOscillator();
    const env = context.createGain();
    const base = 2600 + Math.random() * 1400;
    osc.frequency.setValueAtTime(base, at);
    osc.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), at + 0.08);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.012, at + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
    osc.connect(env).connect(pan);
    osc.start(at);
    osc.stop(at + 0.12);
  }
}

function synthesize(context: AudioContext, out: AudioNode) {
  const pad = context.createBiquadFilter();
  pad.type = "lowpass";
  pad.frequency.value = 900;
  pad.Q.value = 0.4;
  pad.connect(out);
  lfo(context, 0.03, 250, pad.frequency);

  PAD.forEach((freq, i) => {
    for (const detune of [-4, 4]) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = i === 0 ? "triangle" : "sine";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      gain.gain.value = [0.07, 0.045, 0.035, 0.02][i];
      osc.connect(gain).connect(pad);
      lfo(context, 0.05 + i * 0.013, gain.gain.value * 0.5, gain.gain);
      osc.start();
    }
  });

  const breeze = context.createBufferSource();
  breeze.buffer = noiseBuffer(context, 6);
  breeze.loop = true;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 700;
  band.Q.value = 0.5;
  const breezeGain = context.createGain();
  breezeGain.gain.value = 0.12;
  breeze.connect(band).connect(breezeGain).connect(out);
  lfo(context, 0.06, 300, band.frequency);
  lfo(context, 0.09, 0.07, breezeGain.gain);
  breeze.start();

  every(5000, 14000, () => chime(context, out));
  every(7000, 20000, () => bird(context, out));
}

async function hasTrack() {
  try {
    const res = await fetch(TRACK, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export function startAmbience() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const context = new AudioContext();
  ctx = context;
  master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  master.gain.linearRampToValueAtTime(LEVEL, context.currentTime + 5);
  hush = context.createGain();
  hush.connect(master);
  const out = hush;

  void hasTrack().then((found) => {
    if (ctx !== context) return;
    if (!found) {
      synthesize(context, out);
      return;
    }
    const audio = new Audio(TRACK);
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    context.createMediaElementSource(audio).connect(out);
    void audio.play().catch(() => synthesize(context, out));
  });

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

// Everything softens while you hold a letter open.
export function setHush(amount: number) {
  if (!ctx || !hush) return;
  hush.gain.setTargetAtTime(1 - amount * 0.7, ctx.currentTime, 0.6);
}

export function stopAmbience() {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
  void ctx?.close();
  ctx = null;
  master = null;
  hush = null;
}
