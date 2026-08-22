/* ═══════════════════════════════════════════════
   PLAYERS — avatarok, névbevitel, zsetonsor

   Minden játékos kap egy emojit és egy színt, így a
   köröket nem egy szövegsorból, hanem ránézésre lehet
   követni — ez a legolcsóbb módja, hogy a játékosok
   karakterré váljanak.
═══════════════════════════════════════════════ */

import { $, el } from './dom.js';
import * as fx from './fx.js';

const EMOJIS = [
  '🦆', '🐰', '🦊', '🐸', '🐨', '🐼', '🦉', '🐷',
  '🐵', '🦁', '🐯', '🐻', '🐺', '🦝', '🐹', '🦄',
];

const COLORS = [
  'var(--cat-drink)', 'var(--cat-rule)', 'var(--cat-round)',
  'var(--cat-social)', 'var(--cat-duel)', 'var(--cat-king)',
];

export function colorFor(i) { return COLORS[i % COLORS.length]; }

/* ───────────────────────────────
   SETUP — játékos-sorok
─────────────────────────────── */
function usedEmojis() {
  return [...document.querySelectorAll('.avatar')].map(a => a.textContent);
}

function freeEmoji() {
  const used = usedEmojis();
  return EMOJIS.find(e => !used.includes(e))
      || EMOJIS[(Math.random() * EMOJIS.length) | 0];
}

export function addPlayerRow({ name = '', emoji = null, focus = true } = {}) {
  const wrap = $('players-wrap');
  const index = wrap.children.length;

  const row = el('div', 'player-row');

  const avatar = el('button', 'avatar', emoji || freeEmoji());
  avatar.type = 'button';
  avatar.style.setProperty('--av-color', colorFor(index));
  avatar.title = 'Koppints másik állatért';
  avatar.setAttribute('aria-label', 'Avatar cseréje');
  avatar.addEventListener('click', () => {
    const used = usedEmojis().filter(e => e !== avatar.textContent);
    const pool = EMOJIS.filter(e => !used.includes(e));
    const cur = pool.indexOf(avatar.textContent);
    avatar.textContent = pool[(cur + 1) % pool.length];
    avatar.classList.remove('is-rolling');
    void avatar.offsetWidth;
    avatar.classList.add('is-rolling');
    fx.sfx.tap();
    fx.buzz(8);
  });

  const input = el('input', 'field player-input');
  input.type = 'text';
  input.value = name;
  input.placeholder = `Játékos ${index + 1} neve…`;
  input.maxLength = 20;
  input.autocomplete = 'off';
  input.enterKeyHint = 'next';
  input.addEventListener('input', () => onChange?.());
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const rows = [...document.querySelectorAll('.player-input')];
    const next = rows[rows.indexOf(input) + 1];
    if (next) next.focus();
    else if (rows.length < 12) addPlayerRow();
    else input.blur();
  });

  const rm = el('button', 'rm-btn', '✕');
  rm.type = 'button';
  rm.title = 'Törlés';
  rm.setAttribute('aria-label', `${index + 1}. játékos törlése`);
  rm.addEventListener('click', () => {
    if (document.querySelectorAll('.player-row').length <= 2) {
      input.value = '';
      input.focus();
      onChange?.();
      return;
    }
    row.classList.add('is-leaving');
    row.addEventListener('animationend', () => {
      row.remove();
      renumber();
      onChange?.();
    }, { once: true });
    fx.buzz(8);
  });

  row.append(avatar, input, rm);
  wrap.appendChild(row);
  if (focus && !name) input.focus();
  onChange?.();
  return row;
}

/* törlés után a placeholderek és a színek újraszámozódnak */
function renumber() {
  [...document.querySelectorAll('.player-row')].forEach((row, i) => {
    const input = row.querySelector('.player-input');
    if (!input.value) input.placeholder = `Játékos ${i + 1} neve…`;
    row.querySelector('.avatar').style.setProperty('--av-color', colorFor(i));
    row.querySelector('.rm-btn').setAttribute('aria-label', `${i + 1}. játékos törlése`);
  });
}

let onChange = null;
export function setOnChange(fn) { onChange = fn; }

export function readPlayers() {
  return [...document.querySelectorAll('.player-row')]
    .map((row, i) => ({
      name: row.querySelector('.player-input').value.trim(),
      emoji: row.querySelector('.avatar').textContent,
      color: colorFor(i),
    }))
    .filter(p => p.name);
}

export function resetSetup(saved = []) {
  $('players-wrap').innerHTML = '';
  const seed = saved.length >= 2 ? saved : [{}, {}];
  seed.slice(0, 12).forEach((p, i) =>
    addPlayerRow({ name: p.name || '', emoji: p.emoji || null, focus: i === 0 && !p.name }));
}

/* ───────────────────────────────
   ZSETONSOR
   Egyszer épül fel, utána csak az aktív jelölés
   vándorol — így a CSS-átmenet végig sima marad.
─────────────────────────────── */
export function renderChips(players) {
  const box = $('chips');
  box.innerHTML = '';
  players.forEach(p => {
    const chip = el('div', 'chip');
    chip.style.setProperty('--chip-color', p.color);
    chip.append(el('div', 'chip-face', p.emoji), el('div', 'chip-name', p.name));
    chip.title = p.name;
    box.appendChild(chip);
  });
}

export function setActiveChip(index) {
  const chips = [...$('chips').children];
  chips.forEach((c, i) => c.classList.toggle('active', i === index));
  chips[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}
