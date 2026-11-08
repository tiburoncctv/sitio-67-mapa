// Panel de dirección: edición local, guardado, respaldo y publicación hacia la vista de jugadores.
import {
  initialContent, initialPrefs, clone, elementState, withElementState, newId, clampPoint, History,
  validateSave, buildSave, summarize, PASS_TEXT, LABEL_MAX, MAP_W, MAP_H,
} from './state.js';
import { readSaved, writeSaved, openChannel } from './storage.js';
import { MapView } from './mapview.js';
import { describe, floorLabel, passBadge, contBadge, KIND_TEXT } from './describe.js';
import { PlayerScreen } from './player.js';
import { el, $, isEditable, dialog, download, stamp } from './ui.js';
import { SCENARIOS, SCENARIO_BY_ID, scenariosForRoom } from './tactico/registro.js';
import { readTactical, writeTactical, wrapStore, sanitizeStore, blankStore, TAC_KEY } from './tactico/store.js';
import { createTacticalView } from './tactico/engine.js';

const SCEN_IDS = new Set(SCENARIOS.map((x) => x.id));

const TOOL_HINT = {
  block: 'Bloqueo: haz clic en el plano para colocar la marca · Esc cancela',
  passage: 'Paso descubierto: haz clic en el primer extremo · Esc cancela',
  passage2: 'Paso descubierto: haz clic en el segundo extremo (misma planta) · Esc cancela',
  marker: 'Ubicar Beta-7: haz clic en cualquier punto del plano · Esc cancela',
};

export function startDirector(data) {
  document.body.className = 'mode-director';
  const D = {
    data,
    content: initialContent(),
    prefs: initialPrefs(),
    history: new History(),
    sel: null,               // id seleccionado (elemento o anotación)
    tool: 'select',
    pending: [],             // puntos pendientes de la herramienta de paso
    storage: 'ok',           // ok | unavailable | failed | locked
    lastSaved: null,
    hold: false,
    heldPub: null,
    clean: false,
    dragPreview: null,
  };
  $('#director').hidden = false;

  // ------------------------------------------------------------ carga inicial
  const saved = readSaved();
  let corruptRaw = null;
  if (saved.status === 'unavailable') D.storage = 'unavailable';
  else if (saved.status === 'corrupt') { D.storage = 'locked'; corruptRaw = saved.raw; }
  else if (saved.status === 'ok') {
    const v = validateSave(saved.value, { statefulIds: data.stateful, mapVersion: data.mapVersion });
    if (v.ok) { D.content = v.data.content; D.prefs = v.data.prefs; D.lastSaved = v.data.savedAt; }
    else { D.storage = 'locked'; corruptRaw = saved.raw; D.corruptErrors = v.errors; }
  }

  const map = new MapView($('#map-host'), data, {
    interactive: true,
    onTap,
    onAnnotationMove,
    onHover,
    onToolMove: (pt) => { if (D.tool === 'passage' && D.pending.length === 1) map.showTemp('passage', [D.pending[0], clampPoint(pt.x, pt.y)]); },
    onViewChange: () => { updateZoomLabel(); schedulePublish(); },
  });
  // ------------------------------------------------------------ escenarios tácticos
  let tac = wrapStore(readTactical(SCEN_IDS));
  const saveTac = () => { if (!writeTactical(tac.data)) flash('No se pudo guardar el escenario en este navegador'); channel.post({ type: 'tactico', payload: tac.data }); };
  const tview = createTacticalView({
    mapHost: $('#tac-host'), panelHost: $('#tac-panel'), mode: 'director', getStore: () => tac,
    onChange: () => { saveTac(); publishNow(); renderTxStatus(); },
    onSelect: () => publishNow(),
  });
  const scenSel = $('#scen-select');
  for (const sc of SCENARIOS) scenSel.appendChild(el('option', { value: sc.id }, sc.short));
  scenSel.addEventListener('change', () => setScenario(scenSel.value || null));
  if (D.prefs.scenario && !SCENARIO_BY_ID.has(D.prefs.scenario)) D.prefs.scenario = null;

  const cleanScreen = new PlayerScreen(data, () => tac);

  // ------------------------------------------------------------ pestañas de planta
  const tabs = $('#floor-tabs');
  for (const f of data.floors) {
    tabs.appendChild(el('button', { type: 'button', role: 'tab', class: 'floor-tab', dataset: { floor: f.id }, 'aria-selected': 'false', title: f.title, onclick: () => { setScenario(null); setFloor(f.id); } },
      el('span', { class: 'ft-short' }, f.short), el('span', { class: 'ft-name' }, f.name)));
  }
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const ids = data.floors.map((f) => f.id); const i = ids.indexOf(D.prefs.floor);
    const n = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
    setFloor(n); tabs.querySelector(`[data-floor="${n}"]`)?.focus();
  });

  // ------------------------------------------------------------ barra
  document.querySelectorAll('.tool').forEach((b) => b.addEventListener('click', () => setTool(D.tool === b.dataset.tool && b.dataset.tool !== 'select' ? 'select' : b.dataset.tool)));
  $('#btn-marker-vis').addEventListener('click', () => {
    if (!D.content.marker.placed) { setTool('marker'); return; }
    const c = clone(D.content); c.marker.visible = !c.marker.visible; commit(c);
  });
  $('#btn-undo').addEventListener('click', undo);
  $('#btn-legend').addEventListener('click', toggleLegend);
  $('#btn-enemies').addEventListener('click', toggleEnemies);
  $('#btn-zoom-in').addEventListener('click', () => map.zoomBy(1.25));
  $('#btn-zoom-out').addEventListener('click', () => map.zoomBy(0.8));
  $('#btn-fit').addEventListener('click', () => map.fit());
  $('#btn-open-player').addEventListener('click', openPlayer);
  $('#btn-clean-mode').addEventListener('click', () => { $('#popup-alert').hidden = true; enterClean(); });
  $('#btn-popup-dismiss').addEventListener('click', () => { $('#popup-alert').hidden = true; });
  $('#btn-clean-exit').addEventListener('click', exitClean);
  $('#beta-loc').addEventListener('click', () => { const m = D.content.marker; if (m.placed && m.floor !== D.prefs.floor) setFloor(m.floor); });

  // ------------------------------------------------------------ preferencias de transmisión
  bindCheck('#chk-show-card', 'showCard');
  bindCheck('#chk-share-frame', 'shareFrame');
  bindCheck('#chk-legend', 'showLegend');
  $('#chk-hold').addEventListener('change', (e) => {
    D.hold = e.target.checked;
    D.heldPub = D.hold ? livePublished() : null;
    publishNow(); renderTxStatus();
  });
  function bindCheck(sel, key) {
    const c = $(sel); c.checked = !!D.prefs[key];
    c.addEventListener('change', () => { D.prefs[key] = c.checked; persist(); publishNow(); renderTxStatus(); renderShortcuts(); });
  }

  // ------------------------------------------------------------ respaldo
  $('#btn-export').addEventListener('click', exportJSON);
  $('#btn-import').addEventListener('click', () => $('#file-import').click());
  $('#file-import').addEventListener('change', onImportFile);
  $('#btn-reset').addEventListener('click', resetSession);

  // ------------------------------------------------------------ teclado
  document.addEventListener('keydown', (e) => {
    if (D.clean) { if (e.key === 'Escape' && !document.fullscreenElement) { e.preventDefault(); exitClean(); } return; }
    if ($('#dlg').open) return;
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(e.target)) {
      const k = e.key.toLowerCase();
      if (k === 'l') { e.preventDefault(); toggleLegend(); return; }
      if (k === 'e') { e.preventDefault(); toggleEnemies(); return; }
    }
    if (e.key === 'Escape') {
      if (D.prefs.scenario && tview.cancelPlacing()) { e.preventDefault(); return; }
      if (D.tool !== 'select') { e.preventDefault(); setTool('select'); return; }
      if (D.dragPreview) return;
      if (D.sel && !isEditable(e.target)) { select(null); }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
      if (isEditable(e.target)) return; // deshacer nativo del campo
      e.preventDefault(); undo();
    }
  });

  // ------------------------------------------------------------ canal
  const channel = openChannel((msg) => { if (msg.type === 'hello') publishNow(); });
  window.addEventListener('resize', () => schedulePublish());

  // ------------------------------------------------------------ funciones
  function setFloor(f) {
    if (!data.floorById.has(f)) return;
    const changed = D.prefs.floor !== f;
    D.prefs.floor = f;
    if (D.tool === 'passage') { D.pending = []; map.showTemp(null); }
    if (D.sel) { const m = describe(data, D.content, D.sel); if (!m || m.floor !== f) D.sel = null; }
    map.setFloor(f);
    if (changed) map.fit(); else map.apply();
    persist();
    renderAll();
    publishNow();
  }

  function setScenario(id) {
    const next = id && SCENARIO_BY_ID.has(id) ? id : null;
    D.prefs.scenario = next;
    document.body.classList.toggle('tac-mode', !!next);
    $('#tac-host').hidden = !next; $('#tac-panel').hidden = !next;
    scenSel.value = next || '';
    if (next) { setTool('select'); tview.setScenario(SCENARIO_BY_ID.get(next)); tview.setLegend(D.prefs.showLegend); $('#tooltip').hidden = true; }
    persist(); renderAll(); publishNow();
  }
  function toggleLegend() {
    D.prefs.showLegend = !D.prefs.showLegend; $('#chk-legend').checked = D.prefs.showLegend;
    tview.setLegend(D.prefs.showLegend); persist(); publishNow(); renderTxStatus(); renderShortcuts();
    flash(D.prefs.showLegend ? 'Leyenda visible' : 'Leyenda oculta');
  }
  function toggleEnemies() {
    tac.flags.hideEnemies = !tac.flags.hideEnemies; saveTac();
    if (D.prefs.scenario) tview.refresh();
    publishNow(); renderShortcuts();
    flash(tac.flags.hideEnemies ? 'Amenazas ocultas' : 'Amenazas visibles');
  }
  function renderShortcuts() {
    const bl = $('#btn-legend'); bl.setAttribute('aria-pressed', String(D.prefs.showLegend)); bl.firstChild.textContent = D.prefs.showLegend ? 'Leyenda ' : 'Leyenda oculta ';
    const be = $('#btn-enemies'); be.setAttribute('aria-pressed', String(tac.flags.hideEnemies)); be.firstChild.textContent = tac.flags.hideEnemies ? 'Amenazas ocultas ' : 'Ocultar amenazas ';
  }

  function setTool(t) {
    D.tool = t; D.pending = []; map.showTemp(null); map.setTool(t);
    document.querySelectorAll('.tool').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
    const hint = $('#tool-hint');
    hint.hidden = t === 'select'; hint.textContent = TOOL_HINT[t] || '';
  }

  function select(id) {
    D.sel = id;
    renderMap(); renderSelection(); renderList(); publishNow();
  }

  /** Cambio deliberado de contenido: guarda historial, persiste y publica. */
  function commit(next, { keepHistory = true } = {}) {
    if (keepHistory) D.history.push(D.content);
    D.content = next;
    persist();
    renderAll();
    publishNow();
  }

  function undo() {
    const prev = D.history.pop();
    if (!prev) { flash('Nada que deshacer'); return; }
    D.content = prev;
    if (D.sel && !describe(data, D.content, D.sel)) D.sel = null;
    persist(); renderAll(); publishNow();
    flash('Cambio deshecho');
  }

  function onTap({ pt, annId, elementId }) {
    if (D.tool === 'select') {
      if (annId) { select(annId); return; }
      select(elementId || null);
      return;
    }
    if (!pt) return;
    if (pt.x < 0 || pt.y < 0 || pt.x > MAP_W || pt.y > MAP_H) { flash('Fuera del plano'); return; }
    const p = clampPoint(pt.x, pt.y);
    if (D.tool === 'marker') {
      const c = clone(D.content);
      c.marker = { placed: true, visible: true, floor: D.prefs.floor, x: p.x, y: p.y };
      setTool('select'); commit(c); flash(`Beta-7 ubicado en ${floorLabel(data, D.prefs.floor)}`);
    } else if (D.tool === 'block') {
      const c = clone(D.content); const id = newId('blq');
      c.blocks.push({ id, floor: D.prefs.floor, x: p.x, y: p.y, label: '' });
      setTool('select'); D.sel = id; commit(c);
      setTimeout(() => $('#ann-label')?.focus(), 0);
    } else if (D.tool === 'passage') {
      if (D.pending.length === 0) {
        D.pending = [p]; map.showTemp('passage', D.pending);
        $('#tool-hint').textContent = TOOL_HINT.passage2;
      } else {
        const a = D.pending[0];
        if (Math.hypot(a.x - p.x, a.y - p.y) < 4) { flash('Elige un segundo punto distinto'); return; }
        const c = clone(D.content); const id = newId('paso');
        c.passages.push({ id, floor: D.prefs.floor, a, b: p, label: '' });
        setTool('select'); D.sel = id; commit(c);
      }
    }
  }

  function onAnnotationMove(drag, pt, done) {
    if (!pt) { D.dragPreview = null; renderMap(); return; }
    const p = clampPoint(pt.x, pt.y);
    const c = clone(D.content);
    if (drag.kind === 'block') {
      const b = c.blocks.find((x) => x.id === drag.id); if (!b) return;
      b.x = p.x; b.y = p.y;
    } else if (drag.kind === 'passage') {
      const ps = c.passages.find((x) => x.id === drag.id); if (!ps) return;
      if (drag.handle === 'a' || drag.handle === 'b') ps[drag.handle] = p;
      else {
        const orig = D.content.passages.find((x) => x.id === drag.id);
        const dx = p.x - drag.start.x; const dy = p.y - drag.start.y;
        ps.a = clampPoint(orig.a.x + dx, orig.a.y + dy); ps.b = clampPoint(orig.b.x + dx, orig.b.y + dy);
      }
    }
    if (done) { D.dragPreview = null; D.sel = drag.id; commit(c); }
    else { D.dragPreview = c; map.render(c, { id: drag.id }, {}); }
  }

  function onHover(id, x, y) {
    const tip = $('#tooltip');
    if (!id || D.clean) { tip.hidden = true; return; }
    const e = data.byId.get(id); if (!e) { tip.hidden = true; return; }
    const st = data.stateful.has(id) ? elementState(D.content, id) : null;
    tip.textContent = `${e.kind === 'room' ? e.code + ' · ' + e.name : e.name}${st ? ' — ' + PASS_TEXT[st.pass] + (st.contaminated ? ' · contaminación' : '') : ''}`;
    const r = $('#map-wrap').getBoundingClientRect();
    tip.style.left = `${Math.min(x - r.left + 14, r.width - 260)}px`; tip.style.top = `${y - r.top + 16}px`;
    tip.hidden = false;
  }

  // ------------------------------------------------------------ guardado
  function persist() {
    if (D.storage === 'locked' || D.storage === 'unavailable') { renderSaveStatus(); return; }
    const ok = writeSaved(buildSave({ content: D.content, prefs: D.prefs, published: currentPublished(), mapVersion: data.mapVersion }));
    D.storage = ok ? 'ok' : 'failed';
    if (ok) D.lastSaved = new Date().toISOString();
    renderSaveStatus();
  }

  function renderSaveStatus() {
    const s = $('#save-status'); const a = $('#storage-alert');
    a.replaceChildren(); a.hidden = true;
    if (D.storage === 'ok') {
      s.textContent = D.lastSaved ? `Guardado ${new Date(D.lastSaved).toLocaleTimeString('es')}` : 'Sin cambios guardados';
      s.className = 'save-status ok';
    } else if (D.storage === 'locked') {
      s.textContent = 'Guardado en pausa'; s.className = 'save-status warn';
      a.hidden = false;
      a.append(
        el('p', {}, el('strong', {}, 'Se encontró un guardado dañado o incompatible.'), ' No se ha sobrescrito. La sesión actual funciona en memoria hasta que decidas.'),
        D.corruptErrors ? el('p', { class: 'small' }, D.corruptErrors.slice(0, 3).join(' ')) : null,
        el('div', { class: 'row wrap' },
          el('button', { type: 'button', onclick: () => download(`sitio67-guardado-danado-${stamp()}.txt`, corruptRaw || '', 'text/plain') }, 'Descargar contenido guardado'),
          el('button', { type: 'button', onclick: exportJSON }, 'Exportar sesión actual'),
          el('button', { type: 'button', class: 'danger', onclick: discardCorrupt }, 'Descartar guardado dañado…')),
      );
    } else {
      s.textContent = 'Sin guardar'; s.className = 'save-status warn';
      a.hidden = false;
      a.append(el('p', {}, el('strong', {}, D.storage === 'unavailable' ? 'El navegador no permite almacenamiento local.' : 'No se pudo guardar en este navegador.'),
        ' Los cambios siguen en memoria mientras esta pestaña esté abierta. Exporta un respaldo para conservarlos.'),
      el('div', { class: 'row' }, el('button', { type: 'button', onclick: exportJSON }, 'Exportar respaldo JSON'),
        D.storage === 'failed' ? el('button', { type: 'button', onclick: () => persist() }, 'Reintentar') : null));
    }
  }

  async function discardCorrupt() {
    const v = await dialog({ title: 'Descartar guardado dañado', body: ['El guardado dañado se reemplazará por la sesión actual. Si quieres conservarlo, descárgalo antes.'],
      buttons: [{ label: 'Cancelar', value: 'cancel', class: 'default' }, { label: 'Descartar y guardar la sesión actual', value: 'ok', class: 'danger' }] });
    if (v !== 'ok') return;
    D.storage = 'ok'; corruptRaw = null; D.corruptErrors = null; persist();
  }

  function exportJSON() {
    const obj = buildSave({ content: D.content, prefs: D.prefs, mapVersion: data.mapVersion });
    obj.tactico = tac.data;
    download(`sitio67-respaldo-${stamp()}.json`, JSON.stringify(obj, null, 2));
    flash('Respaldo exportado');
  }

  async function onImportFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2_000_000) { await info('Importación rechazada', ['El archivo es demasiado grande para ser un respaldo de esta aplicación.']); return; }
    let parsed;
    try { parsed = JSON.parse(await file.text()); } catch { await info('Importación rechazada', ['El archivo no es JSON válido. La sesión actual no ha cambiado.']); return; }
    const v = validateSave(parsed, { statefulIds: data.stateful, mapVersion: data.mapVersion });
    if (!v.ok) { await info('Importación rechazada', ['La sesión actual no ha cambiado.', el('ul', { class: 'errs' }, v.errors.slice(0, 8).map((x) => el('li', {}, x)))]); return; }
    const s = summarize(v.data.content);
    const ans = await dialog({
      title: 'Reemplazar la sesión actual',
      body: [
        `Archivo: ${file.name}${v.data.savedAt ? ' · guardado ' + new Date(v.data.savedAt).toLocaleString('es') : ''}`,
        el('ul', {}, el('li', {}, `${s.open} transitables, ${s.blocked} bloqueados, ${s.contaminated} con contaminación, ${s.labels} etiquetas`),
          el('li', {}, `${s.blocks} bloqueos puntuales y ${s.passages} pasos descubiertos`),
          el('li', {}, s.marker ? `Beta-7 en ${floorLabel(data, s.marker)}` : 'Beta-7 sin ubicar'),
          el('li', {}, parsed.tactico ? 'Incluye el estado de los escenarios tácticos (iconos, estados, revelaciones e inventario)' : 'Sin estado de escenarios tácticos: se conserva el actual')),
        'Esto reemplaza todos los estados, anotaciones y el marcador actuales. Puedes deshacerlo con «Deshacer».',
      ],
      buttons: [{ label: 'Cancelar', value: 'cancel', class: 'default' }, { label: 'Reemplazar', value: 'ok', class: 'danger' }],
    });
    if (ans !== 'ok') { flash('Importación cancelada'); return; }
    D.prefs = { ...v.data.prefs };
    D.sel = null;
    if (parsed.tactico) { tac = wrapStore(sanitizeStore(parsed.tactico, SCEN_IDS)); saveTac(); }
    commit(v.data.content);
    setScenario(D.prefs.scenario && SCENARIO_BY_ID.has(D.prefs.scenario) ? D.prefs.scenario : null);
    syncChecks(); map.setFloor(D.prefs.floor); map.fit(); renderAll(); publishNow();
    flash('Respaldo importado');
  }

  async function resetSession() {
    const s = summarize(D.content);
    const ans = await dialog({
      title: 'Nueva sesión',
      body: [
        'Se borrará de este navegador:',
        el('ul', {}, el('li', {}, `estados de paso y contaminación de ${Object.keys(D.content.elements).length} elementos y sus etiquetas`),
          el('li', {}, `${s.blocks} bloqueos puntuales y ${s.passages} pasos descubiertos`),
          el('li', {}, s.marker ? `la posición de Beta-7 (${floorLabel(data, s.marker)})` : 'el marcador de Beta-7'),
          el('li', {}, 'las preferencias de vista (vuelve a Superficie, sin ficha en transmisión)'),
          el('li', {}, 'el estado de los escenarios tácticos: iconos insertados, posiciones, estados, revelaciones e inventario')),
        'Los planos originales y las descripciones no cambian. No se tocan datos de otras páginas. Se recomienda exportar un respaldo antes.',
      ],
      buttons: [
        { label: 'Exportar respaldo', value: 'export', keepOpen: true, onClick: exportJSON },
        { label: 'Cancelar', value: 'cancel', class: 'default' },
        { label: 'Borrar y empezar', value: 'ok', class: 'danger' },
      ],
    });
    if (ans !== 'ok') return;
    D.prefs = initialPrefs(); D.sel = null; D.hold = false; D.heldPub = null; $('#chk-hold').checked = false;
    setTool('select');
    tac = wrapStore(blankStore()); saveTac();
    commit(initialContent());
    setScenario(null);
    syncChecks(); map.setFloor('S'); map.fit(); renderAll(); publishNow();
    flash('Sesión reiniciada');
  }

  function info(title, body) { return dialog({ title, body, buttons: [{ label: 'Entendido', value: 'ok', class: 'default' }] }); }

  // ------------------------------------------------------------ publicación
  function livePublished() {
    const showCard = D.prefs.showCard && D.sel;
    return {
      floor: D.prefs.floor,
      frame: D.prefs.shareFrame ? round(map.getFrame()) : null,
      cardId: showCard ? D.sel : null,
      showLegend: D.prefs.showLegend,
      scenario: D.prefs.scenario,
      scenarioSel: D.prefs.scenario && D.prefs.showCard ? tview.selection : null,
    };
  }
  function currentPublished() {
    if (D.hold && D.heldPub) return { ...D.heldPub, showLegend: D.prefs.showLegend, cardId: D.heldPub.cardId && describe(data, D.content, D.heldPub.cardId) ? D.heldPub.cardId : null };
    return livePublished();
  }
  function payload() {
    const o = buildSave({ content: D.content, prefs: D.prefs, published: currentPublished(), mapVersion: data.mapVersion });
    o.publishedAt = new Date().toISOString();
    return o;
  }
  function publishNow() {
    const p = payload();
    channel.post({ type: 'sync', payload: p });
    if (D.clean) cleanScreen.update(D.content, cleanPublishedLocal(p.published));
    if (D.clean) cleanScreen.refreshTactical();
    pendingStore = true; scheduleStore();
  }
  function cleanPublishedLocal(pub) { return { ...pub }; }
  let pubTimer = 0; let pendingStore = false; let storeTimer = 0;
  function schedulePublish() { if (pubTimer) return; pubTimer = setTimeout(() => { pubTimer = 0; if (!D.hold) publishNow(); }, 60); }
  function scheduleStore() {
    if (storeTimer) return;
    storeTimer = setTimeout(() => { storeTimer = 0; if (pendingStore) { pendingStore = false; persist(); } }, 250);
  }

  function openPlayer() {
    const url = new URL(location.href); url.search = '?view=player'; url.hash = '';
    let w = null;
    try { w = window.open(url.toString(), '_blank'); } catch { w = null; }
    if (!w) { $('#player-link').href = url.toString(); $('#popup-alert').hidden = false; return; }
    publishNow();
    setTimeout(publishNow, 400);
    flash('Vista de jugadores abierta: comparte esa ventana');
  }

  function enterClean() {
    D.clean = true; setTool('select');
    $('#director').hidden = true; cleanScreen.show(); document.body.classList.add('clean');
    $('#btn-clean-exit').hidden = false; $('#tooltip').hidden = true;
    publishNow();
  }
  function exitClean() {
    D.clean = false; document.body.classList.remove('clean');
    cleanScreen.hide(); $('#btn-clean-exit').hidden = true; $('#director').hidden = false;
    map.apply(); renderAll();
    $('#btn-open-player').focus();
  }

  // ------------------------------------------------------------ renderizado
  function renderAll() { renderShortcuts(); renderMap(); renderTabs(); renderSelection(); renderList(); renderBeta(); renderUndo(); renderTxStatus(); renderSaveStatus(); updateZoomLabel(); }
  function renderMap() { map.render(D.content, D.sel ? { id: D.sel } : null, {}); $('#map-floor-name').textContent = data.floorById.get(D.prefs.floor).title; }
  function renderTabs() { tabs.querySelectorAll('.floor-tab').forEach((b) => { const on = b.dataset.floor === D.prefs.floor; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }); }
  function renderUndo() { $('#undo-count').textContent = String(D.history.size); $('#btn-undo').disabled = D.history.size === 0; }
  function updateZoomLabel() { $('#zoom-val').textContent = `${map.view.k.toFixed(2)}×`; }
  function renderBeta() {
    const m = D.content.marker; const b = $('#beta-loc'); const vis = $('#btn-marker-vis');
    if (!m.placed) { b.textContent = 'Beta-7: sin ubicar'; b.disabled = true; vis.textContent = 'Mostrar Beta-7'; vis.setAttribute('aria-pressed', 'false'); return; }
    const where = m.floor === D.prefs.floor ? 'en esta planta' : floorLabel(data, m.floor);
    b.textContent = `Beta-7: ${where}${m.visible ? '' : ' (oculto)'}`;
    b.disabled = m.floor === D.prefs.floor;
    b.classList.toggle('elsewhere', m.floor !== D.prefs.floor);
    vis.textContent = m.visible ? 'Ocultar Beta-7' : 'Mostrar Beta-7';
    vis.setAttribute('aria-pressed', String(m.visible));
  }
  function renderTxStatus() {
    const p = currentPublished();
    const parts = [p.scenario ? `Jugadores ven: escenario ${SCENARIO_BY_ID.get(p.scenario).short}` : `Jugadores ven: ${floorLabel(data, p.floor)}`];
    if (!p.scenario) parts.push(p.frame ? 'con tu encuadre' : 'plano completo');
    if (!p.showLegend) parts.push('sin leyenda');
    if (p.scenario && tac.flags.hideEnemies) parts.push('amenazas ocultas');
    parts.push(p.cardId ? 'con ficha' : 'sin ficha');
    if (D.hold) parts.push('(vista retenida)');
    $('#tx-status').textContent = parts.join(' · ');
  }
  function syncChecks() {
    $('#chk-show-card').checked = D.prefs.showCard; $('#chk-share-frame').checked = D.prefs.shareFrame; $('#chk-legend').checked = D.prefs.showLegend;
  }

  function renderSelection() {
    const body = $('#sel-body');
    const m = describe(data, D.content, D.sel);
    if (!m) { body.replaceChildren(el('p', { class: 'muted' }, 'Selecciona una sala, tramo o conexión en el plano o en la lista de abajo.')); return; }
    const nodes = [el('div', { class: 'pc-kind' }, `${m.kindText} · ${floorLabel(data, m.floor)}`), el('h3', { class: 'sel-name' }, m.title), el('p', { class: 'sel-desc' }, m.desc)];
    const scs = m.kind === 'room' ? scenariosForRoom(m.id) : [];
    if (scs.length) nodes.push(el('div', { class: 'row wrap' }, scs.map((sc) => el('button', { type: 'button', class: 'primary', onclick: () => setScenario(sc.id) }, `Abrir escenario: ${sc.short}`))));
    if (m.stateful) nodes.push(...stateControls(m));
    else if (m.kind === 'core') {
      nodes.push(el('p', { class: 'small muted' }, 'Bloquear un medio no bloquea los demás. Elige uno para anotarlo:'));
      nodes.push(el('ul', { class: 'parts' }, m.parts.map((p) => el('li', {}, el('button', { type: 'button', class: 'linkish', onclick: () => select(p.id) }, p.name), passBadge(p.pass), p.contaminated ? contBadge(true) : null))));
    } else if (m.kind === 'terminal') nodes.push(el('p', { class: 'small muted' }, 'Elemento de referencia: sin mecánicas en esta versión.'));
    else if (m.kind === 'block' || m.kind === 'passage') nodes.push(...annotationControls(m));
    body.replaceChildren(...nodes);
  }

  function stateControls(m) {
    const radios = (name, legend, opts, cur, onPick) => el('fieldset', { class: 'seg' }, el('legend', {}, legend),
      ...opts.map(([val, txt, cls]) => el('label', { class: `seg-opt ${cls}` },
        el('input', { type: 'radio', name, value: val, checked: cur === val, onchange: () => onPick(val) }), el('span', {}, txt))));
    const set = (patch) => commit(withElementState(D.content, m.id, patch));
    const label = el('input', { type: 'text', id: 'el-label', maxlength: LABEL_MAX, value: m.label, placeholder: 'p. ej. Tejido en el acceso este', 'aria-describedby': 'el-label-hint' });
    const apply = () => { const v = label.value; if (v.trim() !== m.label) set({ label: v }); };
    label.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } if (e.key === 'Escape') { label.value = m.label; label.blur(); e.stopPropagation(); } });
    return [
      radios(`pass-${m.id}`, 'Paso actual', [['unverified', '? Sin verificar', 'o-unverified'], ['open', '✓ Transitable', 'o-open'], ['blocked', '✕ Bloqueado', 'o-blocked']], m.pass, (v) => set({ pass: v })),
      radios(`cont-${m.id}`, 'Contaminación confirmada', [['no', '– No registrada', 'o-none'], ['yes', '◆ Sí', 'o-cont']], m.contaminated ? 'yes' : 'no', (v) => set({ contaminated: v === 'yes' })),
      el('p', { class: 'small muted' }, '«No registrada» no significa segura. Paso y contaminación son independientes.'),
      el('label', { class: 'field', for: 'el-label' }, 'Etiqueta pública (máx. 120)'),
      el('div', { class: 'row' }, label, el('button', { type: 'button', onclick: apply }, 'Aplicar'), m.label ? el('button', { type: 'button', class: 'ghost', onclick: () => set({ label: '' }) }, 'Quitar') : null),
      el('p', { id: 'el-label-hint', class: 'small muted' }, 'Enter aplica. Se muestra en el mapa y en la ficha.'),
    ];
  }

  function annotationControls(m) {
    const input = el('input', { type: 'text', id: 'ann-label', maxlength: LABEL_MAX, value: m.label || '', placeholder: m.kind === 'block' ? 'p. ej. Escombros' : 'p. ej. Tabique roto' });
    const apply = () => {
      const c = clone(D.content);
      const list = m.kind === 'block' ? c.blocks : c.passages;
      const it = list.find((x) => x.id === m.id); if (!it) return;
      const v = String(input.value).trim().slice(0, LABEL_MAX);
      if (v === (it.label || '')) return;
      it.label = v; commit(c);
    };
    const del = () => {
      const c = clone(D.content);
      if (m.kind === 'block') c.blocks = c.blocks.filter((x) => x.id !== m.id); else c.passages = c.passages.filter((x) => x.id !== m.id);
      D.sel = null; commit(c); flash(m.kind === 'block' ? 'Bloqueo borrado' : 'Paso borrado');
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } if (e.key === 'Escape') { e.stopPropagation(); input.blur(); } });
    return [
      el('p', { class: 'small muted' }, m.kind === 'block' ? 'Arrastra la marca en el plano para moverla.' : 'Arrastra un extremo para ajustarlo, o la línea para moverla entera.'),
      el('label', { class: 'field', for: 'ann-label' }, 'Etiqueta opcional (máx. 120)'),
      el('div', { class: 'row' }, input, el('button', { type: 'button', onclick: apply }, 'Aplicar')),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'danger', onclick: del }, m.kind === 'block' ? 'Borrar bloqueo' : 'Borrar paso descubierto')),
    ];
  }

  function renderList() {
    const host = $('#el-list');
    const f = D.prefs.floor;
    const els = data.elements.filter((e) => e.floor === f);
    const item = (e) => {
      const st = data.stateful.has(e.id) ? elementState(D.content, e.id) : null;
      const label = e.kind === 'room' ? `${e.code} · ${e.name}` : e.name;
      return el('li', {}, el('button', { type: 'button', class: `el-item${D.sel === e.id ? ' is-sel' : ''}`, 'aria-current': D.sel === e.id ? 'true' : null, dataset: { id: e.id }, onclick: () => select(e.id) },
        el('span', { class: 'el-name' }, label),
        st ? el('span', { class: 'el-st' }, st.pass === 'open' ? '✓' : st.pass === 'blocked' ? '✕' : '?', st.contaminated ? ' ◆' : '', st.label ? ' ✎' : '') : el('span', { class: 'el-st muted' }, 'info')));
    };
    const rooms = els.filter((e) => e.kind === 'room');
    const conns = els.filter((e) => e.kind === 'core' || e.kind === 'transport' || e.kind === 'terminal' || ['pt', 'e', 'entry'].includes(e.group));
    const tramos = els.filter((e) => e.kind === 'route' && !['pt', 'e', 'entry'].includes(e.group));
    const anns = [...D.content.blocks.filter((b) => b.floor === f).map((b) => ({ id: b.id, name: `Bloqueo${b.label ? ' · ' + b.label : ''}` })),
      ...D.content.passages.filter((p) => p.floor === f).map((p) => ({ id: p.id, name: `Paso descubierto${p.label ? ' · ' + p.label : ''}` }))];
    const openState = host.querySelector('details')?.open;
    host.replaceChildren(
      el('h3', { class: 'list-h' }, `Salas (${rooms.length})`), el('ul', {}, rooms.map(item)),
      el('h3', { class: 'list-h' }, 'Conexiones'), el('ul', {}, conns.map(item)),
      el('details', { open: openState || tramos.some((t) => t.id === D.sel) },
        el('summary', {}, `Tramos y accesos (${tramos.length})`), el('ul', {}, tramos.map(item))),
      anns.length ? el('h3', { class: 'list-h' }, `Anotaciones (${anns.length})`) : null,
      anns.length ? el('ul', {}, anns.map((a) => el('li', {}, el('button', { type: 'button', class: `el-item${D.sel === a.id ? ' is-sel' : ''}`, onclick: () => select(a.id) }, el('span', { class: 'el-name' }, a.name))))) : null,
      el('p', { class: 'small muted' }, `${KIND_TEXT.room}s y conexiones también se seleccionan con Tab + Enter sobre el plano.`),
    );
  }

  let flashTimer = 0;
  function flash(msg) {
    const s = $('#save-status');
    s.dataset.flash = msg; s.classList.add('flash');
    clearTimeout(flashTimer); flashTimer = setTimeout(() => { s.classList.remove('flash'); delete s.dataset.flash; }, 1800);
  }

  // ------------------------------------------------------------ inicio
  syncChecks();
  map.setFloor(D.prefs.floor);
  map.fit();
  setTool('select');
  setScenario(D.prefs.scenario);
  renderAll();
  publishNow();
  // Otra ventana de dirección del mismo navegador cambió los escenarios.
  window.addEventListener('storage', (e) => { if (e.key === TAC_KEY) { tac = wrapStore(readTactical(SCEN_IDS)); if (D.prefs.scenario) tview.refresh(); renderShortcuts(); } });
  // Estado expuesto solo para pruebas automatizadas locales (no contiene secretos).
  window.__sitio67 = { get content() { return clone(D.content); }, get prefs() { return clone(D.prefs); }, map, get storage() { return D.storage; }, get tactico() { return clone(tac.data); } };
}

function round(f) { const r = (n) => Math.round(n * 10) / 10; return { cx: r(f.cx), cy: r(f.cy), w: r(f.w), h: r(f.h) }; }
