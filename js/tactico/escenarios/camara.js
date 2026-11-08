// 307 · Cámara de contención — primera fase. 28 × 22
export default {
  id:'camara', floor:'N3', rooms:['307'], short:'307 · Cámara de contención',
  crumb:'SITIO-67 / BETA-7 / NIVEL −3', title:'307 · CÁMARA DE CONTENCIÓN',
  objective:'Activar C1 y C2 y salir por PT',
  meta:'NIVEL −3 · 307 · PRIMERA FASE', cols:28, rows:22, margin:{t:62,b:62},
  legend:['wall','tall','low','hazard','door','ag','en','obj'],
  states:[
    {key:'masa', label:'MASA DE CONVERGENCIA', def:'activa', options:[['activa','ACTIVA'],['aturdida','ATURDIDA']]},
    {key:'c1', label:'TERMINAL C1', def:'off', options:[['off','SIN ACTIVAR'],['on','ACTIVADO']]},
    {key:'c2', label:'TERMINAL C2', def:'off', options:[['off','SIN ACTIVAR'],['on','ACTIVADO']]},
    {key:'seq', label:'SECUENCIA', def:'pend', options:[['pend','PENDIENTE'],['ok','CONFIRMADA']]},
    {key:'desc', label:'DESCARGA LATERAL (DEPENDE DE 302/303)', def:'activa', options:[['activa','ACTIVA'],['aislada','AISLADA']]},
  ],
  hotkeys:[['masa',null],['c1',null],['c2',null],['seq',null],['desc',null]],
  starts:[ {code:'C',c:14,r:2}, {code:'M',c:15,r:2}, {code:'L',c:13,r:3}, {code:'T',c:16,r:3} ],
  initialSel:'mc',
  notes:[
    'Composición actual: solo la Masa de Convergencia. No añadir criaturas menores en esta fase.',
    'Ficha existente: daño acumulado para aturdir, una activación por ventana y una sola reserva de PV entre fases.',
    'Si la masa muere aquí, ambos terminales pueden completarse sin más aturdimientos y no hay jefe exterior.',
    'Los dispositivos armados no se reinician. Los estados de esta vista son de presentación y se cambian a mano.',
    'La descarga lateral queda aislada si el grupo opera V (302) y P (303). Daño y cadencia aún sin fijar: el dibujo no los define.',
    'Rutas: C2 → PT por el borde sur; C1 → franja sur (filas 19–21) → PT. El cuerpo de la masa nunca es el único paso.',
  ],
  items:[
    // exterior
    {t:'floor', c:13, r:0.4, w:4, h:0.6, s:'out'},
    {t:'label', x:15, y:-1.15, text:'↑ PASILLO PRINCIPAL · NIVEL −3', s:'ext', always:true},
    {t:'floor', c:22, r:23, w:6, h:0.7, s:'out'},
    {t:'label', x:24.5, y:23.05, text:'PM · PASILLO DE MANTENIMIENTO → ESCALERA B', s:'ext', always:true},
    // suelo
    {t:'floor', c:1, r:1, w:28, h:22, s:'room'},
    {t:'mark', k:'contain', c:11, r:11, w:8, h:8},
    {t:'mark', k:'tape', c:8, r:17, w:3, h:3},
    {t:'mark', k:'tape', c:19, r:17, w:3, h:3},
    {t:'mark', k:'walk', c:13, r:1, w:4, h:3},
    {t:'mark', k:'hazard', c:4, r:9, w:2, h:6, when:{desc:'activa'}},
    {t:'mark', k:'hazard', c:4, r:9, w:2, h:6, off:true, when:{desc:'aislada'}},
    // muros
    {t:'walls', segs:[[0,0,28,0],[0,0,0,22],[0,22,28,22],[28,0,28,22]]},
    {t:'door', x:13, y:0, o:'h', n:2, k:'double', sw:1},
    {t:'door', x:24, y:22, o:'h', n:1, k:'slide', label:'PT', ly:21.55},
    // pilares (altos)
    {t:'obj', k:'pillar', c:6, r:5, w:2, h:2}, {t:'obj', k:'pillar', c:21, r:5, w:2, h:2},
    {t:'obj', k:'pillar', c:6, r:15, w:2, h:2}, {t:'obj', k:'pillar', c:21, r:15, w:2, h:2},
    // estaciones de observación (bajas)
    {t:'obj', k:'station', c:3, r:3, w:2, h:1, label:'ESTACIÓN DE OBSERVACIÓN'},
    {t:'obj', k:'chair', c:3, r:4},
    {t:'obj', k:'station', c:24, r:3, w:2, h:1, label:'ESTACIÓN DE OBSERVACIÓN'},
    {t:'obj', k:'chair', c:25, r:4},
    // terminales
    {t:'obj', k:'terminal', c:9, r:18, layer:'objetivos'},
    {t:'obj', k:'terminal', c:20, r:18, layer:'objetivos'},
    // soportes del sistema de sujeción (bajos)
    {t:'obj', k:'anchor', c:11, r:11}, {t:'obj', k:'anchor', c:18, r:11},
    {t:'obj', k:'anchor', c:11, r:18}, {t:'obj', k:'anchor', c:18, r:18},
    {t:'raw', layer:'mobiliario', svg:(H)=>{ const C=H.C; let s='';
      [[10.5,10.5,1,1],[17.5,10.5,-1,1],[10.5,17.5,1,-1],[17.5,17.5,-1,-1]].forEach(([a,b,dx,dy])=>{
        const x=a*C, y=b*C, ex=x+dx*34, ey=y+dy*30;
        s+=H.L(x,y,ex,ey,'fzd','style="stroke:rgba(233,236,234,.7);stroke-width:4"');
        s+=H.P(`M${ex} ${ey} l${dx*5} ${dy*-3} l${dx*2} ${dy*6} l${dx*5} ${dy*-2}`,'fzd','style="stroke:rgba(233,236,234,.7);stroke-width:2"');
        s+=H.P(`M${x} ${y} q${dx*20} ${dy*30} ${dx*12} ${dy*48}`,'fzd','style="stroke-dasharray:3 3"'); });
      return s; }},
    // descarga lateral: colector, boquillas e indicador de presión
    {t:'raw', layer:'base', svg:(H, st)=>{ const C=H.C; const on=st.states.desc==='activa'; let s='';
      s+=H.R(0.15*C, 8.6*C, 2.7*C, 8, 'fz2'); // conducto empotrado
      s+=H.L(3*C, 8.75*C, 3*C, 14*C, 'fzd', 'style="stroke:rgba(233,236,234,.55);stroke-width:5"');
      for(let r=9;r<=14;r++) for(let c=4;c<=5;c++) s+=H.Ci((c-0.5)*C,(r-0.5)*C,4,'fz2',`style="stroke:${on?'#ff6a2a':'#48d8d8'};fill:#0b0c0c"`);
      const gx=2*C, gy=7.6*C; s+=H.Ci(gx,gy,13,'screen')+H.P(`M${gx-9} ${gy+5} A10 10 0 0 1 ${gx+9} ${gy+5}`,'fzd',`style="stroke:${on?'#ff6a2a':'#48d8d8'};stroke-width:2"`);
      const ang = on ? -25 : -160, rad = ang*Math.PI/180; s+=H.L(gx,gy,gx+Math.cos(rad)*10,gy+Math.sin(rad)*10,'fzd','style="stroke:#e9ecea;stroke-width:2"');
      s+=`<g class="g-labels">${H.Tx(gx,gy-17,on?'PRESIÓN · LÍNEA ACTIVA':'PRESIÓN · LÍNEA AISLADA','lb-small',`style="fill:${on?'#ff9a6e':'#48d8d8'}"`)}</g>`;
      return s; }},
    // secuencia confirmada
    {t:'raw', layer:'objetivos', when:{seq:'ok'}, svg:(H)=>{ const C=H.C; return H.P(`M${8.5*C} ${19.6*C} V${20.5*C} H${19.5*C} V${19.6*C}`,'fzd','style="stroke:#48d8d8;stroke-width:2;stroke-dasharray:6 4"')+H.Tx(14*C,20.5*C+14,'SECUENCIA CONFIRMADA','lb-small','style="fill:#48d8d8;font-size:10px"'); }},
    // rótulos
    {t:'label', x:14, y:5.4, text:'307 · CÁMARA DE CONTENCIÓN', s:'code'},
    {t:'label', x:14, y:10.7, text:'ZONA DE CONTENCIÓN', s:'small'},
        // dirección
    {t:'zone', k:'arrow', d:'M800 740 V820 H980 V860', head:'M972 850 L980 862 L988 850', label:'C2 → PT', lx:22.4, ly:20.0},
    {t:'zone', k:'arrow', d:'M340 740 V800 H800', label:'C1 → RUTA SUR', lx:12, ly:19.75},
    {t:'zone', k:'arrow', d:'M100 340 V620', label:'RODEO SIN DESCARGA', lx:2.5, ly:16.6},
  ],
  contacts:[
    {id:'mc', kind:'en', code:'MC', name:'Masa de Convergencia', c:13, r:13, w:4, h:4, body:'masa', hp:'mc', stunKey:'masa', stunVal:'aturdida',
      links:[[10.5,10.5],[17.5,10.5],[10.5,17.5],[17.5,17.5]],
      desc:'Masa orgánica de gran tamaño en el centro-sur de la cámara, unida por conexiones de tejido a los cuatro soportes rotos del sistema de sujeción.',
      note:'Huella 4 × 4 (col. 13–16, filas 13–16). El cuerpo y sus conexiones se dibujan aparte del marcador. Usa la ficha existente; esta vista no fija PV ni daño.', revealed:true},
    {id:'c1', kind:'obj', code:'C1', name:'Terminal C1', short:'C1', c:9, r:18, stateKey:'c1', onVal:'on',
      desc:'Terminal de intervención de emergencia en una estación accesible, lado suroeste.', note:'Una activación por ventana de aturdimiento según la ficha.'},
    {id:'c2', kind:'obj', code:'C2', name:'Terminal C2', short:'C2', c:20, r:18, stateKey:'c2', onVal:'on',
      desc:'Terminal de intervención de emergencia en una estación accesible, lado sureste.', note:'Ruta despejada hacia PT por el borde sur.'},
    {id:'pt', kind:'obj', code:'PT', name:'Portillo PT', short:'PT', c:25, r:22,
      desc:'Portillo en la pared sur. Lleva al pasillo de mantenimiento; desde ahí, a la escalera B. No sale directamente al exterior.'},
    {id:'dl', kind:'obj', code:'DL', name:'Descarga lateral', short:'DESCARGA', c:4, r:9, w:2, h:6, stateKey:'desc', onVal:'aislada', markAt:'top',
      desc:'Franja con boquillas en el suelo e indicador de presión. Siempre hay rodeo por suelo normal al oeste y al este.',
      note:'Se aísla operando V (302) y P (303). No aturde al jefe, no activa C1/C2 ni reduce PV. Daño y cadencia pendientes.'},
  ],
};
