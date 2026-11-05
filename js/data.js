// Carga de datos estáticos: plantas, salas, rutas y planos SVG originales.

const SVG_NS = 'http://www.w3.org/2000/svg';

async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
  return r.json();
}

async function getSVG(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
  const txt = await r.text();
  const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName !== 'svg' || doc.getElementsByTagName('parsererror').length) throw new Error(`Plano inválido: ${url}`);
  // Saneado defensivo: los planos son locales, pero no se aceptan scripts ni manejadores.
  root.querySelectorAll('script, foreignObject').forEach((n) => n.remove());
  for (const n of [root, ...root.querySelectorAll('*')]) {
    for (const a of [...n.attributes]) {
      if (/^on/i.test(a.name)) n.removeAttribute(a.name);
      if (/href$/i.test(a.name) && !a.value.startsWith('#')) n.removeAttribute(a.name);
    }
  }
  return root;
}

export async function loadData() {
  const [roomsDoc, routesDoc] = await Promise.all([getJSON('data/rooms.json'), getJSON('data/routes.json')]);
  const floors = roomsDoc.floors;
  const svgs = await Promise.all(floors.map((f) => getSVG(f.svg)));
  const elements = [
    ...roomsDoc.rooms.map((r) => ({ ...r, kind: 'room' })),
    ...routesDoc.routes,
  ];
  const byId = new Map(elements.map((e) => [e.id, e]));
  const stateful = new Set(elements.filter((e) => e.kind === 'room' || e.kind === 'route' || e.kind === 'transport').map((e) => e.id));
  const floorById = new Map(floors.map((f, i) => [f.id, { ...f, svgNode: svgs[i] }]));
  return { floors: floors.map((f) => floorById.get(f.id)), floorById, elements, byId, stateful, mapVersion: routesDoc.mapVersion, SVG_NS };
}

export function elementsOnFloor(data, floor) {
  return data.elements.filter((e) => e.floor === floor);
}

export function isStateful(data, id) { return data.stateful.has(id); }

/** Punto de referencia (centro) de la geometría de un elemento. */
export function centerOf(el) {
  const s = el.shape;
  if (s.type === 'rect') return [s.x + s.w / 2, s.y + s.h / 2];
  if (s.type === 'circle') return [s.cx, s.cy];
  const pts = s.points; const i = Math.max(0, Math.floor((pts.length - 2) / 2));
  const a = pts[i]; const b = pts[i + 1] || a;
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
