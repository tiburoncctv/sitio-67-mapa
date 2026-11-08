// SITIO-67 · motor de escenarios tácticos (vista cenital, cuadrícula de 1,5 m).
// Dibuja un escenario (datos de js/tactico/escenarios/) en SVG y gestiona capas, estados manuales,
// revelación de contactos, inserción manual de Beta-7 y colocación de iconos. Sin combate, tiradas,
// movimiento ni eventos automáticos. El SVG se genera a partir de datos locales del repositorio;
// todo texto pasa por esc().
const C = 40, T = 10;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const X = c => (c-1)*C, Y = r => (r-1)*C;
const R = (x,y,w,h,cls,ex='') => `<rect x="${+x.toFixed(1)}" y="${+y.toFixed(1)}" width="${+w.toFixed(1)}" height="${+h.toFixed(1)}" class="${cls}" ${ex}/>`;
const L = (x1,y1,x2,y2,cls,ex='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" ${ex}/>`;
const Ci = (cx,cy,r,cls,ex='') => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}" ${ex}/>`;
const P = (d,cls,ex='') => `<path d="${d}" class="${cls}" ${ex}/>`;
const Tx = (x,y,t,cls,ex='') => `<text x="${x}" y="${y}" class="${cls}" ${ex}>${esc(t)}</text>`;
export const H = { C, X, Y, R, L, Ci, P, Tx, px: v => v*C };

const LAYERS = [
  ['base','BASE'], ['mobiliario','MOBILIARIO'], ['tejido','TEJIDO'], ['cambios','CAMBIOS FÍSICOS'],
  ['objetivos','OBJETIVOS Y EQUIPO'], ['personajes','PERSONAJES'], ['contactos','CONTACTOS']
];
export const AGENTS = [['C','Capitán'],['M','Médico'],['L','Lanzallamas pesado'],['T','Tirador de reconocimiento'],['TE','Técnico de contención'],['D','Demoliciones']];
const AGENT_NAME = Object.fromEntries(AGENTS);
const KIND = { ag:'AGENTE', en:'AMENAZA', npc:'PERSONA', obj:'OBJETIVO / MANDO', item:'EQUIPO' };
const kindLabel = k => k.kindLabel || KIND[k.kind];

/* ================= MOBILIARIO Y MAQUINARIA =================
   c: 'tall' bloquea paso y visión · 'low' mobiliario bajo · 'deco' sin efecto  */
const slats = (x,y,w,h,step=10,cls='tall-d') => { let s=''; if(w>=h){ for(let i=x+step;i<x+w-3;i+=step) s+=L(i,y+3,i,y+h-3,cls); } else { for(let i=y+step;i<y+h-3;i+=step) s+=L(x+3,i,x+w-3,i,cls); } return s; };
export const OBJ = {
  shelfTall:{c:'tall', d:(x,y,w,h)=>{ const a=R(x+4,y+4,w-8,h-8,'tall'); const mid = w>=h ? L(x+4,y+h/2,x+w-4,y+h/2,'tall-d') : L(x+w/2,y+4,x+w/2,y+h-4,'tall-d'); return a+slats(x+4,y+4,w-8,h-8,10)+mid; }},
  rack:{c:'tall', d:(x,y,w,h)=>{ let s=R(x+4,y+4,w-8,h-8,'tall-s'); for(let i=y+12;i<y+h-6;i+=8){ s+=L(x+8,i,x+w-8,i,'tall-d'); s+=Ci(x+w-12,i-3,1.4,'led'); } return s; }},
  cabinetTall:{c:'tall', d:(x,y,w,h)=>{ let s=R(x+3,y+4,w-6,h-8,'tall'); const n=Math.max(1,Math.round((w>=h?w:h)/20)); for(let i=1;i<n;i++){ s+= w>=h ? L(x+3+i*(w-6)/n,y+4,x+3+i*(w-6)/n,y+h-4,'tall-d') : L(x+3,y+4+i*(h-8)/n,x+w-3,y+4+i*(h-8)/n,'tall-d'); } return s; }},
  toolShelf:{c:'tall', d:(x,y,w,h)=>{ let s=R(x+3,y+4,w-6,h-8,'tall'); for(let i=x+10;i<x+w-8;i+=14) s+=P(`M${i} ${y+9} l6 ${h-18}`,'tall-d'); return s; }},
  equip:{c:'tall', d:(x,y,w,h)=>{ let s=R(x+4,y+4,w-8,h-8,'tall'); s+=R(x+10,y+10,Math.min(w-20,34),12,'screen'); s+=P(`M${x+13} ${y+16} h6 l3 -4 l3 7 l3 -3 h${Math.max(4,Math.min(w-20,34)-20)}`,'wave'); for(let i=y+30;i<y+h-8;i+=6) s+=L(x+10,i,x+w-10,i,'tall-d'); return s; }},
  incubator:{c:'tall', d:(x,y,w,h)=>{ let s=R(x+3,y+3,w-6,h-6,'tall'); s+=Ci(x+w/2,y+h/2+2,Math.min(w,h)/2-10,'screen'); s+=R(x+8,y+6,w-16,5,'screen'); return s; }},
  vessel:{c:'tall', d:(x,y,w,h)=>{ const cx=x+w/2, cy=y+h/2, r=Math.min(w,h)/2-4; return Ci(cx,cy,r,'tall')+Ci(cx,cy,r-7,'tall-d')+Ci(cx,cy,r-14,'screen','style="fill:rgba(255,63,160,.12)"')+[0,90,180,270].map(a=>{const rad=a*Math.PI/180; return Ci(cx+Math.cos(rad)*(r-3),cy+Math.sin(rad)*(r-3),2.2,'deco');}).join('')+L(cx,cy-r,cx,cy-r-6,'tall-d'); }},
  tank:{c:'tall', d:(x,y,w,h)=>{ const cx=x+w/2, cy=y+h/2, r=Math.min(w,h)/2-5; let s=Ci(cx,cy,r,'tall')+Ci(cx,cy,r-10,'tall-d')+Ci(cx,cy,r-26,'tall-d'); for(let a=0;a<360;a+=30){const rad=a*Math.PI/180; s+=Ci(cx+Math.cos(rad)*(r-5),cy+Math.sin(rad)*(r-5),1.6,'deco');} s+=Ci(cx,cy,8,'tall-s'); return s; }},
  pump:{c:'tall', d:(x,y,w,h)=>{ let s=R(x+4,y+6,w-8,h-12,'tall'); const r=Math.min(w,h)/2-12; s+=Ci(x+w/2,y+h/2,r,'tall-s')+Ci(x+w/2,y+h/2,r-6,'tall-d'); s+=R(x+2,y+h/2-6,6,12,'tall-s')+R(x+w-8,y+h/2-6,6,12,'tall-s'); return s; }},
  pillar:{c:'tall', d:(x,y,w,h)=>R(x+4,y+4,w-8,h-8,'tall-s')+P(`M${x+4} ${y+4} L${x+w-4} ${y+h-4} M${x+w-4} ${y+4} L${x+4} ${y+h-4}`,'tall-d')+R(x+12,y+12,w-24,h-24,'tall-d') },
  support:{c:'tall', d:(x,y,w,h)=>R(x+8,y+6,w-16,h-12,'tall-s')+L(x+8,y+h/2,x+w-8,y+h/2,'tall-d')+L(x+w/2,y+6,x+w/2,y+h-6,'tall-d') },
  weaponRack:{c:'tall', d:(x,y,w,h,o)=>{ let s=R(x+3,y+4,w-6,h-8,'tall'); const vert=h>w, n=Math.floor((vert?h:w)/13); const empty=o.empty||[]; for(let i=0;i<n;i++){ const p=(vert?y:x)+8+i*13; const isE=empty.includes(i); s+= vert ? L(x+8,p,x+w-8,p+4,isE?'zone-dir':'tall-d', isE?'style="stroke:#6f7877"':'') : L(p,y+8,p+4,y+h-8,isE?'zone-dir':'tall-d', isE?'style="stroke:#6f7877"':''); } return s; }},
  lockers:{c:'tall', d:(x,y,w,h)=>{ let s=R(x+3,y+4,w-6,h-8,'tall'); const n=Math.round((w>=h?w:h)/14); for(let i=1;i<n;i++) s+= w>=h ? L(x+3+i*(w-6)/n,y+4,x+3+i*(w-6)/n,y+h-4,'tall-d') : L(x+3,y+4+i*(h-8)/n,x+w-3,y+4+i*(h-8)/n,'tall-d'); return s; }},
  truck:{c:'tall', d:(x,y,w,h,o)=>{ // eje largo vertical, cabina al norte por defecto
    const vert=h>=w; let s='';
    if(vert){ const cab=Math.min(44,h*0.25); const top=o.cab==='s'? y+h-cab : y; const box=o.cab==='s'? y : y+cab+4;
      s+=R(x+4,box,w-8,h-cab-4,'tall'); s+=slats(x+4,box,w-8,h-cab-4,14);
      s+=R(x+6,top+2,w-12,cab-4,'tall-s'); s+=R(x+10,(o.cab==='s'?top+cab-14:top+6),w-20,8,'screen');
      [box+18,box+h-cab-26].forEach(yy=>{ s+=R(x,yy,4,14,'fz2')+R(x+w-4,yy,4,14,'fz2'); }); }
    else { const cab=Math.min(44,w*0.25); const left=o.cab==='w'? x : x+w-cab; const box=o.cab==='w'? x+cab+4 : x;
      s+=R(box,y+4,w-cab-4,h-8,'tall'); s+=slats(box,y+4,w-cab-4,h-8,14);
      s+=R(left+2,y+6,cab-4,h-12,'tall-s'); s+=R((o.cab==='w'?left+6:left+cab-14),y+10,8,h-20,'screen'); }
    return s; }},
  tree:{c:'tall', d:(x,y,w,h)=>{ const cx=x+w/2, cy=y+h/2, r=Math.min(w,h)/2+3; let d=''; for(let i=0;i<=18;i++){ const a=i/18*Math.PI*2, rr=r*(i%2?0.84:1); d+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)+' '; }
    return P(d+'Z','tall','style="fill:rgba(96,128,106,.35);stroke:rgba(170,200,180,.8)"')+Ci(cx,cy,r*0.45,'tall-d','style="stroke:rgba(170,200,180,.45)"')+Ci(cx,cy,3.5,'tall-s'); }},
  shrub:{c:'low', d:(x,y,w,h)=>{ let s=''; const n=Math.max(2,Math.round(w*h/700)); for(let i=0;i<n;i++){ const cx=x+10+((i*37)%(Math.max(1,w-20))), cy=y+10+((i*23)%(Math.max(1,h-20))); s+=Ci(cx,cy,9,'fz','style="fill:rgba(120,150,130,.18);stroke:rgba(170,200,180,.65)"'); } return s; }},
  building:{c:'tall', d:(x,y,w,h,o)=>{ let s=R(x,y,w,h,'tall','style="fill:url(#pRoof);stroke:#b8c0be;stroke-width:2"'); s+=R(x+6,y+6,w-12,h-12,'tall-d'); if(o.code) s+=Tx(x+w/2,y+h/2-2,o.code,'lb-bld'); if(o.name) s+=Tx(x+w/2,y+h/2+14,o.name.toUpperCase(),'lb-bld2'); return s; }},
  helipad:{c:'deco', d:(x,y,w,h)=>{ const cx=x+w/2, cy=y+h/2, r=Math.min(w,h)/2-10; return Ci(cx,cy,r,'fzd','style="stroke:rgba(230,220,79,.6);stroke-width:3"')+Ci(cx,cy,r-12,'fzd','style="stroke:rgba(233,236,234,.25)"')+P(`M${cx-14} ${cy-20} V${cy+20} M${cx+14} ${cy-20} V${cy+20} M${cx-14} ${cy} H${cx+14}`,'fzd','style="stroke:rgba(233,236,234,.75);stroke-width:5"')+[[x+8,y+8],[x+w-8,y+8],[x+8,y+h-8],[x+w-8,y+h-8]].map(([a,b])=>Ci(a,b,3,'led','style="fill:#e6dc4f"')).join(''); }},
  table:{c:'low', d:(x,y,w,h)=>R(x+4,y+5,w-8,h-10,'fz')+L(x+8,y+9,x+w-8,y+9,'fzd') },
  desk:{c:'low', d:(x,y,w,h,o)=>{ let s=R(x+3,y+4,w-6,h-8,'fz'); const n=Math.max(1,Math.floor((w>=h?w:h)/40)); for(let i=0;i<n;i++){ s+= w>=h ? R(x+10+i*40,y+7,22,8,'screen') : R(x+7,y+10+i*40,8,22,'screen'); } return s; }},
  labBench:{c:'low', d:(x,y,w,h)=>{ let s=R(x+3,y+4,w-6,h-8,'fz'); s+= w>=h ? L(x+3,y+h/2,x+w-3,y+h/2,'fzd') : L(x+w/2,y+4,x+w/2,y+h-4,'fzd'); const n=Math.max(1,Math.floor((w>=h?w:h)/40)); for(let i=0;i<n;i++){ const cx= w>=h ? x+20+i*40 : x+w/2, cy = w>=h ? y+h/2 : y+20+i*40; s+=Ci(cx-3,cy-3,4,'fz2')+P(`M${cx+1} ${cy+1} l6 6 m-10 0 h12`,'fzd','style="stroke:rgba(191,243,240,.6)"'); } return s; }},
  cart:{c:'low', d:(x,y,w,h)=>{ let s=R(x+6,y+9,w-12,h-18,'fz')+L(x+4,y+12,x+4,y+h-12,'fzd'); s+=R(x+10,y+13,8,6,'fz2')+R(x+21,y+13,Math.max(4,w-31),6,'fz2'); [[x+8,y+h-7],[x+w-8,y+h-7],[x+8,y+7],[x+w-8,y+7]].forEach(([a,b])=>s+=Ci(a,b,1.6,'deco','style="fill:rgba(233,236,234,.6)"')); return s; }},
  crates:{c:'low', d:(x,y,w,h)=>{ let s=''; for(let i=x;i<x+w-1;i+=C) for(let j=y;j<y+h-1;j+=C){ s+=R(i+4,j+4,C-8,C-8,'fz')+P(`M${i+4} ${j+4} L${i+C-4} ${j+C-4} M${i+C-4} ${j+4} L${i+4} ${j+C-4}`,'fzd'); } return s; }},
  cargoCart:{c:'low', d:(x,y,w,h)=>R(x+4,y+6,w-8,h-12,'fz')+R(x+10,y+10,(w-20)/2-2,h-20,'fz2')+R(x+w/2+2,y+10,(w-20)/2-2,h-20,'fz2')+L(x+w-2,y+h/2-6,x+w-2,y+h/2+6,'fzd') },
  console:{c:'low', d:(x,y,w,h,o)=>{ let s=R(x+3,y+6,w-6,h-12,'fz'); const n=Math.max(1,Math.floor((w>=h?w:h)/40)); for(let i=0;i<n;i++){ s+= w>=h ? R(x+9+i*40,y+9,24,9,'screen') : R(x+9,y+9+i*40,9,24,'screen'); } s+= w>=h ? Array.from({length:n},(_,i)=>Ci(x+20+i*40,y+h-12,1.6,'led')).join('') : ''; return s; }},
  station:{c:'low', d:(x,y,w,h)=>R(x+4,y+6,w-8,h-12,'fz')+R(x+10,y+9,w-20,10,'screen')+P(`M${x+13} ${y+14} h6 l3 -3 l3 5 h${Math.max(4,w-38)}`,'wave')+Ci(x+w/2,y+h-4,6,'fz2') },
  terminal:{c:'low', d:(x,y,w,h)=>R(x+7,y+8,w-14,h-14,'fz')+R(x+11,y+11,w-22,10,'screen')+R(x+12,y+25,w-24,4,'fz2') },
  sink:{c:'low', d:(x,y,w,h)=>R(x+5,y+6,w-10,h-12,'fz')+`<ellipse cx="${x+w/2}" cy="${y+h/2+2}" rx="${(w-20)/2}" ry="5" class="fzd"/>`+Ci(x+w/2,y+10,1.6,'deco') },
  glovebox:{c:'low', d:(x,y,w,h)=>R(x+4,y+6,w-8,h-12,'fz')+R(x+8,y+9,w-16,h-18,'screen','style="fill:rgba(191,243,240,.06)"')+Ci(x+w/3,y+h-8,5,'fz2')+Ci(x+2*w/3,y+h-8,5,'fz2') },
  panel:{c:'low', d:(x,y,w,h)=>R(x+8,y+8,w-16,h-16,'fz')+R(x+12,y+11,w-24,7,'screen')+Ci(x+15,y+25,2.2,'deco','style="fill:#e6dc4f"')+Ci(x+22,y+25,2.2,'deco','style="fill:#48d8d8"')+Ci(x+29,y+25,2.2,'deco','style="fill:#ff6a2a"') },
  valve:{c:'low', d:(x,y,w,h)=>{ const cx=x+w/2, cy=y+h/2; return Ci(cx,cy,13,'fz')+Ci(cx,cy,4,'fz2')+[0,60,120].map(a=>{const r=a*Math.PI/180; return L(cx-Math.cos(r)*13,cy-Math.sin(r)*13,cx+Math.cos(r)*13,cy+Math.sin(r)*13,'fzd','style="stroke:rgba(233,236,234,.7)"');}).join(''); }},
  counter:{c:'low', d:(x,y,w,h)=>R(x+3,y+8,w-6,h-16,'fz')+L(x+3,y+h/2,x+w-3,y+h/2,'fzd') },
  drums:{c:'low', d:(x,y,w,h)=>{ let s=''; for(let i=x+12;i<x+w-6;i+=18) for(let j=y+12;j<y+h-6;j+=18) s+=Ci(i,j,8,'fz')+Ci(i,j,3,'fzd','style="stroke:#e6dc4f"'); return s; }},
  medcrates:{c:'low', d:(x,y,w,h)=>{ let s=''; for(let i=x;i<x+w-1;i+=C) for(let j=y;j<y+h-1;j+=C) s+=R(i+5,j+7,C-10,C-14,'fz')+R(i+5,j+C/2-2,C-10,4,'deco','style="fill:rgba(191,243,240,.5)"'); return s; }},
  anchor:{c:'low', d:(x,y,w,h)=>R(x+8,y+8,w-16,h-16,'fz')+Ci(x+w/2,y+h/2,6,'fzd','style="stroke:rgba(233,236,234,.7);stroke-width:2"') },
  bench:{c:'low', d:(x,y,w,h)=>R(x+(w>h?4:12),y+(w>h?12:4),w-(w>h?8:24),h-(w>h?24:8),'fz') },
  stool:{c:'deco', d:(x,y,w,h)=>Ci(x+w/2,y+h/2,7,'fz2') },
  papers:{c:'deco', d:(x,y,w,h)=>{ let s=''; for(let i=0;i<7;i++){ const a=(i*53)%80-40, px=x+8+((i*29)%(w-16)), py=y+8+((i*17)%(h-16)); s+=R(px-5,py-4,10,8,'deco',`transform="rotate(${a} ${px} ${py})" style="fill:rgba(233,236,234,.28)"`); } return s; }},
  box:{c:'deco', d:(x,y,w,h)=>R(x+10,y+12,w-20,h-22,'fz','transform="rotate(-22 '+(x+w/2)+' '+(y+h/2)+')"')+P(`M${x+14} ${y+h-10} l10 6 l8 -4`,'fzd') },
  lamp:{c:'deco', d:(x,y,w,h)=>Ci(x+w/2,y+h/2,12,'deco','style="fill:rgba(230,220,79,.08)"')+Ci(x+w/2,y+h/2,3,'deco','style="fill:#e6dc4f"') },
  debris:{c:'deco', d:(x,y,w,h)=>{ let s=''; for(let i=0;i<9;i++){ const px=x+6+((i*31)%(w-12)), py=y+6+((i*19)%(h-12)); s+=P(`M${px} ${py} l${5+i%4} ${-3+i%3} l${-2} ${6}z`,'deco','style="fill:rgba(201,210,208,.45)"'); } return s; }},
  clipboard:{c:'deco', d:(x,y,w,h)=>R(x+w/2-6,y+3,12,15,'fz2')+L(x+w/2-3,y+8,x+w/2+3,y+8,'fzd')+L(x+w/2-3,y+12,x+w/2+3,y+12,'fzd') },
  chair:{c:'deco', d:(x,y,w,h)=>Ci(x+w/2,y+h/2,8,'fz2') },
};

/* ================= CUERPOS ================= */
function rot(face,cx,cy){ const a={e:0,s:90,w:180,n:-90,ne:-45,nw:-135,se:45,sw:135}[face||'e']||0; return `transform="rotate(${a} ${cx} ${cy})"`; }
export const BODY = {
  errante(x,y,w,h){ const cx=x+w/2, cy=y+h/2; let s=`<g transform="translate(${cx} ${cy}) scale(1.22) translate(${-cx} ${-cy})">`;
    s+=`<ellipse cx="${cx+2}" cy="${cy+4}" rx="18" ry="14" fill="rgba(0,0,0,.45)"/>`;
    s+=P(`M${cx-9} ${cy-2} C${cx-20} ${cy+4} ${cx-24} ${cy+14} ${cx-22} ${cy+24}`,'flesh-limb-o')+P(`M${cx-9} ${cy-2} C${cx-20} ${cy+4} ${cx-24} ${cy+14} ${cx-22} ${cy+24}`,'flesh-limb');
    s+=P(`M${cx+10} ${cy-3} C${cx+18} ${cy-6} ${cx+20} ${cy-12} ${cx+18} ${cy-17}`,'flesh-limb-o')+P(`M${cx+10} ${cy-3} C${cx+18} ${cy-6} ${cx+20} ${cy-12} ${cx+18} ${cy-17}`,'flesh-limb');
    s+=P(`M${cx-12} ${cy-4} C${cx-12} ${cy-12} ${cx+4} ${cy-14} ${cx+12} ${cy-8} C${cx+16} ${cy-2} ${cx+12} ${cy+8} ${cx+4} ${cy+10} C${cx-6} ${cy+12} ${cx-13} ${cy+6} ${cx-12} ${cy-4} Z`,'flesh');
    s+=`<ellipse cx="${cx-4}" cy="${cy-12}" rx="6" ry="5.2" transform="rotate(-25 ${cx-4} ${cy-12})" class="flesh"/>`;
    s+=Ci(cx+9,cy-6,4.2,'tissue','style="fill:rgba(255,63,160,.55)"')+Ci(cx+4,cy+6,3,'tissue','style="fill:rgba(255,63,160,.55)"');
    return s+'</g>'; },
  corredor(x,y,w,h,o){ const cx=x+w/2, cy=y+h/2; let s=`<g ${rot(o.face,cx,cy)}>`;
    s+=`<ellipse cx="${cx}" cy="${cy+3}" rx="19" ry="10" fill="rgba(0,0,0,.45)"/>`;
    [[8,-4,18,-15,24,-8],[8,4,18,15,24,8],[-8,-4,-14,-15,-22,-12],[-8,4,-14,15,-22,12]].forEach(([a,b,c2,d,e,f])=>{ const dd=`M${cx+a} ${cy+b} L${cx+c2} ${cy+d} L${cx+e} ${cy+f}`; s+=P(dd,'flesh-limb-o','style="stroke-width:6"')+P(dd,'flesh-limb','style="stroke-width:3.6"'); });
    s+=`<ellipse cx="${cx-1}" cy="${cy}" rx="14" ry="6.5" class="flesh"/>`;
    s+=`<ellipse cx="${cx+15}" cy="${cy}" rx="5.5" ry="4.5" class="flesh"/>`;
    s+=P(`M${cx-10} ${cy} L${cx+8} ${cy}`,'vein','style="stroke:#ff8f8f;opacity:.8"')+[-8,-3,2].map(d=>L(cx+d,cy-3,cx+d+2,cy+3,'vein','style="stroke:#ff8f8f"')).join('');
    s+=Ci(cx-6,cy+4,2.6,'tissue','style="fill:rgba(255,63,160,.6)"');
    return s+'</g>'; },
  escupidor(x,y,w,h,o){ const cx=x+w/2, cy=y+h/2; let s=`<g ${rot(o.face,cx,cy)}>`;
    s+=`<ellipse cx="${cx}" cy="${cy+3}" rx="18" ry="16" fill="rgba(0,0,0,.45)"/>`;
    [[-10,-9,-16,-16],[-10,9,-16,16],[6,-11,10,-18],[6,11,10,18]].forEach(([a,b,c2,d])=>{ const dd=`M${cx+a} ${cy+b} L${cx+c2} ${cy+d}`; s+=P(dd,'flesh-limb-o','style="stroke-width:6"')+P(dd,'flesh-limb','style="stroke-width:3.6"'); });
    s+=Ci(cx-1,cy,13,'flesh');
    s+=Ci(cx-6,cy-1,8.5,'tissue','style="fill:rgba(255,63,160,.45);stroke-width:1.3"')+P(`M${cx-12} ${cy-3} q4 -4 9 0 M${cx-11} ${cy+3} q5 2 9 -2`,'vein');
    s+=`<ellipse cx="${cx+11}" cy="${cy}" rx="4.5" ry="6" fill="#120304" stroke="#ff4a4a" stroke-width="1.4"/>`;
    s+=P(`M${cx+16} ${cy-2} l4 -1 M${cx+16} ${cy+2} l4 1`,'vein','style="stroke:#ff8f8f"');
    return s+'</g>'; },
  ariete(x,y,w,h,o){ const cx=x+w/2, cy=y+h/2; let s=`<g ${rot(o.face,cx,cy)}>`;
    s+=`<ellipse cx="${cx}" cy="${cy+4}" rx="36" ry="30" fill="rgba(0,0,0,.45)"/>`;
    [[-14,-22,-22,-34],[-14,22,-22,34],[8,-24,4,-36],[8,24,4,36]].forEach(([a,b,c2,d])=>{ const dd=`M${cx+a} ${cy+b} L${cx+c2} ${cy+d}`; s+=P(dd,'flesh-limb-o','style="stroke-width:12"')+P(dd,'flesh-limb','style="stroke-width:8.5"'); });
    s+=P(`M${cx-28} ${cy-6} C${cx-30} ${cy-26} ${cx-4} ${cy-30} ${cx+12} ${cy-22} C${cx+24} ${cy-16} ${cx+26} ${cy+16} ${cx+12} ${cy+22} C${cx-4} ${cy+30} ${cx-30} ${cy+26} ${cx-28} ${cy+6} Z`,'flesh');
    s+=Ci(cx-14,cy-12,6,'tissue','style="fill:rgba(255,63,160,.5)"')+Ci(cx-10,cy+13,5,'tissue','style="fill:rgba(255,63,160,.5)"')+P(`M${cx-24} ${cy} C${cx-12} ${cy-4} ${cx} ${cy+4} ${cx+10} ${cy}`,'vein');
    s+=P(`M${cx+14} ${cy-30} C${cx+34} ${cy-22} ${cx+38} ${cy+22} ${cx+14} ${cy+30} C${cx+24} ${cy+14} ${cx+24} ${cy-14} ${cx+14} ${cy-30} Z`,'bone');
    s+=P(`M${cx+20} ${cy-18} l5 2 M${cx+23} ${cy-6} l6 1 M${cx+23} ${cy+6} l6 -1 M${cx+20} ${cy+18} l5 -2`,'fzd','style="stroke:#6b5d45"');
    return s+'</g>'; },
  racimo(x,y,w,h,o){ const cx=x+w/2, cy=y+h/2; let s='';
    (o.links||[]).forEach(([a,b])=>{ s+=P(`M${cx} ${cy} Q${(cx+a*C)/2+8} ${(cy+b*C)/2-10} ${a*C} ${b*C}`,'filament','style="stroke-width:1.6"'); });
    s+=`<ellipse cx="${cx}" cy="${cy+4}" rx="38" ry="32" fill="rgba(0,0,0,.45)"/>`;
    s+=P(`M${cx-30} ${cy} C${cx-34} ${cy-26} ${cx-6} ${cy-36} ${cx+14} ${cy-28} C${cx+36} ${cy-20} ${cx+36} ${cy+18} ${cx+18} ${cy+28} C${cx} ${cy+38} ${cx-30} ${cy+28} ${cx-30} ${cy} Z`,'tissue-core');
    [[-14,-14,10],[10,-16,9],[16,6,10],[-4,12,11],[-20,8,8]].forEach(([a,b,r],i)=>{ s+=Ci(cx+a,cy+b,r,'flesh'); s+=`<ellipse cx="${cx+a+r*0.55}" cy="${cy+b-r*0.4}" rx="${r*0.42}" ry="${r*0.36}" class="flesh"/>`; });
    s+=P(`M${cx-14} ${cy-14} L${cx+10} ${cy-16} L${cx+16} ${cy+6} L${cx-4} ${cy+12} L${cx-20} ${cy+8} Z`,'vein');
    s+=Ci(cx,cy-2,4,'tissue','style="fill:rgba(255,63,160,.7)"');
    return s; },
  masa(x,y,w,h,o){ const cx=x+w/2, cy=y+h/2, stun=o.stunned; let s='';
    const rnd=(i)=>{ const v=Math.sin(i*12.9898+78.233)*43758.5453; return v-Math.floor(v); };
    (o.links||[]).forEach(([a,b],i)=>{ const tx=a*C, ty=b*C; s+=P(`M${cx} ${cy} C${cx+(tx-cx)*0.35+(i%2?24:-24)} ${cy+(ty-cy)*0.25} ${tx+(tx-cx)*-0.25} ${ty+(i%2?-18:18)} ${tx} ${ty}`,'filament',`style="stroke-width:${stun?1.2:2.4};opacity:${stun?.45:.9}"`);
      s+=P(`M${cx} ${cy} C${cx+(tx-cx)*0.5} ${cy+(ty-cy)*0.4+10} ${tx-(tx-cx)*0.2} ${ty} ${tx} ${ty}`,'filament',`style="stroke-width:1;opacity:${stun?.3:.55}"`); });
    s+=`<ellipse cx="${cx}" cy="${cy+8}" rx="${w/2+10}" ry="${h/2+4}" fill="rgba(0,0,0,.5)"/>`;
    const N=16; let d=''; for(let i=0;i<=N;i++){ const a=i/N*Math.PI*2, k=0.86+rnd(i%N)*0.32, rr=(w/2+4)*k; const px=cx+Math.cos(a)*rr, py=cy+Math.sin(a)*rr*0.95;
      if(!i) d+=`M${px.toFixed(1)} ${py.toFixed(1)} `; else { const am=(i-0.5)/N*Math.PI*2, km=0.78+rnd(i+40)*0.2; d+=`Q${(cx+Math.cos(am)*(w/2+4)*km).toFixed(1)} ${(cy+Math.sin(am)*(w/2+4)*km*0.95).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)} `; } }
    s+=P(d+'Z', stun?'flesh':'flesh', stun?'style="fill:#2a2223;stroke:#8f9897;stroke-width:2"':'style="fill:#3b1220;stroke:#ff4a4a;stroke-width:2"');
    for(let i=0;i<14;i++){ const a=rnd(i+3)*Math.PI*2, rr=rnd(i+9)*(w/2-14), r=8+rnd(i+21)*12; s+=Ci((cx+Math.cos(a)*rr).toFixed(1),(cy+Math.sin(a)*rr).toFixed(1),r.toFixed(1), stun?'fz2':'flesh', stun?'style="fill:#353031;stroke:#5b5556"':'style="fill:#55182c;stroke:#c7366a;stroke-width:1"'); }
    for(let i=0;i<9;i++){ const a=rnd(i+60)*Math.PI*2, rr=(w/2-10)*(0.6+rnd(i+70)*0.4); s+=P(`M${cx} ${cy} Q${cx+Math.cos(a+0.5)*rr*0.5} ${cy+Math.sin(a+0.5)*rr*0.5} ${(cx+Math.cos(a)*rr).toFixed(1)} ${(cy+Math.sin(a)*rr).toFixed(1)}`,'vein',stun?'style="stroke:#8f9897;opacity:.35"':'style="stroke-width:1.5"'); }
    [[0.62,-0.2],[-0.5,-0.55],[0.1,0.66],[-0.7,0.3],[0.35,0.42]].forEach(([a,b],i)=>{ const px=cx+a*w/2, py=cy+b*h/2; s+=`<ellipse cx="${px}" cy="${py}" rx="${6+i%2}" ry="4" transform="rotate(${i*37} ${px} ${py})" fill="${stun?'#5b5556':'#e8cfa4'}" stroke="${stun?'#6f7877':'#ff4a4a'}" stroke-width="1"/>`+(stun?'':Ci(px+1,py,1.6,'deco','style="fill:#1a0303"')); });
    [[-0.95,-0.1,-1.25,-0.3],[0.9,0.5,1.2,0.75],[0.2,-0.95,0.35,-1.2]].forEach(([a,b,c2,d2])=>{ const dd=`M${cx+a*w/2} ${cy+b*h/2} Q${cx+(a+c2)/2*w/2+8} ${cy+(b+d2)/2*h/2} ${cx+c2*w/2} ${cy+d2*h/2}`; s+=P(dd,'flesh-limb-o',stun?'style="stroke:#6f7877;stroke-width:10"':'style="stroke-width:10"')+P(dd,'flesh-limb',stun?'style="stroke:#2a2223;stroke-width:7"':'style="stroke:#3b1220;stroke-width:7"'); });
    s+=Ci(cx-4,cy-4,11, stun?'fz2':'tissue', stun?'style="fill:#4a4445"':'style="fill:rgba(255,63,160,.75);stroke-width:1.5"');
    if(stun) s+=`<rect x="${x-10}" y="${y-10}" width="${w+20}" height="${h+20}" class="stun-ring"/>`+Tx(cx,y-16,'ATURDIDA','lb-small','style="fill:#e6dc4f;font-size:10px"');
    return s; },
  piloto(x,y,w,h,o){ const cx=x+w/2, cy=y+h/2; let s=`<g ${rot(o.face,cx,cy)}>`;
    s+=P(`M${cx-2} ${cy-6} L${cx+16} ${cy-8} M${cx-2} ${cy+6} L${cx+16} ${cy+9}`,'fzd','style="stroke:#6f7a77;stroke-width:5.5;stroke-linecap:round"');
    s+=`<ellipse cx="${cx-4}" cy="${cy}" rx="8" ry="12" class="suit"/>`;
    s+=Ci(cx-14,cy,6.5,'skin','style="fill:#cfd6d4"')+P(`M${cx-18} ${cy-4} a6 6 0 0 1 0 8`,'fzd','style="stroke:#0b1414;stroke-width:2"');
    s+=P(`M${cx-2} ${cy-11} C${cx+4} ${cy-16} ${cx+8} ${cy-16} ${cx+11} ${cy-14}`,'fzd','style="stroke:#6f7a77;stroke-width:4;stroke-linecap:round"');
    return s+'</g>'; },
};

/* ================= EQUIPO: SILUETAS CENITALES =================
   Cada icono se dibuja en su propio sistema de coordenadas (w × h) y se escala al hueco. */
const symIg = (cx,cy,s=1,col='#ff9a6e') => `<g transform="translate(${cx} ${cy}) scale(${s})"><polygon points="0,-7 6,-3.5 6,3.5 0,7 -6,3.5 -6,-3.5" fill="#120500" stroke="${col}" stroke-width="1.3"/><path d="M-2.6 3 C-3.4 0 -1 -1 0 -4.4 C1 -1 3.4 0 2.6 3 Z" fill="${col}"/></g>`;
export const ICON = {
  carabina:{w:60,h:18,d:()=>`<path d="M1 6 L13 5 L13 13 L1 12 Z" class="ic"/><rect x="13" y="4" width="24" height="9" rx="1" class="ic"/><rect x="37" y="6" width="12" height="5" class="ic2"/><rect x="49" y="7.5" width="10" height="2" class="ic"/><path d="M24 13 L29 13 L28 18 L24 17 Z" class="ic2"/><rect x="25" y="14.5" width="3" height="1.4" fill="#ff9a6e"/><path d="M17 13 l2.5 0 l-1 4 l-2.5 0z" class="ic2"/><rect x="21" y="2" width="9" height="2.4" class="ic2"/>`},
  fusil:{w:80,h:18,d:()=>`<path d="M1 6 C4 4 14 4 18 5 L18 13 C12 14 4 14 1 12 Z" class="ic"/><rect x="18" y="5" width="26" height="8" class="ic"/><rect x="44" y="6" width="14" height="6" class="ic2"/><rect x="58" y="7.8" width="21" height="2.2" class="ic"/><rect x="23" y="1" width="18" height="4.4" rx="2" class="ic2"/><circle cx="24" cy="3.2" r="1.6" fill="#48d8d8"/><circle cx="40" cy="3.2" r="1.6" fill="#48d8d8"/><rect x="30" y="13" width="5" height="4.5" class="ic2"/><rect x="31" y="14.6" width="3" height="1.3" fill="#ff9a6e"/><path d="M56 12 L70 15 M56 6 L70 3" class="icl"/>`},
  igneo:{w:86,h:42,d:()=>`<rect x="1" y="4" width="14" height="34" rx="2" class="ic2"/><path d="M3 8 L13 34 M13 8 L3 34" class="icl" style="opacity:.5"/><circle cx="4" cy="7" r="1.2" fill="#c5cbc9"/><circle cx="12" cy="7" r="1.2" fill="#c5cbc9"/><circle cx="4" cy="35" r="1.2" fill="#c5cbc9"/><circle cx="12" cy="35" r="1.2" fill="#c5cbc9"/>
    <path d="M56 14 L76 6 M56 28 L76 36" class="icl" style="stroke-width:2.2"/><path d="M74 4 l5 3 M74 38 l5 -3" class="icl" style="stroke-width:2"/>
    <rect x="12" y="13" width="62" height="16" rx="7" class="ic"/><rect x="14" y="12" width="5" height="18" rx="1.5" class="ic2"/>
    <rect x="68" y="11" width="17" height="20" rx="3" class="ic"/>${[14,21,28].map(y=>`<circle cx="72" cy="${y}" r="1.6" fill="#0b0c0c" stroke="#a9b3b1" stroke-width=".7"/><circle cx="79" cy="${y}" r="1.6" fill="#0b0c0c" stroke="#a9b3b1" stroke-width=".7"/>`).join('')}
    <rect x="22" y="15" width="11" height="12" rx="1" fill="#0b0c0c" stroke="#ff9a6e" stroke-width="1" stroke-dasharray="2 1.5"/>
    <rect x="37" y="4" width="15" height="9" rx="2" class="ic2"/><circle cx="48" cy="8.5" r="2.3" fill="#3a4140" stroke="#6f7877" stroke-width=".8"/>
    <path d="M34 29 l3.4 0 l-1.2 9 l-3.4 0z" class="ic2"/><path d="M56 29 l3 0 l0 6.5 l-3 0z" class="ic2"/>
    ${symIg(61,21,0.85)}`},
  igneoDeploy:{w:90,h:56,d:()=>`<path d="M2 50 L30 50 L36 44 L8 44 Z" class="ic2"/><path d="M12 47 h16" class="icl" style="opacity:.5"/>
    <path d="M60 22 L50 54 M60 22 L72 54 M54 40 L68 40" class="icl" style="stroke-width:2"/><path d="M46 54 h8 M68 54 h8" class="icl" style="stroke-width:2.4"/>
    <g transform="rotate(-36 22 44)"><rect x="18" y="38" width="70" height="13" rx="6" class="ic"/><rect x="78" y="36" width="15" height="17" rx="3" class="ic"/><circle cx="83" cy="41" r="1.4" fill="#0b0c0c"/><circle cx="88" cy="41" r="1.4" fill="#0b0c0c"/><circle cx="83" cy="48" r="1.4" fill="#0b0c0c"/><circle cx="88" cy="48" r="1.4" fill="#0b0c0c"/><rect x="44" y="30" width="13" height="8" rx="2" class="ic2"/><circle cx="53" cy="34" r="2" fill="#3a4140"/>${symIg(68,44.5,0.7)}</g>
    <circle cx="22" cy="45" r="3.2" class="ic2"/>`},
  botiquin:{w:36,h:26,d:()=>`<path d="M12 7 V2 H24 V7" class="icl" style="stroke-width:2"/><rect x="2" y="6" width="32" height="18" rx="4" class="ic"/><rect x="2" y="13" width="32" height="4" fill="rgba(191,243,240,.75)"/><rect x="7" y="5" width="4" height="3" class="ic2"/><rect x="25" y="5" width="4" height="3" class="ic2"/>`},
  trauma:{w:40,h:28,d:()=>`<path d="M13 7 V1.5 H27 V7" class="icl" style="stroke-width:2.2"/><rect x="1" y="6" width="38" height="21" rx="3" class="ic"/><rect x="1" y="14" width="38" height="4.5" fill="#ff9a6e"/><rect x="6" y="5" width="5" height="3.4" class="ic2"/><rect x="29" y="5" width="5" height="3.4" class="ic2"/><path d="M5 23 h30" class="icl" style="opacity:.4"/>`},
  placa:{w:26,h:32,d:()=>`<path d="M6 1 H20 L25 6 V27 L13 31 L1 27 V6 Z" class="ic"/><path d="M7.5 4 H18.5 L22 7.5 V25 L13 28 L4 25 V7.5 Z" class="icl" style="opacity:.5"/><path d="M8 13 h10 M8 17 h10" class="icl" style="opacity:.6"/>`},
  incendiaria:{w:18,h:30,d:()=>`<ellipse cx="9" cy="19" rx="7" ry="10" class="ic"/><rect x="6" y="4" width="6" height="6" class="ic2"/><path d="M12 6 L16 19" class="icl" style="stroke-width:2"/><circle cx="4" cy="5" r="2.6" class="icl"/><rect x="2" y="17" width="14" height="3.4" fill="#ff6a2a"/>`},
  humo:{w:16,h:32,d:()=>`<rect x="2" y="6" width="12" height="25" rx="3" class="ic"/><rect x="4" y="1.5" width="8" height="6" class="ic2"/><circle cx="6" cy="4.5" r=".9" fill="#0b0c0c"/><circle cx="10" cy="4.5" r=".9" fill="#0b0c0c"/><rect x="2" y="15" width="12" height="4" fill="#8f9897"/><path d="M13 7 L15 18" class="icl" style="stroke-width:1.8"/>`},
  espuma:{w:20,h:36,d:()=>`<rect x="4" y="8" width="12" height="27" rx="5" class="ic"/><rect x="7" y="3" width="6" height="6" class="ic2"/><path d="M13 5 h5 l1 3" class="icl" style="stroke-width:1.6"/><path d="M7 6 C1 6 1 16 4 18" class="icl"/><rect x="4" y="20" width="12" height="3.5" fill="#48d8d8"/>`},
  termica:{w:32,h:22,d:()=>`<rect x="0" y="6" width="5" height="10" class="ic2"/><rect x="27" y="6" width="5" height="10" class="ic2"/><rect x="4" y="3" width="24" height="16" rx="2" class="ic"/><rect x="8" y="6" width="11" height="5" fill="#0b1414" stroke="#ff9a6e" stroke-width=".8"/><rect x="21" y="12" width="5" height="4" fill="#ff6a2a"/><circle cx="23.5" cy="7.5" r="1.2" fill="#ff6a2a"/>`},
  potenciada:{w:16,h:30,d:()=>`<path d="M3 4 L13 4 L14 28 L4 29 Z" class="ic"/><circle cx="6" cy="3.5" r="1.8" fill="#c9a96b"/><circle cx="10" cy="3.5" r="1.8" fill="#c9a96b"/><path d="M5.5 14 l3 -3 l3 3 M5.5 20 l3 -3 l3 3" fill="none" stroke="#ff6a2a" stroke-width="1.6"/>`},
  cable:{w:34,h:32,d:()=>`<circle cx="15" cy="17" r="13.5" class="ic"/><circle cx="15" cy="17" r="10" class="icl"/><circle cx="15" cy="17" r="6.5" class="icl"/><circle cx="15" cy="17" r="3.4" fill="#0b0c0c" stroke="#a9b3b1"/><path d="M27 10 C31 6 33 3 30 1 C27 -1 25 3 27 5" class="icl" style="stroke-width:2;stroke:#e6dc4f"/>`},
  visor:{w:36,h:22,d:()=>`<path d="M3 12 C0 2 36 2 33 12" fill="none" stroke="#6f7877" stroke-width="2" stroke-dasharray="3 2"/><circle cx="10" cy="13" r="7.5" class="ic"/><circle cx="26" cy="13" r="7.5" class="ic"/><circle cx="10" cy="13" r="4.2" fill="#062626" stroke="#48d8d8" stroke-width="1"/><circle cx="26" cy="13" r="4.2" fill="#062626" stroke="#48d8d8" stroke-width="1"/><rect x="15" y="10" width="6" height="5" class="ic2"/>`},
  dron:{w:36,h:36,d:()=>`${[[7,9],[29,9],[7,27],[29,27]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="6" fill="none" stroke="#a9b3b1" stroke-width=".9" stroke-dasharray="2 1.5"/>`).join('')}<path d="M12 12 L8 6 M24 12 L28 6 M12 24 L8 30 M24 24 L28 30" class="icl" style="stroke-width:2.6"/><rect x="11" y="11" width="14" height="14" rx="3.5" class="ic"/><circle cx="18" cy="18" r="2.6" fill="#062626" stroke="#48d8d8"/>`},
  maletin:{w:42,h:32,d:()=>`<path d="M15 6 V1.5 H27 V6" class="icl" style="stroke-width:2.4"/><rect x="1" y="5" width="40" height="26" rx="3.5" class="ic" style="fill:#2a2f2e;stroke:#e6dc4f;stroke-width:1.4"/><path d="M5 10 h32 M5 26 h32" class="icl" style="opacity:.45"/><rect x="6" y="4" width="5" height="3.5" class="ic2"/><rect x="31" y="4" width="5" height="3.5" class="ic2"/>${symIg(21,18,1.15)}`},
};
function drawIcon(name, x, y, w, h, rot=0){
  const ic=ICON[name]; if(!ic) return '';
  const vert = rot===90 || rot===-90 || rot===270;
  const nw = vert?ic.h:ic.w, nh = vert?ic.w:ic.h, s=Math.min(w/nw, h/nh);
  return `<g transform="translate(${x+w/2} ${y+h/2}) scale(${s.toFixed(3)}) rotate(${rot}) translate(${-ic.w/2} ${-ic.h/2})">${ic.d()}</g>`;
}
function iconSvg(name, px=180, ph=110){ const ic=ICON[name]; if(!ic) return ''; return `<svg viewBox="-4 -4 ${ic.w+8} ${ic.h+8}" width="${px}" height="${ph}" aria-hidden="true" style="display:block">${ic.d()}</svg>`; }
BODY.maletin = (x,y,w,h)=> drawIcon('maletin', x+3, y+5, w-6, h-10);
BODY.biomasa = (x,y,w,h)=>{ const cx=x+w/2, cy=y+h/2; let s='';
  [[-9,-6,9],[7,-8,7],[8,7,9],[-7,9,7],[0,0,11]].forEach(([a,b,r])=>s+=Ci(cx+a,cy+b,r,'tissue','style="fill:rgba(255,63,160,.32)"'));
  s+=P(`M${cx-12} ${cy+2} q6 -10 14 -6 M${cx-4} ${cy+12} q2 -10 12 -12 M${cx+2} ${cy-12} q-2 8 6 14`,'vein','style="stroke-width:1.3"');
  s+=Ci(cx,cy,3.2,'deco','style="fill:#ff3fa0"'); return s; };

/* ================= PATRONES ================= */
const DEFS = `<defs>
<pattern id="pTall" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#262c2b"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(207,214,212,.22)" stroke-width="2"/></pattern>
<pattern id="pRoof" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#1c2221"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(207,214,212,.12)" stroke-width="2"/></pattern>
<pattern id="pDiff" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" fill="rgba(230,220,79,.06)"/><path d="M2 7 L5 3 L8 7" fill="none" stroke="rgba(230,220,79,.6)" stroke-width="1.2"/></pattern>
<pattern id="pTis" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="12" height="12" fill="rgba(255,63,160,.14)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255,63,160,.55)" stroke-width="2"/></pattern>
<pattern id="pWalk" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(230,220,79,.04)"/><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(230,220,79,.20)" stroke-width="2"/></pattern>
<pattern id="pHaz" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="rgba(255,106,42,.10)"/><line x1="0" y1="0" x2="0" y2="9" stroke="#ff6a2a" stroke-width="2.5" stroke-opacity=".55"/></pattern>
</defs>`;

function cutSegs(segs, cuts){
  const out=[];
  segs.forEach(([x1,y1,x2,y2])=>{
    const horiz = y1===y2; let a=Math.min(horiz?x1:y1, horiz?x2:y2), b=Math.max(horiz?x1:y1, horiz?x2:y2);
    let parts=[[a,b]];
    cuts.forEach(d=>{ if(horiz && d.o==='h' && d.y===y1 || !horiz && d.o==='v' && d.x===x1){ const s0 = horiz?d.x:d.y, s1=s0+d.n; parts = parts.flatMap(([p,q])=> (s1<=p||s0>=q) ? [[p,q]] : [[p,Math.max(p,s0)],[Math.min(q,s1),q]].filter(([u,v])=>v-u>0.001)); } });
    parts.forEach(([p,q])=> out.push(horiz?[p,y1,q,y1,(p!==a),(q!==b)]:[x1,p,x1,q,(p!==a),(q!==b)]));
  });
  return out;
}
function wallRects(segs, cls, thick=T){
  return segs.map(([x1,y1,x2,y2,cutA,cutB])=>{
    const e0 = cutA?0:thick/2, e1 = cutB?0:thick/2;
    if(y1===y2) return R(x1*C-e0, y1*C-thick/2, (x2-x1)*C+e0+e1, thick, cls);
    return R(x1*C-thick/2, y1*C-e0, thick, (y2-y1)*C+e0+e1, cls);
  }).join('');
}
function arcLeaf(hx,hy,ax,ay,bx,by){ const r=Math.hypot(ax-hx,ay-hy), cross=(ax-hx)*(by-hy)-(ay-hy)*(bx-hx); return P(`M${ax} ${ay} A${r} ${r} 0 0 ${cross>0?1:0} ${bx} ${by}`,'door-arc')+L(hx,hy,ax,ay,'door-leaf'); }
function drawDoor(d){
  const h = d.o==='h', x0=d.x*C, y0=d.y*C, len=d.n*C, sw=d.sw||1; let s='';
  const pt = (along, across) => h ? [x0+along, y0+across] : [x0+across, y0+along];
  if(d.k==='swing'){ const [hx,hy]=pt(5,0), [ax,ay]=pt(5,sw*(len-10)), [bx,by]=pt(len-5,0); s+=arcLeaf(hx,hy,ax,ay,bx,by); }
  else if(d.k==='double'){ const r=len/2-5; let [hx,hy]=pt(5,0),[ax,ay]=pt(5,sw*r),[bx,by]=pt(len/2,0); s+=arcLeaf(hx,hy,ax,ay,bx,by); [hx,hy]=pt(len-5,0); [ax,ay]=pt(len-5,sw*r); s+=arcLeaf(hx,hy,ax,ay,bx,by); }
  else if(d.k==='quar'||d.k==='slide'){ const [rx,ry]=pt(3,-4); s+= h ? R(rx,ry,len-6,8,d.k==='quar'?'qdoor':'slide') : R(rx,ry,8,len-6,d.k==='quar'?'qdoor':'slide'); const [m1x,m1y]=pt(len/2,-4),[m2x,m2y]=pt(len/2,4); s+=L(m1x,m1y,m2x,m2y,d.k==='quar'?'qdoor-l':'fzd'); }
  else if(d.k==='roll'){ const [rx,ry]=pt(3,-5); s+= h ? R(rx,ry,len-6,10,'roll') : R(rx,ry,10,len-6,'roll'); for(let i=10;i<len-6;i+=8){ const [a1,b1]=pt(i,-5),[a2,b2]=pt(i,5); s+=L(a1,b1,a2,b2,'roll-l'); } }
  else if(d.k==='barrier'){ const [a1,b1]=pt(4,0),[a2,b2]=pt(len-4,0); s+=L(a1,b1,a2,b2,'fzd','style="stroke:#e6dc4f;stroke-width:4;stroke-dasharray:8 6"')+Ci(a1,b1,4,'fz2'); }
  if(d.label){ const lx = d.lx!=null ? d.lx*C : (h? x0+len/2 : x0+ (d.lside||1)*14), ly = d.ly!=null ? d.ly*C : (h? y0+(d.lside||1)*16 : y0+len/2); s+=`<g class="g-labels">${Tx(lx,ly+3,d.label,'lb-small'+(d.k==='quar'?' lb-cyan':''),d.anchor?`style="text-anchor:${d.anchor}"`:'')}</g>`; }
  return s;
}
function cellsPath(cells){ return cells.map(([c,r,w=1,h=1])=>R(X(c)+1,Y(r)+1,w*C-2,h*C-2,'')).join(''); }
const LEG = {
  wall:'<svg width="22" height="10"><rect x="0" y="2" width="22" height="6" fill="#b8c0be"/></svg>PARED',
  tall:'<svg width="18" height="14"><rect x="1" y="1" width="16" height="12" fill="url(#lgTall)" stroke="#cfd6d4" stroke-width="1.4"/></svg>MAQUINARIA / MUEBLE ALTO · BLOQUEA PASO Y VISIÓN',
  low:'<svg width="18" height="14"><rect x="1" y="1" width="16" height="12" fill="rgba(233,236,234,.09)" stroke="rgba(233,236,234,.62)"/></svg>MOBILIARIO BAJO · MEDIA COBERTURA',
  diff:'<svg width="18" height="14"><rect x="1" y="1" width="16" height="12" fill="url(#lgDiff)" stroke="rgba(230,220,79,.55)" stroke-dasharray="3 2"/></svg>SUELO DIFÍCIL',
  tissue:'<svg width="18" height="14"><rect x="1" y="1" width="16" height="12" fill="url(#lgTis)" stroke="#ff3fa0" stroke-dasharray="3 2"/></svg>TEJIDO',
  glass:'<svg width="22" height="10"><rect x="0" y="2" width="22" height="6" fill="rgba(191,243,240,.14)" stroke="#bff3f0"/></svg>CRISTAL · SIN PASO NI DISPARO',
  door:'<svg width="22" height="14"><line x1="2" y1="12" x2="2" y2="2" stroke="#e9ecea" stroke-width="2"/><path d="M2 2 A10 10 0 0 1 12 12" fill="none" stroke="rgba(233,236,234,.45)" stroke-dasharray="2 2"/></svg>PUERTA',
  roll:'<svg width="22" height="10"><rect x="0" y="1" width="22" height="8" fill="rgba(233,236,234,.1)" stroke="rgba(233,236,234,.75)"/></svg>PUERTA DE CARGA',
  qdoor:'<svg width="22" height="10"><rect x="0" y="1" width="22" height="8" fill="rgba(72,216,216,.25)" stroke="#48d8d8" stroke-width="1.5"/></svg>PUERTA SELLADA',
  fence:'<svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#c9d2d0" stroke-width="2"/><rect x="0" y="3" width="4" height="4" fill="#c5cbc9"/><rect x="18" y="3" width="4" height="4" fill="#c5cbc9"/></svg>VALLA',
  hazard:'<svg width="18" height="14"><rect x="1" y="1" width="16" height="12" fill="url(#lgHaz)" stroke="#ff6a2a"/></svg>ZONA DE DESCARGA',
  ag:'<svg width="16" height="16"><circle cx="8" cy="8" r="6.5" fill="#062626" stroke="#48d8d8" stroke-width="2"/></svg>AGENTE',
  en:'<svg width="16" height="16"><rect x="1" y="1" width="14" height="14" fill="rgba(255,74,74,.07)" stroke="#ff4a4a" stroke-dasharray="3 2"/></svg>AMENAZA',
  npc:'<svg width="16" height="16"><rect x="2" y="2" width="12" height="12" fill="#070808" stroke="#e6dc4f" stroke-width="1.5"/></svg>PERSONA',
  obj:'<svg width="16" height="16"><polygon points="8,1 15,8 8,15 1,8" fill="rgba(230,220,79,.18)" stroke="#e6dc4f" stroke-width="1.5"/></svg>OBJETIVO / MANDO',
};
const LEGDEFS = `<svg width="0" height="0" style="position:absolute"><defs><pattern id="lgTall" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#262c2b"/><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(207,214,212,.35)" stroke-width="1.5"/></pattern><pattern id="lgDiff" width="8" height="6" patternUnits="userSpaceOnUse"><path d="M1 5 L3 2 L5 5" fill="none" stroke="rgba(230,220,79,.7)"/></pattern><pattern id="lgTis" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="6" height="6" fill="rgba(255,63,160,.15)"/><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,63,160,.6)" stroke-width="1.5"/></pattern><pattern id="lgHaz" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="rgba(255,106,42,.1)"/><line x1="0" y1="0" x2="0" y2="5" stroke="#ff6a2a" stroke-opacity=".6" stroke-width="1.5"/></pattern></defs></svg>`;


/* ================= ESTADO POR ESCENARIO ================= */
/** Estado vacío y saneado de un escenario. */
export function blankScenarioState() { return { states: {}, cs: {}, pos: {}, inv: {}, agents: {}, layers: {} }; }

/* ================= VISTA ================= */
/**
 * Crea una vista táctica.
 * opts: { mapHost, panelHost (solo dirección), cardHost (solo transmisión), mode: 'director' | 'player',
 *         getStore(): { scen(id) → estado mutable, flags: {hideEnemies}, shared: {hp} },
 *         onChange(): el estado persistente cambió (dirección guarda y publica),
 *         onSelect(id): cambió la selección (dirección publica la ficha) }
 */
export function createTacticalView(opts) {
  const director = opts.mode !== 'player';
  let S = null, st = null, svg = null;
  const ui = { sel: null, preview: false, placing: null, legend: true, grid: true, labels: true };
  const players = () => !director || ui.preview;
  const store = () => opts.getStore();

  // ------------------------------------------------------------ DOM
  const mapRoot = document.createElement('div');
  mapRoot.className = 'tac tac-map' + (director ? '' : ' tac-player');
  mapRoot.innerHTML = `${LEGDEFS}
    <header class="t-head">
      <div class="t-crumb" data-t="crumb"></div>
      <div class="t-titles"><h2 class="t-title" data-t="title"></h2><div class="t-obj"><b>OBJETIVO:</b><span data-t="objective"></span></div></div>
      <div class="t-chips" data-t="chips"></div>
      <ul class="t-legend" data-t="legend" aria-label="Leyenda del escenario"></ul>
    </header>
    <div class="t-meta"><span data-t="meta"></span><span class="t-cell" data-t="cell">COL — · FILA —</span></div>
    <div class="t-frame"><svg class="t-svg" data-t="svg" preserveAspectRatio="xMidYMid meet" role="group"></svg></div>
    <div class="t-foot" data-t="foot"></div>`;
  opts.mapHost.appendChild(mapRoot);
  svg = mapRoot.querySelector('[data-t="svg"]');
  let panel = null;
  if (director && opts.panelHost) {
    panel = document.createElement('div');
    panel.className = 'tac tac-panel';
    panel.innerHTML = `
      <section class="sec"><h3 class="sl">BETA-7 · INSERTAR:</h3>
        <div class="agents" data-t="agents" role="group" aria-label="Insertar agentes de Beta-7"></div>
        <p class="hint" data-t="placehint">Pulsa un agente y luego una casilla del mapa. Con teclado, Enter lo coloca junto a la entrada; después muévelo con las flechas.</p></section>
      <section class="sec"><h3 class="sl">VISUALIZACIÓN:</h3>
        <div class="toggles">
          <label class="tg"><input type="checkbox" data-t="t-grid" checked> CUADRÍCULA</label>
          <label class="tg"><input type="checkbox" data-t="t-labels" checked> RÓTULOS</label>
          <label class="tg"><input type="checkbox" data-t="t-preview"> PREVISUALIZAR VISTA DE JUGADORES</label>
        </div></section>
      <section class="sec" data-t="sec-states"><h3 class="sl">ESTADO:</h3><div data-t="states"></div></section>
      <section class="sec"><h3 class="sl">SELECCIÓN:</h3><div class="detail" data-t="detail" aria-live="polite"></div></section>
      <section class="sec"><h3 class="sl">CONTACTOS:</h3><div data-t="clists"></div></section>
      <section class="sec"><h3 class="sl">CAPAS:</h3><div class="layers" data-t="layers"></div></section>
      <section class="sec"><h3 class="sl">NOTAS DE DIRECCIÓN:</h3><ul class="notes" data-t="notes"></ul></section>
      <p class="hint">Dirección coloca los iconos a mano (arrastrar o flechas) y cambia los estados. No hay movimiento, tiradas, daño ni eventos automáticos. Atajos: <kbd>L</kbd> leyenda · <kbd>E</kbd> amenazas.</p>`;
    opts.panelHost.appendChild(panel);
  }
  const q = (k) => (panel && panel.querySelector(`[data-t="${k}"]`)) || mapRoot.querySelector(`[data-t="${k}"]`);

  // ------------------------------------------------------------ utilidades de estado
  const matches = (w) => !w || Object.entries(w).every(([k, v]) => (Array.isArray(v) ? v.includes(st.states[k]) : st.states[k] === v));
  const layerOn = (l) => st.layers[l] !== false;
  const invOf = (k) => (st.inv[k.id] != null ? st.inv[k.id] : k.qty);
  const posKey = (k) => k.id + (k.when ? '|' + JSON.stringify(k.when) : '');
  const changed = () => { opts.onChange?.(); };

  function hydrate() {
    // valores por defecto de estados y revelación; descarta valores que el escenario no conoce
    (S.states || []).forEach((g) => { if (!g.options.some((o) => o[0] === st.states[g.key])) st.states[g.key] = g.def; });
    (S.contacts || []).forEach((k) => {
      const c = st.cs[k.id];
      if (!c || typeof c !== 'object') st.cs[k.id] = { rev: k.revealed != null ? k.revealed : (k.kind === 'obj' || k.kind === 'item'), down: false };
    });
  }

  function allContacts() {
    const list = [];
    for (const [code, name] of AGENTS) {
      const a = st.agents[code];
      if (a && Number.isFinite(a.c) && Number.isFinite(a.r)) list.push({ kind: 'ag', id: 'ag-' + code, code, name, c: a.c, r: a.r, desc: 'Agente de Beta-7 insertado por dirección. Arrástralo o muévelo con las flechas.' });
    }
    (S.contacts || []).forEach((k) => {
      if (!matches(k.when)) return;
      const p = st.pos[posKey(k)];
      list.push(p ? { ...k, c: p.c, r: p.r, moved: true } : k);
    });
    return list;
  }
  const hiddenEnemies = () => !!store().flags.hideEnemies;
  function visibleInList(k) {
    if (k.kind === 'ag') return true;
    if (k.kind === 'en' && hiddenEnemies()) return false;
    const cs = st.cs[k.id] || {};
    return !players() || (cs.rev && !cs.down);
  }
  const movable = (k) => director && ['ag', 'npc', 'en', 'obj'].includes(k.kind);

  // ------------------------------------------------------------ render del mapa
  function render() {
    if (!S) return;
    const W = S.cols * C, Hh = S.rows * C, m = Object.assign({ l: 64, t: 34, r: 24, b: 44 }, S.margin || {});
    const obj = S.objectives ? (S.objectives[st.states[S.objectiveKey || 'escena']] || S.objective) : S.objective;
    q('objective').textContent = `«${obj}»`;
    mapRoot.classList.toggle('no-legend', !ui.legend);
    mapRoot.classList.toggle('show-grid', ui.grid);
    mapRoot.classList.toggle('show-labels', ui.labels);
    mapRoot.classList.toggle('players', players());
    q('chips').replaceChildren(...(director && hiddenEnemies() ? [chip('AMENAZAS OCULTAS · E')] : []), ...(ui.placing ? [chip(`INSERTANDO ${ui.placing} · ESC CANCELA`)] : []));
    svg.setAttribute('viewBox', `${-m.l} ${-m.t} ${W + m.l + m.r} ${Hh + m.t + m.b}`);
    svg.setAttribute('aria-label', `Plano de combate: ${S.cols} columnas por ${S.rows} filas`);
    svg.classList.toggle('placing', !!ui.placing);
    const items = S.items.filter((it) => matches(it.when));
    const by = (t) => items.filter((it) => it.t === t);
    const L_ = { base: [], mobiliario: [], tejido: [], cambios: [], objetivos: [], personajes: [], contactos: [], labels: [], dir: [] };
    const push = (layer, s) => { (L_[layer] || L_.base).push(s); };
    const view = { states: st.states };

    by('floor').forEach((f) => push(f.layer || 'base', R(X(f.c), Y(f.r), f.w * C, f.h * C, 'fl-' + (f.s || 'room'))));
    by('mark').forEach((mk) => { const x = X(mk.c), y = Y(mk.r), w = mk.w * C, h = mk.h * C; let s = '';
      if (mk.k === 'walk') s = R(x + 2, y + 2, w - 4, h - 4, 'walk');
      else if (mk.k === 'tape') s = R(x + 3, y + 3, w - 6, h - 6, 'tape');
      else if (mk.k === 'contain') s = R(x + 2, y + 2, w - 4, h - 4, 'contain');
      else if (mk.k === 'grate') { s = R(x + 3, y + 3, w - 6, h - 6, 'tape', 'style="stroke-width:1;opacity:.5"'); for (let i = x + 10; i < x + w - 4; i += 8) s += L(i, y + 6, i, y + h - 6, 'fzd', 'style="stroke:rgba(230,220,79,.28)"'); }
      else if (mk.k === 'lane') { const hz = w >= h; s = hz ? L(x, y + h / 2, x + w, y + h / 2, 'lane') + L(x, y + 3, x + w, y + 3, 'lane-edge') + L(x, y + h - 3, x + w, y + h - 3, 'lane-edge') : L(x + w / 2, y, x + w / 2, y + h, 'lane') + L(x + 3, y, x + 3, y + h, 'lane-edge') + L(x + w - 3, y, x + w - 3, y + h, 'lane-edge'); }
      else if (mk.k === 'hazard') s = R(x + 2, y + 2, w - 4, h - 4, mk.off ? 'hazard-off' : 'hazard-zone');
      push(mk.layer || 'base', s); });
    by('difficult').forEach((d) => push(d.layer || 'cambios', `<g class="diff">${cellsPath(d.cells)}</g>`));
    by('obj').forEach((o) => { const def = OBJ[o.k]; if (!def) return; const x = X(o.c), y = Y(o.r), w = (o.w || 1) * C, h = (o.h || 1) * C; let s = def.d(x, y, w, h, o);
      if (o.rot) s = `<g transform="rotate(${o.rot} ${x + w / 2} ${y + h / 2})">${s}</g>`;
      push(o.layer || (['building', 'pillar', 'tank', 'pump', 'helipad', 'tree', 'shrub'].includes(o.k) ? 'base' : 'mobiliario'), s);
      if (o.label) L_.labels.push(Tx(o.lx != null ? o.lx * C : x + w / 2, o.ly != null ? o.ly * C : y + h + 11, o.label, 'lb-small')); });
    by('tissue').forEach((ti) => { let s = ''; if (ti.cells) s += `<g class="tissue-diff">${cellsPath(ti.cells)}</g>`; (ti.blobs || []).forEach(([a, b, r]) => { s += Ci(a * C, b * C, r, 'tissue'); }); (ti.fil || []).forEach((d) => { s += P(d, 'filament'); }); push('tejido', s); });
    const cuts = by('door').concat(by('cut'));
    let ws = '';
    by('walls').forEach((w) => { const segs = cutSegs(w.segs, cuts);
      if (w.s === 'fence') segs.forEach(([x1, y1, x2, y2]) => { ws += L(x1 * C, y1 * C, x2 * C, y2 * C, 'fence'); const len = Math.hypot(x2 - x1, y2 - y1); for (let i = 0; i <= len; i++) { const px = (x1 + (x2 - x1) * i / len) * C, py = (y1 + (y2 - y1) * i / len) * C; ws += R(px - 2.5, py - 2.5, 5, 5, 'fence-post'); } });
      else ws += wallRects(segs, 'wall'); });
    by('glass').forEach((g) => cutSegs(g.segs, cuts).forEach(([x1, y1, x2, y2]) => { const hz = y1 === y2; ws += hz ? R(x1 * C, y1 * C - 5, (x2 - x1) * C, 10, 'glass') : R(x1 * C - 5, y1 * C, 10, (y2 - y1) * C, 'glass'); const n = Math.round(((hz ? x2 - x1 : y2 - y1) * C) / 20); for (let i = 1; i < n; i++) ws += hz ? L(x1 * C + i * 20 - 6, y1 * C + 4, x1 * C + i * 20, y1 * C - 4, 'glass-tick') : L(x1 * C - 4, y1 * C + i * 20, x1 * C + 4, y1 * C + i * 20 - 6, 'glass-tick'); }));
    push('base', ws);
    by('door').forEach((d) => push('base', drawDoor(d)));
    by('raw').forEach((r) => push(r.layer || 'cambios', r.svg(H, view)));
    by('label').forEach((lb) => { const t = Tx(lb.x * C, lb.y * C, lb.text, 'lb-' + (lb.s || 'room') + (lb.cyan ? ' lb-cyan' : ''), (lb.rot ? `transform="rotate(${lb.rot} ${lb.x * C} ${lb.y * C})" ` : '') + (lb.anchor ? `style="text-anchor:${lb.anchor}"` : '')); if (lb.dir) L_.dir.push(t); else if (lb.always) push('base', t); else L_.labels.push(t); });
    by('zone').forEach((z) => { let s = z.k === 'arrow' ? P(z.d, 'arrow-dir') + (z.head ? P(z.head, 'arrow-dir', 'style="stroke-dasharray:none"') : '') : R(X(z.c) + 2, Y(z.r) + 2, z.w * C - 4, z.h * C - 4, 'zone-dir'); if (z.label) s += Tx(z.lx != null ? z.lx * C : X(z.c) + z.w * C / 2, z.ly != null ? z.ly * C : Y(z.r) - 5, z.label, 'lb-dir'); L_.dir.push(s); });

    const tokens = [];
    allContacts().forEach((k) => {
      const cs = st.cs[k.id] || {}; const always = k.kind === 'ag';
      const hidden = always ? false : !cs.rev, down = always ? false : !!cs.down;
      if (k.kind === 'en' && hiddenEnemies()) return;
      if (players() && (hidden || down)) return;
      const layer = k.kind === 'en' ? 'contactos' : (k.kind === 'obj' || k.kind === 'item') ? 'objetivos' : 'personajes';
      if (!layerOn(layer)) return;
      const x = X(k.c), y = Y(k.r), w = (k.w || 1) * C, h = (k.h || 1) * C;
      let body = '';
      if (k.body && BODY[k.body]) body = BODY[k.body](x, y, w, h, { ...k, stunned: k.stunKey && st.states[k.stunKey] === k.stunVal });
      let mk = '';
      if (k.kind === 'ag') { const a = x + w / 2, b = y + h / 2; mk += Ci(a, b, 18, 'ag-halo') + Ci(a, b, 14.5, 'ag-ring') + Tx(a, b + 6, k.code, 'ag-t', `style="font-size:${k.code.length > 1 ? 13 : 17}px"`) + Ci(a, b, 20, 'focusring'); }
      else if (k.kind === 'en') { mk += R(x + 2, y + 2, w - 4, h - 4, 'foot-en'); const tw = 8 + k.code.length * 8; mk += R(x + 2, y - 14, tw, 15, hidden ? 'tag-hid' : 'tag-en') + Tx(x + 2 + tw / 2, y - 2, k.code, hidden ? 'tag-hid-t' : 'tag-en-t'); if (hidden) mk += Tx(x + tw + 8, y - 3, 'OCULTO', 'lb-dir', 'style="text-anchor:start;font-size:8.5px"'); mk += R(x - 1, y - 1, w + 2, h + 2, 'focusring') + `<g class="g-labels">${Tx(x + w / 2, y + h + 12, k.name.toUpperCase(), 'name-tag name-en')}</g>`; }
      else if (k.kind === 'npc') { const tw = 8 + k.code.length * 8; mk += R(x + 1, y + 1, w - 2, h - 2, '', 'fill="none" stroke="#e6dc4f" stroke-dasharray="2 3" opacity=".8"') + R(x + w - tw - 1, y - 13, tw, 15, 'tag-npc') + Tx(x + w - tw / 2 - 1, y - 1, k.code, 'tag-npc-t') + R(x - 1, y - 1, w + 2, h + 2, 'focusring'); if (hidden) mk += Tx(x, y - 3, 'OCULTO', 'lb-dir', 'style="text-anchor:start;font-size:8.5px"'); mk += `<g class="g-labels">${Tx(x + w / 2, y + h + 12, k.name.toUpperCase(), 'name-tag name-npc')}</g>`; }
      else if (k.kind === 'obj' && k.mark) {
        const col = k.mark === 'bio' ? '#ff3fa0' : '#e6dc4f', ink = k.mark === 'bio' ? '#1d0010' : '#0b0b00';
        const tw = 10 + k.code.length * 7.2, ty = k.tagBelow ? y + h + 1 : y - 15;
        mk += R(x + 1, y + 1, w - 2, h - 2, '', `fill="none" stroke="${col}" stroke-width="1.3" stroke-dasharray="3 2"`) + R(x + w / 2 - tw / 2, ty, tw, 15, '', `fill="${col}"`) + Tx(x + w / 2, ty + 11.5, k.code, 'tag-en-t', `style="fill:${ink};font-size:11.5px"`) + R(x - 1, y - 1, w + 2, h + 2, 'focusring');
        if (hidden) mk += Tx(x + w / 2 + tw / 2 + 4, ty + 11, 'OCULTO', 'lb-dir', 'style="text-anchor:start;font-size:8.5px"');
        if (k.on && st.states[k.on[0]] === k.on[1]) mk += R(x - 3, y - 3, w + 6, h + 6, '', `fill="none" stroke="${col}" stroke-width="2"`);
        mk += `<g class="g-labels">${Tx(x + w / 2, y + h + (k.tagBelow ? 28 : 12), (k.short || k.name).toUpperCase(), 'name-tag', `style="fill:${col}"`)}</g>`; }
      else if (k.kind === 'obj') { const on = k.stateKey && st.states[k.stateKey] === k.onVal; const a = x + w / 2, b = k.markAt === 'top' ? y + 2 : y + h / 2; const r = 11; mk += `<polygon points="${a},${b - r} ${a + r},${b} ${a},${b + r} ${a - r},${b}" class="obj-d${on ? ' on' : ''}"/>` + Tx(a, b + 4, k.code, 'obj-t' + (on ? ' on' : ''), `style="font-size:${k.code.length > 2 ? 9 : 11}px"`) + R(x - 1, y - 1, w + 2, h + 2, 'focusring') + `<g class="g-labels">${Tx(a, y + h + 12, (k.short || k.name).toUpperCase(), 'name-tag name-obj')}</g>`; }
      else if (k.kind === 'item') {
        const avail = invOf(k), n = avail > 0 ? Math.min(avail, k.show || avail) : 1, vert = (k.layout || (h > w ? 'v' : 'h')) === 'v';
        const bx = x + 3, by2 = y + 3, bw = w - 6, bh = h - 6; let units = '';
        for (let i = 0; i < n; i++) { const ux = vert ? bx : bx + i * bw / n, uy = vert ? by2 + i * bh / n : by2, uw = vert ? bw : bw / n, uh = vert ? bh / n : bh; units += R(ux + 1, uy + 1, uw - 2, uh - 2, 'item-back') + drawIcon(k.icon, ux + 3, uy + 3, uw - 6, uh - 6, k.rot || 0); }
        mk += `<g class="${avail > 0 ? '' : 'item-gone'}">${units}</g>`;
        const label = avail > 0 ? (k.qty > 1 ? '×' + avail : '') : 'RETIRADO';
        if (label) { const tw = 6 + label.length * 6.6; const tx = k.tag === 'w' ? x - tw + 6 : x + w - 6; mk += R(tx, y - 6, tw, 13, avail > 0 ? 'qty-tag' : 'qty-tag gone') + Tx(tx + tw / 2, y + 4, label, 'qty-t' + (avail > 0 ? '' : ' gone')); }
        mk += R(x - 1, y - 1, w + 2, h + 2, 'focusring') + R(x, y, w, h, '', 'fill="transparent"'); }
      const mv = movable(k);
      const cls = 'tok' + (hidden && !players() && !always ? ' unrev' : '') + (down ? ' downed' : '') + (mv ? ' movable' : '');
      const al = `${k.code} · ${kindLabel(k)} · ${k.name}${k.kind === 'item' ? ` · disponibles ${invOf(k)} de ${k.qty}` : ''} · columna ${k.c}, fila ${k.r}${mv ? ' · flechas para mover' : ''}`;
      tokens.push({ layer, html: `<g class="${cls}" tabindex="0" role="button" data-id="${esc(k.id)}" ${mv ? 'data-drag="1"' : ''} aria-label="${esc(al)}">${body}${mk}${down ? P(`M${x + 6} ${y + 6} L${x + w - 6} ${y + h - 6} M${x + w - 6} ${y + 6} L${x + 6} ${y + h - 6}`, 'fzd', 'style="stroke:#ff8f8f;stroke-width:2"') : ''}</g>` });
    });

    let grid = '<g class="g-grid" aria-hidden="true">';
    for (let c = 0; c <= S.cols; c++) grid += L(c * C, 0, c * C, Hh, 'gridline');
    for (let r = 0; r <= S.rows; r++) grid += L(0, r * C, W, r * C, 'gridline');
    for (let c = 1; c <= S.cols; c++) grid += Tx(X(c) + C / 2, -12, c, 'gridnum');
    for (let r = 1; r <= S.rows; r++) grid += Tx(-10, Y(r) + C / 2 + 3.5, r, 'gridnum', 'style="text-anchor:end"');
    grid += `<rect class="hitgrid" x="0" y="0" width="${W}" height="${Hh}" fill="transparent"/></g>`;
    const g = (name, arr) => (layerOn(name) && arr.length ? `<g data-layer="${name}" aria-hidden="true">${arr.join('')}</g>` : '');
    let out = DEFS + (layerOn('base') ? `<g data-layer="base" aria-hidden="true">${L_.base.join('')}</g>` : '') + grid;
    out += g('mobiliario', L_.mobiliario) + g('tejido', L_.tejido) + g('cambios', L_.cambios);
    out += `<g class="g-labels" aria-hidden="true">${L_.labels.join('')}</g><g class="g-dir" aria-hidden="true">${L_.dir.join('')}</g>`;
    ['objetivos', 'personajes', 'contactos'].forEach((l) => { out += g(l, L_[l]) + tokens.filter((t) => t.layer === l).map((t) => t.html).join(''); });
    out += '<g class="sel" aria-hidden="true"></g>';
    out += `<rect x="-6" y="-6" width="${W + 12}" height="${Hh + 12}" fill="none" stroke="rgba(220,230,228,.18)" pointer-events="none"/>`;
    out += P(`M-6 -6 h22 M-6 -6 v22 M${W + 6} -6 h-22 M${W + 6} -6 v22 M-6 ${Hh + 6} h22 M-6 ${Hh + 6} v-22 M${W + 6} ${Hh + 6} h-22 M${W + 6} ${Hh + 6} v-22`, 'frame-tick');
    svg.innerHTML = out;
    bindTokens();
    drawSel();
  }
  const chip = (t) => { const s = document.createElement('span'); s.className = 'chip warn'; s.textContent = t; return s; };

  // ------------------------------------------------------------ interacción con iconos
  function toSvg(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  function cellAt(e) { const p = toSvg(e); return { c: Math.floor(p.x / C) + 1, r: Math.floor(p.y / C) + 1 }; }
  function bindTokens() {
    svg.querySelectorAll('.tok').forEach((el) => {
      el.addEventListener('click', (e) => { if (ui.placing) return; e.stopPropagation(); if (el.dataset.dragged) { delete el.dataset.dragged; return; } select(el.dataset.id); });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(el.dataset.id); return; }
        const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (mv && el.dataset.drag) { e.preventDefault(); e.stopPropagation(); const k = allContacts().find((c) => c.id === el.dataset.id); if (k) { ui.sel = k.id; setPos(k, k.c + mv[0], k.r + mv[1]); } }
      });
      if (!el.dataset.drag) return;
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || ui.placing) return;
        const k = allContacts().find((c) => c.id === el.dataset.id); if (!k) return;
        e.stopPropagation();
        const p0 = toSvg(e); let moved = false; try { el.setPointerCapture(e.pointerId); } catch { /* ignorar */ }
        const mv = (ev) => { const p = toSvg(ev), dx = p.x - p0.x, dy = p.y - p0.y; if (!moved && Math.hypot(dx, dy) < 6) return; moved = true; el.setAttribute('transform', `translate(${dx} ${dy})`); el.classList.add('dragging'); };
        const up = (ev) => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
          if (moved) { const p = toSvg(ev); el.dataset.dragged = '1'; ui.sel = k.id; setPos(k, k.c + Math.round((p.x - p0.x) / C), k.r + Math.round((p.y - p0.y) / C)); } };
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
    });
  }
  function clampCell(k, c, r) { return { c: Math.max(1, Math.min(S.cols - (k.w || 1) + 1, c)), r: Math.max(1, Math.min(S.rows - (k.h || 1) + 1, r)) }; }
  function setPos(k, c, r) {
    ({ c, r } = clampCell(k, c, r));
    if (k.kind === 'ag') st.agents[k.code] = { c, r };
    else { const base = (S.contacts || []).find((o) => o.id === k.id); const key = posKey(k); if (base && base.c === c && base.r === r) delete st.pos[key]; else st.pos[key] = { c, r }; }
    changed(); render(); renderDetail(); renderLists();
    svg.querySelector(`.tok[data-id="${CSS.escape(k.id)}"]`)?.focus({ preventScroll: true });
  }
  // inserción manual de Beta-7
  function entryCell() {
    const hint = (S.starts || []).find((a) => matches(a.when)) || S.entry || { c: 1, r: 1 };
    const occ = new Set(allContacts().map((k) => `${k.c},${k.r}`));
    const blocked = new Set(); S.items.filter((i) => i.t === 'obj' && matches(i.when) && OBJ[i.k] && OBJ[i.k].c !== 'deco').forEach((o) => { for (let c = o.c; c < o.c + (o.w || 1); c++) for (let r = o.r; r < o.r + (o.h || 1); r++) blocked.add(`${c},${r}`); });
    for (let d = 0; d < Math.max(S.cols, S.rows); d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) {
      if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue;
      const c = hint.c + dc, r = hint.r + dr, key = `${c},${r}`;
      if (c >= 1 && r >= 1 && c <= S.cols && r <= S.rows && !occ.has(key) && !blocked.has(key)) return { c, r };
    }
    return { c: hint.c, r: hint.r };
  }
  function startPlacing(code, viaKeyboard) {
    if (viaKeyboard) { const cell = entryCell(); st.agents[code] = cell; ui.placing = null; ui.sel = 'ag-' + code; changed(); refresh(); svg.querySelector(`.tok[data-id="ag-${code}"]`)?.focus(); return; }
    ui.placing = ui.placing === code ? null : code; render(); renderAgents();
  }
  svg.addEventListener('click', (e) => {
    if (!director || !ui.placing || !S) return;
    const { c, r } = cellAt(e); if (c < 1 || r < 1 || c > S.cols || r > S.rows) return;
    const code = ui.placing; st.agents[code] = { c, r }; ui.placing = null; ui.sel = 'ag-' + code;
    changed(); refresh();
  });

  // ------------------------------------------------------------ selección y ficha
  function drawSel() {
    const g = svg.querySelector('.sel'); if (!g) return;
    const k = allContacts().find((c) => c.id === ui.sel); if (!k || !visibleInList(k)) { g.innerHTML = ''; return; }
    const x = X(k.c), y = Y(k.r), w = (k.w || 1) * C, h = (k.h || 1) * C, p = 6, Lb = 12, x0 = x - p, y0 = y - p, x1 = x + w + p, y1 = y + h + p;
    g.innerHTML = R(x, y, w, h, 'sel-wash') + P(`M${x0} ${y0 + Lb} V${y0} H${x0 + Lb} M${x1 - Lb} ${y0} H${x1} V${y0 + Lb} M${x1} ${y1 - Lb} V${y1} H${x1 - Lb} M${x0 + Lb} ${y1} H${x0} V${y1 - Lb}`, 'sel-br');
  }
  function select(id) { ui.sel = id; renderDetail(); renderLists(); drawSel(); opts.onSelect?.(id); }
  const posText = (k) => { const w = k.w || 1, h = k.h || 1; return (w > 1 || h > 1) ? `COL. ${k.c}–${k.c + w - 1} · FILAS ${k.r}–${k.r + h - 1} · HUELLA ${w} × ${h}` : `COL. ${k.c} · FILA ${k.r}`; };

  /** HTML de la ficha. publicOnly: solo campos observables (transmisión). */
  function detailHTML(k, publicOnly) {
    const cs = st.cs[k.id] || {};
    const title = (k.kind === 'ag' || k.kind === 'item') ? k.name.toUpperCase() : `${k.code} · ${k.name.toUpperCase()}`;
    let html = `<div class="d-kicker">${esc(kindLabel(k))}${k.zone ? ' · ' + esc(k.zone) : ''} · ${esc(k.code)}</div><div class="d-title ${k.kind}">${esc(title)}</div>`;
    if (k.kind === 'item') {
      const av = invOf(k);
      html += `<div class="d-icon">${iconSvg(k.icon)}${k.icon2 ? `<div class="d-icon2">${iconSvg(k.icon2, 150, 92)}<span>${esc(k.icon2Label || '')}</span></div>` : ''}</div>`;
      html += `<div class="d-qty"><span class="${av ? '' : 'gone'}">${av ? `${av} / ${k.qty} DISPONIBLE${k.qty > 1 ? 'S' : ''}` : 'RETIRADO'}</span></div>`;
    } else html += `<div class="d-pos">${posText(k)}${k.moved && !publicOnly ? ' · <span class="hl">COLOCADO A MANO</span>' : ''}</div>`;
    if (k.big) html += `<div class="d-icon">${iconSvg(k.big)}</div>`;
    if (k.badge) html += `<div class="badge-pub">${esc(k.badge)}</div>`;
    if (k.desc) html += `<p class="d-desc">${esc(k.desc)}</p>`;
    if (k.stats) html += `<table class="stats-t"><tbody>${k.stats.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`;
    if (k.effect) html += `<p class="d-effect"><b>EFECTO</b>${esc(k.effect)}</p>`;
    if (k.log) html += `<p class="d-log">${esc(k.log)}</p>`;
    if (k.stateKey) { const grp = (S.states || []).find((s) => s.key === k.stateKey); const opt = grp && grp.options.find((o) => o[0] === st.states[k.stateKey]); if (opt) html += `<span class="chip ${st.states[k.stateKey] === k.onVal ? 'on' : ''}">${esc(opt[1])}</span>`; }
    if (k.stunKey && st.states[k.stunKey] === k.stunVal) html += '<span class="chip warn">ATURDIDA</span>';
    if (publicOnly) return html;
    if (k.kind === 'item') {
      html += `<div class="acts"><button type="button" class="act" data-act="minus" ${invOf(k) ? '' : 'disabled'}>− RETIRAR UNA</button><button type="button" class="act" data-act="plus" ${invOf(k) < k.qty ? '' : 'disabled'}>+ CORREGIR / DEVOLVER</button></div>`;
      if (k.note) html += `<p class="note"><b>NOTA DE DIRECCIÓN</b>${esc(k.note)}</p>`;
    } else if (k.kind === 'ag') {
      html += '<div class="acts"><button type="button" class="act" data-act="remove">RETIRAR DEL MAPA</button></div>';
    } else {
      if (k.note) html += `<p class="note"><b>NOTA DE DIRECCIÓN</b>${esc(k.note)}</p>`;
      if (k.hp) { const v = store().shared.hp[k.hp]; html += `<label class="hp-l">PV ACTUALES · ANOTACIÓN COMPARTIDA ENTRE ESCENARIOS<input type="number" inputmode="numeric" min="0" step="1" class="hp-in" value="${v != null ? esc(v) : ''}" placeholder="—"></label>`; }
      html += `<div class="acts"><button type="button" class="act" data-act="rev" aria-pressed="${!!cs.rev}">${cs.rev ? '✓ VISIBLE PARA JUGADORES' : 'REVELAR A JUGADORES'}</button>`;
      if (k.kind !== 'obj') html += `<button type="button" class="act" data-act="down" aria-pressed="${!!cs.down}">${cs.down ? '✕ BAJA / RETIRADO' : 'MARCAR BAJA'}</button>`;
      if (k.moved) html += '<button type="button" class="act" data-act="reset">RESTABLECER POSICIÓN</button>';
      html += '</div>';
    }
    if (movable(k)) html += '<p class="hint">Arrastra el icono o enfócalo y usa las flechas para colocarlo.</p>';
    return html;
  }
  function renderDetail() {
    if (!panel) return;
    const el = q('detail');
    const k = allContacts().find((c) => c.id === ui.sel);
    if (!k || !visibleInList(k)) { el.innerHTML = '<div class="d-kicker">SIN SELECCIÓN</div><p class="d-desc dim">Elige un elemento en el mapa o en la lista.</p>'; return; }
    el.innerHTML = detailHTML(k, players());
    el.querySelectorAll('.act').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'rev' || a === 'down') { const c = st.cs[k.id]; if (a === 'rev') c.rev = !c.rev; else c.down = !c.down; }
      else if (a === 'minus') st.inv[k.id] = Math.max(0, invOf(k) - 1);
      else if (a === 'plus') st.inv[k.id] = Math.min(k.qty, invOf(k) + 1);
      else if (a === 'reset') delete st.pos[posKey(k)];
      else if (a === 'remove') { delete st.agents[k.code]; ui.sel = null; }
      changed(); refresh();
    }));
    const hp = el.querySelector('.hp-in');
    if (hp) hp.addEventListener('change', () => { const sh = store().shared.hp; if (hp.value === '') delete sh[k.hp]; else sh[k.hp] = Math.max(0, Math.min(99999, parseInt(hp.value, 10) || 0)); changed(); });
  }
  function renderLists() {
    if (!panel) return;
    const wrap = q('clists'); const all = allContacts();
    const groups = [['en', 'AMENAZAS'], ['npc', 'PERSONAS']];
    const seen = new Set();
    (S.contacts || []).forEach((k) => { if (k.kind === 'obj' || k.kind === 'item') { const gname = k.zone || k.group || 'OBJETIVOS Y MANDOS'; if (!seen.has(gname)) { seen.add(gname); groups.push(['g:' + gname, gname]); } } });
    const inGroup = (k, key) => (key.startsWith('g:') ? ((k.kind === 'obj' || k.kind === 'item') && ('g:' + (k.zone || k.group || 'OBJETIVOS Y MANDOS')) === key) : k.kind === key);
    let html = '';
    const placed = all.filter((k) => k.kind === 'ag');
    html += `<div class="grp">BETA-7 · ${placed.length}</div>` + (placed.length ? listHTML(placed) : '<div class="empty">Ningún agente insertado.</div>');
    groups.forEach(([key, label]) => {
      const ks = all.filter((k) => inGroup(k, key) && visibleInList(k));
      const declared = (S.contacts || []).some((k) => inGroup(k, key) && matches(k.when));
      if (!declared && !ks.length) return;
      html += `<div class="grp">${esc(label)} · ${ks.length}</div>`;
      if (key === 'en' && hiddenEnemies()) { html += '<div class="empty">Ocultas con el atajo E.</div>'; return; }
      html += ks.length ? listHTML(ks) : '<div class="empty">Nada visible.</div>';
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll('.cbtn').forEach((b) => b.addEventListener('click', () => select(b.dataset.id)));
  }
  function listHTML(ks) {
    return '<ul class="clist">' + ks.map((k) => {
      const cs = st.cs[k.id] || {}; const gone = k.kind === 'item' && !invOf(k);
      const cl = (k.kind !== 'ag' && !cs.rev ? ' hidden-c' : '') + (cs.down || gone ? ' down-c' : '');
      const pos = k.kind === 'item' ? (gone ? 'RETIRADO' : `${invOf(k)} / ${k.qty}`) : ((k.w || 1) > 1 || (k.h || 1) > 1) ? `${k.c}–${k.c + (k.w || 1) - 1} · ${k.r}–${k.r + (k.h || 1) - 1}` : `${k.c} · ${k.r}`;
      const code = k.kind === 'item' ? `<span class="code item" aria-hidden="true">${iconSvg(k.icon, 26, 20)}</span>` : `<span class="code ${k.kind}${k.mark ? ' mk-' + k.mark : ''}">${esc(k.code)}</span>`;
      return `<li><button type="button" class="cbtn${cl}" data-id="${esc(k.id)}" aria-pressed="${ui.sel === k.id}">${code}<span>${esc(k.name.toUpperCase())}</span><span class="pos">${pos}</span></button></li>`;
    }).join('') + '</ul>';
  }
  function renderAgents() {
    if (!panel) return;
    const wrap = q('agents');
    wrap.innerHTML = AGENTS.map(([code, name]) => { const placed = !!st.agents[code];
      return `<button type="button" class="agbtn${placed ? ' placed' : ''}" data-code="${code}" aria-pressed="${ui.placing === code}"><span class="code ag">${code}</span><span>${esc(name.toUpperCase())}</span><span class="pos">${placed ? `${st.agents[code].c} · ${st.agents[code].r}` : 'INSERTAR'}</span></button>`; }).join('');
    wrap.querySelectorAll('.agbtn').forEach((b) => b.addEventListener('click', (e) => startPlacing(b.dataset.code, e.detail === 0)));
  }
  function renderStates() {
    if (!panel) return;
    const groups = S.states || [];
    q('sec-states').hidden = !groups.length;
    const el = q('states');
    el.innerHTML = groups.map((gp) => { const dis = gp.enabledWhen && !matches(gp.enabledWhen);
      return `<div class="stgroup"><div class="stlabel">${esc(gp.label)}${dis ? ' · ' + esc(gp.disabledNote || 'NO APLICA') : ''}</div><div class="segb" role="group" aria-label="${esc(gp.label)}">${gp.options.map(([v, l]) => `<button type="button" data-k="${esc(gp.key)}" data-v="${esc(v)}" aria-pressed="${st.states[gp.key] === v}" ${dis ? 'disabled' : ''}>${esc(l)}</button>`).join('')}</div></div>`; }).join('');
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { st.states[b.dataset.k] = b.dataset.v; changed(); refresh(); }));
  }
  function renderLayers() {
    if (!panel) return;
    const el = q('layers');
    el.innerHTML = LAYERS.map(([k, l]) => `<label class="tg"><input type="checkbox" data-layer="${k}" ${layerOn(k) ? 'checked' : ''}> ${l}</label>`).join('');
    el.querySelectorAll('input').forEach((i) => i.addEventListener('change', () => { st.layers[i.dataset.layer] = i.checked; changed(); render(); }));
  }
  function renderStatic() {
    q('crumb').innerHTML = S.crumb.split('/').map((s) => esc(s.trim())).join(' <span class="sep">/</span> ');
    q('title').textContent = S.title;
    q('meta').textContent = S.meta || '';
    q('foot').textContent = `1 CASILLA ≈ 1,5 M · CUADRÍCULA ${S.cols} × ${S.rows} · ESCENARIO DE COMBATE A ESCALA, INDEPENDIENTE DEL PLANO GENERAL`;
    q('legend').innerHTML = (S.legend || ['wall', 'tall', 'low', 'diff', 'tissue', 'door', 'ag', 'en', 'obj']).map((k) => `<li>${LEG[k] || ''}</li>`).join('');
    if (panel) q('notes').innerHTML = (S.notes || []).map((n) => `<li>${esc(n)}</li>`).join('');
  }
  function refresh() { render(); renderDetail(); renderLists(); renderAgents(); renderStates(); renderLayers(); }

  // ------------------------------------------------------------ controles del panel
  if (panel) {
    const tg = (k, fn) => q(k).addEventListener('change', (e) => fn(e.target.checked));
    tg('t-grid', (v) => { ui.grid = v; render(); });
    tg('t-labels', (v) => { ui.labels = v; render(); });
    tg('t-preview', (v) => { ui.preview = v; panel.classList.toggle('players', v); refresh(); });
  }
  svg.addEventListener('mousemove', (e) => { if (!S) return; const { c, r } = cellAt(e); q('cell').textContent = (c >= 1 && c <= S.cols && r >= 1 && r <= S.rows) ? `COL ${c} · FILA ${r}` : 'COL — · FILA —'; });
  svg.addEventListener('mouseleave', () => { q('cell').textContent = 'COL — · FILA —'; });

  // ------------------------------------------------------------ API
  return {
    root: mapRoot,
    /** Carga un escenario (dirección y transmisión). */
    setScenario(scn) {
      if (S !== scn) { S = scn; ui.sel = director ? (scn.initialSel || null) : null; ui.placing = null; }
      st = store().scen(scn.id); hydrate(); renderStatic(); refresh();
    },
    get scenario() { return S; },
    get selection() { return ui.sel; },
    /** Vuelve a leer el estado (p. ej. tras recibirlo de otra ventana). */
    refresh() { if (!S) return; st = store().scen(S.id); hydrate(); refresh(); },
    setLegend(on) { ui.legend = !!on; if (S) render(); },
    /** Ficha pública de un id (para la vista de jugadores); null si no es visible. */
    publicCard(id) { if (!S || !id) return null; const k = allContacts().find((c) => c.id === id); if (!k || !visibleInList(k)) return null; return detailHTML(k, true); },
    setRemoteSelection(id) { ui.sel = id; if (S) drawSel(); },
    cancelPlacing() { if (!ui.placing) return false; ui.placing = null; render(); renderAgents(); return true; },
    get placing() { return ui.placing; },
    destroy() { mapRoot.remove(); panel?.remove(); },
  };
}
