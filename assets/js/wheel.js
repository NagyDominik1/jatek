/* ═══════════════════════════════════════════════
   WHEEL — a negyedik király utolsó esélye

   Aki a King's Cupot kapja, választhat:
     · megissza az alapot, vagy
     · pörget egyet — 2/3 eséllyel valaki még tölt
       hozzá, 1/3 eséllyel viszont megússza.

   A kerék hat egyforma cikkből áll: négy „plusz ital"
   és két „megúszod", egymással szemben. Így az esély
   ránézésre is leolvasható a lapról, nem csak hiszed.
═══════════════════════════════════════════════ */

import { $, esc } from './dom.js';
import * as fx from './fx.js';

/* index → kimenet; a két 'escape' szemben áll egymással */
const SLICES = ['extra', 'escape', 'extra', 'extra', 'escape', 'extra'];
const SLICE_DEG = 360 / SLICES.length;
const SPIN_MS = 3400;

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

let loser = null;
let others = [];
let onDone = null;
let busy = false;
let turns = 0;

/* ───────────────────────────────
   ELŐKÉSZÍTÉS
─────────────────────────────── */
export function arm(roster, loserIndex, done) {
  loser = roster[loserIndex];
  others = roster.filter((_, i) => i !== loserIndex);
  onDone = done;
  busy = false;
  turns = 0;

  const box = $('end-wheel');
  box.hidden = false;
  box.classList.remove('is-done');

  const disc = $('wheel-disc');
  disc.style.transition = 'none';
  disc.style.transform = 'rotate(0deg)';
  void disc.offsetWidth;              // a nullázás ne animálódjon
  disc.style.transition = '';

  $('wheel-actions').hidden = false;
  $('spin-btn').disabled = false;
  $('decline-btn').disabled = false;
  $('wheel-result').hidden = true;
  $('wheel-result').textContent = '';
  $('wheel-intro').hidden = false;
  $('drink-btn').hidden = true;
}

export function hide() {
  $('end-wheel').hidden = true;
}

/* ───────────────────────────────
   PÖRGETÉS
─────────────────────────────── */
export function spin() {
  if (busy) return;
  busy = true;
  $('spin-btn').disabled = true;
  $('decline-btn').disabled = true;
  $('wheel-intro').hidden = true;

  /* Előbb eldöntjük a kimenetet, utána számoljuk hozzá a szöget —
     így az esély pontosan 2/3 – 1/3, nem a szögek kerekítésén múlik. */
  const outcome = Math.random() < 1 / 3 ? 'escape' : 'extra';
  const candidates = SLICES.reduce((acc, s, i) => (s === outcome ? [...acc, i] : acc), []);
  const slice = candidates[(Math.random() * candidates.length) | 0];

  // a cikk közepét visszük a mutató alá, kis szórással
  const center = slice * SLICE_DEG + SLICE_DEG / 2;
  const jitter = (Math.random() - 0.5) * (SLICE_DEG - 16);
  turns += 5;
  const angle = turns * 360 + (360 - center) - jitter;

  const disc = $('wheel-disc');
  if (reduced.matches) {
    disc.style.transition = 'none';
    disc.style.transform = `rotate(${angle}deg)`;
    setTimeout(() => finish(outcome), 300);
    return;
  }

  disc.style.transform = `rotate(${angle}deg)`;
  fx.sfx.spin(SPIN_MS / 1000);
  fx.buzz(20);
  setTimeout(() => finish(outcome), SPIN_MS + 120);
}

/* ───────────────────────────────
   „Nem kockáztatok"
─────────────────────────────── */
export function decline() {
  if (busy) return;
  busy = true;
  $('spin-btn').disabled = true;
  $('decline-btn').disabled = true;
  $('wheel-intro').hidden = true;
  finish('declined');
}

/* ───────────────────────────────
   EREDMÉNY
─────────────────────────────── */
function finish(outcome) {
  const box = $('end-wheel');
  const res = $('wheel-result');
  box.classList.add('is-done');
  $('wheel-actions').hidden = true;

  let pourer = null;
  if (outcome === 'extra' && others.length) {
    pourer = others[(Math.random() * others.length) | 0];
  }

  if (outcome === 'escape') {
    res.className = 'wheel-result is-escape';
    res.innerHTML = '🎉 <b>Megúsztad!</b> Nulla korty.';
    fx.sfx.win();
    fx.buzz([15, 50, 15]);
  } else if (outcome === 'extra') {
    res.className = 'wheel-result is-extra';
    res.innerHTML = pourer
      ? `💀 ${pourer.emoji} <b>${esc(pourer.name)}</b> tölt bele még egyet. Sok sikert.`
      : '💀 <b>Még egy ital megy bele.</b> Sok sikert.';
    fx.sfx.doom();
    fx.buzz([25, 70, 25, 70, 40]);
  } else {
    res.className = 'wheel-result is-declined';
    res.innerHTML = '🍺 Nem kockáztatsz. <b>Csak az alap megy le.</b>';
    fx.sfx.next();
  }

  res.hidden = false;

  /* Új menet csak innen indulhat: amíg a soron lévő nem nyugtázza,
     hogy megvolt, a „Még egy kört" és az „Új névsor" rejtve marad. */
  const drink = $('drink-btn');
  drink.textContent = outcome === 'escape' ? '✅ Mehet tovább' : '✅ Megittam';
  drink.hidden = false;

  onDone?.(outcome, pourer);
}
