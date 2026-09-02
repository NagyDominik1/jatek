/* ═══════════════════════════════════════════════
   TIMER — visszaszámláló a lapon

   Van pár lap, ami időre megy (Kibírod?, Gyorstűz).
   Eddig fejben számolták, amiből mindig vita lett:
   „ez nem volt 30 másodperc". Ez a modul a lap alsó
   sávjába tesz egy gombot — a lapot előbb el lehet
   olvasni, az idő csak koppintásra indul.

   Futás közben a Következő gomb zárva van, hogy senki
   ne lapozzon el a feladat fölött; a futó számlálóra
   koppintva viszont bármikor megszakítható.
═══════════════════════════════════════════════ */

import { $ } from './dom.js';
import * as fx from './fx.js';

let cfg = null;        // az aktuális lap időzítő-beállítása
let endsAt = 0;
let raf = 0;
let lastSec = -1;
let onRun = () => {};

const btn = () => $('card-timer');
const label = () => $('ct-label');

export function init(opts = {}) {
  onRun = opts.onRun || (() => {});
  btn().addEventListener('click', e => {
    e.stopPropagation();     // ne a lap kapja el a koppintást
    toggle();
  });
}

/* ── új lap ── */
export function attach(rule) {
  reset();
  cfg = rule && rule.timer ? rule.timer : null;
  const b = btn();
  b.hidden = !cfg;
  $('card-front').classList.toggle('has-timer', !!cfg);
  if (cfg) idle();
}

/* ── takarítás: körváltás, menet vége ── */
export function stop() {
  reset();
  cfg = null;
  btn().hidden = true;
  $('card-front').classList.remove('has-timer');
}

function reset() {
  cancelAnimationFrame(raf);
  raf = 0;
  endsAt = 0;
  lastSec = -1;
  const b = btn();
  b.classList.remove('is-run', 'is-over', 'is-gone');
  b.querySelector('.ct-fill').style.transform = 'scaleX(0)';
  onRun(false);
}

/* A felirat szándékosan rövid: a lapon max ennyi fér el az infó
   gomb mellett, a hosszt pedig úgyis kimondja a lap szövege. */
function idle(text) {
  const b = btn();
  b.classList.remove('is-run', 'is-over', 'is-gone');
  b.querySelector('.ct-fill').style.transform = 'scaleX(0)';
  label().textContent = text || '⏱ Indítás';
  b.setAttribute('aria-label', `Időzítő indítása, ${cfg.sec} másodperc`);
}

function toggle() {
  if (!cfg) return;
  if (raf) { reset(); idle(); fx.sfx.tap(); return; }   // futás közben: megszakítás
  start();
}

function start() {
  const b = btn();
  endsAt = Date.now() + cfg.sec * 1000;
  lastSec = -1;
  b.classList.add('is-run');
  b.classList.remove('is-over', 'is-gone');
  b.setAttribute('aria-label', 'Koppints az időzítő megszakításához');
  onRun(true);
  fx.sfx.next();
  fx.buzz(10);

  /* A csík CSS-ből fut végig: háttérben lévő fülön is pontos marad,
     és nem a rAF-től függ, hogy egyenletes-e. */
  const fill = b.querySelector('.ct-fill');
  fill.style.transition = 'none';
  fill.style.transform = 'scaleX(1)';
  void fill.offsetWidth;
  fill.style.transition = `transform ${cfg.sec}s linear`;
  fill.style.transform = 'scaleX(0)';

  tick();
}

function tick() {
  const left = endsAt - Date.now();

  if (left <= 0) { finish(); return; }

  const sec = Math.ceil(left / 1000);
  if (sec !== lastSec) {
    lastSec = sec;
    label().textContent = String(sec);
    if (sec <= 3) { fx.sfx.tick(); fx.buzz(8); }   // az utolsó három másodperc hallatszik
  }
  raf = requestAnimationFrame(tick);
}

function finish() {
  cancelAnimationFrame(raf);
  raf = 0;

  const b = btn();
  b.classList.remove('is-run');
  b.classList.add('is-over');
  b.querySelector('.ct-fill').style.transform = 'scaleX(0)';
  label().textContent = '⏰ Lejárt!';
  b.setAttribute('aria-label', 'Lejárt az idő');

  fx.sfx.timeUp();
  fx.buzz([40, 70, 40, 70, 120]);
  fx.shake($('card-slot'));
  onRun(false);                       // innentől mehet a Következő

  /* Egyszeri lapnál eltűnik, hogy ne maradjon ott feleslegesen;
     a körben forgó lapoknál (Gyorstűz) viszont a következő
     játékosnak újra kell — ott visszaáll indítható állapotba. */
  setTimeout(() => {
    if (!cfg || b.classList.contains('is-run')) return;
    if (cfg.repeat) { idle('⏱ Újra'); return; }
    b.classList.add('is-gone');
    setTimeout(() => { if (b.classList.contains('is-gone')) b.hidden = true; }, 320);
  }, 1200);
}
