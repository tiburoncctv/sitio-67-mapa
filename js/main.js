// Punto de entrada: carga datos y arranca la vista de dirección o la de jugadores.
import { loadData } from './data.js';
import { startDirector } from './director.js';
import { startPlayerWindow } from './player.js';

async function boot() {
  const boot = document.getElementById('boot');
  let data;
  try {
    data = await loadData();
  } catch (err) {
    boot.textContent = location.protocol === 'file:'
      ? 'Esta aplicación debe servirse por HTTP/HTTPS (GitHub Pages o un servidor local). Abrir el archivo con doble clic no funciona.'
      : `No se pudieron cargar los planos: ${err.message}`;
    boot.classList.add('error');
    return;
  }
  boot.remove();
  const view = new URLSearchParams(location.search).get('view');
  if (view === 'player') startPlayerWindow(data);
  else startDirector(data);
}

boot();
