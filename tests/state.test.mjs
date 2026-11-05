// Pruebas de unidad del modelo (Node ≥ 18): node --test tests/state.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initialContent, initialPrefs, withElementState, validateSave, buildSave, History, elementState } from '../js/state.js';

const routes = JSON.parse(fs.readFileSync(new URL('../data/routes.json', import.meta.url)));
const rooms = JSON.parse(fs.readFileSync(new URL('../data/rooms.json', import.meta.url)));
const stateful = new Set([...rooms.rooms.map((r) => r.id), ...routes.routes.filter((r) => ['route', 'transport'].includes(r.kind)).map((r) => r.id)]);
const opts = { statefulIds: stateful, mapVersion: routes.mapVersion };
const save = (content) => JSON.parse(JSON.stringify(buildSave({ content, prefs: initialPrefs(), mapVersion: routes.mapVersion })));

test('38 salas: 10 + 10 + 10 + 8, sin 308/309', () => {
  const by = {}; for (const r of rooms.rooms) by[r.floor] = (by[r.floor] || 0) + 1;
  assert.deepEqual(by, { S: 10, N1: 10, N2: 10, N3: 8 });
  assert.ok(!rooms.rooms.some((r) => r.code === '308' || r.code === '309'));
});

test('paso y contaminación son independientes', () => {
  let c = withElementState(initialContent(), 'n1-pm-sc', { pass: 'open' });
  c = withElementState(c, 'n1-pm-sc', { contaminated: true });
  assert.deepEqual(elementState(c, 'n1-pm-sc'), { pass: 'open', contaminated: true, label: '' });
  c = withElementState(c, 'n1-pm-sc', { pass: 'unverified', contaminated: false });
  assert.equal(c.elements['n1-pm-sc'], undefined);
});

test('etiquetas recortadas a 120 caracteres y sin controles', () => {
  const c = withElementState(initialContent(), '101', { label: 'a\u0000b'.padEnd(300, 'x') });
  assert.equal(c.elements['101'].label.length, 120);
  assert.ok(!c.elements['101'].label.includes('\u0000'));
});

test('ida y vuelta de un guardado válido', () => {
  const c = initialContent();
  c.marker = { placed: true, visible: true, floor: 'N2', x: 300, y: 450 };
  c.blocks.push({ id: 'blq-1', floor: 'N1', x: 10, y: 20, label: '<b>x</b>' });
  c.passages.push({ id: 'paso-1', floor: 'S', a: { x: 1, y: 2 }, b: { x: 3, y: 4 }, label: '' });
  const v = validateSave(save(withElementState(c, '207', { pass: 'blocked' })), opts);
  assert.ok(v.ok, v.errors.join());
  assert.equal(v.data.content.blocks[0].label, '<b>x</b>');
  assert.equal(v.data.content.elements['207'].pass, 'blocked');
});

test('rechazos: versión, mapa, ID, enumeración, coordenadas, duplicados', () => {
  const g = save(initialContent());
  assert.ok(!validateSave({ ...g, schemaVersion: 2 }, opts).ok);
  assert.ok(!validateSave({ ...g, mapVersion: 'otro' }, opts).ok);
  assert.ok(!validateSave({ ...g, content: { ...g.content, elements: { 308: { pass: 'open', contaminated: false, label: '' } } } }, opts).ok);
  assert.ok(!validateSave({ ...g, content: { ...g.content, elements: { 101: { pass: 'abierto', contaminated: false, label: '' } } } }, opts).ok);
  assert.ok(!validateSave({ ...g, content: { ...g.content, marker: { ...g.content.marker, y: 666 } } }, opts).ok);
  assert.ok(!validateSave({ ...g, content: { ...g.content, blocks: [{ id: 'blq-a', floor: 'S', x: 1, y: 1 }, { id: 'blq-a', floor: 'S', x: 2, y: 2 }] } }, opts).ok);
  assert.ok(!validateSave({ ...g, content: { ...g.content, blocks: [{ id: 'blq-a', floor: 'N4', x: 1, y: 1 }] } }, opts).ok);
  assert.ok(!validateSave(null, opts).ok);
  assert.ok(!validateSave([], opts).ok);
});

test('campos desconocidos no se copian', () => {
  const g = save(initialContent()); g.secreto = 'x'; g.content.extra = 1;
  const v = validateSave(g, opts);
  assert.ok(v.ok);
  assert.equal(JSON.stringify(v.data).includes('secreto'), false);
  assert.equal('extra' in v.data.content, false);
});

test('deshacer limitado a 20', () => {
  const h = new History();
  for (let i = 0; i < 25; i++) h.push({ i });
  assert.equal(h.size, 20);
  assert.equal(h.pop().i, 24);
});
