// Pruebas de aceptación de los escenarios tácticos (Playwright, Chrome headless).
// Uso: sirve la carpeta padre del repositorio y ejecuta
//   BASE=http://localhost:8765/sitio-67-mapa/ node pruebas/tactico.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8765/sitio-67-mapa/';
const results = [];
const check = (n, name, ok, detail = '') => { results.push({ n, name, ok: !!ok }); console.log(`${ok ? 'OK  ' : 'FAIL'} [${n}] ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(BASE);
await page.waitForSelector('#director:not([hidden])');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#director:not([hidden])');

const T = () => page.evaluate(() => window.__sitio67.tactico);
const cellPoint = (c, r, host = '#tac-host') => page.evaluate(([c, r, host]) => {
  const s = document.querySelector(`${host} .t-svg`); const m = s.getScreenCTM();
  const p = new DOMPoint((c - 1) * 40 + 20, (r - 1) * 40 + 20).matrixTransform(m); return { x: p.x, y: p.y };
}, [c, r, host]);
const open = async (id) => { await page.selectOption('#scen-select', id); await page.waitForTimeout(80); };

// 1 · todos los escenarios cargan
const ids = await page.$$eval('#scen-select option', (o) => o.map((x) => x.value).filter(Boolean));
const counts = {};
for (const id of ids) { await open(id); counts[id] = await page.$$eval('#tac-host .t-svg .tok', (n) => n.length); }
check(1, 'Siete escenarios cargan sin errores', ids.length === 7 && !errs.length, `${ids.join(', ')} · errores=${errs.length}`);

// 2 · Beta-7 no se coloca solo; inserción manual de los seis
await open('camara');
const before = await page.$$eval('#tac-host .tok[data-id^="ag-"]', (n) => n.length);
const codes = ['C', 'M', 'L', 'T', 'TE', 'D'];
for (let i = 0; i < codes.length; i++) { await page.click(`.agbtn[data-code="${codes[i]}"]`); const p = await cellPoint(10 + i, 3); await page.mouse.click(p.x, p.y); await page.waitForTimeout(30); }
let t = await T();
check(2, 'Beta-7 se inserta a mano: 0 al abrir, 6 tras insertar (incluye TE y D)', before === 0 && Object.keys(t.scen.camara.agents).length === 6 && t.scen.camara.agents.TE.c === 14 && t.scen.camara.agents.D.c === 15, JSON.stringify(t.scen.camara.agents));

// 3 · arrastrar un agente y la masa
const a0 = await cellPoint(10, 3); const a1 = await cellPoint(12, 6);
await page.mouse.move(a0.x, a0.y); await page.mouse.down(); await page.mouse.move(a1.x, a1.y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(50);
const m0 = await cellPoint(14, 14); const m1 = await cellPoint(14, 12);
await page.mouse.move(m0.x, m0.y); await page.mouse.down(); await page.mouse.move(m1.x, m1.y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(50);
t = await T();
const massPos = Object.entries(t.scen.camara.pos).find(([k]) => k.startsWith('mc'))?.[1];
check(3, 'Los iconos se arrastran por casillas (agente y amenaza 4 × 4)', t.scen.camara.agents.C.c === 12 && t.scen.camara.agents.C.r === 6 && massPos && massPos.c === 13 && massPos.r === 11, `C=${JSON.stringify(t.scen.camara.agents.C)} masa=${JSON.stringify(massPos)}`);

// 4 · flechas
await page.focus('#tac-host .tok[data-id="ag-M"]'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
t = await T();
check(4, 'Las flechas mueven el icono enfocado', t.scen.camara.agents.M.r === 5, JSON.stringify(t.scen.camara.agents.M));

// 5–7 · transmisión: revelado, L y E
const pl = await ctx.newPage(); await pl.goto(BASE + '?view=player'); await pl.waitForTimeout(500);
const plTok = (sel) => pl.$$eval(`#player-tac ${sel}`, (n) => n.length);
// la masa de 307 empieza revelada: se oculta y se vuelve a revelar desde su ficha
const startMass = await plTok('.tok[data-id="mc"]');
await page.click('#tac-panel .cbtn[data-id="mc"]'); await page.click('#tac-panel .act[data-act="rev"]'); await pl.waitForTimeout(300);
const hiddenMass = await plTok('.tok[data-id="mc"]');
await page.click('#tac-panel .act[data-act="rev"]'); await pl.waitForTimeout(300);
const shownMass = await plTok('.tok[data-id="mc"]');
check(5, 'La transmisión muestra el escenario y solo los contactos revelados', startMass === 1 && hiddenMass === 0 && shownMass === 1 && (await plTok('.tok[data-id^="ag-"]')) === 6, `inicio=${startMass} oculta=${hiddenMass} revelada=${shownMass}`);
await page.click('#tac-host .t-title'); await page.keyboard.press('l'); await pl.waitForTimeout(300);
const legHidden = await pl.$eval('#player-tac .tac', (n) => n.classList.contains('no-legend')) && await page.$eval('#tac-host .tac', (n) => n.classList.contains('no-legend'));
await page.keyboard.press('l'); await pl.waitForTimeout(200);
const legBack = !(await pl.$eval('#player-tac .tac', (n) => n.classList.contains('no-legend')));
check(6, 'Atajo L oculta y muestra toda la leyenda (dirección y transmisión)', legHidden && legBack);
await page.keyboard.press('e'); await pl.waitForTimeout(300);
const enHiddenP = await plTok('.tok[data-id="mc"]'); const enHiddenD = await page.$$eval('#tac-host .tok[data-id="mc"]', (n) => n.length);
const layerChk = await page.$eval('#tac-panel input[data-layer="contactos"]', (n) => n.checked);
const chipP = await pl.$$eval('#player-tac .t-chips .chip', (n) => n.length);
await page.keyboard.press('e'); await pl.waitForTimeout(300);
const dbg7 = JSON.stringify({ enHiddenP, enHiddenD, layerChk, chipP });
check(7, 'Atajo E oculta y muestra la capa Contactos (dirección y transmisión)', enHiddenP === 0 && enHiddenD === 0 && !layerChk && chipP === 0 && (await plTok('.tok[data-id="mc"]')) === 1 && await page.$eval('#tac-panel input[data-layer="contactos"]', (n) => n.checked), dbg7);

// 8 · armería
await open('armeria');
const groups = await page.$$eval('#tac-host .tok', (n) => n.filter((x) => x.getAttribute('aria-label').includes('EQUIPO')).length);
await page.click('#tac-panel .cbtn[data-id="i-bf"]'); await page.click('#tac-panel .act[data-act="minus"]'); await page.click('#tac-panel .act[data-act="minus"]');
t = await T();
const igneo = await page.$$eval('#tac-panel .cbtn[data-id="i-ig"]', (n) => n.length);
check(8, 'Armería: 14 grupos, ÍGNEO presente y retirada manual', groups === 14 && igneo === 1 && t.scen.armeria.inv['i-bf'] === 4, `grupos=${groups} campo=${t.scen.armeria.inv['i-bf']}`);

// 9 · patio: jefe final y maletín oculto
await open('superficie');
const escenasAntes = await page.$$eval('#tac-panel [data-k="escena"]', (n) => n.map((x) => x.dataset.v).join());
await page.click('#tac-host .t-title'); await page.keyboard.press('Shift+Digit3'); await pl.waitForTimeout(300);
const malDir = await page.$$eval('#tac-host .tok[data-id="oig"]', (n) => n.length); const malPl = await plTok('.tok[data-id="oig"]');
const escenasJefe = await page.$$eval('#tac-panel [data-k="escena"]', (n) => n.map((x) => x.dataset.v).join());
const notaJefe = await page.$eval('#tac-panel', (n) => n.textContent.includes('Extracción con jefe final'));
check(9, 'Patio: Mayús+3 pasa al jefe final sin que el panel delate las otras escenas', escenasAntes === 'llegada' && escenasJefe === 'jefe' && malDir === 1 && malPl === 0 && notaJefe, `antes=${escenasAntes} después=${escenasJefe}`);

// 10 · persistencia
await page.reload(); await page.waitForSelector('#director:not([hidden])'); await page.waitForTimeout(100);
const sel = await page.$eval('#scen-select', (s) => s.value);
t = await T();
check(10, 'El escenario activo y su estado sobreviven a la recarga', sel === 'superficie' && t.scen.camara.agents.C.c === 12 && t.scen.superficie.states.escena === 'jefe');

// 11 · volver al plano
await page.click('[data-floor="N2"]'); await pl.waitForTimeout(300);
const back = await page.$eval('#tac-host', (n) => n.hidden) && await pl.$eval('#player-tac', (n) => n.hidden);
check(11, 'Pulsar una planta vuelve al plano general en dirección y transmisión', back);

// 12 · arrastrar un icono ya seleccionado; arrastrar no selecciona
await open('camara');
await page.click('#tac-panel .cbtn[data-id="ag-L"]'); await page.waitForTimeout(50);
const selBefore = await page.$$eval('#tac-host .sel', (n) => n.length);
t = await T(); const L0 = t.scen.camara.agents.L;
let p0 = await cellPoint(L0.c, L0.r), p1 = await cellPoint(L0.c + 2, L0.r + 4);
await page.mouse.move(p0.x, p0.y); await page.mouse.down(); await page.mouse.move(p1.x, p1.y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(60);
t = await T(); const L1 = t.scen.camara.agents.L;
await page.keyboard.press('Escape'); await page.click('#tac-host .t-title'); await page.waitForTimeout(40);
const T0 = t.scen.camara.agents.T; p0 = await cellPoint(T0.c, T0.r); p1 = await cellPoint(T0.c, T0.r + 3);
const selIdle = await page.$$eval('#tac-host .sel', (n) => n.length);
await page.mouse.move(p0.x, p0.y); await page.mouse.down(); await page.mouse.move(p1.x, p1.y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(60);
t = await T(); const selAfter = await page.$$eval('#tac-host .sel', (n) => n.length); const selId = await page.evaluate(() => document.querySelector('#tac-panel .cbtn[aria-pressed="true"], #tac-panel .cbtn.on')?.dataset.id);
check(12, 'Un icono seleccionado se arrastra y arrastrar no selecciona', selBefore === 1 && L1.c === L0.c + 2 && L1.r === L0.r + 4 && t.scen.camara.agents.T.r === T0.r + 3 && selAfter === selIdle && selId !== 'ag-T', `L ${JSON.stringify(L0)}→${JSON.stringify(L1)} sel antes=${selBefore} reposo=${selIdle} tras arrastre=${selAfter} seleccionado=${selId}`);

// 13 · Alt+1..4 añade amenazas comunes bajo el cursor; Supr las borra
const hc = await cellPoint(4, 4); await page.mouse.move(hc.x, hc.y);
await page.keyboard.press('Alt+Digit1'); await page.keyboard.press('Alt+Digit4'); await pl.waitForTimeout(250);
t = await T(); const ex = t.scen.camara.extra;
const exPl = await pl.$$eval('#player-tac .tok', (n) => n.filter((x) => /^x/.test(x.dataset.id)).length);
await page.focus(`#tac-host .tok[data-id="${ex[0].id}"]`); await page.keyboard.press('Delete'); await page.waitForTimeout(60);
t = await T();
check(13, 'Alt+1 añade un Errante bajo el cursor (visible en transmisión), Alt+4 un Ariete y Supr lo borra', ex.length === 2 && ex[0].type === 'errante' && ex[0].c === 4 && ex[0].r === 4 && ex[1].type === 'ariete' && exPl === 2 && t.scen.camara.extra.length === 1, JSON.stringify(ex));

// 14 · H oculta toda la interfaz salvo la cabecera; se puede seguir arrastrando
await page.click('#tac-host .t-title'); await page.keyboard.press('h'); await page.waitForTimeout(150);
const vis = (sel) => page.$eval(sel, (n) => !!(n.offsetWidth || n.offsetHeight));
const uiHidden = !(await vis('.topbar')) && !(await vis('.toolbar')) && !(await vis('#panel')) && await vis('#tac-host .t-head');
const unrevShown = await page.$$eval('#tac-host .tok.unrev', (n) => n.length);
t = await T(); const C0 = t.scen.camara.agents.C; p0 = await cellPoint(C0.c, C0.r); p1 = await cellPoint(C0.c + 1, C0.r);
await page.mouse.move(p0.x, p0.y); await page.mouse.down(); await page.mouse.move(p1.x, p1.y, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(60);
t = await T(); const dragged = t.scen.camara.agents.C.c === C0.c + 1;
await page.keyboard.press('h'); await page.waitForTimeout(100);
check(14, 'H: modo transmisión sin interfaz, sin amenazas ocultas y con arrastre', uiHidden && unrevShown === 0 && dragged && await vis('.topbar'), `ui=${uiHidden} ocultas=${unrevShown} arrastre=${dragged}`);

// 15 · 203/204: E revela el lado de entrada y R el otro
await open('laboratorios');
const labPl = async () => { await pl.waitForTimeout(250); const v = await pl.$$eval('#player-tac .tok', (n) => n.map((x) => x.dataset.id)); return ['e1', 'e2', 'e3'].map((i) => v.includes(i) ? 1 : 0).join(''); };
const r0 = await labPl(); const dirSees = await page.$$eval('#tac-host .tok.unrev', (n) => n.filter((x) => /^e\d$/.test(x.dataset.id)).length);
await page.click('#tac-host .t-title'); await page.keyboard.press('e'); const r1 = await labPl();
await page.keyboard.press('r'); const r2 = await labPl();
await page.keyboard.press('Shift+Digit4'); await page.keyboard.press('e'); const r3 = await labPl();
check(15, '203/204: E muestra los contactos del lado de entrada y R los del otro lado', r0 === '000' && dirSees === 3 && r1 === '100' && r2 === '111' && r3 === '100', `inicio=${r0} dirección=${dirSees} E=${r1} R=${r2} entrada 204 + E=${r3}`);

check(16, 'Sin errores de consola', !errs.length, errs.slice(0, 3).join(' | '));
await browser.close();
const fail = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fail}/${results.length} comprobaciones aprobadas`);
process.exit(fail ? 1 : 0);
