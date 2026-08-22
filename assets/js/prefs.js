/* ═══════════════════════════════════════════════
   PREFS — téma, hang, utolsó névsor

   Kizárólag a böngésző saját localStorage-ában él:
   nincs szerver, nincs adatbázis, semmi nem hagyja el
   a készüléket. Privát ablakban / letiltott sütiknél a
   getter dob — ezért minden hozzáférés try/catch-ben van,
   és a játék üres beállításokkal is működik.
═══════════════════════════════════════════════ */

const KEY = 'bunnyduck.prefs.v1';

/* Neveket szándékosan NEM tárolunk: a lobbi mindig tiszta lappal
   induljon, ne az előző társaság névsorával. */
const DEFAULTS = {
  theme: 'auto',   // 'auto' | 'light' | 'dark'
  sound: true,
  haptics: true,
};

let cache = null;

function load() {
  if (cache) return cache;
  cache = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(cache, JSON.parse(raw));
    if (cache.players) { delete cache.players; save(); }  // korábbi verzió névsora — töröljük
  } catch { /* privát mód vagy letiltott tárolás — maradnak az alapok */ }
  return cache;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch { /* tele a kvóta vagy tiltott — nem baj, csak kényelmi funkció */ }
}

export function get(key) {
  return load()[key];
}

export function set(key, value) {
  load()[key] = value;
  save();
}

/* ── téma ── */
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  // a böngésző címsávja is kövesse a témát
  const dark = theme === 'dark'
    || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#17110d' : '#f4ead5');
}

export function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  const next = order[(order.indexOf(get('theme')) + 1) % order.length];
  set('theme', next);
  applyTheme(next);
  return next;
}

export function themeIcon(theme = get('theme')) {
  return theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌗';
}

export function initTheme() {
  applyTheme(get('theme'));
  // ha 'auto', kövessük a rendszer váltását is
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (get('theme') === 'auto') applyTheme('auto');
  });
}
