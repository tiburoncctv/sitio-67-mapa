// Vista de transmisión (solo lectura). Se usa en la ventana ?view=player y en el modo limpio.
import { MapView } from './mapview.js';
import { validateSave } from './state.js';
import { describe, publicCardNodes, floorLabel, cleanPublished } from './describe.js';
import { readSaved, onSavedChange, openChannel } from './storage.js';
import { $ } from './ui.js';

export class PlayerScreen {
  constructor(data) {
    this.data = data;
    this.root = $('#player');
    this.map = new MapView($('#player-map'), data, { interactive: false, onViewChange: () => this.reframe() });
    this.pub = null;
    this.content = null;
    const fsBtn = $('#btn-fullscreen');
    if (!document.fullscreenEnabled) fsBtn.hidden = true;
    fsBtn.addEventListener('click', () => { document.documentElement.requestFullscreen?.().catch(() => {}); });
    document.addEventListener('fullscreenchange', () => { this.root.classList.toggle('is-fs', !!document.fullscreenElement); });
  }

  show() { this.root.hidden = false; }
  hide() { this.root.hidden = true; }

  /** content: contenido validado; pub: bloque publicado ya limpio */
  update(content, pub) {
    this.content = content; this.pub = pub;
    $('#player-wait').hidden = true;
    this.map.setFloor(pub.floor);
    this.reframe();
    this.map.render(content, pub.cardId ? { id: pub.cardId } : null, {});
    const fl = this.data.floorById.get(pub.floor);
    $('#player-floor').textContent = fl.title;
    const m = content.marker;
    $('#player-beta').textContent = m.placed && m.visible && m.floor !== pub.floor ? `Beta-7: ${floorLabel(this.data, m.floor)}` : '';
    $('#legend').hidden = !pub.showLegend;
    const card = $('#pcard');
    const model = pub.cardId ? describe(this.data, content, pub.cardId) : null;
    if (model && model.floor === pub.floor) { card.replaceChildren(...publicCardNodes(this.data, model)); card.hidden = false; }
    else { card.replaceChildren(); card.hidden = true; }
  }

  reframe() { if (this.pub) this.map.showFrame(this.pub.frame); }
}

/** Arranque de la ventana de jugadores independiente. */
export function startPlayerWindow(data) {
  document.body.className = 'mode-player';
  document.title = 'SITIO-67 · Transmisión';
  const screen = new PlayerScreen(data);
  screen.show();
  let lastAt = '';
  const accept = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    const v = validateSave(obj, { statefulIds: data.stateful, mapVersion: data.mapVersion });
    if (!v.ok) return; // datos no válidos: se mantiene lo último mostrado
    const at = typeof obj.publishedAt === 'string' ? obj.publishedAt : '';
    if (at && lastAt && at < lastAt) return; // descarta mensajes antiguos
    lastAt = at || lastAt;
    screen.update(v.data.content, cleanPublished(obj.published, data, v.data.content));
  };
  const saved = readSaved();
  if (saved.status === 'ok') accept(saved.value);
  else $('#player-wait').hidden = false;
  onSavedChange(accept);
  const ch = openChannel((msg) => { if (msg.type === 'sync') accept(msg.payload); });
  ch.post({ type: 'hello' });
  // Teclas: la vista de jugadores no tiene atajos de edición. Escape sale de pantalla completa de forma nativa.
}
