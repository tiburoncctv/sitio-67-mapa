// Pruebas de unidad de los escenarios tácticos (Node ≥ 18): node --test tests/tactico.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../js/tactico/registro.js';
import { sanitizeStore, blankStore } from '../js/tactico/store.js';
import { AGENTS, OBJ } from '../js/tactico/engine.js';

const ids = new Set(SCENARIOS.map((s) => s.id));

test('siete escenarios con plantas y salas del plano general', () => {
  assert.deepEqual([...ids].sort(), ['archivo', 'armeria', 'bombas', 'camara', 'enfermeria', 'laboratorios', 'superficie']);
  for (const s of SCENARIOS) { assert.ok(['S', 'N1', 'N2', 'N3'].includes(s.floor), s.id); assert.ok(s.rooms.length > 0, s.id); }
});

test('Beta-7 tiene seis iconos, incluidos TE y D, y ninguno se coloca solo', () => {
  assert.deepEqual(AGENTS.map((a) => a[0]), ['C', 'M', 'L', 'T', 'TE', 'D']);
  assert.deepEqual(blankStore().scen, {});
});

test('las huellas de contactos caben en la cuadrícula y no pisan mobiliario', () => {
  for (const s of SCENARIOS) {
    const occ = new Set();
    for (const o of s.items) if (o.t === 'obj' && OBJ[o.k] && OBJ[o.k].c !== 'deco' && o.layer !== 'objetivos') for (let c = o.c; c < o.c + (o.w || 1); c++) for (let r = o.r; r < o.r + (o.h || 1); r++) occ.add(`${c},${r}|${JSON.stringify(o.when || null)}`);
    for (const k of s.contacts) {
      if (k.kind === 'item' || k.kind === 'obj') continue;
      for (let c = k.c; c < k.c + (k.w || 1); c++) for (let r = k.r; r < k.r + (k.h || 1); r++) {
        assert.ok(c >= 1 && r >= 1 && c <= s.cols && r <= s.rows, `${s.id}/${k.id} fuera de la cuadrícula`);
        assert.ok(!occ.has(`${c},${r}|null`), `${s.id}/${k.id} sobre mobiliario en ${c},${r}`);
      }
    }
  }
});

test('el almacén táctico descarta escenarios, agentes y valores desconocidos', () => {
  const out = sanitizeStore({ v: 1, scen: { camara: { agents: { C: { c: 2, r: 3 }, X: { c: 1, r: 1 }, TE: { c: 0, r: 1 } }, pos: { mc: { c: 1.5, r: 2 } }, inv: { a: -1 }, cs: { mc: { rev: 'sí' } } }, malicioso: {} }, flags: { hideEnemies: 1 }, shared: { hp: { mc: 120, x: 'a' } } }, ids);
  assert.deepEqual(Object.keys(out.scen), ['camara']);
  assert.deepEqual(out.scen.camara.agents, { C: { c: 2, r: 3 } });
  assert.deepEqual(out.scen.camara.pos, {});
  assert.deepEqual(out.scen.camara.inv, {});
  assert.deepEqual(out.scen.camara.cs, { mc: { rev: false, down: false } });
  assert.equal(out.flags.hideEnemies, false);
  assert.deepEqual(out.shared.hp, { mc: 120 });
  assert.deepEqual(sanitizeStore('basura', ids), blankStore());
});

test('stock de la armería según la última especificación', () => {
  const a = SCENARIOS.find((s) => s.id === 'armeria');
  const q = Object.fromEntries(a.contacts.filter((k) => k.kind === 'item').map((k) => [k.name, k.qty]));
  assert.deepEqual(q, { 'Carabina compacta de reserva': 1, 'Fusil de reconocimiento de reserva': 1, 'Lanzador de contención ÍGNEO': 1, 'Botiquín de campo': 6, 'Botiquín de trauma': 2, 'Placa reforzada': 4, 'Granada incendiaria': 3, 'Granada de humo': 3, 'Espuma de sellado': 2, 'Carga térmica portátil': 2, 'Carga incendiaria potenciada': 4, 'Cable de rescate': 1, 'Visor térmico': 1, 'Dron de reconocimiento': 1 });
});

test('sanitizeStore conserva amenazas añadidas válidas y descarta las corruptas', () => {
  const raw = blankStore();
  raw.scen.camara = { extra: [
    { id: 'xabc1', type: 'errante', code: 'E1', c: 3, r: 4 },
    { id: 'xabc2', type: 'dragón', code: 'E2', c: 3, r: 4 },
    { id: 'malo', type: 'corredor', code: 'E3', c: 3, r: 4 },
    { id: 'xabc4', type: 'ariete', code: 'Z9', c: 3, r: 4 },
  ] };
  const out = sanitizeStore(raw, new Set(['camara']));
  assert.deepEqual(out.scen.camara.extra.map((x) => x.id), ['xabc1']);
});
