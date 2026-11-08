// Estado de los escenarios tácticos: guardado propio en localStorage y saneado al leer o importar.
// Módulo puro (sin DOM salvo localStorage) para poder probarlo con Node.
import { blankScenarioState, AGENTS, EXTRA_TYPES } from './engine.js';

export const TAC_KEY = 'sitio67:tactico:v1';
export const TAC_VERSION = 1;
const AGENT_CODES = new Set(AGENTS.map((a) => a[0]));
const isObj = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
const isCell = (p) => isObj(p) && Number.isInteger(p.c) && Number.isInteger(p.r) && p.c >= 1 && p.r >= 1 && p.c <= 64 && p.r <= 64;
const KEY_RE = /^[a-z0-9áéíóúñ_|:{}"\[\],.-]{1,120}$/i;

export function blankStore() { return { v: TAC_VERSION, scen: {}, flags: { hideEnemies: false }, shared: { hp: {} } }; }

/** Sanea un objeto leído o importado. scenarioIds: Set de IDs válidos. Devuelve siempre un almacén válido. */
export function sanitizeStore(raw, scenarioIds) {
  const out = blankStore();
  if (!isObj(raw) || raw.v !== TAC_VERSION) return out;
  if (isObj(raw.flags)) out.flags.hideEnemies = raw.flags.hideEnemies === true;
  if (isObj(raw.shared) && isObj(raw.shared.hp)) for (const [k, v] of Object.entries(raw.shared.hp)) if (/^[a-z0-9-]{1,20}$/.test(k) && Number.isInteger(v) && v >= 0 && v <= 99999) out.shared.hp[k] = v;
  if (!isObj(raw.scen)) return out;
  for (const [id, s] of Object.entries(raw.scen)) {
    if (!scenarioIds.has(id) || !isObj(s)) continue;
    const t = blankScenarioState();
    if (isObj(s.states)) for (const [k, v] of Object.entries(s.states)) if (KEY_RE.test(k) && typeof v === 'string' && v.length <= 40) t.states[k] = v;
    if (isObj(s.cs)) for (const [k, v] of Object.entries(s.cs)) if (KEY_RE.test(k) && isObj(v)) t.cs[k] = { rev: v.rev === true, down: v.down === true };
    if (isObj(s.pos)) for (const [k, v] of Object.entries(s.pos)) if (KEY_RE.test(k) && isCell(v)) t.pos[k] = { c: v.c, r: v.r };
    if (isObj(s.inv)) for (const [k, v] of Object.entries(s.inv)) if (KEY_RE.test(k) && Number.isInteger(v) && v >= 0 && v <= 999) t.inv[k] = v;
    if (isObj(s.agents)) for (const [k, v] of Object.entries(s.agents)) if (AGENT_CODES.has(k) && isCell(v)) t.agents[k] = { c: v.c, r: v.r };
    if (isObj(s.layers)) for (const [k, v] of Object.entries(s.layers)) if (KEY_RE.test(k) && typeof v === 'boolean') t.layers[k] = v;
    if (Array.isArray(s.extra)) for (const x of s.extra.slice(0, 60)) if (isObj(x) && /^x[a-z0-9]{1,16}$/.test(x.id) && EXTRA_TYPES[x.type] && /^E\d{1,3}$/.test(x.code) && isCell(x)) t.extra.push({ id: x.id, type: x.type, code: x.code, c: x.c, r: x.r });
    out.scen[id] = t;
  }
  return out;
}

/** Envoltorio con acceso por escenario. */
export function wrapStore(data) {
  return {
    data,
    scen(id) { if (!data.scen[id]) data.scen[id] = blankScenarioState(); return data.scen[id]; },
    get flags() { return data.flags; },
    get shared() { return data.shared; },
  };
}

export function readTactical(scenarioIds) {
  try { const raw = localStorage.getItem(TAC_KEY); return sanitizeStore(raw ? JSON.parse(raw) : null, scenarioIds); } catch { return blankStore(); }
}
export function writeTactical(data) { try { localStorage.setItem(TAC_KEY, JSON.stringify(data)); return true; } catch { return false; } }
