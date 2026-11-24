'use strict';
/* ===== town: extra streetscape (decor only — no rooms, no talking) =====
   ・どんぐりどおり: new street going south from the main road west of わたしの いえ (x≈-39.5), 8 houses, a gate, a windmill at the end
   ・4 houses along the road to the ruins (x≈-21)
   ・パンや / はなや at both ends of the shopping street, カフェ + terrace and a bus stop by the main road, a たいやき stall
   ・すいしゃごや (water-wheel hut) on the river bank
   ・small street things: mailboxes, benches, planters, bicycles, a well, crates, flower buckets
   Every building is "baked": its parts are merged per material (plain colours → one vertex-colour mesh), so it costs
   only a few draw calls. Small repeated things use inst() (one draw call per part type for the whole village).
   Called from buildWorld() before the random trees, so trees / flowers grow around it. */

const VCMAT=Toon({color:0xffffff,vertexColors:true}),VCTEX={};
const HIPGEO=(()=>{const g=new THREE.ConeGeometry(1,1,4);g.rotateY(Math.PI/4);return g;})();
const TAPER=new THREE.CylinderGeometry(.72,1,1,16);
const DOOR_COLS=[0x9a6a44,0x5a8ed6,0xe0675a,0x3daf88,0x8d6e63],WFLOW=[0xff9fb8,0xfff07a,0xffffff,0xc9b3f0];
const AWN={};
function awnMat(a,b){const k=a+b;if(!AWN[k])AWN[k]=Toon({map:canvasTex(64,16,(c,w,h)=>{for(let i=0;i<8;i++){c.fillStyle=i%2?b:a;c.fillRect(i*8,0,8,h);}})});return AWN[k];}

/* merge the direct mesh children of g per material (also swaps them in the see-through list) */
function bake(g){const plain=new Set(Object.values(matC)),tex=new Set(Object.values(texMatC)),buckets=new Map();
  g.children.filter(m=>m.isMesh&&!m.isInstancedMesh).forEach(m=>{const mt=m.material;let key,out,vc=false;
    if(plain.has(mt)){key='vc';out=VCMAT;vc=true;}
    else if(tex.has(mt)){key='vt'+mt.map.uuid;out=VCTEX[mt.map.uuid]||(VCTEX[mt.map.uuid]=Toon({color:0xffffff,map:mt.map,vertexColors:true}));vc=true;}
    else{key=mt.uuid;out=mt;}
    if(!buckets.has(key))buckets.set(key,{out,vc,list:[]});buckets.get(key).list.push(m);});
  buckets.forEach(b=>{if(b.list.length<2&&!b.vc)return;const P=[],N=[],U=[],C=[];let cast=false;
    b.list.forEach(m=>{m.updateMatrix();const src=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();src.applyMatrix4(m.matrix);
      const p=src.attributes.position,n=src.attributes.normal,u=src.attributes.uv,col=m.material.color;
      for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));U.push(u?u.getX(i):0,u?u.getY(i):0);if(b.vc)C.push(col.r,col.g,col.b);}
      src.dispose();cast=cast||m.castShadow;g.remove(m);if(OCC_CUR){const k=OCC_CUR.meshes.indexOf(m);if(k>=0)OCC_CUR.meshes.splice(k,1);}});
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));if(b.vc)geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));geo.computeBoundingSphere();
    const mm=new THREE.Mesh(geo,b.out);mm.castShadow=cast;mm.receiveShadow=true;g.add(mm);occAdd(mm);});}

/* local (lx,lz) of a thing at {x,z,ry} → world; same convention as Object3D.rotation.y */
function L2W(o,lx,lz){const c=Math.cos(o.ry),s=Math.sin(o.ry);return [o.x+lx*c+lz*s,o.z-lx*s+lz*c];}
function instL(o,key,geo,lx,y,lz,sx,sy,sz,col,lry,sh){const [x,z]=L2W(o,lx,lz);inst(key,geo,x,y,z,sx,sy,sz,col,(lry||0)+o.ry,sh);}
function foot(o,w,d){return Math.abs(Math.sin(o.ry))>.5?[d,w]:[w,d];}
function circL(o,lx,lz,r){const [x,z]=L2W(o,lx,lz);addCircle(x,z,r);}

/* window with frame, cross bars and a flower box. side 0 = front wall (local z=a, lateral b = x); side ±1 = right/left wall (local x=±a, lateral b = z) */
function townWin(g,o,a,b,wy,side){const P=(t,lat)=>side?[side*(a+t),lat]:[lat,a+t],S=(dep,lat)=>side?[dep,lat]:[lat,dep];let x,z,sx,sz;
  [x,z]=P(.04,b);[sx,sz]=S(.22,1.5);box(sx,1.4,sz,0xffffff,x,wy,z,g,false);
  [x,z]=P(.13,b);[sx,sz]=S(.1,1.1);box(sx,1,sz,WINMAT,x,wy,z,g,false);
  [x,z]=P(.17,b);[sx,sz]=S(.14,.12);box(sx,1,sz,0xffffff,x,wy,z,g,false);[sx,sz]=S(.14,1.1);box(sx,.1,sz,0xffffff,x,wy,z,g,false);
  [x,z]=P(.24,b);[sx,sz]=S(.4,1.5);rbox(sx,.32,sz,.12,0x9a6a44,x,wy-.82,z,g);
  for(let k=0;k<4;k++){const [fx,fz]=P(.28,b-.48+k*.32);instL(o,'wflower',G.sphL,fx,wy-.6,fz,.14,.12,.14,pick(WFLOW),0,false);}}

/* a decorative house / shop. o:{x,z,ry,w,d,h,style:'gable'|'tall'|'hip'|'round'|'flat',wall,roof,door,chim,shop:{label,aw:[c1,c2]},noMail}
   the front (door) is local +z */
function cottage(o){o.ry=o.ry||0;const st=o.style||'gable',round=st==='round',tall=st==='tall';
  const rh=o.rh||(st==='flat'?.5:tall?3:2.4),F=round?o.w/2:o.d/2,dep=round?o.w:o.d,[fw,fd]=foot(o,o.w,dep);
  const own=occBegin([occBox(o.x-fw/2-.8,o.x+fw/2+.8,o.z-fd/2-.8,o.z+fd/2+.8,o.h+rh*(round?1.3:1)+(o.chim?1.2:0)+.4)]);
  const g=new THREE.Group();g.position.set(o.x,0,o.z);g.rotation.y=o.ry;scene.add(g);
  const wallM=MT(o.wall,SIDING),roofM=MT(o.roof,SHINGLE),trim=0xffffff,door=o.door||DOOR_COLS[0];
  if(round){const r=F;mk(roundCylGeo(r,o.h,.3),wallM,1,1,1,0,o.h/2,0,g);rcyl(r+.25,.5,.2,0xd9c6a8,0,.25,0,g);rcyl(r+.45,.28,.12,trim,0,o.h,0,g);
    mk(G.cone,roofM,r+.75,rh*1.3,r+.75,0,o.h+rh*.65,0,g);sph(.28,.28,.28,0xffd45c,0,o.h+rh*1.3,0,g);}
  else{rbox(o.w,o.h,o.d,.3,wallM,0,o.h/2,0,g);rbox(o.w+.4,.5,o.d+.4,.2,0xd9c6a8,0,.25,0,g);[-1,1].forEach(s=>rbox(.3,o.h,.3,.12,trim,s*o.w/2,o.h/2,F,g));
    if(st==='flat'){rbox(o.w+.5,.45,o.d+.5,.15,o.roof,0,o.h+.2,0,g);rbox(1.2,.8,1.2,.15,0xd9c6a8,-o.w/2+1.2,o.h+.8,-o.d/2+1.2,g);
      for(let k=0;k<3;k++){const lx=o.w/2-1-k*.9;instL(o,'tpot',G.pot,lx,o.h+.65,-o.d/2+.8,.26,.36,.26,0xd4845a);instL(o,'bush',G.sph,lx,o.h+1.0,-o.d/2+.8,.32,.28,.32,0x88b85a);}}
    else{rbox(o.w+.4,.3,.4,.12,trim,0,o.h,F,g);
      if(st==='hip')mk(HIPGEO,roofM,(o.w/2+.6)/.7071,rh,(F+.6)/.7071,0,o.h+rh/2,0,g);
      else if(tall){/* gable toward the street: two roof slabs + a wall-coloured gable with a round attic window */
        const b=o.w/2+.6,th=Math.atan2(rh,b),L=Math.hypot(b,rh),gh=rh*(o.w/2)/b;
        [-1,1].forEach(s=>{rbox(L+.15,.28,o.d+.9,.1,roofM,s*b/2,o.h+rh/2+.1,0,g).rotation.z=-s*th;});
        mk(G.prism,wallM,o.d,gh/1.5,(o.w/2)/.866,0,o.h+.5*gh/1.5,0,g).rotation.y=Math.PI/2;
        mk(G.cyl,trim,.6,.08,.6,0,o.h+gh*.4,F+.02,g).rotation.x=Math.PI/2;mk(G.cyl,WINMAT,.44,.1,.44,0,o.h+gh*.4,F+.05,g,false).rotation.x=Math.PI/2;}
      else mk(G.prism,roofM,o.w+.9,rh/1.5,(F+.6)/.866,0,o.h+.5*rh/1.5,0,g);}}
  if(o.chim)rbox(.7,1.6,.7,.12,0x8f6a52,round?.9:o.w/2-1.2,o.h+rh*.5+.3,round?-.6:-F+1.1,g);
  /* door, step, little lamp */
  rbox(1.7,2.6,.3,.14,trim,0,1.3,F+.02,g);rbox(1.2,2.25,.28,.12,door,0,1.15,F+.08,g);sph(.1,.1,.1,0xffd54f,.38,1.1,F+.25,g,false);
  rbox(2,.22,1,.08,0xd9c6a8,0,.11,F+.55,g);sph(.16,.2,.16,LAMPMAT,1.12,2.35,F+.2,g,false);
  /* windows */
  const shop=o.shop,rows=shop?[2]:tall?[1.9,4.4]:[o.h*.55],lat=o.w/2-1.25;
  if(!round)rows.forEach((wy,ri)=>[-lat,lat].forEach(x=>townWin(g,o,F,x,wy,0)));
  rows.forEach(wy=>[-1,1].forEach(s=>townWin(g,o,round?F:o.w/2,0,wy,s)));
  if(shop){mk(G.box,awnMat(shop.aw[0],shop.aw[1]),o.w-.6,.12,1.5,0,3.3,F+.72,g).rotation.x=-.35;
    textPlane(shop.label,Math.min(o.w-1.4,4.2),.85,'#fffbef','#4a3523',g,0,o.h-.5,F+.2);}
  bake(g);
  /* mailbox + stepping stones (instanced, shared by all houses) */
  if(!shop&&!o.noMail){const mx=-(round?F-.5:o.w/2-.3),mz=F+.85,col=pick([0xef5350,0x64b5f6,0xffd45c]);
    instL(o,'mpost',G.box,mx,.45,mz,.1,.9,.1,0x8a5a33);instL(o,'mbox',roundBoxGeo(.5,.36,.4,.1),mx,1.02,mz,1,1,1,col);instL(o,'mflag',G.box,mx+.27,1.14,mz,.04,.24,.1,0xffd45c);circL(o,mx,mz,.3);
    [1.25,1.95].forEach(t=>instL(o,'stone',G.cylL,0,.03,F+t,.42,.06,.34,0xe3d6bf,0,false));}
  if(own)occEnd();
  addBox(o.x,o.z,fw+.3,fd+.3);KEEP.push([o.x,o.z,Math.max(fw,fd)/2+2]);blobAt(o.x,o.z,fw/2+1.4,fd/2+1.4);
  {const [gx,gz]=L2W(o,0,F+1.3);glowAt(gx,gz,2.6,.8);if(!round)[-lat,lat].forEach(x=>{const [wx,wz]=L2W(o,x,F+1.2);glowAt(wx,wz,2.2,.6);});}
  return g;}

/* a small one-off thing built from parts, then baked */
function prop(x,z,ry,build){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry||0;scene.add(g);build(g);bake(g);return g;}

function townGate(x,z,ry,text){const o={x,z,ry};const [fw,fd]=foot(o,6.4,1);occBegin([occBox(x-fw/2,x+fw/2,z-fd/2,z+fd/2,5.2)]);
  prop(x,z,ry,g=>{[-1,1].forEach(s=>{rcyl(.26,4.2,.1,0xc9955f,s*2.75,2.1,0,g);sph(.34,.4,.34,0xb5733d,s*2.75,4.55,0,g);sph(.4,.18,.4,0x7a5532,s*2.75,4.86,0,g);});
    rbox(6.2,.36,.4,.12,0xd9a46c,0,3.95,0,g);rbox(4.7,1.05,.18,.08,0x9a6a44,0,3.25,0,g);
    textPlane(text,4.5,.9,'#fffbef','#4a3523',g,0,3.25,.11);textPlane(text,4.5,.9,'#fffbef','#4a3523',g,0,3.25,-.11,Math.PI);});
  occEnd();circL(o,-2.75,0,.35);circL(o,2.75,0,.35);blobAt(x,z,3.4,.8);}

function windmill(x,z,ry){const o={x,z,ry},R0=2.6,R1=1.87,HH=8,rAt=y=>R0+(R1-R0)*y/HH;let g;
  occBegin([occCyl(x,z,2.8,0,11.2)]);
  g=prop(x,z,ry,g=>{mk(TAPER,MT(0xfff1d6,SIDING),R0,HH,R0,0,HH/2,0,g);rcyl(R0+.3,.5,.2,0xd9c6a8,0,.25,0,g);rcyl(R1+.4,.3,.12,0xffffff,0,HH,0,g);
    mk(G.cone,MT(0xe0675a,SHINGLE),R1+.6,2.8,R1+.6,0,HH+1.4,0,g);sph(.3,.3,.3,0xffd45c,0,HH+2.9,0,g);
    const dz=rAt(1.2);rbox(1.7,2.6,.4,.14,0xffffff,0,1.3,dz,g);rbox(1.2,2.25,.36,.12,0x9a6a44,0,1.15,dz+.06,g);sph(.1,.1,.1,0xffd54f,.38,1.1,dz+.26,g,false);
    [4.3,6.1].forEach(wy=>{const wz=rAt(wy);rbox(1.2,1.2,.3,.1,0xffffff,0,wy,wz,g,false);box(.85,.85,.1,WINMAT,0,wy,wz+.12,g,false);});
    [-1,1].forEach(s=>{const wy=3.6,r=rAt(wy);rbox(.3,1.2,1.2,.1,0xffffff,s*r,wy,0,g,false);box(.1,.85,.85,WINMAT,s*(r+.12),wy,0,g,false);});});
  occEnd();
  /* sails: turn slowly (main loop: W.mill.rotation.z). Kept out of the see-through list because they move. */
  const B=new THREE.Group();B.position.set(0,7.6,rAt(7.6)+.7);g.add(B);
  sph(.45,.45,.35,0x8a5a33,0,0,0,B);mk(G.cyl,0x8a5a33,.18,.9,.18,0,0,-.4,B).rotation.x=Math.PI/2;
  for(let k=0;k<4;k++){const a=k*Math.PI/2,c=Math.cos(a),s=Math.sin(a);box(.22,4.8,.14,0x8a5a33,-s*2.4,c*2.4,0,B).rotation.z=a;
    box(1.1,3.7,.06,0xfffbef,.66*c-2.75*s,.66*s+2.75*c,.07,B).rotation.z=a;
    for(let j=0;j<3;j++){const t=1.5+j*1.2;box(1.15,.07,.1,0xc9955f,.66*c-t*s,.66*s+t*c,.12,B).rotation.z=a;}}
  bake(B);W.mill=B;
  addBox(x,z,R0*2,R0*2);KEEP.push([x,z,7]);blobAt(x,z,R0+1.2);const [gx,gz]=L2W(o,0,rAt(1.2)+1.3);glowAt(gx,gz,2.6,.8);}

/* water wheel turning in the river (main loop: W.wheel.rotation.x); axle runs west to the hut */
function waterWheel(x,z){const g=new THREE.Group();g.position.set(x,1.5,z);scene.add(g);const R=2.2;
  [-.36,.36].forEach(px=>{mk(G.torus,0x9a6a44,R,R,R,px,0,0,g).rotation.y=Math.PI/2;for(let k=0;k<4;k++)box(.12,2*R,.12,0x8a5a33,px,0,0,g).rotation.x=k*Math.PI/4;});
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2;box(.9,.6,.1,0xb07a45,0,Math.cos(a)*(R-.15),Math.sin(a)*(R-.15),g).rotation.x=a;}
  mk(G.cyl,0x6d4c33,.35,.95,.35,0,0,0,g).rotation.z=Math.PI/2;mk(G.cyl,0x6d4c33,.14,4.2,.14,-2.1,0,0,g).rotation.z=Math.PI/2;
  bake(g);W.wheel=g;}

/* --- small street things (instanced) --- */
function townBench(x,z,ry){const o={x,z,ry};instL(o,'tbseat',roundBoxGeo(2.2,.3,.75,.14),0,.6,0,1,1,1,0xe0a066);instL(o,'tbback',roundBoxGeo(2.2,.6,.25,.12),0,1.08,-.32,1,1,1,0xe0a066);
  [-.8,.8].forEach(lx=>instL(o,'tbleg',roundBoxGeo(.4,.48,.66,.15),lx,.24,0,1,1,1,0xa8703f));circL(o,-.6,0,.55);circL(o,.6,0,.55);blobAt(x,z,1.4);}
function townPlanter(x,z,ry){const o={x,z,ry};instL(o,'tplanter',roundBoxGeo(1.8,.45,.6,.14),0,.225,0,1,1,1,pick([0xc9955f,0xffffff,0xe0a066]));
  const cols=pick([[0xffffff,0xffe066],[0xffb8cc,0xffffff],[0xffe066,0xff9fbb],[0xc9b3f0,0xffffff]]);
  for(let i=0;i<6;i++){const lx=-.7+i*.28,lz=i%2?.12:-.12;instL(o,'tuft',G.coneL,lx,.55,lz,.08,.3,.08,0x88b85a,0,false);instL(o,'flower',FLOWER_GEO,lx,.66,lz,.15,1,.15,cols[i%2],i,false);instL(o,'fcenter',G.oct,lx,.67,lz,.05,.025,.05,0xffc83a,0,false);}
  circL(o,-.5,0,.4);circL(o,.5,0,.4);blobAt(x,z,1.2,1.2);}
function townBike(x,z,ry){const o={x,z,ry},fc=pick([0xef5350,0x64b5f6,0x3daf88,0xffb74d]),B=(lx,y,sx,sy,sz,c)=>instL(o,'tbike',G.box,lx,y,0,sx,sy,sz,c||fc);
  [-.55,.55].forEach(lx=>instL(o,'twheel',G.torus,lx,.42,0,.42,.42,.42,0x4a4a4a));
  B(0,.72,1.0,.08,.08);B(0,.52,.9,.08,.08);B(-.3,.75,.08,.42,.08);B(-.3,.98,.32,.08,.18,0x5d4037);B(.45,.8,.08,.45,.08);B(.45,1.03,.08,.08,.5,0x5d4037);B(.66,.86,.3,.22,.3,0xc9955f);
  circL(o,0,0,.6);blobAt(x,z,1,.6);}
function townCrate(x,z,bread){inst('tcrate',roundBoxGeo(.62,.5,.62,.06),x,.25,z,1,1,1,0xc9955f,Math.random()*.4);if(bread)for(let k=0;k<3;k++)inst('tbread',G.sphL,x-.16+k*.16,.58,z+(k%2?.1:-.1),.13,.1,.2,0xd9944a,.3);addCircle(x,z,.4);blobAt(x,z,.6);}
function townBarrel(x,z){inst('tbarrel',roundCylGeo(.36,.8,.1),x,.4,z,1,1,1,0xa8703f);[.2,.6].forEach(y=>inst('tband',roundCylGeo(.375,.07,.03),x,y,z,1,1,1,0x6d4c33,0,false));addCircle(x,z,.42);blobAt(x,z,.6);}
function townBucket(x,z){inst('tbucket',roundCylGeo(.26,.42,.06),x,.21,z,1,1,1,pick([0xb0bec5,0x90caf9,0xffcc80]));const c=pick(FLOWER_COLS.concat([0xff7aa0,0xc9b3f0]));
  for(let k=0;k<4;k++){const a=k*1.6,fx=x+Math.cos(a)*.13,fz=z+Math.sin(a)*.13;inst('tuft',G.coneL,fx,.52,fz,.07,.28,.07,0x88b85a,0,false);inst('flower',FLOWER_GEO,fx,.66,fz,.15,1,.15,c,k,false);inst('fcenter',G.oct,fx,.67,fz,.05,.025,.05,0xffc83a,0,false);}
  addCircle(x,z,.3);blobAt(x,z,.45);}

function townWell(x,z){prop(x,z,0,g=>{rcyl(.9,.8,.2,0xbdb5a3,0,.4,0,g);cyl(.7,.04,0x5ab9e8,0,.79,0,g,false);[-1,1].forEach(s=>rbox(.16,1.9,.16,.05,0x8a5a33,s*.8,1.3,0,g));
  mk(G.prism,MT(0xe0675a,SHINGLE),2.1,.55/1.5,.8/.866,0,2.25+.5*.55/1.5,0,g);mk(G.cylL,0x8a5a33,.06,1.6,.06,0,1.95,0,g).rotation.z=Math.PI/2;cyl(.015,.45,0xeeeeee,0,1.7,0,g,false);rcyl(.17,.26,.05,0x9a6a44,0,1.35,0,g);});
  addCircle(x,z,1.1);blobAt(x,z,1.4);}
function busStop(x,z,ry){const o={x,z,ry};prop(x,z,ry,g=>{[-1,1].forEach(s=>{rcyl(.09,2.4,.04,0x64b5f6,s*1.2,1.2,-.45,g);rbox(.2,.45,.4,.05,0xa8703f,s*.85,.25,-.2,g);});
  rbox(2.9,.2,1.3,.08,0x64b5f6,0,2.45,-.1,g);rbox(2.5,1.1,.08,.04,0xd6eef8,0,1.4,-.5,g);rbox(2.2,.22,.5,.08,0xe0a066,0,.55,-.2,g);
  rcyl(.06,2.3,.03,0xeeeeee,1.75,1.15,.1,g);mk(roundCylGeo(.42,.1,.04),0x64b5f6,1,1,1,1.75,2.5,.1,g).rotation.x=Math.PI/2;textPlane('バス',.6,.3,'#fffbef','#3a6fb0',g,1.75,2.5,.17);});
  const [fw,fd]=foot(o,2.9,1);const [cx,cz]=L2W(o,0,-.2);addBox(cx,cz,fw,fd);circL(o,1.75,.1,.2);blobAt(x,z,1.9,1);}
function yatai(x,z,ry,text){const o={x,z,ry};prop(x,z,ry,g=>{rbox(2.6,1,1.2,.15,0xc9955f,0,.85,0,g);rbox(2.8,.12,1.4,.05,0xe2c08e,0,1.41,0,g);
  [-1,1].forEach(s=>{mk(roundCylGeo(.42,.16,.05),0x8a5a33,1,1,1,s*1.42,.45,0,g).rotation.z=Math.PI/2;[-1,1].forEach(t=>rcyl(.07,1.2,.03,0x8a5a33,s*1.25,2.05,t*.55,g));});
  mk(G.box,awnMat('#ff8a65','#fff'),3.1,.16,1.8,0,2.7,0,g);textPlane(text,1.7,.45,'#fffbef','#a0522d',g,0,2.3,.63);
  box(1.3,.08,.5,0x555555,0,1.5,-.2,g);for(let k=0;k<4;k++)sph(.2,.07,.12,0xd08a3c,-.75+k*.5,1.52,.3,g);sph(.22,.28,.22,ME(0xff7043),1.35,2.3,.75,g,false);});
  const [fw,fd]=foot(o,3.2,1.6);addBox(x,z,fw,fd);blobAt(x,z,fw/2+.6,fd/2+.6);glowAt(x,z,2.4,.7);}
function terraceTable(x,z,col){prop(x,z,0,g=>{rcyl(.55,.1,.04,0xffffff,0,.78,0,g);cyl(.07,.75,0x8a5a33,0,.38,0,g);rcyl(.3,.06,.03,0x8a5a33,0,.03,0,g);
  cyl(.04,2.2,0xffffff,0,1.4,0,g);mk(G.cone,col,1.3,.5,1.3,0,2.45,0,g);sph(.08,.08,.08,0xffffff,0,2.72,0,g);
  [-1,1].forEach(s=>{rcyl(.2,.45,.05,0xa8703f,s*.85,.23,0,g);rbox(.46,.08,.46,.04,0xe0a066,s*.85,.48,0,g);rbox(.08,.5,.46,.04,0xe0a066,s*1.07,.75,0,g);});});
  addCircle(x,z,1.25);blobAt(x,z,1.6);}

function buildTown(){const PI=Math.PI;
  /* ----- どんぐりどおり: 8 houses facing a new street, gate at the main road, windmill at the end ----- */
  road(-41,-38,1.6,46.3);townGate(-39.5,3.6,0,'どんぐりどおり');
  const hw=st=>st==='round'?5.6:6.2,hh=st=>st==='tall'?6.2:st==='round'?3.8:4.1;
  [[8,'gable',0xfff1d6,0xe0675a,1],[17,'round',0xffe0ea,0x9a6fd6],[26,'tall',0xe8f0ff,0x5a8ed6],[35,'hip',0xfff3c4,0x3daf88]]
    .forEach(([z,st,w,r,ch],i)=>cottage({x:-46,z,ry:PI/2,w:hw(st),d:5,h:hh(st),style:st,wall:w,roof:r,chim:ch,door:DOOR_COLS[i%5]}));
  [[8,'tall',0xe0fff0,0xef7aa0],[17,'hip',0xffe6cc,0x5a8ed6],[26,'gable',0xf2e2ff,0xf2a53a,1],[35,'round',0xe8f0ff,0xe0675a]]
    .forEach(([z,st,w,r,ch],i)=>cottage({x:-33,z,ry:-PI/2,w:hw(st),d:5,h:hh(st),style:st,wall:w,roof:r,chim:ch,door:DOOR_COLS[(i+2)%5]}));
  townPlanter(-45.6,12.5,PI/2);townBike(-45.8,21.5,0);townBench(-45.6,30.5,PI/2);
  townBench(-33.4,12.5,-PI/2);townPlanter(-33.4,21.5,-PI/2);townBike(-33.2,30.5,PI);
  [[-42.6,21.5],[-36.4,12.5],[-36.4,30.5],[-42.6,39.5]].forEach(([x,z])=>toyLamp(x,z,2.8));
  windmill(-39.5,50,PI);townWell(-34.6,44.6);townBench(-44.6,44.6,PI/2);
  /* ----- houses along the road to the ruins ----- */
  [[-22,'gable',0xffe0ea,0x3daf88,1],[-33,'tall',0xfff1d6,0x8d6e63],[-44,'round',0xe0fff0,0xf2a53a],[-55,'hip',0xe8f0ff,0xe0675a,1]]
    .forEach(([z,st,w,r,ch],i)=>cottage({x:-21,z,ry:PI/2,w:hw(st),d:5,h:hh(st),style:st,wall:w,roof:r,chim:ch,door:DOOR_COLS[(i+1)%5]}));
  townPlanter(-18.2,-27.5,PI/2);townBike(-18.6,-38.5,0);townPlanter(-18.2,-49.5,PI/2);
  /* ----- shops at both ends of the shopping street (decor; the 3 real shops stay as they are) ----- */
  road(-29.5,-22,23.5,28.5);road(22,29.5,23.5,28.5);
  cottage({x:-26.5,z:33.5,ry:PI,w:6.2,d:5,h:4.6,style:'gable',wall:0xffe6cc,roof:0xb5653a,door:0x8d6e63,chim:1,shop:{label:'パンや',aw:['#b5653a','#fff3d6']}});
  townCrate(-29.2,30.1,true);townCrate(-28.4,30.2,false);townBarrel(-23.8,30.1);
  cottage({x:26.5,z:33.5,ry:PI,w:6.2,d:5,h:4.6,style:'hip',wall:0xfff0f5,roof:0xef7aa0,door:0x3daf88,shop:{label:'はなや',aw:['#ef7aa0','#fff']}});
  [24,24.65,28.35,29].forEach(x=>townBucket(x,30.2));
  yatai(8,21.4,0,'たいやき');
  /* ----- by the main road: カフェ with a terrace, bus stop ----- */
  cottage({x:-42,z:-6.5,ry:0,w:7,d:5,h:4.6,style:'flat',wall:0xf3e3c8,roof:0x8d6e63,door:0x6d8f5a,shop:{label:'カフェ',aw:['#6d8f5a','#fffbef']}});
  terraceTable(-36.2,-7,0xff9fb8);terraceTable(-34.4,-4.2,0x8fd3c0);
  busStop(-51.5,-3.6,0);
  /* ----- すいしゃごや on the river bank ----- */
  cottage({x:31,z:-33,ry:-PI/2,w:5.4,d:4.6,h:3.6,style:'gable',wall:0xf3e3c8,roof:0x8d6e63,door:0x7a4f2a,chim:1,noMail:true});
  waterWheel(37.4,-33);signPost(27.4,-28.4,'[水|すい][車|しゃ]ごや');townBarrel(28.2,-36.4);townCrate(28.4,-30.6,false);
}
