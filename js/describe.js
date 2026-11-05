// Descripción pública de una selección (compartida entre panel y transmisión).
import { elementState, PASS_TEXT, FLOOR_IDS, MAP_W, MAP_H } from './state.js';
import { el } from './ui.js';

export const KIND_TEXT = {
  room: 'Sala', route: 'Tramo de ruta', transport: 'Medio de paso vertical', core: 'Conexión vertical', terminal: 'Terminal de referencia',
};
const GROUP_TEXT = { access: 'Acceso de sala', corridor: 'Pasillo principal', entry: 'Entrada a núcleo', pm: 'Pasillo de mantenimiento', vial: 'Vial perimetral', e: 'Conexión E', pt: 'Conexión PT', service: 'Entrada de servicio' };

export function floorLabel(data, f) { return data.floorById.get(f)?.name || f; }

/** Modelo de ficha para un ID de elemento o anotación. */
export function describe(data, content, id) {
  if (!id) return null;
  const e = data.byId.get(id);
  if (e) {
    const m = { id, floor: e.floor, kind: e.kind, title: e.kind === 'room' ? `${e.code} · ${e.name}` : e.name, desc: e.desc,
      kindText: e.kind === 'route' ? GROUP_TEXT[e.group] || KIND_TEXT.route : KIND_TEXT[e.kind], stateful: data.stateful.has(id) };
    if (m.stateful) Object.assign(m, elementState(content, id));
    if (e.kind === 'core') m.parts = e.parts.map((pid) => ({ id: pid, name: data.byId.get(pid).name, ...elementState(content, pid) }));
    return m;
  }
  const b = content.blocks.find((x) => x.id === id);
  if (b) return { id, floor: b.floor, kind: 'block', title: 'Bloqueo puntual', kindText: 'Anotación', desc: 'Obstrucción marcada por el director en este punto.', label: b.label };
  const p = content.passages.find((x) => x.id === id);
  if (p) return { id, floor: p.floor, kind: 'passage', title: 'Paso descubierto', kindText: 'Anotación', desc: 'Conexión observada (tabique abierto o atajo). No garantiza transitabilidad.', label: p.label };
  return null;
}

export function passBadge(pass) {
  const sym = pass === 'open' ? '✓' : pass === 'blocked' ? '✕' : '?';
  return el('span', { class: `pill pill-${pass}` }, `${sym} ${PASS_TEXT[pass]}`);
}
export function contBadge(c, short = false) {
  if (short) return c ? el('span', { class: 'pill pill-cont' }, '◆ Confirmada') : el('span', { class: 'pill pill-none' }, '– No registrada');
  return c ? el('span', { class: 'pill pill-cont' }, '◆ Contaminación confirmada') : el('span', { class: 'pill pill-none' }, '– Contaminación no registrada');
}

/** Nodos de ficha pública (sin controles). */
export function publicCardNodes(data, model) {
  const out = [el('div', { class: 'pc-kind' }, `${model.kindText} · ${floorLabel(data, model.floor)}`), el('h3', { class: 'pc-title' }, model.title), el('p', { class: 'pc-desc' }, model.desc)];
  if (model.stateful) {
    out.push(el('div', { class: 'pc-state' }, el('span', { class: 'pc-k' }, 'Paso actual'), passBadge(model.pass)));
    out.push(el('div', { class: 'pc-state' }, el('span', { class: 'pc-k' }, 'Contaminación'), contBadge(model.contaminated, true)));
  }
  if (model.parts) {
    out.push(el('ul', { class: 'pc-parts' }, model.parts.map((p) => el('li', {}, el('span', {}, p.name), passBadge(p.pass), p.contaminated ? contBadge(true) : null))));
  }
  if (model.label) out.push(el('p', { class: 'pc-label' }, `«${model.label}»`));
  return out;
}

/** Valida el bloque «published» recibido por la vista de jugadores. */
export function cleanPublished(pub, data, content) {
  const out = { floor: 'S', frame: null, cardId: null, showLegend: true };
  if (!pub || typeof pub !== 'object') return out;
  if (FLOOR_IDS.includes(pub.floor)) out.floor = pub.floor;
  const f = pub.frame;
  if (f && [f.cx, f.cy, f.w, f.h].every((n) => typeof n === 'number' && Number.isFinite(n))
    && f.w > 1 && f.h > 1 && f.w < MAP_W * 10 && f.h < MAP_H * 10 && Math.abs(f.cx) < MAP_W * 3 && Math.abs(f.cy) < MAP_H * 3) out.frame = { cx: f.cx, cy: f.cy, w: f.w, h: f.h };
  if (typeof pub.cardId === 'string' && describe(data, content, pub.cardId)) out.cardId = pub.cardId;
  if (typeof pub.showLegend === 'boolean') out.showLegend = pub.showLegend;
  return out;
}
