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
const chipP = await pl.$$eval('#player-tac .t-chips .chip', (n) => n.length);
await page.keyboard.press('e'); await pl.waitForTimeout(300);
check(7, 'Atajo E oculta y muestra las amenazas sin delatarlo en transmisión', enHiddenP === 0 && enHiddenD === 0 && chipP === 0 && (await plTok('.tok[data-id="mc"]')) === 1);

// 8 · armería
await open('armeria');
const groups = await page.$$eval('#tac-host .tok', (n) => n.filter((x) => x.getAttribute('aria-label').includes('EQUIPO')).length);
await page.click('#tac-panel .cbtn[data-id="i-bf"]'); await page.click('#tac-panel .act[data-act="minus"]'); await page.click('#tac-panel .act[data-act="minus"]');
t = await T();
const igneo = await page.$$eval('#tac-panel .cbtn[data-id="i-ig"]', (n) => n.length);
check(8, 'Armería: 14 grupos, ÍGNEO presente y retirada manual', groups === 14 && igneo === 1 && t.scen.armeria.inv['i-bf'] === 4, `grupos=${groups} campo=${t.scen.armeria.inv['i-bf']}`);

// 9 · patio: jefe final y maletín oculto
await open('superficie');
await page.click('#tac-panel [data-k="escena"][data-v="jefe"]'); await pl.waitForTimeout(300);
const malDir = await page.$$eval('#tac-host .tok[data-id="oig"]', (n) => n.length); const malPl = await plTok('.tok[data-id="oig"]');
const llegada = await page.$$eval('#tac-panel [data-k="escena"]', (n) => n.map((x) => x.dataset.v).join());
check(9, 'Patio: llegada conservada y jefe final con maletín oculto a jugadores', llegada === 'llegada,salida,jefe' && malDir === 1 && malPl === 0);

// 10 · persistencia
await page.reload(); await page.waitForSelector('#director:not([hidden])'); await page.waitForTimeout(100);
const sel = await page.$eval('#scen-select', (s) => s.value);
t = await T();
check(10, 'El escenario activo y su estado sobreviven a la recarga', sel === 'superficie' && t.scen.camara.agents.C.c === 12 && t.scen.superficie.states.escena === 'jefe');

// 11 · volver al plano
await page.click('[data-floor="N2"]'); await pl.waitForTimeout(300);
const back = await page.$eval('#tac-host', (n) => n.hidden) && await pl.$eval('#player-tac', (n) => n.hidden);
check(11, 'Pulsar una planta vuelve al plano general en dirección y transmisión', back);

check(12, 'Sin errores de consola', !errs.length, errs.slice(0, 3).join(' | '));
await browser.close();
const fail = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fail}/${results.length} comprobaciones aprobadas`);
process.exit(fail ? 1 : 0);
