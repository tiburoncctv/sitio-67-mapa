// Vista del plano: SVG original + capas de estado, anotaciones, marcador e interacción.
import { MAP_W, MAP_H, elementState } from './state.js';

const NS = 'http://www.w3.org/2000/svg';
export const ZOOM_MIN = 0.75;
export const ZOOM_MAX = 3;

function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}
function text(parent, x, y, str, attrs = {}) {
  const t = svg('text', { x, y, class: 'map-text', ...attrs }, parent);
  t.textContent = str; // siempre texto plano
  return t;
}

function shapeNode(el, parent, attrs = {}) {
  const s = el.shape;
  if (s.type === 'rect') return svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, ...attrs }, parent);
  if (s.type === 'circle') return svg('circle', { cx: s.cx, cy: s.cy, r: s.r, ...attrs }, parent);
  return svg('polyline', { points: s.points.map((p) => p.join(',')).join(' '), fill: 'none', 'stroke-width': s.width, 'stroke-linejoin': 'round', 'stroke-linecap': 'butt', ...attrs }, parent);
}

const BADGE = {
  open: { txt: '✓ TRANSITABLE', cls: 'b-open' },
  blocked: { txt: '✕ BLOQUEADO', cls: 'b-blocked' },
  cont: { txt: '◆ CONTAMINADO', cls: 'b-cont' },
};

export class MapView {
  /**
   * @param {HTMLElement} container
   * @param {object} data   datos cargados (plantas y elementos)
   * @param {object} opts   { interactive, onTap, onAnnotationMove, onHover, onViewChange }
   */
  constructor(container, data, opts = {}) {
    this.c = container; this.data = data; this.o = opts;
    this.interactive = !!opts.interactive;
    this.view = { k: 1, cx: MAP_W / 2, cy: MAP_H / 2 };
    this.floor = null;
    this.tool = 'select';
    this.root = svg('svg', { class: 'map-svg', role: 'group', 'aria-label': 'Plano de la planta' });
    container.appendChild(this.root);
    this.buildDefs();
    this.world = svg('g', { class: 'world' }, this.root);
    this.baseLayer = svg('g', { class: 'layer-base', 'aria-hidden': 'true' }, this.world);
    this.stateLayer = svg('g', { class: 'layer-state', 'aria-hidden': 'true' }, this.world);
    this.selLayer = svg('g', { class: 'layer-sel', 'aria-hidden': 'true' }, this.world);
    this.hitLayer = svg('g', { class: 'layer-hit' }, this.world);
    this.annLayer = svg('g', { class: 'layer-ann' }, this.world);
    this.markerLayer = svg('g', { class: 'layer-marker' }, this.world);
    this.tempLayer = svg('g', { class: 'layer-temp', 'aria-hidden': 'true' }, this.world);
    if (!this.interactive) this.root.classList.add('readonly');
    this.ro = new ResizeObserver(() => { this.apply(); this.o.onViewChange?.(); });
    this.ro.observe(container);
    if (this.interactive) this.bindPointer();
  }

  buildDefs() {
    const d = svg('defs', {}, this.root);
    const hatch = svg('pattern', { id: 'pat-blocked', width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d);
    svg('rect', { width: 10, height: 10, fill: 'rgba(255,92,92,0.10)' }, hatch);
    svg('line', { x1: 0, y1: 0, x2: 0, y2: 10, stroke: '#ff6b6b', 'stroke-width': 3, 'stroke-opacity': 0.55 }, hatch);
    const dots = svg('pattern', { id: 'pat-cont', width: 12, height: 12, patternUnits: 'userSpaceOnUse' }, d);
    svg('circle', { cx: 3, cy: 3, r: 2.1, fill: '#ff5fd2', 'fill-opacity': 0.75 }, dots);
    svg('circle', { cx: 9, cy: 9, r: 2.1, fill: '#ff5fd2', 'fill-opacity': 0.75 }, dots);
  }

  // ------------------------------------------------------------ encuadre
  size() { const r = this.c.getBoundingClientRect(); return { w: Math.max(1, r.width), h: Math.max(1, r.height) }; }
  fitScale() { const { w, h } = this.size(); return Math.min(w / MAP_W, h / MAP_H) * 0.97; }
  scale() { return this.fitScale() * this.view.k; }
  apply() {
    const { w, h } = this.size(); const s = this.scale();
    const tx = w / 2 - this.view.cx * s; const ty = h / 2 - this.view.cy * s;
    this.world.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})`);
    this.root.style.setProperty('--zoom', String(this.view.k));
  }
  setView(v, silent) {
    this.view = { k: clamp(v.k, ZOOM_MIN, ZOOM_MAX), cx: clamp(v.cx, 0, MAP_W), cy: clamp(v.cy, 0, MAP_H) };
    this.apply(); if (!silent) this.o.onViewChange?.();
  }
  fit() { this.setView({ k: 1, cx: MAP_W / 2, cy: MAP_H / 2 }); }
  zoomBy(f, screenPt) {
    const { w, h } = this.size(); const s0 = this.scale();
    const sp = screenPt || { x: w / 2, y: h / 2 };
    const p = { x: this.view.cx + (sp.x - w / 2) / s0, y: this.view.cy + (sp.y - h / 2) / s0 };
    const k = clamp(this.view.k * f, ZOOM_MIN, ZOOM_MAX);
    const s1 = this.fitScale() * k;
    this.setView({ k, cx: p.x - (sp.x - w / 2) / s1, cy: p.y - (sp.y - h / 2) / s1 });
  }
  /** Rectángulo visible en coordenadas del plano. */
  getFrame() {
    const { w, h } = this.size(); const s = this.scale();
    return { cx: this.view.cx, cy: this.view.cy, w: w / s, h: h / s };
  }
  /** Encaja un rectángulo (contain) sin recortarlo. Para la vista de jugadores. */
  showFrame(fr) {
    if (!fr) { this.view = { k: 1, cx: MAP_W / 2, cy: MAP_H / 2 }; this.apply(); return; }
    const { w, h } = this.size();
    const s = Math.min(w / fr.w, h / fr.h);
    this.view = { k: s / this.fitScale(), cx: fr.cx, cy: fr.cy }; // sin límites: sigue al director
    this.apply();
  }

  /** Convierte coordenadas de pantalla a coordenadas del plano con la transformación activa. */
  toMap(clientX, clientY) {
    const m = this.world.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  // ------------------------------------------------------------ planta
  setFloor(floorId) {
    if (this.floor === floorId) return;
    this.floor = floorId;
    this.baseLayer.replaceChildren();
    const node = this.data.floorById.get(floorId).svgNode;
    const copy = document.importNode(node, true);
    copy.setAttribute('x', 0); copy.setAttribute('y', 0); copy.setAttribute('width', MAP_W); copy.setAttribute('height', MAP_H);
    copy.removeAttribute('role');
    this.baseLayer.appendChild(copy);
    this.buildHit();
  }

  buildHit() {
    this.hitLayer.replaceChildren();
    const els = this.data.elements.filter((e) => e.floor === this.floor);
    const order = { room: 0, route: 1, core: 2, transport: 3, terminal: 4 };
    const groupOrder = { corridor: 0, vial: 1, pm: 1, access: 2, service: 3, e: 3, pt: 4, entry: 5 };
    els.sort((a, b) => (order[a.kind] - order[b.kind]) || ((groupOrder[a.group] ?? 0) - (groupOrder[b.group] ?? 0)));
    for (const el of els) {
      const isLine = el.shape.type === 'line';
      const n = shapeNode(el, this.hitLayer, {
        class: `hit hit-${el.kind}${el.group ? ' hit-' + el.group : ''}`,
        'data-id': el.id,
        fill: isLine ? 'none' : 'transparent',
        stroke: isLine ? 'transparent' : 'none',
      });
      if (this.interactive && (el.kind !== 'route' || el.group === 'pt' || el.group === 'e')) {
        n.setAttribute('tabindex', '0');
        n.setAttribute('role', 'button');
        n.setAttribute('aria-label', el.kind === 'room' ? `${el.code} · ${el.name}` : el.name);
      }
    }
  }

  // ------------------------------------------------------------ render
  /**
   * @param content  contenido de la sesión
   * @param sel      { id } de la selección (elemento o anotación) o null
   * @param opts     { showMarker, showLabels }
   */
  render(content, sel, opts = {}) {
    const fl = this.floor;
    this.stateLayer.replaceChildren();
    this.selLayer.replaceChildren();
    this.annLayer.replaceChildren();
    this.markerLayer.replaceChildren();

    const els = this.data.elements.filter((e) => e.floor === fl);
    const badgesLayer = svg('g', { class: 'badges' });
    for (const el of els) {
      if (!this.data.stateful.has(el.id)) continue;
      const st = elementState(content, el.id);
      if (el.kind === 'transport') { this.drawChip(el, st); continue; }
      if (st.pass === 'unverified' && !st.contaminated && !st.label) continue;
      const isLine = el.shape.type === 'line';
      const g = svg('g', { class: `st st-${st.pass}${st.contaminated ? ' st-cont' : ''}` }, this.stateLayer);
      if (st.contaminated) shapeNode(el, g, isLine ? { stroke: 'url(#pat-cont)', class: 'fill-cont' } : { fill: 'url(#pat-cont)', class: 'fill-cont' });
      if (st.pass === 'blocked') shapeNode(el, g, isLine ? { stroke: 'url(#pat-blocked)', class: 'fill-blocked' } : { fill: 'url(#pat-blocked)', class: 'fill-blocked' });
      if (isLine) {
        if (st.pass === 'open') shapeNode(el, g, { stroke: '#7ee2a8', 'stroke-width': 3, 'stroke-dasharray': '1 0', class: 'line-open' });
        if (st.pass === 'blocked') shapeNode(el, g, { stroke: '#ff6b6b', 'stroke-width': 4, class: 'line-blocked' });
        if (st.contaminated) shapeNode(el, g, { stroke: '#ff5fd2', 'stroke-width': 2, 'stroke-dasharray': '2 4', transform: 'translate(0 0)', class: 'line-cont' });
      } else {
        if (st.pass === 'open') shapeNode(el, g, { fill: 'none', stroke: '#7ee2a8', 'stroke-width': 2.5, class: 'outline-open' });
        if (st.pass === 'blocked') shapeNode(el, g, { fill: 'none', stroke: '#ff6b6b', 'stroke-width': 3, class: 'outline-blocked' });
        if (st.contaminated) shapeNode(el, g, { fill: 'none', stroke: '#ff5fd2', 'stroke-width': 2, 'stroke-dasharray': '6 4', class: 'outline-cont' });
      }
      this.drawBadges(el, st, badgesLayer);
    }
    this.stateLayer.appendChild(badgesLayer);

    // selección
    if (sel && sel.id && this.data.byId.has(sel.id)) {
      const el = this.data.byId.get(sel.id);
      if (el.floor === fl) {
        const isLine = el.shape.type === 'line';
        shapeNode(el, this.selLayer, isLine
          ? { stroke: '#38e1ff', 'stroke-width': el.shape.width + 6, 'stroke-opacity': 0.35, class: 'sel-glow' }
          : { fill: 'rgba(56,225,255,0.10)', stroke: '#38e1ff', 'stroke-width': 3.5, class: 'sel-outline' });
        if (isLine) shapeNode(el, this.selLayer, { stroke: '#38e1ff', 'stroke-width': 2, class: 'sel-outline' });
      }
    }

    // anotaciones
    for (const p of content.passages) if (p.floor === fl) this.drawPassage(p, sel && sel.id === p.id);
    for (const b of content.blocks) if (b.floor === fl) this.drawBlock(b, sel && sel.id === b.id);

    // marcador
    const m = content.marker;
    if (m.placed && m.visible && m.floor === fl && opts.showMarker !== false) this.drawMarker(m);
  }

  drawChip(el, st) {
    const s = el.shape;
    const cls = `chip chip-${st.pass}${st.contaminated ? ' chip-cont' : ''}`;
    const g = svg('g', { class: cls }, this.stateLayer);
    svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 3, class: 'chip-bg' }, g);
    if (st.pass === 'blocked') svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 3, fill: 'url(#pat-blocked)' }, g);
    if (st.contaminated) svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 3, fill: 'url(#pat-cont)' }, g);
    const sym = st.pass === 'open' ? '✓ ' : st.pass === 'blocked' ? '✕ ' : '';
    text(g, s.x + s.w / 2, s.y + 13.5, `${sym}${el.chip}${st.contaminated ? ' ◆' : ''}`, { 'text-anchor': 'middle', class: 'map-text chip-text' });
  }

  drawBadges(el, st, layer) {
    const [bx, by] = el.badge || [el.shape.x ?? 0, el.shape.y ?? 0];
    let x = bx;
    const items = [];
    if (st.pass === 'open') items.push(BADGE.open);
    if (st.pass === 'blocked') items.push(BADGE.blocked);
    if (st.contaminated) items.push(BADGE.cont);
    // Insignias en fila; los tramos verticales del PM/vial las apilan para no salirse de la banda.
    const vertical = el.shape.type === 'line' && el.shape.points.length > 2;
    let y = by;
    for (const it of items) {
      const g = svg('g', { class: `badge ${it.cls}` }, layer);
      const w = it.txt.length * 6.7 + 8;
      svg('rect', { x, y, width: w, height: 14, rx: 2 }, g);
      text(g, x + 4, y + 10.5, it.txt, { class: 'map-text badge-text' });
      if (vertical) y += 16; else x += w + 3;
    }
    if (st.label) {
      const below = items.length && !vertical ? by + 14 : y;
      const horizontalBand = el.shape.type === 'line' && !vertical && (el.group === 'pm' || el.group === 'vial');
      const ly = horizontalBand ? by - 6 : below + 11;
      const t = text(layer, bx + 2, ly, st.label, { class: 'map-text state-label' });
      t.setAttribute('data-label-for', el.id);
    }
  }

  drawBlock(b, selected) {
    const g = svg('g', { class: `ann ann-block${selected ? ' is-selected' : ''}`, 'data-ann': 'block', 'data-ann-id': b.id, 'data-handle': 'body' }, this.annLayer);
    if (this.interactive) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `Bloqueo${b.label ? ': ' + b.label : ''}`); }
    if (selected) svg('circle', { cx: b.x, cy: b.y, r: 17, class: 'ann-sel' }, g);
    const r = 11; const pts = [];
    for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; pts.push(`${(b.x + r * Math.cos(a)).toFixed(2)},${(b.y + r * Math.sin(a)).toFixed(2)}`); }
    svg('polygon', { points: pts.join(' '), class: 'block-oct' }, g);
    svg('path', { d: `M${b.x - 4.5} ${b.y - 4.5} L${b.x + 4.5} ${b.y + 4.5} M${b.x + 4.5} ${b.y - 4.5} L${b.x - 4.5} ${b.y + 4.5}`, class: 'block-x' }, g);
    text(g, b.x, b.y + 25, b.label ? `BLOQUEO · ${b.label}` : 'BLOQUEO', { 'text-anchor': 'middle', class: 'map-text ann-label ann-label-block' });
  }

  drawPassage(p, selected) {
    const g = svg('g', { class: `ann ann-passage${selected ? ' is-selected' : ''}`, 'data-ann': 'passage', 'data-ann-id': p.id }, this.annLayer);
    svg('line', { x1: p.a.x, y1: p.a.y, x2: p.b.x, y2: p.b.y, class: 'passage-hit', 'data-ann': 'passage', 'data-ann-id': p.id, 'data-handle': 'body' }, g);
    if (selected) svg('line', { x1: p.a.x, y1: p.a.y, x2: p.b.x, y2: p.b.y, class: 'passage-sel' }, g);
    svg('line', { x1: p.a.x, y1: p.a.y, x2: p.b.x, y2: p.b.y, class: 'passage-line' }, g);
    for (const h of ['a', 'b']) {
      const c = svg('circle', { cx: p[h].x, cy: p[h].y, r: selected ? 8 : 6, class: 'passage-end', 'data-ann': 'passage', 'data-ann-id': p.id, 'data-handle': h }, g);
      if (this.interactive && selected) { c.setAttribute('aria-label', `Extremo ${h.toUpperCase()} del paso descubierto`); }
    }
    if (this.interactive) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `Paso descubierto${p.label ? ': ' + p.label : ''}`); }
    const mx = (p.a.x + p.b.x) / 2; const my = (p.a.y + p.b.y) / 2;
    text(g, mx, my - 9, p.label ? `Paso descubierto · ${p.label}` : 'Paso descubierto', { 'text-anchor': 'middle', class: 'map-text ann-label ann-label-passage' });
  }

  drawMarker(m) {
    const g = svg('g', { class: 'beta-marker', transform: `translate(${m.x} ${m.y})` }, this.markerLayer);
    svg('circle', { r: 19, class: 'marker-halo' }, g);
    svg('path', { d: 'M0 -15 L13 7.5 L-13 7.5 Z', class: 'marker-tri' }, g);
    svg('circle', { r: 2.6, class: 'marker-dot' }, g);
    const lbl = svg('g', { class: 'marker-label' }, g);
    svg('rect', { x: -27, y: -38, width: 54, height: 17, rx: 3 }, lbl);
    text(lbl, 0, -25.5, 'BETA-7', { 'text-anchor': 'middle', class: 'map-text marker-text' });
  }

  // ------------------------------------------------------------ temporales (herramientas)
  showTemp(kind, pts) {
    this.tempLayer.replaceChildren();
    if (!kind) return;
    if (kind === 'passage' && pts.length) {
      svg('circle', { cx: pts[0].x, cy: pts[0].y, r: 7, class: 'passage-end temp' }, this.tempLayer);
      if (pts[1]) svg('line', { x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y, class: 'passage-line temp' }, this.tempLayer);
    }
  }

  // ------------------------------------------------------------ puntero
  bindPointer() {
    const root = this.root;
    let down = null;
    root.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.button !== 1) return;
      const annEl = e.target.closest?.('[data-ann-id]');
      const handle = annEl?.getAttribute('data-handle');
      const drag = (this.tool === 'select' && annEl && handle && e.button === 0)
        ? { kind: annEl.getAttribute('data-ann'), id: annEl.getAttribute('data-ann-id'), handle, start: this.toMap(e.clientX, e.clientY) } : null;
      down = { x: e.clientX, y: e.clientY, view: { ...this.view }, moved: false, drag, target: e.target, id: e.pointerId };
      try { root.setPointerCapture(e.pointerId); } catch { /* ignorar */ }
    });
    root.addEventListener('pointermove', (e) => {
      if (!down || e.pointerId !== down.id) {
        if (this.o.onHover && e.pointerType === 'mouse') {
          const t = e.target.closest?.('[data-id]');
          this.o.onHover(t ? t.getAttribute('data-id') : null, e.clientX, e.clientY);
        }
        if (this.tool === 'passage' && this.o.onToolMove) this.o.onToolMove(this.toMap(e.clientX, e.clientY));
        return;
      }
      const dx = e.clientX - down.x; const dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) < 5) return;
      down.moved = true;
      if (down.drag) { this.o.onAnnotationMove?.(down.drag, this.toMap(e.clientX, e.clientY), false); return; }
      const s = this.scale();
      root.classList.add('panning');
      this.setView({ k: down.view.k, cx: down.view.cx - dx / s, cy: down.view.cy - dy / s });
    });
    const end = (e, cancelled) => {
      if (!down || e.pointerId !== down.id) return;
      const d = down; down = null; root.classList.remove('panning');
      if (cancelled) { if (d.drag && d.moved) this.o.onAnnotationMove?.(d.drag, null, true); return; }
      if (d.moved) { if (d.drag) this.o.onAnnotationMove?.(d.drag, this.toMap(e.clientX, e.clientY), true); return; }
      if (e.button === 1) return;
      const pt = this.toMap(e.clientX, e.clientY);
      const ann = d.target.closest?.('[data-ann-id]');
      const hit = d.target.closest?.('[data-id]');
      this.o.onTap?.({ pt, annId: ann?.getAttribute('data-ann-id') || null, annKind: ann?.getAttribute('data-ann') || null, elementId: hit?.getAttribute('data-id') || null });
    };
    root.addEventListener('pointerup', (e) => end(e, false));
    root.addEventListener('pointercancel', (e) => end(e, true));
    root.addEventListener('pointerleave', () => this.o.onHover?.(null));
    root.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = root.getBoundingClientRect();
      const f = Math.exp(-Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120) / 600);
      this.zoomBy(f, { x: e.clientX - r.left, y: e.clientY - r.top });
    }, { passive: false });
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const ann = e.target.closest?.('[data-ann-id]');
      const hit = e.target.closest?.('[data-id]');
      if (!ann && !hit) return;
      e.preventDefault();
      this.o.onTap?.({ pt: null, keyboard: true, annId: ann?.getAttribute('data-ann-id') || null, annKind: ann?.getAttribute('data-ann') || null, elementId: hit?.getAttribute('data-id') || null });
    });
  }

  setTool(t) { this.tool = t; this.root.dataset.tool = t; }
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
