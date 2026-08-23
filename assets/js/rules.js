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

/* desc: ami a lapra kerül — rövid, hogy elférjen
   long: ami az infó gombra nyílik — a széljegyzetek, amiken
         élő helyzetben elakad a társaság */
export const KING_RULE = {
  id: 'king', cat: 'king', name: 'Király 👑',
  desc: 'Tölts a King\'s Cup pohárba! A 4. király húzója megissza az egészet! 👑🍺',
  long: 'Ez a lap nem rólad szól, hanem a közös pohárról: tölts bele annyit, amennyit mersz. Ez a menet tétje. Aki a negyedik királyt húzza, annak az egészet meg kell innia — és ott véget is ér a játék.',
};

/* persist: tartós hatás — cetli kerül ki mellé
     pick: 'self'   → a húzó a szabály gazdája
           'word'   → beírt szó/név kerül a cetlire
           'player' → a húzó választ egy másik játékost */
export const RULE_POOL = [
  /* ── gyors, ivós ───────────────────────────── */
  { id: 'you',    cat: 'drink', name: 'You',      desc: 'Válassz valakit — ő iszik! 🍺',
    long: 'Te választasz: bárkit a körből, csak magadat nem. Ő iszik egyet, és mehet is a következő lap. A pakli leggyorsabb lapja — nincs mit magyarázni rajta.' },
  { id: 'me',     cat: 'drink', name: 'Me',       desc: 'Te iszol! 🍺',
    long: 'Nincs választás, nincs mérlegelés: te iszol egyet. A You párja, csak épp visszafelé sül el.' },
  { id: 'girls',  cat: 'drink', name: 'Csajok',   desc: 'Minden lány iszik! 👩',
    long: 'Minden lány iszik egyet a körben — te is, ha rád igaz. Ha nincs lány az asztalnál, a lap egyszerűen elmarad: nem kell helyette semmi mást csinálni.' },
  { id: 'guys',   cat: 'drink', name: 'Srácok',   desc: 'Minden fiú iszik! 👨',
    long: 'Minden fiú iszik egyet a körben — te is, ha rád igaz. Ha nincs fiú az asztalnál, a lap elmarad.' },
  { id: 'left',   cat: 'drink', name: 'Balra',    desc: 'A tőled balra ülő iszik! 👈',
    long: 'A tőled balra ülő iszik egyet, függetlenül attól, hogy ő mit húzott korábban. Két játékosnál ez mindig a másik ember.' },
  { id: 'right',  cat: 'drink', name: 'Jobbra',   desc: 'A tőled jobbra ülő iszik! 👉',
    long: 'A tőled jobbra ülő iszik egyet. A menet elején érdemes tisztázni, ki hol ül, hogy ez és a Balra lap ne okozzon vitát — főleg, ha nem kör alakban ültök.' },
  { id: 'cheers', cat: 'drink', name: 'Koccints', desc: 'Válassz valakit, koccintsatok — mindketten isztok! 🥂',
    long: 'Válassz valakit, koccintsatok össze rendesen, és mindketten isztok egyet. Ez az egyetlen lap, ahol önként viszed magaddal a másikat is.' },
  { id: 'gift',   cat: 'drink', name: 'Ajándék',  desc: 'Adj valakinek egy kortyot — de akkor te is iszol egyet! 🎁',
    long: 'Adj egy kortyot bárkinek a körből — de a nagylelkűségnek ára van: te is iszol egyet. Magadnak nem ajándékozhatsz.' },
  { id: 'all',    cat: 'drink', name: 'Mindenki', desc: 'Mindenki iszik egyet — egyszerre! 🍻',
    long: 'Mindenki iszik egyet, te is — egyszerre, most. Ez az egyetlen lap, ami senkit nem hagy ki. Bármilyen itallal működik: nem lánc és nem korty, csak egy közös menesztés.' },

  /* ── tartós szabályok ──────────────────────── */
  { id: 'duck',   cat: 'rule', name: 'Kacsamester',
    desc: 'Bármikor csőrt formálhatsz a kezeddel — mindenki utánozzon, az utolsó iszik! A következő ugyanilyen lapig te vagy a mester. 🦆',
    long: 'Bármikor, bármelyik kör közben csőrt formálhatsz a kezeddel — szó nélkül, csak megcsinálod. Aki észreveszi, utánozza; aki utolsónak kapcsol, iszik egyet. Addig vagy te a mester, amíg elő nem kerül ugyanaz a lapérték, akkor az új húzó veszi át tőled.',
    persist: { emoji: '🦆', label: 'Kacsamester', pick: 'self', sub: 'a köv. ugyanilyen lapig' } },
  { id: 'banned', cat: 'rule', name: 'Tiltott szó',
    desc: 'Válassz egy szót — a következő ugyanilyen lapig senki nem mondhatja ki! Aki kimondja, iszik. 🤐',
    long: 'Válassz egy szót — a jó választás olyan, ami sűrűn előkerül magától: „ital”, „nem”, vagy valakinek a neve. A következő ugyanilyen lapig aki kimondja, iszik egyet. Ha elgépelted, koppints a falon lévő cetlire és átírhatod.',
    persist: { emoji: '🤐', label: 'Tiltott szó', pick: 'word', ph: 'Írd be a tiltott szót… 🤐' } },
  { id: 'mate',   cat: 'rule', name: 'Társ',
    desc: 'Válassz valakit! A következő ugyanilyen lapig amikor te iszol, ő is iszik. 🤝',
    long: 'Válassz valakit a körből: mostantól össze vagytok kötve. Amikor te iszol bármi miatt, ő is iszik ugyanannyit — de fordítva nem, az ő kortyai nem szállnak rád. A cetlire koppintva bármikor lecserélheted a társad.',
    persist: { emoji: '🤝', label: 'Társ', pick: 'player', sub: 'együtt isznak' } },
  { id: 'nick',   cat: 'rule', name: 'Új név',
    desc: 'Adj valakinek új nevet! A következő ugyanilyen lapig aki a régin szólítja, iszik. 🏷️',
    long: 'Adj valakinek új nevet. A következő ugyanilyen lapig csak így lehet szólítani — aki a régi nevén szólítja, iszik egyet. Az érintett is iszik, ha véletlenül magára használja a régit. A nevet a cetlire koppintva átírhatod.',
    persist: { emoji: '🏷️', label: 'Új név', pick: 'word', ph: 'Mi legyen az új név? 🏷️' } },
  { id: 'quiz',   cat: 'rule', name: 'Kérdésmester',
    desc: 'A következő ugyanilyen lapig aki válaszol egy kérdésedre, iszik! Kérdezz ravaszul. ❓',
    long: 'Mostantól csapda minden kérdésed: aki válaszol rá, iszik egyet. A trükk az, hogy teljesen hétköznapi dolgokat kérdezz, amikre reflexből rávágják a választ. Addig tart, amíg elő nem kerül ugyanaz a lapérték.',
    persist: { emoji: '❓', label: 'Kérdésmester', pick: 'self', sub: 'a köv. ugyanilyen lapig' } },
  { id: 'double', cat: 'rule', name: 'Duplázó',
    desc: 'A következő ugyanilyen lapig minden korty dupla — mindenkire, minden lapnál. A King\'s Cup kivétel. ✌️',
    long: 'Ez nem szabály, hanem szorzó: a következő ugyanilyen lapig minden korty dupla. Mindenkire vonatkozik, nem csak rád — a húzó neve csak azért van a cetlin, hogy tudjátok, ki hozta rátok. Te magad nem iszol tőle rögtön. Nem halmozódik, sose lesz négyszeres, és a King\'s Cup a menet végén kivétel: az marad egy pohár.',
    persist: { emoji: '✌️', label: 'Duplázó', pick: 'self', sub: 'minden korty dupla' } },
  { id: 'gesture', cat: 'rule', name: 'Kötelező mozdulat',
    desc: 'Találj ki egy mozdulatot! A következő ugyanilyen lapig mindenkinek el kell végeznie, mielőtt iszik — aki elfelejti, dupláz. 🕺',
    long: 'Találj ki egy mozdulatot — egy tapsot, egy fejbiccentést, egy szalutálást. A következő ugyanilyen lapig mindenkinek el kell végeznie, mielőtt kortyol. Aki elfelejti, iszik még egyet. Írd be a cetlire, hogy ne felejtsétek el, mi volt.',
    persist: { emoji: '🕺', label: 'Kötelező mozdulat', pick: 'word', ph: 'Mi legyen a mozdulat? 🕺' } },

  /* ── körjátékok ────────────────────────────── */
  { id: 'rhyme',  cat: 'round', name: 'Rímel',       desc: 'Mondj egy szót, körben rímeljetek — aki elakad, iszik! 🎵',
    long: 'Mondj egy szót, aztán körben mindenki mond rá egy rímet. Aki elakad, ismétel egy már elhangzottat, vagy nagyon erőltetett rímet mond, iszik egyet — és a kör ott véget is ér.' },
  { id: 'categ',  cat: 'round', name: 'Kategória',   desc: 'Mondj egy kategóriát, körben soroljatok — aki elakad, iszik! 🗣️',
    long: 'Mondj egy kategóriát: autómárkák, filmcímek, magyar városok, bármi. Körben mindenki mond egy elemet. Aki elakad vagy olyat mond, ami már elhangzott, iszik egyet.' },
  { id: 'chain',  cat: 'round', name: 'Szólánc',     desc: 'Mondj egy szót — körben mindenki az előző utolsó betűjével kezdődőt mond. Aki elakad, iszik! 🔗',
    long: 'Mondj egy szót. A következő ember olyan szót mond, ami a te szavad utolsó betűjével kezdődik, aztán a következő az övével, és így tovább. Aki elakad vagy már elhangzott szót mond, iszik egyet.' },
  { id: 'story',  cat: 'round', name: 'Sztori-lánc', desc: 'Kezdj egy mondatot egy szóval! Körben mindenki hozzátesz egyet — aki lezárja vagy elakad, iszik! 📖',
    long: 'Kezdj egy mondatot egyetlen szóval. Körben mindenki hozzátesz pontosan egy szót. Aki lezárja a mondatot, aki elakad, vagy aki teljesen értelmetlenné teszi, iszik egyet.' },
  { id: 'echo',   cat: 'round', name: 'Visszhang',   desc: 'Csinálj egy mozdulatot hanggal! Körben mindenki megismétli az eddigieket és hozzátesz egyet — aki elrontja, iszik! 🔁',
    long: 'Csinálj egy mozdulatot egy hanggal együtt. A következő ember megismétli a tiédet, majd hozzátesz egy sajátot. A harmadik már kettőt ismétel és tesz hozzá egyet, és így tovább. Aki elrontja a sorrendet vagy kihagy egyet, iszik.' },
  { id: 'count',  cat: 'round', name: 'Bomba',       desc: 'Számoljatok körben 1-től! A 7-re és minden 7-tel oszthatóra tapsolni kell szám helyett — aki elrontja, iszik! 💣',
    long: 'Számoljatok körben egyesével, egytől indulva. A 7-re és minden 7-tel oszthatóra (7, 14, 21…) szám helyett tapsolni kell. Aki kimondja a számot, rosszkor tapsol vagy sokáig gondolkodik, iszik — és tőle indul újra egytől.' },

  /* ── társasági ─────────────────────────────── */
  { id: 'never',  cat: 'social', name: 'Soha Nem Voltam',  desc: '3 ujj fel! Mondj valamit amit te nem csináltál — aki csinálta, lehajt egy ujjat és iszik! ✋',
    long: 'Mindenki feltart három ujjat. Mondj valamit, amit te még sose csináltál — érdemes olyat, amiről sejted, hogy valaki más már igen. Aki csinálta, lehajt egy ujjat és iszik egyet.' },
  { id: 'quest',  cat: 'social', name: 'Kérdések',         desc: 'Kérdezz valakit → ő kérdéssel válaszol és kérdez mást → stb. Aki kijelentő mondatot mond vagy nevet, iszik! ❓',
    long: 'Kérdezz valakit. Ő nem válaszolhat: egy újabb kérdéssel kell reagálnia, és azt már valaki máshoz intézi. Aki kijelentő mondatot mond, elakad, megismétel egy kérdést vagy elneveti magát, iszik egyet.' },
  { id: 'most',   cat: 'social', name: 'Ki az, aki…?',     desc: 'Tegyél fel egy „Ki az, aki…?" kérdést. Háromra mindenki mutasson valakire — akire a legtöbben mutattak, iszik! 👉',
    long: 'Tegyél fel egy „Ki az, aki…?” kérdést — például ki késne el a saját esküvőjéről. Háromra mindenki rámutat valakire, magára is mutathat. Akire a legtöbb ujj mutat, iszik; holtversenynél mindketten.' },
  { id: 'truth',  cat: 'social', name: 'Igaz vagy hamis?', desc: 'Mondj magadról 3 állítást, egy hazugság! Aki nem találja ki melyik, iszik — ha mindenki kitalálja, te iszol! 🎭',
    long: 'Mondj magadról három állítást, amiből pontosan egy hazugság. A többiek megpróbálják kitalálni, melyik. Aki nem találja el, iszik egyet — ha viszont mindenki eltalálja, egyedül te iszol helyettük.' },
  { id: 'rank',   cat: 'social', name: 'Rangsor',          desc: 'Mondj egy szempontot — állítsátok sorba magatokat! Az utolsó iszik, vitánál te döntesz. 📊',
    long: 'Mondj egy szempontot, amiben sorba lehet állítani a társaságot: ki kel fel legkorábban, ki járt a legtöbb országban, kinek van a legtöbb fotója a telefonján. Rendezzétek magatokat sorba a legtöbbtől a legkevesebbig — az utolsó helyezett iszik egyet. Ha nem tudtok megegyezni, te döntesz: te mondtad a szempontot, tiéd a végszó. Holtversenynél mindketten isznak.' },

  /* ── párbaj, kihívás ───────────────────────── */
  { id: 'vs',      cat: 'duel', name: 'Kacsa vagy Nyuszi', desc: 'Háromra mindenki mutat: kacsacsőr 🦆 vagy nyuszifül 🐰! Aki kisebbségben van, iszik — döntetlennél mindenki! 🦆🐰',
    long: 'Háromra mindenki mutat: kacsacsőr a kézzel, vagy nyuszifül a fej mellett. Aki a kisebbségbe kerül, iszik egyet. Ha pontosan fele-fele az arány, mindenki iszik.' },
  { id: 'duel',    cat: 'duel', name: 'Párbaj',            desc: 'Hívj ki valakit kő-papír-ollóra! A vesztes iszik. ⚔️',
    long: 'Hívj ki valakit egy kör kő-papír-ollóra. A vesztes iszik egyet. Döntetlennél újra kell játszani, amíg meg nem lesz a győztes — az egymás utáni döntetlenek nem számítanak bele.' },
  { id: 'laugh',   cat: 'duel', name: 'Kibírod?',          desc: '30 másodpercig nem nevethetsz — a többiek mindent megtesznek, hogy megnevettessenek. Ha elmosolyodsz, iszol! 😐',
    long: 'Indul egy 30 másodperces visszaszámlálás, ami alatt neked kőarcot kell vágnod. A többiek bármit bevethetnek — grimaszt, sztorit, hangokat —, de hozzád nem érhetnek. Ha elmosolyodsz vagy felnevetsz, iszol egyet; ha kibírod, megúsztad.' },
  { id: 'fingers', cat: 'duel', name: 'Kacsaszám',         desc: 'Tippelj meg egy számot hangosan! Háromra mindenki mutat 0–5 ujjat — ha eltaláltad az összeget, mindenki más iszik, ha nem, te! 🔢',
    long: 'Mondj hangosan egy tippet arra, mennyi lesz az összes felmutatott ujj száma. Háromra mindenki mutat 0 és 5 közötti ujjat, te is. Ha eltaláltad az összeget, mindenki más iszik egyet; ha nem, egyedül te.' },
  { id: 'stare',   cat: 'duel', name: 'Szemezés',          desc: 'Válassz valakit és nézzetek egymás szemébe! Aki előbb elkapja a tekintetét vagy elmosolyodik, iszik. 👀',
    long: 'Válassz valakit, és nézzetek egymás szemébe. Aki előbb elkapja a tekintetét vagy elmosolyodik, iszik egyet. Ha egyszerre törtök meg, mindketten isztok.' },
  { id: 'freeze',  cat: 'duel', name: 'Szoborjáték',       desc: 'Vedd fel a legbénább pózt, amit tudsz! Aki nem tudja utánozni 3 másodpercen belül, iszik. 🗿',
    long: 'Vedd fel a lehető legbénább pózt, és tartsd. A többieknek három másodpercen belül le kell másolniuk. Aki nem tudja felvenni, elveszti az egyensúlyát vagy nevetni kezd, iszik egyet.' },
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
