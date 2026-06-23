// ui/i18n.js — Self-contained i18n for external hosting compatibility
// Uses platform miniappI18n when available, falls back to locales/*.json

let _catalog = null;
let _ready = false;

export async function initI18n() {
  if (window.miniappI18n) {
    _ready = true;
    return;
  }
  try {
    const resp = await fetch('locales/fr.json');
    if (resp.ok) _catalog = await resp.json();
  } catch {}
  _ready = true;
  applyToDOM();
}

function getVal(key) {
  if (!_catalog) return null;
  const parts = key.split('.');
  let cur = _catalog;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return null;
  }
  return typeof cur === 'string' ? cur : null;
}

export function t(key, values) {
  if (window.miniappI18n) return window.miniappI18n.t(key, values);
  let str = getVal(key) ?? key;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

export function applyToDOM(root) {
  if (window.miniappI18n) return;
  const el = root || document;
  el.querySelectorAll('[data-i18n]').forEach(n => {
    n.textContent = t(n.getAttribute('data-i18n'));
  });
  ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
    el.querySelectorAll(`[data-i18n-${attr}]`).forEach(n => {
      n.setAttribute(attr, t(n.getAttribute(`data-i18n-${attr}`)));
    });
  });
}
