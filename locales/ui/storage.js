// ui/storage.js — Storage abstraction: uses miniappsAI.storage when available,
// falls back to localStorage for external hosting.
// Call initStorage() once at startup before any storage access.

const _pending = [];

export function initStorage() {
  // Drain any queued calls once platform storage becomes available
  // (it's sync after DOMContentLoaded on miniapps)
}

function _isPlatform() {
  return !!window.miniappsAI?.storage;
}

// ----- localStorage fallback keys -----
const LS_PREFIX = 'pz_';

function lsGet(key) {
  try { return localStorage.getItem(LS_PREFIX + key); } catch { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(LS_PREFIX + key, value); } catch {}
}
function lsRemove(key) {
  try { localStorage.removeItem(LS_PREFIX + key); } catch {}
}

export async function getItem(key, opts) {
  if (_isPlatform()) {
    try { return await window.miniappsAI.storage.getItem(key, opts); } catch { return null; }
  }
  // In session mode, use sessionStorage
  if (opts?.area === 'session') {
    try { return sessionStorage.getItem(LS_PREFIX + key); } catch { return null; }
  }
  return lsGet(key);
}

export async function setItem(key, value, opts) {
  if (_isPlatform()) {
    try { return await window.miniappsAI.storage.setItem(key, value, opts); } catch {}
    return;
  }
  if (opts?.area === 'session') {
    try { sessionStorage.setItem(LS_PREFIX + key, value); } catch {}
    return;
  }
  lsSet(key, value);
}

export async function removeItem(key, opts) {
  if (_isPlatform()) {
    try { return await window.miniappsAI.storage.removeItem(key, opts); } catch {}
    return;
  }
  if (opts?.area === 'session') {
    try { sessionStorage.removeItem(LS_PREFIX + key); } catch {}
    return;
  }
  lsRemove(key);
}
