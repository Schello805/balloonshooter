let ctx = null;

function audio() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noiseBuffer(ac, seconds) {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  return buffer;
}

export function playShot(kind = "bolt") {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const rapid = kind === "rapid";
  const length = rapid ? 0.12 : 0.22;

  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, length);
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(rapid ? 2400 : 1600, now);
  filter.frequency.exponentialRampToValueAtTime(rapid ? 760 : 320, now + length * 0.85);
  filter.Q.value = 0.9;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(rapid ? 0.34 : 0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + length * 0.92);

  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(now);

  const tone = ac.createOscillator();
  const toneGain = ac.createGain();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(rapid ? 210 : 160, now);
  tone.frequency.exponentialRampToValueAtTime(rapid ? 70 : 45, now + length * 0.75);
  toneGain.gain.setValueAtTime(rapid ? 0.18 : 0.32, now);
  toneGain.gain.exponentialRampToValueAtTime(0.001, now + length * 0.82);
  tone.connect(toneGain).connect(ac.destination);
  tone.start(now);
  tone.stop(now + length);
}

export function playEmpty() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.05);
  gain.gain.setValueAtTime(0.07, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}

export function playSwitch() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  [0, 0.09].forEach((offset, i) => {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac, 0.05);
    const filter = ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = i === 0 ? 1800 : 3200;
    const gain = ac.createGain();
    const t = now + offset;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t);
  });
}

export function playPop(points = 100) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const base = 380 + Math.min(points, 750) * 0.9;

  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, 0.09);
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.34, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  src.connect(hp).connect(g).connect(ac.destination);
  src.start(now);

  const osc = ac.createOscillator();
  const og = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 2.4, now + 0.07);
  og.gain.setValueAtTime(0.26, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(og).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

export function playMiss() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  osc.connect(g).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

export function playHorn() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t = now + i * 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}
