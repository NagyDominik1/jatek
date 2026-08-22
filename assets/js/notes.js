/* ═══════════════════════════════════════════════
   NOTES — tartós szabályok cetlijei

   A cetlik DOM-ját nem építjük újra minden körben:
   azonosító szerint összefésüljük a meglévőkkel, így
   csak az újonnan felkerülő cetli pattan be — a régiek
   nyugton maradnak a „falon".
═══════════════════════════════════════════════ */

import { $, esc, el } from './dom.js';

export const notes = new Map();   // ruleId → note

export function clear() { notes.clear(); }

export function add(rule, owner) {
  const n = {
    id: rule.id,
    emoji: rule.persist.emoji,
    label: rule.persist.label,
    kind: rule.persist.pick,
    sub: rule.persist.sub || '',
    ph: rule.persist.ph || '',
    by: owner,
    value: '',
  };
  notes.set(rule.id, n);
  return n;
}

export function get(id) { return notes.get(id); }

/* ───────────────────────────────
   RENDER (összefésülő)
─────────────────────────────── */
export function render(onEdit) {
  const box = $('effects');
  const seen = new Set();
  let i = 0;

  for (const n of notes.values()) {
    seen.add(n.id);
    let node = box.querySelector(`[data-note="${CSS.escape(n.id)}"]`);
    const fresh = !node;

    if (fresh) {
      node = el('div');
      node.dataset.note = n.id;
      node.innerHTML =
        '<div class="note-label"></div><div class="note-word"></div><div class="note-by"></div>';
      box.appendChild(node);
    }

    const editable = n.kind !== 'self';
    node.className = `note note-${i % 2 ? 'b' : 'a'}${editable ? ' note-edit' : ''}${fresh ? ' is-new' : ''}`;
    node.style.setProperty('--note-tint', n.by.color);

    if (editable) {
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      node.title = 'Koppints a módosításhoz';
      if (fresh) {
        const open = () => onEdit(n.id);
        node.addEventListener('click', open);
        node.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      }
    }

    const who = `${n.by.emoji} ${esc(n.by.name)}`;
    let main, sub;
    if (n.kind === 'self') {
      main = who;
      sub = n.sub;
    } else if (n.kind === 'player') {
      main = `${who} <span class="note-x">↔</span> ${n.value ? esc(n.value) : '?'}`;
      sub = n.sub;
    } else {
      main = n.value ? esc(n.value) : '…';
      sub = `${who} szabálya`;
    }

    node.children[0].textContent = `${n.label} ${n.emoji}`;
    node.children[1].innerHTML = main;
    node.children[2].innerHTML = sub;

    if (fresh) node.addEventListener('animationend', () => node.classList.remove('is-new'), { once: true });
    i++;
  }

  // ami kikerült az állapotból, tűnjön el a falról is
  [...box.children].forEach(node => {
    if (!seen.has(node.dataset.note)) node.remove();
  });
}

/* ───────────────────────────────
   BEÁLLÍTÓ (szövegdoboz vagy játékosválasztó)
─────────────────────────────── */
export function openCtrl(id, players) {
  const n = notes.get(id);
  const word = $('rule-word');
  const sel = $('rule-target');
  word.classList.add('hidden');
  sel.classList.add('hidden');
  if (!n || n.kind === 'self') return;

  if (n.kind === 'word') {
    word.value = n.value;
    word.placeholder = n.ph;
    word.dataset.id = id;
    word.classList.remove('hidden');
    setTimeout(() => word.focus(), 60);
  } else {
    /* Natív <select> helyett koppintható arcok.
       A legördülő popupját a böngésző rajzolja, sötét témában
       világos háttéren világos szöveggel — olvashatatlan volt.
       Ez ráadásul gyorsabb is: egy koppintás, nem kettő. */
    sel.dataset.id = id;
    sel.innerHTML =
      '<div class="rule-pick-label">Kit választasz társnak? 🤝</div>'
      + '<div class="rule-pick-row">'
      + players
        .filter(p => p.name !== n.by.name)
        .map(p => `
          <button type="button" class="pick${p.name === n.value ? ' is-picked' : ''}"
                  data-name="${esc(p.name)}" style="--who:${p.color}">
            <span class="pick-face">${p.emoji}</span>
            <span class="pick-name">${esc(p.name)}</span>
          </button>`)
        .join('')
      + '</div>';
    sel.classList.remove('hidden');
  }
}

export function hideCtrl() {
  $('rule-word').classList.add('hidden');
  $('rule-target').classList.add('hidden');
}
