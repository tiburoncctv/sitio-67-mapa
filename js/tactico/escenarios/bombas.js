// 302 Bombas / 303 Control de emergencia — el Racimo. 24 × 18
export default {
  id:'bombas', floor:'N3', rooms:['302', '303'], short:'302 / 303 · Bombas y control',
  crumb:'SITIO-67 / BETA-7 / NIVEL −3', title:'302 · BOMBAS / 303 · CONTROL',
  objective:'Opcional: aislar la línea de descarga operando V y P',
  meta:'NIVEL −3 · 302 / 303 · PASILLO PRINCIPAL AL SUR', cols:24, rows:18,
  legend:['wall','tall','low','glass','door','ag','en','obj'],
  states:[
    {key:'v', label:'VÁLVULA V (302)', def:'off', options:[['off','SIN OPERAR'],['on','OPERADA']]},
    {key:'p', label:'PANEL P (303)', def:'off', options:[['off','SIN OPERAR'],['on','OPERADO']]},
  ],
  starts:[ {code:'C',c:8,r:17}, {code:'M',c:9,r:17}, {code:'L',c:7,r:17}, {code:'T',c:10,r:17} ],
  initialSel:'e1',
  notes:[
    'Tres enemigos: Racimo, Errante y Corredor. Sin Prensor.',
    'Las dos formas comunes permiten la incorporación de la ficha del Racimo; no se consumen al empezar. Solo una fusión o incorporación en preparación a la vez.',
    'El Corredor presiona a quien vaya hacia los mandos; el Errante puede ocupar un acceso.',
    'Con V y P operadas, la línea queda aislada y desaparece la zona de descarga de 307. No aturde al jefe, no activa C1/C2 ni reduce PV.',
    'Se puede intervenir sin matar al Racimo (distraerlo o sortearlo) o saltarse esta sala. C1/C2 no dependen de este minijefe.',
    'Los filamentos del Racimo son visuales: no le dan inmunidades ni habilidades nuevas. Pasarela a la misma cota: no hay reglas de altura.',
  ],
  items:[
    {t:'floor', c:1, r:1, w:15, h:15, s:'room'},
    {t:'floor', c:16, r:1, w:9, h:15, s:'dark'},
    {t:'floor', c:1, r:16, w:24, h:3, s:'corr'},
    {t:'mark', k:'lane', c:14, r:1, w:2, h:14},
    {t:'walls', segs:[[0,0,24,0],[0,0,0,15],[24,0,24,15],[0,15,24,15],[15,0,15,1],[15,7,15,15],[0,18,24,18]]},
    {t:'glass', segs:[[15,1,15,7]]},
    {t:'door', x:7, y:15, o:'h', n:2, k:'double', sw:-1, label:'ACCESO 302'},
    {t:'door', x:19, y:15, o:'h', n:1, k:'swing', sw:-1, label:'ACCESO 303'},
    {t:'door', x:15, y:10, o:'v', n:2, k:'double', sw:1, label:'MANTENIMIENTO', lx:17.9, ly:10.25},
    // tuberías selladas en muros (sin ocupar casillas)
    {t:'raw', layer:'base', svg:(H)=>{ let s=''; s+=H.L(240,9,590,9,'fzd','style="stroke:rgba(201,210,208,.75);stroke-width:5"')+H.L(240,17,590,17,'fzd','style="stroke:rgba(201,210,208,.45);stroke-width:3"');
      s+=H.L(9,40,9,560,'fzd','style="stroke:rgba(201,210,208,.6);stroke-width:5"');
      [300,380,460,540].forEach(x=>s+=H.R(x-3,4,6,18,'fz2'));
      s+=H.P('M540 12 V140','fzd','style="stroke:rgba(201,210,208,.5);stroke-width:3;stroke-dasharray:4 4"');
      s+=`<g class="g-labels">${H.Tx(415,34,'TUBERÍAS SELLADAS','lb-small')}</g>`; return s; }},
    // depósitos y bombas (altos)
    {t:'obj', k:'tank', c:2, r:2, w:4, h:4, label:'DEPÓSITO 1'}, {t:'obj', k:'pump', c:6, r:3, w:2, h:2, label:'BOMBA 1'},
    {t:'obj', k:'tank', c:2, r:10, w:4, h:4, label:'DEPÓSITO 2'}, {t:'obj', k:'pump', c:6, r:11, w:2, h:2, label:'BOMBA 2'},
    {t:'raw', layer:'base', svg:(H)=>H.L(230,160,240,160,'fzd','style="stroke:#c5cbc9;stroke-width:6"')+H.L(230,480,240,480,'fzd','style="stroke:#c5cbc9;stroke-width:6"')},
    {t:'obj', k:'support', c:10, r:7, w:1, h:2, label:'SOPORTE'},
    {t:'obj', k:'valve', c:13, r:4, layer:'objetivos'},
    {t:'obj', k:'panel', c:9, r:1},
    {t:'label', x:14.5, y:14.6, text:'FRANJA DE SERVICIO', s:'small'},
    // control
    {t:'obj', k:'console', c:16, r:2, w:1, h:5, label:'PUESTOS DE OBSERVACIÓN'},
    {t:'obj', k:'chair', c:17, r:3}, {t:'obj', k:'chair', c:17, r:5},
    {t:'obj', k:'panel', c:21, r:4, layer:'objetivos'},
    {t:'obj', k:'rack', c:24, r:2, w:1, h:3, label:'INDICADORES', lx:23.5},
    {t:'obj', k:'desk', c:19, r:8, w:3, h:1},
    {t:'obj', k:'chair', c:20, r:9},
    {t:'obj', k:'lockers', c:24, r:11, w:1, h:3},
    // rótulos
    {t:'label', x:4.5, y:8.1, text:'302 · BOMBAS', s:'code'},
    {t:'label', x:20, y:12.8, text:'303 · CONTROL DE EMERGENCIA', s:'code'},
    {t:'label', x:12, y:17.6, text:'PASILLO PRINCIPAL · NIVEL −3', s:'room'},
    {t:'label', x:0.3, y:17.1, text:'← HACIA A', s:'small', anchor:'start'},
    {t:'label', x:23.7, y:17.1, text:'HACIA B →', s:'small', anchor:'end'},
    // dirección
    {t:'zone', k:'arrow', d:'M500 340 H560 V420 H600', head:'M592 412 L604 420 L592 428', label:'RACIMO → PUERTA INTERNA', lx:12.6, ly:10.2},
  ],
  contacts:[
    {id:'e1', kind:'en', code:'E1', name:'Racimo', c:11, r:7, w:2, h:2, body:'racimo', links:[[10.5,7.2],[10.5,8.8],[11.6,0.35],[12.6,0.35],[9.5,1.6]],
      desc:'Varios cuerpos fundidos en uno, unido por filamentos a un soporte de conducciones y a las tuberías del techo norte.',
      note:'Huella 2 × 2. Pasos de tres casillas al este (col. 13–15) y entre depósitos (filas 6–9). Recorrido libre hasta la puerta interna.'},
    {id:'e2', kind:'en', code:'E2', name:'Errante', c:9, r:11, body:'errante',
      desc:'Silueta humana deformada entre la bomba 2 y el acceso a la sala.', note:'Puede ocupar el acceso 302.'},
    {id:'e3', kind:'en', code:'E3', name:'Corredor', c:13, r:12, body:'corredor', face:'n',
      desc:'Figura baja y alargada en la franja de servicio.', note:'Presiona a quien vaya hacia V o hacia la puerta de mantenimiento.'},
    {id:'v', kind:'obj', code:'V', name:'Válvula manual V', short:'V', c:13, r:4, stateKey:'v', onVal:'on',
      desc:'Válvula de volante en la sala de bombas, con espacio libre alrededor. Se opera con autorización ordinaria.', note:'Una acción adyacente.'},
    {id:'p', kind:'obj', code:'P', name:'Panel P', short:'P', c:21, r:4, stateKey:'p', onVal:'on',
      desc:'Panel de control en 303, con espacio libre alrededor. Se opera con autorización ordinaria.', note:'Una acción adyacente. Con V también operada, la línea de descarga queda aislada.'},
  ],
};
