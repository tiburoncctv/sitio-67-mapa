// Utilidades de DOM. Todo contenido dinámico se inserta como texto (nunca innerHTML).

export function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, '');
    else n.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return n;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function isEditable(t) {
  if (!t || !(t instanceof Element)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (t.getAttribute('type') || 'text').toLowerCase();
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(type);
  }
  return false;
}

/**
 * Diálogo modal. buttons: [{label, value, class}] → Promise<value|null>
 */
export function dialog({ title, body, buttons }) {
  const dlg = document.getElementById('dlg');
  document.getElementById('dlg-title').textContent = title;
  const bodyEl = document.getElementById('dlg-body');
  bodyEl.replaceChildren(...(Array.isArray(body) ? body : [body]).map((b) => (typeof b === 'string' ? el('p', {}, b) : b)));
  const actions = document.getElementById('dlg-actions');
  actions.replaceChildren();
  return new Promise((resolve) => {
    let resolved = false;
    const done = (v) => { if (resolved) return; resolved = true; resolve(v); };
    for (const b of buttons) {
      const btn = el('button', { type: b.keepOpen ? 'button' : 'submit', value: b.value, class: b.class || '' }, b.label);
      if (b.keepOpen) btn.addEventListener('click', () => b.onClick?.());
      actions.appendChild(btn);
    }
    dlg.addEventListener('close', function onClose() {
      dlg.removeEventListener('close', onClose);
      done(dlg.returnValue && dlg.returnValue !== 'cancel' ? dlg.returnValue : null);
    });
    dlg.returnValue = '';
    dlg.showModal();
    const def = actions.querySelector('.default') || actions.querySelector('button');
    def?.focus();
  });
}

export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
