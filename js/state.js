// Estado de contenido de la sesión: modelo, validación y deshacer.
// Módulo puro (sin DOM) para poder probarlo también con Node.

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'sitio67:mapa:v1';
export const FLOOR_IDS = ['S', 'N1', 'N2', 'N3'];
export const PASS_VALUES = ['unverified', 'open', 'blocked'];
export const MAP_W = 1000;
export const MAP_H = 665;
export const LABEL_MAX = 120;
export const MAX_ANNOTATIONS = 300;
export const UNDO_LIMIT = 20;

export const PASS_TEXT = { unverified: 'Sin verificar', open: 'Transitable', blocked: 'Bloqueado' };

export function initialContent() {
  return {
    elements: {},
    marker: { placed: false, visible: true, floor: 'S', x: 500, y: 305 },
    blocks: [],
    passages: [],
  };
}

export function initialPrefs() {
  return { floor: 'S', showCard: false, shareFrame: true, showLegend: true, scenario: null };
}

export function clone(v) { return JSON.parse(JSON.stringify(v)); }

export function elementState(content, id) {
  const s = content.elements[id];
  return {
    pass: s && s.pass ? s.pass : 'unverified',
    contaminated: !!(s && s.contaminated),
    label: s && s.label ? s.label : '',
  };
}

/** Devuelve un nuevo contenido con el estado de un elemento modificado (sin mutar). */
export function withElementState(content, id, patch) {
  const next = clone(content);
  const cur = elementState(content, id);
  const merged = { ...cur, ...patch };
  merged.label = cleanLabel(merged.label);
  if (merged.pass === 'unverified' && !merged.contaminated && !merged.label) delete next.elements[id];
  else next.elements[id] = merged;
  return next;
}

export function cleanLabel(s) {
  return String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, LABEL_MAX);
}

let idCounter = 0;
export function newId(prefix) {
  idCounter = (idCounter + 1) % 1e6;
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}${rnd}`.slice(0, 40);
}

export function clampPoint(x, y) {
  return { x: Math.min(MAP_W, Math.max(0, round1(x))), y: Math.min(MAP_H, Math.max(0, round1(y))) };
}
function round1(n) { return Math.round(n * 10) / 10; }

// ---------------------------------------------------------------- validación

function isNum(n) { return typeof n === 'number' && Number.isFinite(n); }
function inX(n) { return isNum(n) && n >= 0 && n <= MAP_W; }
function inY(n) { return isNum(n) && n >= 0 && n <= MAP_H; }
function isPlainObject(o) { return o !== null && typeof o === 'object' && !Array.isArray(o); }
const ANN_ID = /^[a-z][a-z0-9-]{0,39}$/;
export const SCENARIO_ID = /^[a-z][a-z0-9-]{0,29}$/;

/**
 * Valida un objeto guardado/exportado y devuelve {ok, errors, data}.
 * data es una copia limpia que solo contiene campos conocidos.
 * statefulIds: Set de IDs de elementos que admiten estado.
 */
export function validateSave(raw, { statefulIds, mapVersion }) {
  const errors = [];
  const fail = (m) => { errors.push(m); };
  if (!isPlainObject(raw)) return { ok: false, errors: ['El archivo no contiene un objeto JSON.'] };
  if (raw.schemaVersion !== SCHEMA_VERSION) fail(`Versión de esquema incompatible (${JSON.stringify(raw.schemaVersion)}; se esperaba ${SCHEMA_VERSION}).`);
  if (raw.mapVersion !== mapVersion) fail(`Versión de mapa incompatible (${JSON.stringify(raw.mapVersion)}; se esperaba "${mapVersion}").`);
  if (errors.length) return { ok: false, errors };

  const c = raw.content;
  if (!isPlainObject(c)) return { ok: false, errors: ['Falta el bloque «content».'] };
  const out = initialContent();

  // estados por elemento
  if (!isPlainObject(c.elements)) fail('«elements» debe ser un objeto.');
  else {
    const keys = Object.keys(c.elements);
    if (keys.length > 2000) fail('Demasiados estados de elemento.');
    for (const id of keys) {
      if (!statefulIds.has(id)) { fail(`ID de elemento desconocido: ${String(id).slice(0, 40)}`); continue; }
      const s = c.elements[id];
      if (!isPlainObject(s)) { fail(`Estado inválido en ${id}.`); continue; }
      if (!PASS_VALUES.includes(s.pass)) { fail(`Paso inválido en ${id}.`); continue; }
      if (typeof s.contaminated !== 'boolean') { fail(`Contaminación inválida en ${id}.`); continue; }
      if (typeof s.label !== 'string' || s.label.length > LABEL_MAX) { fail(`Etiqueta inválida en ${id}.`); continue; }
      const label = cleanLabel(s.label);
      if (s.pass !== 'unverified' || s.contaminated || label) out.elements[id] = { pass: s.pass, contaminated: s.contaminated, label };
    }
  }

  // marcador
  const m = c.marker;
  if (!isPlainObject(m)) fail('Falta el marcador.');
  else if (typeof m.placed !== 'boolean' || typeof m.visible !== 'boolean' || !FLOOR_IDS.includes(m.floor) || !inX(m.x) || !inY(m.y)) {
    fail('Marcador inválido (planta o coordenadas fuera de rango).');
  } else out.marker = { placed: m.placed, visible: m.visible, floor: m.floor, x: m.x, y: m.y };

  const seen = new Set();
  const checkAnnId = (id, what) => {
    if (typeof id !== 'string' || !ANN_ID.test(id)) { fail(`${what}: ID inválido.`); return false; }
    if (seen.has(id) || statefulIds.has(id)) { fail(`${what}: ID duplicado ${id}.`); return false; }
    seen.add(id); return true;
  };
  const checkLabel = (l, what) => {
    if (l === undefined) return '';
    if (typeof l !== 'string' || l.length > LABEL_MAX) { fail(`${what}: etiqueta inválida.`); return null; }
    return cleanLabel(l);
  };

  if (!Array.isArray(c.blocks)) fail('«blocks» debe ser una lista.');
  else if (c.blocks.length > MAX_ANNOTATIONS) fail('Demasiados bloqueos.');
  else for (const b of c.blocks) {
    if (!isPlainObject(b)) { fail('Bloqueo inválido.'); continue; }
    if (!checkAnnId(b.id, 'Bloqueo')) continue;
    if (!FLOOR_IDS.includes(b.floor) || !inX(b.x) || !inY(b.y)) { fail(`Bloqueo ${b.id}: planta o coordenadas fuera de rango.`); continue; }
    const label = checkLabel(b.label, `Bloqueo ${b.id}`); if (label === null) continue;
    out.blocks.push({ id: b.id, floor: b.floor, x: b.x, y: b.y, label });
  }

  if (!Array.isArray(c.passages)) fail('«passages» debe ser una lista.');
  else if (c.passages.length > MAX_ANNOTATIONS) fail('Demasiados pasos descubiertos.');
  else for (const p of c.passages) {
    if (!isPlainObject(p) || !isPlainObject(p.a) || !isPlainObject(p.b)) { fail('Paso descubierto inválido.'); continue; }
    if (!checkAnnId(p.id, 'Paso')) continue;
    if (!FLOOR_IDS.includes(p.floor) || !inX(p.a.x) || !inY(p.a.y) || !inX(p.b.x) || !inY(p.b.y)) { fail(`Paso ${p.id}: planta o coordenadas fuera de rango.`); continue; }
    const label = checkLabel(p.label, `Paso ${p.id}`); if (label === null) continue;
    out.passages.push({ id: p.id, floor: p.floor, a: { x: p.a.x, y: p.a.y }, b: { x: p.b.x, y: p.b.y }, label });
  }

  // preferencias (opcionales; si son inválidas se usan las predeterminadas)
  const prefs = initialPrefs();
  if (isPlainObject(raw.prefs)) {
    if (FLOOR_IDS.includes(raw.prefs.floor)) prefs.floor = raw.prefs.floor;
    for (const k of ['showCard', 'shareFrame', 'showLegend']) if (typeof raw.prefs[k] === 'boolean') prefs[k] = raw.prefs[k];
    if (typeof raw.prefs.scenario === 'string' && SCENARIO_ID.test(raw.prefs.scenario)) prefs.scenario = raw.prefs.scenario;
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, errors: [], data: { content: out, prefs, savedAt: typeof raw.savedAt === 'string' ? raw.savedAt.slice(0, 40) : null } };
}

export function buildSave({ content, prefs, published, mapVersion }) {
  const o = { schemaVersion: SCHEMA_VERSION, mapVersion, savedAt: new Date().toISOString(), content: clone(content), prefs: clone(prefs) };
  if (published) o.published = clone(published);
  return o;
}

export function summarize(content) {
  const el = Object.values(content.elements);
  return {
    open: el.filter((s) => s.pass === 'open').length,
    blocked: el.filter((s) => s.pass === 'blocked').length,
    contaminated: el.filter((s) => s.contaminated).length,
    labels: el.filter((s) => s.label).length,
    blocks: content.blocks.length,
    passages: content.passages.length,
    marker: content.marker.placed ? content.marker.floor : null,
  };
}

// ---------------------------------------------------------------- deshacer

export class History {
  constructor(limit = UNDO_LIMIT) { this.limit = limit; this.stack = []; }
  push(snapshot) { this.stack.push(clone(snapshot)); if (this.stack.length > this.limit) this.stack.shift(); }
  pop() { return this.stack.pop() || null; }
  clear() { this.stack = []; }
  get size() { return this.stack.length; }
}
