// Almacenamiento local y canal entre ventanas del mismo navegador.
import { STORAGE_KEY } from './state.js';

function getLS() {
  try { const ls = window.localStorage; return ls || null; } catch { return null; }
}

/** Lee el guardado. status: empty | ok | corrupt | unavailable */
export function readSaved() {
  const ls = getLS();
  if (!ls) return { status: 'unavailable' };
  let raw;
  try { raw = ls.getItem(STORAGE_KEY); } catch { return { status: 'unavailable' }; }
  if (raw === null) return { status: 'empty' };
  try { return { status: 'ok', value: JSON.parse(raw), raw }; } catch { return { status: 'corrupt', raw }; }
}

/** Escribe el guardado. Devuelve true solo si se pudo escribir. */
export function writeSaved(obj) {
  const ls = getLS();
  if (!ls) return false;
  try { ls.setItem(STORAGE_KEY, JSON.stringify(obj)); return true; } catch { return false; }
}

/** Escucha cambios del guardado hechos por otras ventanas. */
export function onSavedChange(cb) {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || e.newValue === null) return;
    try { cb(JSON.parse(e.newValue)); } catch { /* ignorar */ }
  });
}

/** Canal local entre ventanas (BroadcastChannel); funciona aunque el almacenamiento falle. */
export function openChannel(onMessage) {
  if (typeof BroadcastChannel === 'undefined') return { post() {}, close() {} };
  let ch;
  try { ch = new BroadcastChannel(STORAGE_KEY); } catch { return { post() {}, close() {} }; }
  ch.onmessage = (e) => { if (e.data && typeof e.data === 'object') onMessage(e.data); };
  return { post(msg) { try { ch.postMessage(msg); } catch { /* ignorar */ } }, close() { ch.close(); } };
}
