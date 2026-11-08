// Superficie · patio de servicio. 32 × 24. Llegada, extracción sin jefe y extracción con jefe final sobre la misma base.
export default {
  id:'superficie', floor:'S', rooms:['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10'], short:'Superficie · Patio de servicio',
  crumb:'SITIO-67 / BETA-7 / SUPERFICIE', title:'SUPERFICIE · PATIO DE SERVICIO',
  objective:'Asegurar el patio y llegar al núcleo de descenso',
  objectives:{ llegada:'Asegurar el patio y llegar al núcleo de descenso', salida:'Llegar a la salida terrestre E o a S08', jefe:'Sobrevivir a la masa y llegar a E o a S08' },
  meta:'SUPERFICIE · S01–S10 · A / B', cols:32, rows:24, margin:{b:40},
  legend:['tall','low','diff','tissue','fence','door','roll','qdoor','ag','en','npc','obj'],
  states:[
    {key:'escena', label:'ESCENA', def:'llegada', secret:true, options:[['llegada','LLEGADA'],['salida','EXTRACCIÓN · SIN JEFE'],['jefe','EXTRACCIÓN · JEFE FINAL']]},
    {key:'mal', label:'MALETÍN O-ÍGNEO', def:'restos', options:[['restos','ENTRE LOS RESTOS'],['rec','RECUPERADO']], enabledWhen:{escena:'jefe'}, disabledNote:'SOLO CON JEFE FINAL'},
    {key:'mod', label:'MÓDULOS ÍGNEO RESTANTES', def:'2', options:[['2','2'],['1','1'],['0','0']], enabledWhen:{escena:'jefe'}, disabledNote:'SOLO CON JEFE FINAL'},
    {key:'con1', label:'CONEXIÓN · BIOMASA B1', def:'off', options:[['off','SIN CONEXIÓN'],['on','CONECTADA']], enabledWhen:{escena:'jefe'}, disabledNote:'SOLO CON JEFE FINAL'},
    {key:'con2', label:'CONEXIÓN · BIOMASA B2', def:'off', options:[['off','SIN CONEXIÓN'],['on','CONECTADA']], enabledWhen:{escena:'jefe'}, disabledNote:'SOLO CON JEFE FINAL'},
  ],
  hotkeys:[['escena','llegada'],['escena','salida'],['escena','jefe'],['mal',null],['mod',null],['con1',null],['con2',null]],
  starts:[
    {code:'C',c:9,r:17,when:{escena:'llegada'}}, {code:'M',c:8,r:18,when:{escena:'llegada'}}, {code:'L',c:10,r:18,when:{escena:'llegada'}}, {code:'T',c:7,r:17,when:{escena:'llegada'}},
    {code:'C',c:28,r:8,when:{escena:['salida','jefe']}},
    {code:'M',c:29,r:7,when:{escena:['salida','jefe']}}, {code:'L',c:28,r:7,when:{escena:['salida','jefe']}}, {code:'T',c:27,r:8,when:{escena:['salida','jefe']}},
  ],
  initialSel:'e1',
  notes:[
    'Llegada: introducción breve. Dos Errantes y un Corredor separados por la carga.',
    {when:{escena:['salida','jefe']}, text:'Extracción sin jefe: si la masa murió en 307, no hay segunda fase ni accidente. No forzarlos para usar este contenido.'},
    {when:{escena:'jefe'}, text:'Extracción con jefe final: el helicóptero se estrella al este del helipunto y su carga de emergencia queda entre los restos. Los agentes están en tierra; la transición no los daña ni incapacita.'},
    {when:{escena:'jefe'}, text:'La masa conserva exactamente los PV que le quedaban en 307 (anótalos en su ficha). Alimentarse no la cura ni cambia su vulnerabilidad a las armas normales.'},
    {when:{escena:'jefe'}, text:'Biomasa B1 (restos, col. 22 fila 15) y B2 (seto, col. 32 filas 17–18) quedan a 3 y 4 casillas de la huella: dentro del alcance 6. Sus conexiones se activan por separado y no atraviesan paredes.'},
    {when:{escena:'jefe'}, text:'Transmisión del transporte antes del accidente: «Llevamos el módulo de respuesta ÍGNEO. Confirmen una zona segura para entregarlo».'},
    {when:{escena:'jefe'}, text:'El maletín se descubre por observación ordinaria, sin tirada. Si el grupo consiguió antes una entrega segura, no inventar un bloqueo.'},
    'Las bajas siguen retiradas al cambiar de escena. No reponer enemigos muertos ni suministros gastados. Fragmentos solo según la ficha.',
    {when:{escena:'jefe'}, text:'Rutas libres: B → maletín (filas 8–10), B → piloto (fila 9–10 hacia el oeste) y salida hacia S08 o E por el centro-sur. Ninguna atraviesa el cuerpo de la masa.'},
    {when:{escena:'jefe'}, text:'Fuego y humo son localizados y solo visuales: su efecto, si lo hay, lo decide dirección. El camión bloquea visión; las cajas son cobertura baja.'},
  ],
  items:[
    // suelos
    {t:'floor', c:1, r:5, w:32, h:14, s:'yard'},
    {t:'floor', c:13, r:1, w:7, h:4, s:'pad'},
    {t:'floor', c:6, r:1, w:1, h:4, s:'grass'}, {t:'floor', c:26, r:1, w:1, h:4, s:'grass'},
    {t:'floor', c:6, r:19, w:1, h:4, s:'grass'}, {t:'floor', c:13, r:19, w:1, h:4, s:'grass'}, {t:'floor', c:25, r:19, w:1, h:4, s:'grass'},
    {t:'floor', c:26, r:19, w:4, h:4, s:'road'}, {t:'floor', c:30, r:21, w:3, h:2, s:'grass'},
    {t:'floor', c:1, r:23, w:32, h:2, s:'road'},
    {t:'mark', k:'lane', c:4, r:11, w:25, h:2},
    {t:'mark', k:'lane', c:27, r:19, w:2, h:6},
    {t:'mark', k:'lane', c:1, r:23, w:32, h:2},
    // edificios: solo fachadas y accesos
    {t:'obj', k:'building', c:1, r:1, w:5, h:4, code:'S01', name:'Control exterior'},
    {t:'obj', k:'building', c:7, r:1, w:6, h:4, code:'S02', name:'Hangar'},
    {t:'obj', k:'helipad', c:13, r:1, w:7, h:5},
    {t:'obj', k:'building', c:20, r:1, w:6, h:4, code:'S04', name:'Descontaminación'},
    {t:'obj', k:'building', c:27, r:1, w:6, h:4, code:'S05', name:'Cuarentena exterior'},
    {t:'obj', k:'building', c:29, r:5, w:2, h:1},
    {t:'obj', k:'building', c:1, r:19, w:5, h:4, code:'S06', name:'Taller'},
    {t:'obj', k:'building', c:7, r:19, w:6, h:4, code:'S07', name:'Carga y suministros'},
    {t:'obj', k:'building', c:14, r:19, w:6, h:4, code:'S08', name:'Vehículos'},
    {t:'obj', k:'building', c:20, r:19, w:5, h:4, code:'S09', name:'Apoyo médico'},
    {t:'obj', k:'building', c:30, r:19, w:3, h:2, code:'S10', name:'Acceso'},
    {t:'obj', k:'building', c:1, r:9, w:3, h:6, code:'A', name:'Esc. / asc.'},
    {t:'obj', k:'building', c:30, r:8, w:3, h:8, code:'B', name:'Esc. / carga'},
    // accesos de edificios
    {t:'door', x:2, y:4, o:'h', n:1, k:'swing', sw:1},
    {t:'door', x:7, y:4, o:'h', n:4, k:'roll', label:'PORTÓN DE HANGAR', ly:4.55},
    {t:'door', x:22, y:4, o:'h', n:1, k:'swing', sw:1},
    {t:'door', x:28, y:4, o:'h', n:2, k:'quar'}, {t:'door', x:28, y:5, o:'h', n:2, k:'quar', label:'S05 · ESCLUSA SELLADA', ly:5.55},
    {t:'door', x:2, y:18, o:'h', n:1, k:'swing', sw:-1},
    {t:'door', x:7, y:18, o:'h', n:2, k:'roll'}, {t:'door', x:10, y:18, o:'h', n:2, k:'roll'},
    {t:'door', x:8, y:22, o:'h', n:2, k:'roll', label:'ENTRADA DE SERVICIO', ly:23.3},
    {t:'door', x:14, y:18, o:'h', n:4, k:'roll'},
    {t:'door', x:21, y:18, o:'h', n:1, k:'swing', sw:-1, label:'S09 · ACCESO PROPIO', ly:17.6},
    {t:'door', x:29, y:19, o:'v', n:1, k:'swing', sw:1},
    {t:'door', x:3, y:10, o:'v', n:2, k:'double', sw:1, label:'A', lx:3.6, ly:11.15},
    {t:'door', x:29, y:8, o:'v', n:1, k:'swing', sw:-1, label:'B · ESCALERA', lx:28.8, ly:9.5, anchor:'end'},
    {t:'door', x:29, y:11, o:'v', n:3, k:'roll', label:'B · MONTACARGAS', lx:28.8, ly:15.3, anchor:'end'},
    {t:'door', x:25, y:22, o:'h', n:4, k:'barrier'},
    // vallas perimetrales
    {t:'walls', s:'fence', segs:[[0,4,0,8],[0,15,0,18],[32,4,32,7],[32,16,32,22],[5,22,6,22],[12,22,13,22],[24,22,29,22],[29,22,32,22]]},
    {t:'cut', x:25, y:22, o:'h', n:4},
    // carga y vehículos
    {t:'obj', k:'truck', c:13, r:14, w:2, h:5, cab:'n', label:'CAMIÓN DE SUMINISTROS', lx:14, ly:13.7},
    {t:'obj', k:'crates', c:9, r:15, w:2, h:1},
    {t:'obj', k:'crates', c:18, r:13, w:2, h:2},
    {t:'obj', k:'cargoCart', c:16, r:17, w:2, h:1, label:'CARRO DE CARGA'},
    // iluminación y vegetación
    {t:'obj', k:'lamp', c:5, r:7}, {t:'obj', k:'lamp', c:12, r:7}, {t:'obj', k:'lamp', c:21, r:7}, {t:'obj', k:'lamp', c:28, r:6},
    {t:'obj', k:'lamp', c:5, r:16}, {t:'obj', k:'lamp', c:24, r:17},
    {t:'obj', k:'shrub', c:6, r:1, w:1, h:2}, {t:'obj', k:'tree', c:6, r:3},
    {t:'obj', k:'shrub', c:26, r:1}, {t:'obj', k:'tree', c:26, r:3},
    {t:'obj', k:'tree', c:6, r:20}, {t:'obj', k:'shrub', c:13, r:20, w:1, h:2}, {t:'obj', k:'tree', c:25, r:20},
    {t:'obj', k:'shrub', c:1, r:16, w:1, h:2}, {t:'obj', k:'shrub', c:1, r:6, w:1, h:2}, {t:'obj', k:'shrub', c:32, r:17, w:1, h:2},
    // rótulos
    {t:'label', x:16, y:0.55, text:'S03 · HELIPUNTO', s:'code'},
    {t:'label', x:17, y:9.4, text:'PATIO DE SERVICIO', s:'room'},
    {t:'label', x:16, y:24.25, text:'VIAL PERIMETRAL', s:'ext'},
    {t:'label', x:31.9, y:23.55, text:'E · SALIDA AL PERÍMETRO →', s:'ext', anchor:'end', cyan:true},

    // ===== EXTRACCIÓN · JEFE FINAL =====
    // tejido junto al montacargas B, sobre pavimento y fachada (no cubre el patio)
    {t:'tissue', when:{escena:'jefe'}, cells:[[29,12],[29,13],[29,14],[24,12,1,2],[25,15,3,1]],
      blobs:[[29.06,10.9,5],[29.06,11.5,4],[29.08,15.3,6],[29.06,15.8,4],[24.6,11.4,5],[24.3,14.6,4]],
      fil:['M1160 470 C1130 470 1110 455 1100 440','M1160 510 C1140 520 1125 530 1105 545','M1160 550 C1140 565 1120 580 1090 590','M980 470 C960 470 950 480 940 500','M1000 560 C1000 590 1010 600 1030 610'] },
    // conexiones de biomasa: capas retirables por separado
    {t:'raw', layer:'tejido', when:{escena:'jefe', con1:'on'}, svg:(H)=>H.P('M965 545 C935 560 905 572 872 578','filament','style="stroke-width:2.4"')+H.P('M968 530 C930 545 900 560 870 570','filament')+H.P('M972 556 C944 575 910 588 878 588','filament')},
    {t:'raw', layer:'tejido', when:{escena:'jefe', con2:'on'}, svg:(H)=>H.P('M1100 560 C1120 620 1180 650 1250 662','filament','style="stroke-width:2.4"')+H.P('M1090 562 C1112 630 1176 662 1246 672','filament')+H.P('M1112 556 C1136 612 1190 640 1256 652','filament')},
    // fuselaje (obstáculo sólido), rotor detenido y roto, cola dañada
    {t:'solid', when:{escena:'jefe'}, cells:[[21,6],[22,6],[23,6],[21,7],[22,7],[23,7],[24,6],[25,6],[26,6]]},
    {t:'raw', layer:'cambios', when:{escena:'jefe'}, svg:(H)=>{ let s='';
      const st='style="stroke:#cfd6d4;stroke-width:4;fill:none;stroke-linecap:round"';
      s+=`<g transform="rotate(-8 862 242)">`;
      // patines
      s+=H.P('M812 200 H912 M812 284 H912 M828 200 V214 M896 200 V212 M828 284 V270 M896 284 V272','fzd','style="stroke:#a9b3b1;stroke-width:3;fill:none"');
      // fuselaje y cabina
      s+=H.P('M802 242 C802 214 826 206 850 206 L904 210 C918 212 924 226 924 242 C924 258 918 272 904 274 L850 278 C826 278 802 270 802 242 Z','tall','style="stroke-width:2.2"');
      s+=H.P('M808 242 C808 222 824 214 840 213 L842 271 C824 270 808 262 808 242 Z','screen','style="fill:rgba(191,243,240,.12)"');
      s+=H.P('M818 226 L830 238 M822 258 L834 250','crack');
      s+=H.R(852,230,46,24,'tall-s','rx="6"');
      // cola: botalón doblado, deriva rota y rotor de cola partido
      s+=H.P('M920 232 L998 220 L1000 230 L920 254 Z','tall','style="stroke-width:1.6"');
      s+=H.P('M1004 214 L1030 204 L1036 222 L1010 232 Z','tall','style="stroke-width:1.6"');
      s+=H.P('M998 222 l4 -6 l3 7','crack');
      s+=H.P('M1026 196 L1036 214 M1020 212 L1030 200','fzd','style="stroke:#cfd6d4;stroke-width:2.6"');
      // compuerta de carga abierta (lado sur)
      s+=H.P('M884 274 L914 272 L918 290 L888 292 Z','fz','style="fill:#232928;stroke:#e6dc4f;stroke-dasharray:3 2"');
      // rotor principal detenido y roto
      s+=H.P('M870 242 L812 186',null,st)+H.P('M870 242 L912 206 L936 196',null,st)+H.P('M870 242 L884 262',null,st);
      s+=H.Ci(870,242,8,'tall-s');
      s+=`</g>`;
      // palas caídas sobre el pavimento
      s+=H.L(758,356,812,372,'fzd','style="stroke:#c5cbc9;stroke-width:5"')+H.L(990,272,1018,298,'fzd','style="stroke:#c5cbc9;stroke-width:5"');
      s+=`<g class="g-labels">${H.Tx(870,180,'HELICÓPTERO ESTRELLADO','lb-small','style="fill:#ffd2bd"')}</g>`;
      return s; }},
    {t:'difficult', when:{escena:'jefe'}, cells:[[21,8],[22,8],[25,7],[19,9]]},
    {t:'obj', k:'debris', c:21, r:8, w:2, h:1, when:{escena:'jefe'}, layer:'cambios'},
    {t:'obj', k:'debris', c:25, r:7, when:{escena:'jefe'}, layer:'cambios'},
    {t:'obj', k:'debris', c:19, r:9, when:{escena:'jefe'}, layer:'cambios'},
    // incendios localizados y humo (estáticos, sin tapar casillas)
    {t:'raw', layer:'cambios', when:{escena:'jefe'}, svg:(H)=>{ let s='';
      const fire=(cx,cy)=>H.R(cx-18,cy-18,36,36,'','fill="none" stroke="#ff6a2a" stroke-width="1.2" stroke-dasharray="3 2"')+H.P(`M${cx} ${cy+13} C${cx-11} ${cy+9} ${cx-10} ${cy-3} ${cx-3} ${cy-13} C${cx-2} ${cy-5} ${cx+3} ${cy-6} ${cx+5} ${cy-11} C${cx+11} ${cy-2} ${cx+11} ${cy+9} ${cx} ${cy+13} Z`,'fire')+H.P(`M${cx} ${cy+11} C${cx-5} ${cy+8} ${cx-4} ${cy+2} ${cx} ${cy-3} C${cx+4} ${cy+2} ${cx+5} ${cy+8} ${cx} ${cy+11} Z`,'fire-in');
      s+=fire(860,220)+fire(980,260);
      [[848,186,13],[872,170,10],[968,228,11],[990,214,8]].forEach(([x,y,r])=>s+=H.Ci(x,y,r,'smoke'));
      s+=`<g class="g-labels">${H.Tx(980,292,'FUEGO','lb-small','style="fill:#ff9a6e"')}</g>`;
      return s; }},
    // dirección
    {t:'zone', k:'arrow', when:{escena:'jefe'}, d:'M1140 352 H944 V326', head:'M936 334 L944 322 L952 334', label:'B → MALETÍN', lx:26, ly:8.6},
    {t:'zone', k:'arrow', when:{escena:'jefe'}, d:'M1140 380 H792 V306', head:'M784 314 L792 302 L800 314', label:'B → PILOTO', lx:22.6, ly:9.75},
    {t:'zone', k:'arrow', when:{escena:'jefe'}, d:'M820 400 V690 H1066 V880', head:'M1058 870 L1066 882 L1074 870', label:'SALIDA → E', lx:24, ly:17.6},
    {t:'zone', k:'arrow', when:{escena:'jefe'}, d:'M820 690 H672 V712', head:'M664 704 L672 716 L680 704', label:'→ S08', lx:18.2, ly:17.05},
    {t:'zone', k:'arrow', when:{escena:'llegada'}, d:'M360 690 L360 760', label:'ENTRADA PROPUESTA BETA-7', lx:9, ly:16.15},
    {t:'zone', k:'arrow', when:{escena:['salida','jefe']}, d:'M1150 330 L1110 310', label:'SALIDA PROPUESTA · ESCALERA B', lx:26.4, ly:7.2},
  ],
  contacts:[
    {id:'e1', kind:'en', code:'E1', name:'Errante', c:8, r:13, body:'errante',
      desc:'Silueta humana deformada en el patio, al oeste del grupo de cajas.', note:'Contacto de llegada. Si muere, márcalo como baja: no reaparece en la extracción.'},
    {id:'e2', kind:'en', code:'E2', name:'Errante', c:16, r:15, body:'errante',
      desc:'Silueta humana deformada junto al camión de suministros.', note:'Separado de E1 por el camión y las cajas.'},
    {id:'e3', kind:'en', code:'E3', name:'Corredor', c:20, r:10, body:'corredor', face:'w',
      desc:'Figura baja y alargada, apoyada en las cuatro extremidades, en el carril central.', note:'Cubre el carril largo hacia el oeste.'},
    {id:'mc', kind:'en', code:'MC', name:'Masa de Convergencia', c:25, r:11, w:4, h:4, body:'masa', hp:'mc', when:{escena:'jefe'}, links:[[29.1,12.5],[29.1,13.5],[29.1,14.2]],
      desc:'Masa orgánica enorme que sale por el hueco del montacargas B y entra en el borde este del patio. La puerta de la escalera B queda aparte y libre.',
      note:'Huella 4 × 4 (col. 25–28, filas 11–14), con espacio para entrar al patio. Conserva los PV restantes de 307: anótalos aquí. Sin inmunidades nuevas; puede morir con el armamento habitual.'},
    {id:'pi', kind:'npc', code:'PI', name:'Piloto', c:20, r:7, body:'piloto', face:'e', when:{escena:'jefe'}, revealed:false,
      desc:'Piloto vivo y herido, fuera de la cabina en el flanco oeste del fuselaje. Se puede llegar a él desde el patio.',
      note:'Posibilidad de rescate, no un cadáver decorativo. Rutas libres desde B y desde el oeste.'},
    {id:'oig', kind:'obj', mark:'case', code:'O-ÍGNEO', name:'Maletín de carga de contingencia', short:'CARGA DE CONTINGENCIA', kindLabel:'CARGA DE CONTINGENCIA', group:'OBJETIVOS Y CARGA',
      c:23, r:8, body:'maletin', big:'maletin', when:{escena:'jefe'}, revealed:false, on:['mal','rec'], tagBelow:true,
      badge:'KIT AÉREO ÍGNEO · 2 MÓDULOS DE DISPARO + SOPORTE DE EMERGENCIA',
      desc:'Maletín rígido con el símbolo ÍGNEO, entre el compartimento de carga abierto y los restos, protegido del fuego inmediato. Contiene dos módulos de disparo ÍGNEO y un soporte de emergencia autónomo, para usarlos aunque no hayan traído el lanzador de 207.',
      stats:[['Recuperar','1 acción desde una casilla adyacente'],['Con lanzador de 207','Emplazar 1 acción · cargar 1 acción · disparar 1 acción'],['Sin lanzador','Desplegar soporte 1 acción en casilla libre · cargar 1 · disparar 1'],['Reubicar','1 acción · conserva el módulo cargado'],['Alcance','12 casillas · línea de visión libre · un objetivo'],['Daño','60 automático por disparo'],['Munición','2 módulos · cada disparo consume uno']],
      effect:'Sin tirada de ataque, crítico, área ni daño persistente. El daño se resta de los PV actuales. Es equipo especial: no se dispara con «¡Ahora!», no admite cargas potenciadas ni da ataques adicionales. Cualquier agente puede operarlo.',
      note:'Se descubre por observación ordinaria, sin tirada. No aparece por umbral de PV: el transporte lo llevaba desde antes.'},
    {id:'b1', kind:'obj', mark:'bio', code:'B1', name:'Restos orgánicos', short:'RESTOS ORGÁNICOS', kindLabel:'ELEMENTO DEL PATIO', group:'ELEMENTOS DEL PATIO', c:22, r:15, body:'biomasa', when:{escena:'jefe'}, on:['con1','on'], revealed:false,
      desc:'Restos orgánicos sobre el pavimento, al suroeste de la masa.', note:'Punto de biomasa B1: a 3 casillas de la huella, dentro del alcance 6. Conexión independiente (estado «Conexión · biomasa B1»).'},
    {id:'b2', kind:'obj', mark:'bio', code:'B2', name:'Seto con tejido', short:'SETO CON TEJIDO', kindLabel:'ELEMENTO DEL PATIO', group:'ELEMENTOS DEL PATIO', c:32, r:17, h:2, body:'biomasa', when:{escena:'jefe'}, on:['con2','on'], revealed:false,
      desc:'Seto del borde este, junto a la valla, por debajo del núcleo B.', note:'Punto de biomasa B2: a 4 casillas de la huella, dentro del alcance 6. La conexión rodea B por el sur; no atraviesa paredes.'},
    {id:'ex', kind:'obj', code:'E', name:'Salida terrestre E', short:'E', group:'OBJETIVOS Y CARGA', c:32, r:23, revealed:true,
      desc:'Vial perimetral hacia el exterior. Se llega desde el patio por el carril de S10 y la barrera.'},
  ],
};
