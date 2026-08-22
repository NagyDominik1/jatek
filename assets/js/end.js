/* ═══════════════════════════════════════════════
   END — a menet lezárása

   A régi végképernyő egy közlemény volt: ikon, cím,
   egy mondat. Itt viszont dől el a játék tétje, ezért
   most három rétege van:
     1. a leleplezés  — ki issza meg a poharat,
     2. a kitüntetések — ki mivel érdemelte ki,
     3. a mérleg      — mi történt a menet alatt.
═══════════════════════════════════════════════ */

import { $, esc, el } from './dom.js';

/* ───────────────────────────────
   STATISZTIKA
─────────────────────────────── */
export function newStats(roster) {
  return {
    cards: 0,
    turns: 0,
    perPlayer: roster.map(() => ({
      total: 0, kings: 0, drink: 0, rule: 0, round: 0, social: 0, duel: 0,
    })),
  };
}

export function record(stats, playerIndex, rule) {
  const s = stats.perPlayer[playerIndex];
  if (!s) return;
  stats.cards++;
  s.total++;
  if (rule.cat === 'king') s.kings++;
  else s[rule.cat]++;
}

/* ───────────────────────────────
   KITÜNTETÉSEK
   Egy játékos legfeljebb egyet kap: ha a legjobb már
   nyert, a következő legjobb viszi — így nem söpri be
   az összeset ugyanaz az ember.
─────────────────────────────── */
const AWARDS = [
  { emoji: '👑', label: 'Királygyűjtő',  note: 'a legtöbb király',        of: s => s.kings, min: 2 },
  { emoji: '🍺', label: 'Legszomjasabb', note: 'a legtöbb ivós lap',      of: s => s.drink, min: 2 },
  { emoji: '📌', label: 'Szabályalkotó', note: 'a legtöbb tartós szabály', of: s => s.rule,  min: 1 },
  { emoji: '⚔️', label: 'Bajkeverő',     note: 'a legtöbb párbaj',        of: s => s.duel,  min: 2 },
  { emoji: '🎭', label: 'Társaság lelke', note: 'a legtöbb társasági lap', of: s => s.social, min: 2 },
  { emoji: '🔥', label: 'Gépezet',       note: 'a legtöbb lap összesen',  of: s => s.total, min: 4 },
];

function pickAwards(roster, stats, limit = 3) {
  const taken = new Set();
  const out = [];

  for (const a of AWARDS) {
    if (out.length >= limit) break;

    // a legjobb, aki még nem kapott semmit
    let best = -1, bestVal = 0;
    stats.perPlayer.forEach((s, i) => {
      const v = a.of(s);
      if (v >= a.min && v > bestVal && !taken.has(i)) { best = i; bestVal = v; }
    });

    if (best < 0) continue;
    taken.add(best);
    out.push({ ...a, player: roster[best], value: bestVal });
  }
  return out;
}

/* ───────────────────────────────
   RENDER
─────────────────────────────── */
/* A leleplezés ütemezett animációi CSS-ben élnek, és egy elem
   animációja magától nem indul újra. Második menet után is
   szóljon a bemutatás, ezért kézzel újraindítjuk őket. */
const STAGED = '.end-eyebrow, .end-spot, .end-face, .end-cup, .end-name, .end-verdict, .end-wheel, .end-panel, .end-actions';

function restartReveal() {
  const nodes = document.querySelectorAll(`#end-screen ${STAGED.split(', ').join(', #end-screen ')}`);
  nodes.forEach(n => { n.style.animation = 'none'; });
  void document.getElementById('end-screen').offsetWidth;
  nodes.forEach(n => { n.style.animation = ''; });
}

export function render({ reason, roster, stats, loserIndex, notesLeft }) {
  const kings = reason === 'kings';
  const loser = kings ? roster[loserIndex] : null;

  /* ── 1. leleplezés ── */
  const stage = $('end-stage');
  stage.classList.toggle('is-deckout', !kings);

  // a --who a színpadon él, onnan örökli a reflektor, az arc és a név
  stage.style.setProperty('--who', kings ? loser.color : 'var(--accent-3)');

  $('end-eyebrow').textContent = kings ? 'Megvan a 4. király' : 'Elfogyott a pakli';
  $('end-face').textContent = kings ? loser.emoji : '🃏';
  $('end-name').textContent = kings ? loser.name : 'Senki';

  // királynál még nincs eldöntve: a kerék írja felül ezt a mondatot
  $('end-verdict').innerHTML = kings
    ? 'Tiéd a <b>King\'s Cup</b>. 🍺'
    : 'Elfogyott a pakli, mielőtt kijött volna a 4. király. Megúsztátok. 🦆🐰';

  /* ── 2. kitüntetések ── */
  const awards = pickAwards(roster, stats);
  const box = $('end-awards');
  box.innerHTML = '';
  awards.forEach((a, i) => {
    const node = el('div', 'award');
    node.style.setProperty('--who', a.player.color);
    node.style.animationDelay = `${900 + i * 110}ms`;
    node.innerHTML = `
      <div class="award-medal">${a.emoji}</div>
      <div class="award-text">
        <div class="award-label">${esc(a.label)}</div>
        <div class="award-who">${a.player.emoji} ${esc(a.player.name)} <span class="award-note">· ${a.note} (${a.value})</span></div>
      </div>`;
    box.appendChild(node);
  });
  box.hidden = awards.length === 0;

  /* ── 3. mérleg ── */
  $('end-sum-cards').textContent = stats.cards;
  $('end-sum-left').textContent = Math.max(0, 52 - stats.cards);
  $('end-sum-rules').textContent = notesLeft;

  const max = Math.max(1, ...stats.perPlayer.map(s => s.total));
  const table = $('end-table');
  table.innerHTML = '';
  roster.forEach((p, i) => {
    const s = stats.perPlayer[i];
    const row = el('div', 'stat-row');
    row.style.setProperty('--who', p.color);
    if (i === loserIndex && kings) row.classList.add('is-loser');
    row.innerHTML = `
      <div class="stat-face">${p.emoji}</div>
      <div class="stat-name">${esc(p.name)}</div>
      <div class="stat-bar"><i style="transform:scaleX(${s.total / max})"></i></div>
      <div class="stat-num">${s.total}</div>
      <div class="stat-kings">${s.kings ? '👑'.repeat(Math.min(s.kings, 4)) : ''}</div>`;
    table.appendChild(row);
  });

  restartReveal();
}
