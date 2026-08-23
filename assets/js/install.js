/* ═══════════════════════════════════════════════
   TELEPÍTÉS (PWA)

   Két világ van, és külön kell kezelni:

   • Chrome / Edge (Android és asztali gép) — elsüti a
     `beforeinstallprompt` eseményt. Ezt elkapjuk és félretesszük,
     hogy ne a böngésző sávja döntsön az időzítésről, hanem a
     lobbi gombja.
   • iOS Safari — nincs ilyen esemény, ott a felhasználó kézzel
     adja hozzá a főképernyőhöz. Neki leírjuk a két lépést.

   Ha a játék már telepítve fut, a gomb meg se jelenik.
═══════════════════════════════════════════════ */

import { $ } from './dom.js';

/* A böngésző félretett ajánlata. Egyszer használható:
   a prompt() után eldobjuk, új esemény hozza a következőt. */
let deferred = null;

export function standalone() {
  return matchMedia('(display-mode: standalone)').matches
    || matchMedia('(display-mode: fullscreen)').matches
    || navigator.standalone === true;     // iOS
}

/* iPadOS 13 óta „MacIntel"-nek vallja magát, a tapintás
   különbözteti meg az igazi asztali Mactől. */
function isApple() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function initInstall({ onTap } = {}) {
  const btn = $('install-btn');
  const dlg = $('install-dialog');
  if (!btn || !dlg) return;

  const show = () => { btn.hidden = false; };
  const hide = () => { btn.hidden = true; };

  if (standalone()) return;               // már telepítve fut, nincs mit ajánlani

  /* ── Chrome/Edge: a natív ajánlat elkapása ── */
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();                   // ne a böngésző sávja vigye
    deferred = e;
    show();
  });

  /* ── iOS: nincs esemény, de van kézi mód ── */
  if (isApple()) show();

  addEventListener('appinstalled', () => {
    deferred = null;
    hide();
  });

  btn.addEventListener('click', async () => {
    onTap?.();

    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;                    // az ajánlat elhasználódott
      if (outcome === 'accepted') hide();
      return;
    }

    dlg.showModal();                      // iOS és a bizonytalan esetek
  });

  $('install-close').addEventListener('click', () => dlg.close());
  $('install-ok').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* A leírás platformfüggő: az Androidos menü máshol van,
     mint a Safari megosztás gombja. */
  $('install-steps').innerHTML = isApple()
    ? `<li>Koppints a <b>Megosztás</b> ikonra (⬆️) a böngésző sávjában.</li>
       <li>Görgess le, és válaszd a <b>Főképernyőhöz adás</b> lehetőséget.</li>
       <li>Kész — innentől ikonról indul, offline is. 🦆</li>`
    : `<li>Nyisd meg a böngésző menüjét (⋮).</li>
       <li>Válaszd a <b>Telepítés</b> vagy <b>Alkalmazás telepítése</b> pontot.</li>
       <li>Kész — innentől ikonról indul, offline is. 🦆</li>`;
}
