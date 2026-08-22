/* ═══════════════════════════════════════════════
   FX — hang, rezgés, konfetti, rázás

   A hangok szintetizáltak (WebAudio), nincs hozzájuk
   letöltendő fájl: offline is szólnak, és nem lassítják
   a betöltést mobilneten.
═══════════════════════════════════════════════ */

import * as prefs from './prefs.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/* ───────────────────────────────
   HANG
─────────────────────────────── */
let ac = null;

/* Az AudioContext csak felhasználói gesztusra indítható
   (iOS/Chrome szabály), ezért az első koppintáskor hozzuk létre. */
function ctx() {
  if (!prefs.get('sound')) return null;
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch { return null; }
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}

export function unlockAudio() {
  if (prefs.get('sound')) ctx();
}

function tone(freq, start, dur, { type = 'sine', gain = 0.16, slideTo = null } = {}) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/* szűrt zajlöket — ebből lesz a lapsuhanás */
function noise(start, dur, { from = 1800, to = 400, gain = 0.1 } = {}) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + start;
  const frames = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, frames, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

  const src = a.createBufferSource();
  src.buffer = buf;

  const filt = a.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(from, t);
  filt.frequency.exponentialRampToValueAtTime(to, t + dur);
  filt.Q.value = 1.1;

  const g = a.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filt).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  flip() {
    noise(0, 0.26, { from: 2400, to: 520, gain: 0.11 });
    tone(320, 0.02, 0.14, { type: 'triangle', gain: 0.05, slideTo: 180 });
  },
  tap() {
    tone(660, 0, 0.07, { type: 'triangle', gain: 0.07 });
  },
  next() {
    tone(392, 0, 0.09, { type: 'sine', gain: 0.08 });
    tone(587, 0.06, 0.11, { type: 'sine', gain: 0.07 });
  },
  king() {
    // emelkedő fanfár — minden király egy fokkal ünnepélyesebb
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, i * 0.085, 0.34, { type: 'triangle', gain: 0.13 }));
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone(f, i * 0.1, 0.5, { type: 'triangle', gain: 0.15 }));
    noise(0.5, 0.6, { from: 900, to: 200, gain: 0.07 });
  },
  end() {
    [440, 392, 330, 262].forEach((f, i) =>
      tone(f, i * 0.13, 0.4, { type: 'sine', gain: 0.11 }));
  },
  /* kerékkattogás: a kattanások egyre ritkulnak, ahogy lassul */
  spin(seconds = 3.4) {
    let t = 0, gap = 0.055;
    while (t < seconds) {
      tone(1150, t, 0.035, { type: 'square', gain: 0.045 });
      gap *= 1.14;
      t += gap;
    }
  },
  /* rossz hír: ereszkedő tercek */
  doom() {
    [392, 330, 262, 196].forEach((f, i) =>
      tone(f, i * 0.11, 0.42, { type: 'sawtooth', gain: 0.09 }));
  },
};

/* ───────────────────────────────
   REZGÉS
─────────────────────────────── */
export function buzz(pattern = 12) {
  if (!prefs.get('haptics')) return;
  if (!navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { /* nem támogatott */ }
}

/* ───────────────────────────────
   RÁZÁS
─────────────────────────────── */
export function shake(el) {
  if (reduced.matches || !el) return;
  el.classList.remove('shake');
  void el.offsetWidth;          // újraindítja az animációt
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

/* A konfetti-vászon kikerült: a leleplezésre zúduló elemek
   gyengébb telefonon megakasztották az oldalt, és a döntő
   pillanatot is elrejtették. Marad a rázás és a hang. */
