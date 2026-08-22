/* ═══════════════════════════════════════════════
   RULES — a pakli és a szabálykészlet

   A király fix, a maradék 12 lapértékre minden új
   játék a készletből sorsol — kategóriánként kvótával,
   hogy egyetlen menet se csússzon el egy irányba.
═══════════════════════════════════════════════ */

export const SUITS = [
  { sym: '♥', cls: 'suit-h' },
  { sym: '♦', cls: 'suit-d' },
  { sym: '♠', cls: 'suit-s' },
  { sym: '♣', cls: 'suit-c' },
];

export const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/* Kategória-identitás: minden lap ránézésre besorolható.
   A `var` a --cat változóba kerül, abból lesz a keret,
   a szabálynév és a jelvény színe az előlapon. */
export const CAT_META = {
  drink:  { label: 'Ivás',           emoji: '🍺', var: 'var(--cat-drink)'  },
  rule:   { label: 'Tartós szabály', emoji: '📌', var: 'var(--cat-rule)'   },
  round:  { label: 'Körjáték',       emoji: '🔄', var: 'var(--cat-round)'  },
  social: { label: 'Társasági',      emoji: '💬', var: 'var(--cat-social)' },
  duel:   { label: 'Párbaj',         emoji: '⚔️', var: 'var(--cat-duel)'   },
  king:   { label: 'Király',         emoji: '👑', var: 'var(--cat-king)'   },
};

export const CATEGORIES = ['drink', 'rule', 'round', 'social', 'duel'];

export const KING_RULE = {
  id: 'king', cat: 'king', name: 'Király 👑',
  desc: 'Tölts a King\'s Cup pohárba! A 4. király húzója megissza az egészet! 👑🍺',
};

/* persist: tartós hatás — cetli kerül ki mellé
     pick: 'self'   → a húzó a szabály gazdája
           'word'   → beírt szó/név kerül a cetlire
           'player' → a húzó választ egy másik játékost */
export const RULE_POOL = [
  /* ── gyors, ivós ───────────────────────────── */
  { id: 'you',    cat: 'drink', name: 'You',      desc: 'Válassz valakit — ő iszik! 🍺' },
  { id: 'me',     cat: 'drink', name: 'Me',       desc: 'Te iszol! 🍺' },
  { id: 'girls',  cat: 'drink', name: 'Csajok',   desc: 'Minden lány iszik! 👩' },
  { id: 'guys',   cat: 'drink', name: 'Srácok',   desc: 'Minden fiú iszik! 👨' },
  { id: 'left',   cat: 'drink', name: 'Balra',    desc: 'A tőled balra ülő iszik! 👈' },
  { id: 'right',  cat: 'drink', name: 'Jobbra',   desc: 'A tőled jobbra ülő iszik! 👉' },
  { id: 'cheers', cat: 'drink', name: 'Koccints', desc: 'Válassz valakit, koccintsatok — mindketten isztok! 🥂' },
  { id: 'gift',   cat: 'drink', name: 'Ajándék',  desc: 'Adj valakinek egy kortyot — de akkor te is iszol egy felet! 🎁' },
  { id: 'wave',   cat: 'drink', name: 'Hullám',   desc: 'Kezdd el inni! Tőled balra sorban mindenki elkezdi — csak akkor állhat meg, ha az előtte lévő már letette. 🌊' },

  /* ── tartós szabályok ──────────────────────── */
  { id: 'duck',   cat: 'rule', name: 'Kacsamester',
    desc: 'Bármikor csőrt formálhatsz a kezeddel — mindenki utánozzon, az utolsó iszik! A következő ugyanilyen lapig te vagy a mester. 🦆',
    persist: { emoji: '🦆', label: 'Kacsamester', pick: 'self', sub: 'a köv. ugyanilyen lapig' } },
  { id: 'banned', cat: 'rule', name: 'Tiltott szó',
    desc: 'Válassz egy szót — a következő ugyanilyen lapig senki nem mondhatja ki! Aki kimondja, iszik. 🤐',
    persist: { emoji: '🤐', label: 'Tiltott szó', pick: 'word', ph: 'Írd be a tiltott szót… 🤐' } },
  { id: 'mate',   cat: 'rule', name: 'Társ',
    desc: 'Válassz valakit! A következő ugyanilyen lapig amikor te iszol, ő is iszik. 🤝',
    persist: { emoji: '🤝', label: 'Társ', pick: 'player', sub: 'együtt isznak' } },
  { id: 'nick',   cat: 'rule', name: 'Új név',
    desc: 'Adj valakinek új nevet! A következő ugyanilyen lapig aki a régin szólítja, iszik. 🏷️',
    persist: { emoji: '🏷️', label: 'Új név', pick: 'word', ph: 'Mi legyen az új név? 🏷️' } },
  { id: 'quiz',   cat: 'rule', name: 'Kérdésmester',
    desc: 'A következő ugyanilyen lapig aki válaszol egy kérdésedre, iszik! Kérdezz ravaszul. ❓',
    persist: { emoji: '❓', label: 'Kérdésmester', pick: 'self', sub: 'a köv. ugyanilyen lapig' } },
  { id: 'thumb',  cat: 'rule', name: 'Hüvelykmester',
    desc: 'Bármikor leteheted a hüvelykujjad az asztalra — mindenki utánozzon, az utolsó iszik! A következő ugyanilyen lapig te vagy a mester. 👍',
    persist: { emoji: '👍', label: 'Hüvelykmester', pick: 'self', sub: 'a köv. ugyanilyen lapig' } },
  { id: 'gesture', cat: 'rule', name: 'Kötelező mozdulat',
    desc: 'Találj ki egy mozdulatot! A következő ugyanilyen lapig mindenkinek el kell végeznie, mielőtt iszik — aki elfelejti, dupláz. 🕺',
    persist: { emoji: '🕺', label: 'Kötelező mozdulat', pick: 'word', ph: 'Mi legyen a mozdulat? 🕺' } },

  /* ── körjátékok ────────────────────────────── */
  { id: 'rhyme',  cat: 'round', name: 'Rímel',       desc: 'Mondj egy szót, körben rímeljetek — aki elakad, iszik! 🎵' },
  { id: 'categ',  cat: 'round', name: 'Kategória',   desc: 'Mondj egy kategóriát, körben soroljatok — aki elakad, iszik! 🗣️' },
  { id: 'chain',  cat: 'round', name: 'Szólánc',     desc: 'Mondj egy szót — körben mindenki az előző utolsó betűjével kezdődőt mond. Aki elakad, iszik! 🔗' },
  { id: 'story',  cat: 'round', name: 'Sztori-lánc', desc: 'Kezdj egy mondatot egy szóval! Körben mindenki hozzátesz egyet — aki lezárja vagy elakad, iszik! 📖' },
  { id: 'echo',   cat: 'round', name: 'Visszhang',   desc: 'Csinálj egy mozdulatot hanggal! Körben mindenki megismétli az eddigieket és hozzátesz egyet — aki elrontja, iszik! 🔁' },
  { id: 'count',  cat: 'round', name: 'Bomba',       desc: 'Számoljatok körben 1-től! A 7-re és minden 7-tel oszthatóra tapsolni kell szám helyett — aki elrontja, iszik! 💣' },

  /* ── társasági ─────────────────────────────── */
  { id: 'never',  cat: 'social', name: 'Soha Nem Voltam',  desc: '3 ujj fel! Mondj valamit amit te nem csináltál — aki csinálta, lehajt egy ujjat és iszik! ✋' },
  { id: 'quest',  cat: 'social', name: 'Kérdések',         desc: 'Kérdezz valakit → ő kérdéssel válaszol és kérdez mást → stb. Aki kijelentő mondatot mond vagy nevet, iszik! ❓' },
  { id: 'most',   cat: 'social', name: 'Ki az, aki…?',     desc: 'Tegyél fel egy „Ki az, aki…?" kérdést. Háromra mindenki mutasson valakire — akire a legtöbben mutattak, iszik! 👉' },
  { id: 'truth',  cat: 'social', name: 'Igaz vagy hamis?', desc: 'Mondj magadról 3 állítást, egy hazugság! Aki nem találja ki melyik, iszik — ha mindenki kitalálja, te iszol! 🎭' },
  { id: 'confess', cat: 'social', name: 'Vallomás',        desc: 'Mesélj el egy kínos sztorit magadról! Aki nem nevet rajta, iszik — ha senki nem nevet, te iszol. 🙈' },

  /* ── párbaj, kihívás ───────────────────────── */
  { id: 'vs',      cat: 'duel', name: 'Kacsa vagy Nyuszi', desc: 'Háromra mindenki mutat: kacsacsőr 🦆 vagy nyuszifül 🐰! Aki kisebbségben van, iszik — döntetlennél mindenki! 🦆🐰' },
  { id: 'duel',    cat: 'duel', name: 'Párbaj',            desc: 'Hívj ki valakit kő-papír-ollóra! A vesztes iszik. ⚔️' },
  { id: 'laugh',   cat: 'duel', name: 'Kibírod?',          desc: '30 másodpercig nem nevethetsz — a többiek mindent megtesznek, hogy megnevettessenek. Ha elmosolyodsz, iszol! 😐' },
  { id: 'fingers', cat: 'duel', name: 'Kacsaszám',         desc: 'Tippelj meg egy számot hangosan! Háromra mindenki mutat 0–5 ujjat — ha eltaláltad az összeget, mindenki más iszik, ha nem, te! 🔢' },
  { id: 'stare',   cat: 'duel', name: 'Szemezés',          desc: 'Válassz valakit és nézzetek egymás szemébe! Aki előbb elkapja a tekintetét vagy elmosolyodik, iszik. 👀' },
  { id: 'freeze',  cat: 'duel', name: 'Szoborjáték',       desc: 'Vedd fel a legbénább pózt, amit tudsz! Aki nem tudja utánozni 3 másodpercen belül, iszik. 🗿' },
];

/* ── sorsolás ──
   12 szabad slot / 5 kategória → 3+3+2+2+2.
   Azt is sorsoljuk, melyik kettő kap hármat, hogy ne
   mindig ugyanaz a két kategória legyen túlsúlyban. */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildRuleSet() {
  const quota = {};
  CATEGORIES.forEach(c => { quota[c] = 2; });
  shuffle([...CATEGORIES]).slice(0, 2).forEach(c => { quota[c] = 3; });

  const chosen = [];
  CATEGORIES.forEach(c => {
    chosen.push(...shuffle(RULE_POOL.filter(r => r.cat === c)).slice(0, quota[c]));
  });
  shuffle(chosen);

  const set = { K: KING_RULE };
  VALUES.filter(v => v !== 'K').forEach((v, i) => { set[v] = chosen[i]; });
  return set;
}

export function buildDeck() {
  return shuffle(SUITS.flatMap(s => VALUES.map(v => ({ v, s }))));
}
