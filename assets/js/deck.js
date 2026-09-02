/* ═══════════════════════════════════════════════
   DECK — lapméretezés, előlap, pakli-kupac, pohár
═══════════════════════════════════════════════ */

import { $ } from './dom.js';
import { CAT_META } from './rules.js';
import * as timer from './timer.js';

const MAX_CARD_W = 310;
const MIN_CARD_W = 124;
const RATIO = 7 / 5;          // magasság / szélesség

/* ───────────────────────────────
   MÉRETEZÉS
   A lap szélességét a rendelkezésre álló helyből
   számoljuk, nem vw-ből: így alacsony telefonon
   (és fekvő módban) sem lóg ki soha.
─────────────────────────────── */
let sizingReady = false;

export function initCardSizing() {
  if (sizingReady) return;
  const zone = $('card-zone');
  const slot = $('card-slot');
  if (!zone || !slot) return;
  sizingReady = true;

  const measure = () => {
    const r = zone.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const w = Math.floor(Math.min(r.width - 4, (r.height - 22) / RATIO, MAX_CARD_W));
    slot.style.setProperty('--card-w', Math.max(MIN_CARD_W, w) + 'px');
  };

  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(zone);
  addEventListener('resize', measure, { passive: true });
  addEventListener('orientationchange', () => setTimeout(measure, 120));
  measure();
}

/* ───────────────────────────────
   ELŐLAP
─────────────────────────────── */
/* az éppen kifordított lap — az infó gomb ebből dolgozik */
let current = null;
export function currentRule() { return current; }

export function renderFront(card, rule) {
  const front = $('card-front');
  const meta = CAT_META[rule.cat] || CAT_META.drink;
  current = rule;

  front.style.setProperty('--cat', meta.var);
  front.classList.toggle('is-king', rule.cat === 'king');

  $('card-sv').innerHTML = `<span class="${card.s.cls}">${card.v}${card.s.sym}</span>`;
  $('card-badge').textContent = `${meta.emoji} ${meta.label}`;
  $('card-rule').textContent = rule.name;
  $('card-desc').textContent = rule.desc;

  // az időzítő sávja is helyet foglal a lapon — a méretezés előtt kell tudni róla
  timer.attach(rule);

  fitCard();
}

export function clearFront() {
  current = null;
  timer.stop();
  $('card-sv').textContent = '';
  $('card-badge').textContent = '';
  $('card-rule').textContent = '';
  $('card-desc').textContent = '';
  $('card-body').style.setProperty('--fit', '1');
}

/* Egyetlen --fit változó skálázza a nevet és a leírást együtt.

   Szélesség: a leghosszabb szót canvasszal mérjük meg. A scrollWidth
   itt félrevezet — egy overflow:visible blokkban a kilógó szöveg nem
   számít bele, ezért a „Kérdésmester" simán átvágott a lap szélén.
   A szövegszélesség lineárisan skálázódik a betűmérettel, így a
   maximális arány egy osztással kijön, keresés nélkül.

   Magasság: felezéssel, mert a sortörés nem lineáris. Itt a
   scrollHeight megbízható, mert a .card-body overflow:hidden. */
const measurer = document.createElement('canvas').getContext('2d');
const MIN_FIT = 0.38;   // eddig mehet le a szöveg, ha másképp nem fér el

function fitCard() {
  const body = $('card-body');
  const rule = $('card-rule');
  const set = v => body.style.setProperty('--fit', String(v));

  set(1);

  // 1) vízszintes korlát a leghosszabb szóból
  const cs = getComputedStyle(rule);
  const longest = rule.textContent.split(/\s+/)
    .reduce((a, b) => (b.length > a.length ? b : a), '');
  measurer.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const wordW = measurer.measureText(longest).width;
  const avail = rule.clientWidth;

  // 4px ráhagyás: a betűméret kerekítése miatt a pontos határ még kilóg
  let hi = 1;
  if (wordW > avail - 4 && avail > 12) hi = Math.max(MIN_FIT, (avail - 4) / wordW);
  set(hi);

  // 2) függőleges korlát felezéssel
  if (body.scrollHeight <= body.clientHeight + 1) return;

  let lo = MIN_FIT, best = MIN_FIT;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    set(mid);
    if (body.scrollHeight <= body.clientHeight + 1) { best = mid; lo = mid; }
    else { hi = mid; }
  }
  set(best);
}

/* ───────────────────────────────
   PAKLI-KUPAC
   A maradék lapszám látszik a lap alatti rétegeken:
   a „hány lap van még" nem szám, hanem tárgy.
─────────────────────────────── */
export function setDeckLayers(remaining, total = 52) {
  const stack = $('deck-stack');
  if (!stack) return;
  const ratio = Math.max(0, remaining) / total;
  const layers = remaining <= 0 ? 0
    : ratio > 0.66 ? 4
    : ratio > 0.42 ? 3
    : ratio > 0.18 ? 2
    : 1;
  stack.dataset.layers = String(layers);

  const bar = $('deck-fill');
  if (bar) bar.style.transform = `scaleX(${ratio})`;
  $('deck-cnt').textContent = String(remaining);
}

/* ───────────────────────────────
   KING'S CUP
   A játék tétje: minden királynál eggyel telibb,
   a negyediknél kicsordul.
─────────────────────────────── */
export function updateCup(kings, { animate = false } = {}) {
  const cup = $('cup');
  const fill = $('cup-fill');
  if (!cup || !fill) return;

  const level = Math.min(kings, 4) / 4;
  fill.style.transform = `scaleY(${level})`;
  cup.classList.toggle('has-liquid', kings > 0);
  cup.classList.toggle('is-full', kings >= 4);
  $('cup-count').textContent = `${kings}/4`;
  cup.setAttribute('aria-label', `${kings} király a négyből`);

  if (animate) {
    cup.classList.remove('is-filling');
    void cup.offsetWidth;
    cup.classList.add('is-filling');
  }
}

/* ───────────────────────────────
   OSZTÁS
─────────────────────────────── */
export function dealIn() {
  const wrap = $('card-wrap');
  wrap.classList.remove('is-dealing');
  void wrap.offsetWidth;
  wrap.classList.add('is-dealing');
}
