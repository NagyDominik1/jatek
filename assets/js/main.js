/* ═══════════════════════════════════════════════
   MAIN — állapot és összekötés
═══════════════════════════════════════════════ */

import { $, replay } from './dom.js';
import { buildDeck, buildRuleSet } from './rules.js';
import * as prefs from './prefs.js';
import * as fx from './fx.js';
import * as players from './players.js';
import * as notes from './notes.js';
import * as deck from './deck.js';
import * as end from './end.js';
import * as wheel from './wheel.js';
import { keepAwake, registerSW } from './platform.js';

const DECK_SIZE = 52;
const FLIP_MS = 620;

/* ── állapot ── */
let roster = [];      // [{ name, emoji, color }]
let cards = [];
let ruleSet = {};
let curIdx = 0;
let kings = 0;
let flipped = false;
let stats = null;

/* ═══════════════════════════════
   KÉPERNYŐVÁLTÁS
═══════════════════════════════ */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = $(id);
  screen.classList.add('active');
  replay(screen, 'screen-enter');
}

/* ═══════════════════════════════
   SETUP
═══════════════════════════════ */
function syncStartBtn() {
  const list = players.readPlayers();
  $('start-btn').disabled = list.length < 2;
  if (list.length >= 2) $('err-msg').textContent = '';
  renderTableSummary(list.length);
}

/* Élő visszajelzés a lobbiban: az asztal formálódjon,
   ahogy gépelik a neveket — ne csak egy inaktív gomb jelezze,
   hogy „még nincs elég ember". */
function renderTableSummary(count) {
  const box = $('table-summary');
  if (count < 2) {
    box.innerHTML = count === 1
      ? 'Még egy ember kell, és mehet 🦆'
      : 'Írjátok be a neveket — legalább ketten legyetek 🐰';
    return;
  }
  // a 4. király átlagosan a 42. lap környékén jön elő
  const mins = Math.round(42 * 0.45);
  box.innerHTML =
    `<span>👥 <b>${count}</b> játékos</span>`
    + `<span>🃏 <b>52</b> lap</span>`
    + `<span>⏱ kb. <b>${mins}</b> perc</span>`;
}

function startGame() {
  roster = players.readPlayers();
  if (roster.length < 2) {
    $('err-msg').textContent = 'Legalább 2 játékos kell! 🦆';
    fx.buzz([12, 40, 12]);
    return;
  }
  if (new Set(roster.map(p => p.name.toLowerCase())).size !== roster.length) {
    $('err-msg').textContent = 'Két játékosnak ne legyen ugyanaz a neve! 🐰';
    fx.buzz([12, 40, 12]);
    return;
  }

  $('err-msg').textContent = '';
  dealGame();
}

/* A menet indítása a már összeállt névsorral — ezt hívja
   az Indítás és a végképernyő „Még egy kört!" gombja is. */
function dealGame() {
  cards = buildDeck();
  ruleSet = buildRuleSet();
  curIdx = 0;
  kings = 0;
  stats = end.newStats(roster);
  notes.clear();

  players.renderChips(roster);
  deck.updateCup(0);
  deck.setDeckLayers(cards.length, DECK_SIZE);
  notes.render(openNoteEditor);

  // előbb látszódjon a képernyő, csak utána indítsanak az animációk
  show('game-screen');
  resetCard();
  updateTurn();

  keepAwake(true);
  fx.sfx.next();
}

/* ═══════════════════════════════
   KÖR
═══════════════════════════════ */
function updateTurn() {
  const p = roster[curIdx];
  const nameEl = $('turn-name');
  nameEl.textContent = `${p.emoji} ${p.name}`;
  nameEl.style.setProperty('--turn-color', p.color);
  replay(nameEl, 'is-changing');
  players.setActiveChip(curIdx);
}

function resetCard() {
  $('card-inner').classList.remove('flipped');
  $('card-wrap').classList.remove('no-click');
  $('card-slot').classList.remove('is-flipping');
  $('next-btn').disabled = true;
  notes.hideCtrl();
  deck.clearFront();
  deck.dealIn();
  flipped = false;
}

function flipCard() {
  if (flipped || !cards.length) return;
  flipped = true;

  const card = cards.pop();
  const rule = ruleSet[card.v];

  deck.renderFront(card, rule);
  end.record(stats, curIdx, rule);

  const slot = $('card-slot');
  slot.classList.add('is-flipping');
  $('card-inner').classList.add('flipped');
  $('card-wrap').classList.add('no-click');
  setTimeout(() => slot.classList.remove('is-flipping'), FLIP_MS * 0.55);

  fx.sfx.flip();
  fx.buzz(14);

  deck.setDeckLayers(cards.length, DECK_SIZE);

  /* ── tartós hatás ──
     A szabály azonosítójára figyelünk, nem a lapértékre:
     a szabályok minden játékban más lapra kerülnek. */
  if (rule.persist) {
    const n = notes.add(rule, roster[curIdx]);
    notes.render(openNoteEditor);
    if (n.kind !== 'self') {
      // csak akkor nyíljon meg, ha még mindig ez a kör tart
      setTimeout(() => { if (flipped) notes.openCtrl(rule.id, roster); }, FLIP_MS + 80);
    }
  }

  /* ── király ── */
  if (card.v === 'K') {
    kings++;
    setTimeout(() => {
      deck.updateCup(kings, { animate: true });
      fx.sfx.king();
      fx.buzz([18, 60, 18, 60, 30]);
      // a 4. királynál csak rázás — a leleplezésre semmi ne essen,
      // gyengébb telefonon a sok mozgó elem megakasztotta az oldalt
      if (kings >= 4) fx.shake($('game-screen'));
    }, FLIP_MS * 0.6);
  }

  if (kings >= 4) { setTimeout(() => endGame('kings'), 1600); return; }
  if (!cards.length) { setTimeout(() => endGame('deck'), 1600); return; }

  $('next-btn').disabled = false;
}

function nextTurn() {
  if (!flipped) return;
  curIdx = (curIdx + 1) % roster.length;
  resetCard();
  updateTurn();
  fx.sfx.next();
  fx.buzz(8);
}

/* ═══════════════════════════════
   VÉGE
═══════════════════════════════ */
function endGame(reason) {
  keepAwake(false);

  end.render({
    reason,
    roster,
    stats,
    loserIndex: curIdx,
    notesLeft: notes.notes.size,
  });

  show('end-screen');

  /* A negyedik királynál még van egy döntése: pörget, vagy megissza
     az alapot. Pakli-kifogyásnál nincs vesztes, tehát kerék sincs. */
  if (reason === 'kings') {
    $('end-stage').classList.remove('is-saved');
    $('end-actions').hidden = true;     // csak a nyugtázás után nyílik
    wheel.arm(roster, curIdx, applyWheelOutcome);
    fx.sfx.win();
  } else {
    wheel.hide();
    $('end-actions').hidden = false;    // itt nincs kit megvárni
    fx.sfx.end();
  }
}

/* „Megittam" — innentől indulhat új menet */
function confirmDrink() {
  $('drink-btn').hidden = true;
  const actions = $('end-actions');
  actions.hidden = false;
  actions.style.animation = 'endDrop .45s var(--spring) both';
  actions.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  fx.sfx.next();
  fx.buzz(12);
}

/* a kerék eredménye átírja a verdiktet — az a képernyő fő üzenete */
function applyWheelOutcome(outcome, pourer) {
  const verdict = $('end-verdict');
  const stage = $('end-stage');

  if (outcome === 'escape') {
    stage.classList.add('is-saved');
    verdict.innerHTML = `<b>Megúsztad.</b> A pohár marad, te meg röhögsz. 🎉`;
  } else if (outcome === 'extra') {
    stage.classList.remove('is-saved');
    verdict.innerHTML = pourer
      ? `Megy le a <b>King's Cup</b> — és ${pourer.emoji} <b>${pourer.name}</b> még tölt is bele. 💀`
      : `Megy le a <b>King's Cup</b> — még egy itallal megfejelve. 💀`;
    fx.shake(stage);
  } else {
    stage.classList.remove('is-saved');
    verdict.innerHTML = `Nem kockáztattál. <b>Megy le az alap.</b> 🍺`;
  }
}

/* ugyanaz a névsor, új pakli — a leggyakoribb kérés a menet végén */
function playAgain() {
  notes.clear();
  dealGame();
}

function newGame() {
  keepAwake(false);
  notes.clear();
  players.resetSetup();
  syncStartBtn();
  show('setup-screen');
}

/* ═══════════════════════════════
   CETLI-SZERKESZTÉS
═══════════════════════════════ */
function openNoteEditor(id) {
  notes.openCtrl(id, roster);
  const n = notes.get(id);
  if (n.kind === 'word') $('rule-word').focus();
  else $('rule-target').querySelector('.pick')?.focus();
}

/* ═══════════════════════════════
   BEKÖTÉS
═══════════════════════════════ */
function wire() {
  /* — setup — */
  players.setOnChange(syncStartBtn);
  $('add-btn').addEventListener('click', () => {
    if (document.querySelectorAll('.player-row').length >= 12) {
      $('err-msg').textContent = 'Tizenkét játékos a maximum — az már egy buli. 🎉';
      return;
    }
    players.addPlayerRow();
    fx.sfx.tap();
  });
  $('start-btn').addEventListener('click', startGame);

  /* — kártya: kattintás és billentyű — */
  const wrap = $('card-wrap');
  wrap.addEventListener('click', flipCard);
  wrap.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(); }
  });

  $('next-btn').addEventListener('click', nextTurn);

  /* — tartós szabályok beállítói — */
  $('rule-word').addEventListener('input', e => {
    const n = notes.get(e.target.dataset.id);
    if (!n) return;
    n.value = e.target.value.trim();
    notes.render(openNoteEditor);
  });
  $('rule-word').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.target.blur(); notes.hideCtrl(); }
  });
  $('rule-target').addEventListener('click', e => {
    const btn = e.target.closest('.pick');
    if (!btn) return;
    const n = notes.get(e.currentTarget.dataset.id);
    if (!n) return;
    n.value = btn.dataset.name;
    notes.render(openNoteEditor);
    fx.sfx.tap();
    fx.buzz(10);
    notes.hideCtrl();
  });

  /* — vége — */
  $('spin-btn').addEventListener('click', () => wheel.spin());
  $('decline-btn').addEventListener('click', () => wheel.decline());
  $('drink-btn').addEventListener('click', confirmDrink);
  $('again-btn').addEventListener('click', playAgain);
  $('new-btn').addEventListener('click', newGame);

  /* — téma és hang (mindkét képernyőn ugyanaz a két gomb) — */
  document.querySelectorAll('[data-action="theme"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = prefs.cycleTheme();
      syncToggleUI();
      btn.title = `Téma: ${t}`;
      fx.sfx.tap();
    });
  });
  document.querySelectorAll('[data-action="sound"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const on = !prefs.get('sound');
      prefs.set('sound', on);
      prefs.set('haptics', on);
      syncToggleUI();
      if (on) { fx.unlockAudio(); fx.sfx.tap(); }
    });
  });

  wireInfo();

  /* az AudioContext csak felhasználói gesztusra indulhat */
  addEventListener('pointerdown', () => fx.unlockAudio(), { once: true });

  /* gyorsbillentyűk asztali gépen */
  addEventListener('keydown', e => {
    if (!$('game-screen').classList.contains('active')) return;
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'Enter' && !$('next-btn').disabled) nextTurn();
  });
}

/* ═══════════════════════════════
   INFÓ SAROK
═══════════════════════════════ */
function wireInfo() {
  const btn = $('info-btn');
  const panel = $('info-panel');
  const handle = $('info-handle');

  const setOpen = open => {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(panel.hidden);
    fx.sfx.tap();
  });

  // a névre koppintva vágólapra kerül — így mindegy, melyik appban keres rá
  const hint = $('info-copy');
  const HINT_IDLE = '📋 bökj rá, kimásolom';

  handle.addEventListener('click', async e => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText('n_dom1n1k');
    } catch {
      // nincs vágólap-engedély (régi böngésző, nem biztonságos eredet):
      // legalább kijelöljük, hogy kézzel másolható legyen
      try {
        const range = document.createRange();
        range.selectNodeContents($('info-name'));
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        hint.textContent = '👆 jelöld ki és másold';
      } catch { /* ennyi tellett */ }
      return;
    }
    handle.classList.add('is-copied');
    hint.textContent = '✅ megvan, kimásoltam';
    fx.sfx.next();
    fx.buzz(10);
    setTimeout(() => {
      handle.classList.remove('is-copied');
      hint.textContent = HINT_IDLE;
    }, 1800);
  });

  panel.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => { if (!panel.hidden) setOpen(false); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); }
  });
}

function syncToggleUI() {
  const soundOn = prefs.get('sound');
  document.querySelectorAll('[data-action="sound"]').forEach(b => {
    b.textContent = soundOn ? '🔊' : '🔇';
    b.classList.toggle('is-off', !soundOn);
    b.setAttribute('aria-label', soundOn ? 'Hang kikapcsolása' : 'Hang bekapcsolása');
  });
  document.querySelectorAll('[data-action="theme"]').forEach(b => {
    b.textContent = prefs.themeIcon();
    b.setAttribute('aria-label', 'Téma váltása');
  });
}

/* ═══════════════════════════════
   INDULÁS
═══════════════════════════════ */
prefs.initTheme();
wire();
syncToggleUI();
players.resetSetup();    // mindig üres névsorral indulunk
syncStartBtn();
deck.initCardSizing();   // a ResizeObserver akkor mér, amikor a zóna láthatóvá válik
registerSW();
