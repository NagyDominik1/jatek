/* ═══════════════════════════════════════════════
   PLATFORM — képernyőzár-tiltás és offline működés
═══════════════════════════════════════════════ */

/* ───────────────────────────────
   WAKE LOCK
   Egy társasjáték közben percekig nem érinti senki
   a telefont — enélkül elalszik a képernyő a kör közepén.
   A zár elveszik, ha a lap háttérbe kerül, ezért
   visszatéréskor újra kell kérni.
─────────────────────────────── */
let lock = null;
let wanted = false;

export async function keepAwake(on) {
  wanted = on;
  if (!('wakeLock' in navigator)) return;

  if (!on) {
    try { await lock?.release(); } catch { /* már elengedve */ }
    lock = null;
    return;
  }
  if (lock) return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
  } catch { /* alacsony töltöttség vagy nincs engedély — nem kritikus */ }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wanted && !lock) keepAwake(true);
});

/* ───────────────────────────────
   SERVICE WORKER
   Ettől települ a kezdőképernyőre és megy offline is.
   Relatív hatókör, hogy XAMPP alkönyvtárból is működjön
   (http://localhost/BunnyDuck/).
─────────────────────────────── */
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;   // fájlrendszerről nem regisztrálható

  /* Új verzió átvételekor egyszer újratöltünk, különben a lap
     félig a régi, félig az új fájlokkal futna tovább. Csak akkor,
     ha MÁR volt vezérlő: az első telepítés claim()-je egyébként
     rögtön újratöltené az oldalt az első látogatáskor. */
  if (navigator.serviceWorker.controller) {
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }

  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      /* pl. nem biztonságos eredet — a játék enélkül is teljes értékű */
    });
  });
}
