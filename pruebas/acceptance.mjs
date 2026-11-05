// Uso: npm i playwright && npx playwright install chromium
// Sirve la carpeta padre del repositorio (así queda bajo /sitio-67-mapa/) y ejecuta, por ejemplo:
// BASE=http://localhost:8765/sitio-67-mapa/ REF=ruta/REFERENCIA-JUGADORES.md node pruebas/acceptance.mjs
// Pruebas de aceptación en Chrome headless (Playwright). Uso: node acceptance.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:8765/repositorio/mapa/';
const SHOTS = process.env.SHOTS || 'capturas-prueba';
fs.mkdirSync(SHOTS, { recursive: true });
const results = [];
function rec(n, name, ok, detail = '') { results.push({ n, name, ok, detail }); console.log(`${ok ? 'OK  ' : 'FAIL'} [${n}] ${name}${detail ? ' — ' + detail : ''}`); }
function check(n, name, cond, detail) { rec(n, name, !!cond, detail); return !!cond; }

const launchOpts = { args: ['--no-sandbox'] };
const browser = await chromium.launch(launchOpts);

async function newDirector(viewport = { width: 1920, height: 1080 }, ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, ...ctxOpts });
  const page = await ctx.newPage();
  page._errs = [];
  page.on('pageerror', (e) => page._errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page._errs.push(m.text()); });
  await page.goto(BASE);
  await page.waitForSelector('#director:not([hidden])');
  return { ctx, page };
}
const S = (page) => page.evaluate(() => window.__sitio67.content);
async function toScreen(page, x, y, host = '#map-host') {
  return page.evaluate(([x, y, host]) => {
    const m = document.querySelector(`${host} .world`).getScreenCTM();
    const p = new DOMPoint(x, y).matrixTransform(m); return { x: p.x, y: p.y };
  }, [x, y, host]);
}
async function clickMap(page, x, y) { const p = await toScreen(page, x, y); await page.mouse.click(p.x, p.y); await page.waitForTimeout(30); }
async function selName(page) { return (await page.textContent('#sel-body .sel-name')) || ''; }
async function selDesc(page) { return (await page.textContent('#sel-body .sel-desc')) || ''; }
async function floor(page, f) { await page.click(`[data-floor="${f}"]`); await page.waitForTimeout(50); }
async function setPass(page, v) { await page.click(`#sel-body .o-${v}`); await page.waitForTimeout(20); }

// ======================================================= 1–5 contenido
const ref = fs.readFileSync(process.env.REF || 'REFERENCIA-JUGADORES.md', 'utf8');
const refRooms = [...ref.matchAll(/^- \*\*([0-9S]+) · (.+?):\*\* (.+)$/gm)].map((m) => ({ code: m[1], name: m[2], desc: m[3] }));
{
  const { ctx, page } = await newDirector();
  const tabs = await page.$$eval('.floor-tab', (b) => b.map((x) => x.dataset.floor));
  const perFloor = {};
  const shown = [];
  for (const f of tabs) {
    await floor(page, f);
    const rooms = await page.$$eval('#map-host .hit-room', (n) => n.map((x) => x.dataset.id));
    perFloor[f] = rooms.length;
    for (const id of rooms) {
      await page.click(`#el-list .el-item[data-id="${id}"]`);
      shown.push({ code: id, title: await selName(page), desc: await selDesc(page) });
    }
  }
  check(1, 'Cuatro plantas y 38 salas (10+10+10+8)', tabs.join() === 'S,N1,N2,N3' && JSON.stringify(perFloor) === '{"S":10,"N1":10,"N2":10,"N3":8}', JSON.stringify(perFloor));
  const mism = refRooms.filter((r) => { const s = shown.find((x) => x.code === r.code); return !s || s.title !== `${r.code} · ${r.name}` || s.desc !== r.desc; });
  const n3 = shown.filter((s) => s.code.startsWith('3')).map((s) => s.code).join(',');
  check(2, 'Código, nombre y descripción literales; −3 = 301–307 y 310', refRooms.length === 38 && mism.length === 0 && n3 === '301,302,303,304,305,306,307,310', `n3=${n3}, discrepancias=${mism.length}`);
  await floor(page, 'N2');
  const acc207 = await page.$('#map-host [data-id="acc-207"]');
  const room207 = await page.$('#map-host [data-id="207"]');
  check(3, 'Armería 207 en −2 con su acceso original', acc207 && room207 && shown.find((s) => s.code === '207')?.title === '207 · Armería');
  const conn = {};
  for (const f of ['S', 'N1', 'N2', 'N3']) { await floor(page, f); conn[f] = await page.$$eval('#map-host .hit', (n) => n.map((x) => x.dataset.id).filter((id) => /-(A|B|PT|E|C1|C2|A-esc|A-asc|B-esc|B-carga|pm-o)$/.test(id))); }
  const abPos = await page.evaluate(() => { const a = document.querySelector('#map-host [data-id="n3-A"]'); const b = document.querySelector('#map-host [data-id="n3-B"]'); return [a.getAttribute('x'), b.getAttribute('x')]; });
  check(4, 'A/B, PM, PT, E, C1/C2 presentes; escalera B y montacargas separados', conn.S.includes('s-E') && conn.N3.includes('n3-PT') && conn.N3.includes('n3-C1') && conn.N3.includes('n3-C2') && conn.N1.includes('n1-pm-o') && conn.N2.includes('n2-B-esc') && conn.N2.includes('n2-B-carga') && !conn.S.includes('s-PT') && abPos.join() === '60,805', JSON.stringify(abPos));
  const allText = await page.evaluate(() => document.body.innerText + [...document.querySelectorAll('#map-host text')].map((t) => t.textContent).join(' '));
  const files = ['js/main.js', 'js/director.js', 'js/player.js', 'data/rooms.json', 'data/routes.json'].map((f) => fs.readFileSync((process.env.APP || './') + f, 'utf8')).join('\n');
  check(5, 'Planos completos desde el inicio; sin «galería técnica» ni spoilers', !/galer[ií]a t[eé]cnica/i.test(allText + files) && !/enemig|demolici|desenlace/i.test(files) && /PASILLO DE MANTENIMIENTO/.test(allText));
  await ctx.close();
}

// ======================================================= 6–12 interacción
{
  const { ctx, page } = await newDirector();
  // 6 superficie interior
  await floor(page, 'N3');
  await clickMap(page, 300, 530); // esquina inferior de 307, lejos de las letras
  const n6a = await selName(page);
  await floor(page, 'S');
  await clickMap(page, 75, 110); // esquina de S01
  const n6b = await selName(page);
  check(6, 'Selección por superficie interior de la sala', n6a === '307 · Cámara de contención' && n6b === 'S01 · Control exterior' && (await selDesc(page)) === 'identificación y acceso.', `${n6a} / ${n6b}`);

  // 11 marcador en patio, luego en otro punto
  await page.click('.tool[data-tool="marker"]');
  await clickMap(page, 500, 300); // patio de servicio
  let st = await S(page);
  const okPatio = st.marker.placed && st.marker.floor === 'S' && Math.abs(st.marker.x - 500) < 1;
  await floor(page, 'N1');
  await page.click('.tool[data-tool="marker"]');
  await clickMap(page, 42, 450); // PM
  st = await S(page);
  const okPM = st.marker.floor === 'N1' && Math.abs(st.marker.x - 42) < 1;
  await page.click('.tool[data-tool="marker"]');
  await clickMap(page, 690, 470); // sala 109
  await floor(page, 'N3');
  st = await S(page);
  const head = await page.textContent('#beta-loc');
  check(11, 'Beta-7 en patio, PM y sala; consultar otra planta no lo transporta', okPatio && okPM && st.marker.floor === 'N1' && head.includes('Nivel −1'), head);

  // 7 alineación con zoom/pan/resize
  await floor(page, 'N1');
  const markerPos = async () => page.evaluate(() => { const r = document.querySelector('#map-host .marker-tri').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 2 / 3 }; });
  const expect7 = async () => { const s = await S(page); const e = await toScreen(page, s.marker.x, s.marker.y); const m = await markerPos(); return Math.hypot(e.x - m.x, e.y - m.y); };
  const roomPos = async () => page.evaluate(() => { const r = document.querySelector('#map-host [data-id="109"]').getBoundingClientRect(); const b = document.querySelector('#map-host .layer-base rect[x="604"][y="375"]').getBoundingClientRect(); return Math.abs(r.x - b.x) + Math.abs(r.y - b.y) + Math.abs(r.width - b.width); });
  const d0 = await expect7();
  await page.click('#btn-zoom-in'); await page.click('#btn-zoom-in'); await page.click('#btn-zoom-in');
  const mp = await toScreen(page, 500, 300);
  await page.mouse.move(mp.x, mp.y); await page.mouse.down(); await page.mouse.move(mp.x - 150, mp.y - 80, { steps: 5 }); await page.mouse.up();
  const d1 = await expect7(); const r1 = await roomPos();
  const before = await toScreen(page, 400, 200);
  await page.mouse.move(before.x, before.y); await page.mouse.wheel(0, -240); await page.waitForTimeout(50);
  const after = await toScreen(page, 400, 200);
  await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(150);
  const d2 = await expect7(); const r2 = await roomPos();
  await page.click('#btn-fit');
  const k = await page.evaluate(() => window.__sitio67.map.view.k);
  await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(100);
  check(7, 'Zoom, desplazamiento, rueda y redimensionado mantienen capas alineadas', d0 < 2 && d1 < 2 && d2 < 2 && r1 < 1 && r2 < 1 && Math.hypot(before.x - after.x, before.y - after.y) < 2 && k === 1, `d=${[d0, d1, d2].map((x) => x.toFixed(2))} rueda=${Math.hypot(before.x - after.x, before.y - after.y).toFixed(2)}`);

  // 8 transitable + contaminado
  await page.click('#el-list summary');
  await page.click('#el-list .el-item[data-id="n1-pm-sc"]');
  await setPass(page, 'open'); await page.click('#sel-body .o-cont');
  st = await S(page);
  const cls8 = await page.$$eval('#map-host .layer-state .st', (n) => n.map((x) => x.getAttribute('class')));
  await page.click('#el-list .el-item[data-id="105"]');
  await setPass(page, 'open'); await setPass(page, 'unverified');
  const blocked8 = await page.$$eval('#map-host .st-blocked', (n) => n.length);
  check(8, 'Transitable y contaminado a la vez; «sin verificar» no se dibuja como bloqueo', st.elements['n1-pm-sc']?.pass === 'open' && st.elements['n1-pm-sc']?.contaminated === true && cls8.some((c) => c.includes('st-open') && c.includes('st-cont')) && blocked8 === 0);

  // 9 bloquear un tramo y bloqueo libre movible/borrable
  await page.click('#el-list .el-item[data-id="n1-pasillo-c"]');
  await setPass(page, 'blocked');
  st = await S(page);
  const segOk = st.elements['n1-pasillo-c']?.pass === 'blocked' && !st.elements['n1-pasillo-o'] && !st.elements['n1-pasillo-e'];
  await page.click('.tool[data-tool="block"]');
  await clickMap(page, 300, 300);
  await page.fill('#ann-label', 'Escombros'); await page.press('#ann-label', 'Enter');
  let blk = (await S(page)).blocks[0];
  const bp = await toScreen(page, blk.x, blk.y);
  await page.mouse.move(bp.x, bp.y); await page.mouse.down(); await page.mouse.move(bp.x + 60, bp.y + 40, { steps: 6 }); await page.mouse.up();
  const moved = (await S(page)).blocks[0];
  await page.click('#sel-body button.danger');
  const afterDel = (await S(page)).blocks.length;
  check(9, 'Bloquear un tramo sin bloquear el resto; bloqueo libre se mueve y borra', segOk && blk.label === 'Escombros' && moved.x > blk.x + 5 && moved.y > blk.y + 5 && afterDel === 0, `mov=(${blk.x},${blk.y})→(${moved.x},${moved.y})`);

  // 10 paso descubierto
  const baseBefore = await page.$eval('#map-host .layer-base', (n) => n.innerHTML);
  await page.click('.tool[data-tool="passage"]');
  await clickMap(page, 400, 200); await clickMap(page, 400, 420);
  let ps = (await S(page)).passages[0];
  const ep = await toScreen(page, ps.b.x, ps.b.y);
  await page.mouse.move(ep.x, ep.y); await page.mouse.down(); await page.mouse.move(ep.x + 40, ep.y, { steps: 5 }); await page.mouse.up();
  const ps2 = (await S(page)).passages[0];
  const txt = await page.$eval('#map-host .ann-label-passage', (n) => n.textContent);
  const baseAfter = await page.$eval('#map-host .layer-base', (n) => n.innerHTML);
  await page.click('#sel-body button.danger');
  const nPs = (await S(page)).passages.length;
  check(10, 'Paso descubierto: añadir, ajustar extremo y borrar sin tocar el plano', ps && ps2.a.x === ps.a.x && ps2.b.x > ps.b.x + 10 && txt === 'Paso descubierto' && baseBefore === baseAfter && nPs === 0);

  // 12 deshacer / Ctrl+Z en texto / Escape
  const c0 = await S(page);
  await page.click('#btn-undo'); // deshace borrado del paso
  const c1 = await S(page);
  await page.click('#btn-undo'); // deshace ajuste de extremo
  const c2 = await S(page);
  await page.click('#el-list .el-item[data-id="102"]');
  await page.fill('#el-label', 'Puerta forzada'); await page.press('#el-label', 'Enter');
  const withLabel = await S(page);
  await page.click('#el-label'); await page.keyboard.type('xx');
  const undoCount = await page.textContent('#undo-count');
  await page.keyboard.press('Control+z');
  const stillLabel = (await S(page)).elements['102']?.label;
  const undoCount2 = await page.textContent('#undo-count');
  await page.click('#map-floor-name', { force: true }).catch(() => {});
  await page.locator('#btn-fit').focus();
  await page.keyboard.press('Control+z');
  const noLabel = (await S(page)).elements['102'];
  // marcador: deshacer restaura posición previa
  const mBefore = (await S(page)).marker;
  await page.click('.tool[data-tool="marker"]'); await clickMap(page, 800, 150);
  await page.keyboard.press('Control+z');
  const mAfter = (await S(page)).marker;
  // Escape cancela colocación pendiente
  await page.click('.tool[data-tool="passage"]'); await clickMap(page, 300, 200);
  await page.keyboard.press('Escape');
  await clickMap(page, 500, 200);
  const toolNow = await page.$eval('.tool[aria-pressed="true"]', (b) => b.dataset.tool);
  const nPass = (await S(page)).passages.length;
  check(12, 'Deshacer restaura anotaciones, etiquetas y marcador; no intercepta en texto; Esc cancela',
    c0.passages.length === 0 && c1.passages.length === 1 && c2.passages[0].b.x === ps.b.x && withLabel.elements['102']?.label === 'Puerta forzada'
    && stillLabel === 'Puerta forzada' && undoCount === undoCount2 && !noLabel && mAfter.x === mBefore.x && mAfter.y === mBefore.y && toolNow === 'select' && nPass === 1,
    `undoCount ${undoCount}/${undoCount2}`);
  await page.screenshot({ path: `${SHOTS}/director-1920.png` });
  console.log('errores de página', page._errs);
  await ctx.close();
}

// ======================================================= 13–16 transmisión
{
  const { ctx, page } = await newDirector();
  const [player] = await Promise.all([ctx.waitForEvent('page'), page.click('#btn-open-player')]);
  await player.setViewportSize({ width: 1920, height: 1080 });
  await player.waitForSelector('#player:not([hidden])');
  await player.waitForTimeout(200);
  const both = !(await page.isClosed()) && !(await player.isClosed()) && player.url().includes('view=player');
  // popup bloqueado → alternativa
  const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const p2 = await ctx2.newPage(); await p2.addInitScript(() => { window.open = () => null; });
  await p2.goto(BASE); await p2.waitForSelector('#director:not([hidden])');
  await p2.click('#btn-open-player');
  const alertVis = await p2.isVisible('#popup-alert');
  await p2.click('#btn-clean-mode');
  const cleanOk = (await p2.isVisible('#player')) && !(await p2.isVisible('#director'));
  await p2.screenshot({ path: `${SHOTS}/modo-limpio-1366.png` });
  await p2.keyboard.press('Escape');
  const backOk = await p2.isVisible('#director');
  await ctx2.close();
  check(13, 'Abrir vista de jugadores con un clic; alternativa si se bloquea (modo limpio)', both && alertVis && cleanOk && backOk);

  // 14 diez cambios sucesivos
  const lat = [];
  const waitPlayer = async (fn) => { const t0 = Date.now(); await player.waitForFunction(fn, null, { timeout: 3000, polling: 'raf' }); return Date.now() - t0; };
  const ops = [
    async () => { await floor(page, 'N2'); return () => document.querySelector('#player-floor').textContent.includes('−2'); },
    async () => { await page.click('#el-list .el-item[data-id="207"]'); await setPass(page, 'blocked'); return () => !!document.querySelector('#player-map .st-blocked'); },
    async () => { await page.click('#sel-body .o-cont'); return () => !!document.querySelector('#player-map .st-cont'); },
    async () => { await page.click('.tool[data-tool="marker"]'); await clickMap(page, 500, 300); return () => !!document.querySelector('#player-map .beta-marker'); },
    async () => { await page.click('.tool[data-tool="block"]'); await clickMap(page, 250, 300); return () => !!document.querySelector('#player-map .ann-block'); },
    async () => { await page.click('.tool[data-tool="passage"]'); await clickMap(page, 600, 200); await clickMap(page, 600, 420); return () => !!document.querySelector('#player-map .ann-passage'); },
    async () => { await floor(page, 'N3'); return () => document.querySelector('#player-floor').textContent.includes('−3'); },
    async () => { window0 = await player.evaluate(() => parseFloat(document.querySelector('#player-map .world').getAttribute('transform').split('scale(')[1])); await page.click('#btn-zoom-in'); await page.click('#btn-zoom-in'); return `parseFloat(document.querySelector('#player-map .world').getAttribute('transform').split('scale(')[1]) > ${window0} * 1.4`; },
    async () => { await page.click('#btn-fit'); return `Math.abs(parseFloat(document.querySelector('#player-map .world').getAttribute('transform').split('scale(')[1]) - ${window0}) < 0.01`; },
    async () => { await page.click('#btn-marker-vis'); return () => !document.querySelector('#player-map .beta-marker') && document.querySelector('#player-beta').textContent === ''; },
  ];
  let fails = 0; let window0 = 0;
  for (const op of ops) { const fn = await op(); try { lat.push(await waitPlayer(fn)); } catch { fails++; lat.push(9999); } }
  const max = Math.max(...lat);
  check(14, 'Diez cambios reflejados sin recargar (<1 s cada uno)', fails === 0 && max < 1000, `latencias ms: ${lat.join(',')}`);
  await page.click('#btn-marker-vis');

  // 15 ficha solo con visibilidad activada; legibilidad
  await floor(page, 'N3');
  await page.click('#el-list .el-item[data-id="307"]');
  await player.waitForTimeout(250);
  const cardHidden = await player.isHidden('#pcard');
  await page.check('#chk-show-card');
  await player.waitForSelector('#pcard:not([hidden])', { timeout: 1500 });
  const cardTxt = await player.textContent('#pcard');
  await page.click('#el-list .el-item[data-id="307"]');
  await setPass(page, 'open');
  await page.fill('#el-label', '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>'); await page.press('#el-label', 'Enter');
  await player.waitForTimeout(300);
  const pTxt = await player.textContent('#pcard');
  const pwned = await player.evaluate(() => window.__pwned) || await page.evaluate(() => window.__pwned);
  const imgs = await player.$$eval('#pcard img, #player-map img', (n) => n.length);
  await player.screenshot({ path: `${SHOTS}/jugadores-1920.png` });
  await player.setViewportSize({ width: 1366, height: 768 }); await player.waitForTimeout(250);
  const legendFits = await player.evaluate(() => { const l = document.querySelector('#legend').getBoundingClientRect(); const c = document.querySelector('#pcard').getBoundingClientRect(); return l.bottom <= innerHeight && c.bottom <= innerHeight && l.bottom <= c.top + 1; });
  const mapFits = await player.evaluate(() => { const r = document.querySelector('#player-map .layer-base svg').getBoundingClientRect(); const h = document.querySelector('#player-map').getBoundingClientRect(); return r.width > 700; });
  await player.screenshot({ path: `${SHOTS}/jugadores-1366.png` });
  await page.uncheck('#chk-share-frame');
  await player.waitForTimeout(250);
  const fullFits = await player.evaluate(() => { const r = document.querySelector('#player-map .layer-base svg').getBoundingClientRect(); const h = document.querySelector('#player-map').getBoundingClientRect(); return r.left >= h.left - 1 && r.right <= h.right + 1 && r.top >= h.top - 1 && r.bottom <= h.bottom + 1; });
  check(15, 'Ficha pública solo con el control activo; legible a 1920 y 1366', cardHidden && cardTxt.includes('307 · Cámara de contención') && legendFits && mapFits && fullFits, `legendFits=${legendFits} fullFits=${fullFits}`);
  check(19.5, 'Etiqueta con HTML/script se muestra como texto (parte de 19)', pTxt.includes('<script>') && !pwned && imgs === 0);

  // 16 sin controles de edición en jugadores
  const visibleButtons = await player.$$eval('button, input, select, textarea', (n) => n.filter((x) => x.checkVisibility()).map((x) => x.id || x.textContent.trim()));
  await player.click('#player-map', { position: { x: 400, y: 300 } });
  for (const k of ['Control+z', 'Delete', 'Escape', 'b', 'Enter']) await player.keyboard.press(k);
  const txtPlayer = await player.evaluate(() => document.body.innerText);
  const noInternal = !/Guardado|Exportar|Importar|Deshacer|Bloqueo:/.test(txtPlayer);
  await player.setViewportSize({ width: 1920, height: 1080 });
  await player.click('#btn-fullscreen');
  await player.waitForTimeout(400);
  const isFs = await player.evaluate(() => !!document.fullscreenElement);
  const fsHidden = isFs ? await player.isHidden('#btn-fullscreen') : null;
  if (isFs) { await player.evaluate(() => document.exitFullscreen()); await player.waitForTimeout(300); }
  const fsBack = await player.isVisible('#btn-fullscreen');
  check(16, 'Jugadores sin controles de edición ni avisos internos; pantalla completa y salida', visibleButtons.join() === 'btn-fullscreen' && noInternal && (isFs ? fsHidden && fsBack : true),
    `botones=${visibleButtons.join('|')} fullscreen=${isFs}${isFs ? '' : ' (no soportado en headless: no verificado)'}`);
  results.find((r) => r.n === 16).fsVerified = isFs;
  await page.screenshot({ path: `${SHOTS}/director-con-ficha-1920.png` });
  await ctx.close();
}

// ======================================================= 17 persistencia (incl. cerrar y reabrir el navegador)
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 's67-'));
  let pctx = await chromium.launchPersistentContext(dir, { ...launchOpts, viewport: { width: 1600, height: 900 } });
  let page = pctx.pages()[0] || await pctx.newPage();
  await page.goto(BASE); await page.waitForSelector('#director:not([hidden])');
  await floor(page, 'N2');
  await page.click('.tool[data-tool="marker"]'); await clickMap(page, 300, 450);
  await page.click('#el-list .el-item[data-id="204"]'); await setPass(page, 'blocked'); await page.fill('#el-label', 'Tejido en el acceso este'); await page.press('#el-label', 'Enter');
  await floor(page, 'N3');
  await page.click('.tool[data-tool="block"]'); await clickMap(page, 500, 300);
  await page.click('.tool[data-tool="passage"]'); await clickMap(page, 200, 200); await clickMap(page, 200, 450);
  const snap = await S(page);
  await page.reload(); await page.waitForSelector('#director:not([hidden])');
  const r1 = await S(page);
  const floorAfter = await page.$eval('.floor-tab[aria-selected="true"]', (b) => b.dataset.floor);
  await pctx.close();
  pctx = await chromium.launchPersistentContext(dir, { ...launchOpts, viewport: { width: 1600, height: 900 } });
  page = pctx.pages()[0] || await pctx.newPage();
  await page.goto(BASE); await page.waitForSelector('#director:not([hidden])');
  const r2 = await S(page);
  await pctx.close();
  check(17, 'Recargar y reabrir el navegador conserva marcador, etiquetas, estados y anotaciones', JSON.stringify(r1) === JSON.stringify(snap) && JSON.stringify(r2) === JSON.stringify(snap) && snap.marker.floor === 'N2' && snap.blocks[0].floor === 'N3' && floorAfter === 'N3');
}

// ======================================================= 18–19 exportar/importar y rechazos
{
  const { ctx, page } = await newDirector();
  await floor(page, 'N1');
  await page.click('#el-list .el-item[data-id="103"]'); await setPass(page, 'open');
  await page.click('.tool[data-tool="block"]'); await clickMap(page, 700, 300);
  await page.click('.tool[data-tool="marker"]'); await clickMap(page, 100, 300);
  const orig = await S(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export')]);
  const file = path.join(os.tmpdir(), 'export.json'); await dl.saveAs(file);
  // modificar
  await page.click('#el-list .el-item[data-id="103"]'); await setPass(page, 'blocked');
  await page.click('.tool[data-tool="marker"]'); await clickMap(page, 900, 500);
  const modified = await S(page);
  // importar y cancelar
  await page.setInputFiles('#file-import', file);
  await page.waitForSelector('#dlg[open]');
  const summary = await page.textContent('#dlg-body');
  await page.click('#dlg-actions button:has-text("Cancelar")'); await page.waitForTimeout(100);
  const afterCancel = await S(page);
  // importar y confirmar
  await page.setInputFiles('#file-import', file);
  await page.waitForSelector('#dlg[open]');
  await page.click('#dlg-actions button:has-text("Reemplazar")'); await page.waitForTimeout(100);
  const restored = await S(page);
  check(18, 'Exportar → modificar → importar reproduce el estado; cancelar no cambia nada', JSON.stringify(restored) === JSON.stringify(orig) && JSON.stringify(afterCancel) === JSON.stringify(modified) && /transitables/.test(summary));

  const good = JSON.parse(fs.readFileSync(file, 'utf8'));
  const bads = {
    corrupto: '{ "schemaVersion": 1, ',
    version: JSON.stringify({ ...good, schemaVersion: 99 }),
    idDesconocido: JSON.stringify({ ...good, content: { ...good.content, elements: { ...good.content.elements, '999': { pass: 'open', contaminated: false, label: '' } } } }),
    coordenadas: JSON.stringify({ ...good, content: { ...good.content, marker: { ...good.content.marker, x: 5000 } } }),
    enumeracion: JSON.stringify({ ...good, content: { ...good.content, elements: { '101': { pass: 'quizas', contaminated: false, label: '' } } } }),
  };
  const ok19 = [];
  for (const [k, txt] of Object.entries(bads)) {
    const before = await S(page);
    const f = path.join(os.tmpdir(), `bad-${k}.json`); fs.writeFileSync(f, txt);
    await page.setInputFiles('#file-import', f);
    await page.waitForSelector('#dlg[open]');
    const t = await page.textContent('#dlg-title');
    await page.click('#dlg-actions button'); await page.waitForTimeout(100);
    const after = await S(page);
    ok19.push(t === 'Importación rechazada' && JSON.stringify(before) === JSON.stringify(after));
  }
  const r195 = results.find((r) => r.n === 19.5);
  check(19, 'JSON corrupto, versión, IDs, enumeraciones y coordenadas se rechazan sin perder estado; etiquetas como texto', ok19.every(Boolean) && r195?.ok, ok19.join(','));
  await ctx.close();
}

// ======================================================= 20 fallo de almacenamiento y guardado dañado
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
  await ctx.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); }; });
  const page = await ctx.newPage(); await page.goto(BASE); await page.waitForSelector('#director:not([hidden])');
  await page.click('#el-list .el-item[data-id="S03"]'); await setPass(page, 'blocked');
  const edited = (await S(page)).elements.S03?.pass === 'blocked';
  const alert = await page.isVisible('#storage-alert');
  const status = await page.textContent('#save-status');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#storage-alert button')]);
  const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  const [player] = await Promise.all([ctx.waitForEvent('page'), page.click('#btn-open-player')]);
  await player.waitForSelector('#player:not([hidden])'); await player.waitForTimeout(400);
  const playerTxt = await player.evaluate(() => document.body.innerText);
  const playerSees = await player.$$eval('#player-map .st-blocked', (n) => n.length);
  await ctx.close();
  // guardado dañado
  const ctx2 = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE); await p2.evaluate(() => { localStorage.setItem('sitio67:mapa:v1', '{"schemaVersion":1, roto'); });
  await p2.reload(); await p2.waitForSelector('#director:not([hidden])');
  const corruptAlert = await p2.textContent('#storage-alert');
  await p2.click('#el-list .el-item[data-id="S02"]'); await setPass(p2, 'open');
  await p2.waitForTimeout(400);
  const raw = await p2.evaluate(() => localStorage.getItem('sitio67:mapa:v1'));
  await ctx2.close();
  check(20, 'Fallo de almacenamiento: edición en memoria, aviso solo al director, exportación; guardado dañado no se destruye',
    edited && alert && /Sin guardar/.test(status) && exported.content.elements.S03.pass === 'blocked' && !/guardar|almacenamiento/i.test(playerTxt) && playerSees === 1
    && /dañado/.test(corruptAlert) && raw === '{"schemaVersion":1, roto');
}

// ======================================================= 21 reinicio
{
  const { ctx, page } = await newDirector();
  await page.evaluate(() => localStorage.setItem('otraapp:dato', 'intacto'));
  await page.click('#el-list .el-item[data-id="S05"]'); await setPass(page, 'blocked');
  await page.click('.tool[data-tool="marker"]'); await clickMap(page, 500, 300);
  const before = await S(page);
  await page.click('#btn-reset'); await page.waitForSelector('#dlg[open]');
  const body = await page.textContent('#dlg-body');
  await page.click('#dlg-actions button:has-text("Cancelar")'); await page.waitForTimeout(100);
  const kept = await S(page);
  await page.click('#btn-reset'); await page.waitForSelector('#dlg[open]');
  await page.click('#dlg-actions button:has-text("Borrar y empezar")'); await page.waitForTimeout(100);
  const reset = await S(page);
  const other = await page.evaluate(() => localStorage.getItem('otraapp:dato'));
  check(21, 'Reiniciar requiere confirmación; cancelar conserva; confirmar restaura; no toca otras claves',
    JSON.stringify(kept) === JSON.stringify(before) && Object.keys(reset.elements).length === 0 && !reset.marker.placed && other === 'intacto' && /Se borrará/.test(body));
  await ctx.close();
}

// ======================================================= 22–23 subruta, sin externos, teclado
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  const bad = []; const ext = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) ext.push(r.url()); });
  page.on('pageerror', (e) => bad.push(e.message));
  await page.goto(BASE); await page.waitForSelector('#director:not([hidden])');
  const absPaths = /(src|href)="\/(?!\/)/.test(fs.readFileSync((process.env.APP || './') + 'index.html', 'utf8')) || /fetch\(['"]\//.test(fs.readFileSync((process.env.APP || './') + 'js/data.js', 'utf8'));
  check(22, `Bajo subruta ${new URL(BASE).pathname}: todos los recursos cargan, sin rutas absolutas ni servicios externos`, bad.length === 0 && ext.length === 0 && !absPaths, [...bad, ...ext].join(' | '));
  await page.screenshot({ path: `${SHOTS}/director-1024.png` });
  // teclado: tab hasta una sala del plano y Enter
  await page.focus('#btn-fit');
  let found = null;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    found = await page.evaluate(() => document.activeElement?.getAttribute('data-id'));
    if (found) break;
  }
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).stroke);
  await page.keyboard.press('Enter');
  const name = await selName(page);
  // radio de estado con teclado
  await page.focus('#sel-body .o-unverified input'); await page.keyboard.press('ArrowRight');
  const st = (await S(page)).elements[found];
  const badgeText = await page.$$eval('#map-host .badge-text', (n) => n.map((x) => x.textContent));
  // flechas en las pestañas de planta
  await page.focus('.floor-tab[aria-selected="true"]'); await page.keyboard.press('ArrowRight');
  const fl = await page.$eval('.floor-tab[aria-selected="true"]', (b) => b.dataset.floor);
  check(23, 'Teclado: sala del plano con Tab+Enter, estados con flechas, foco visible; estados con texto/iconos', found && name.length > 0 && st?.pass === 'open' && outline && outline !== 'none' && badgeText.some((t) => t.includes('TRANSITABLE')) && fl === 'N1', `foco=${found} trazo=${outline}`);
  await ctx.close();
}

await browser.close();
// 24: documentación
const docs = ['README.md', 'CREDITS.md', 'PRUEBAS-RESULTADOS.md'].every((f) => fs.existsSync((process.env.APP || './') + f));
check(24, 'README, créditos y resultados presentes', docs);
fs.writeFileSync('resultados.json', JSON.stringify(results, null, 1));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} aprobadas`);
