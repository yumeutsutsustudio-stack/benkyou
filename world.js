'use strict';
/* ===== three basics ===== */
const V3=THREE.Vector3;
const canvas=$('#gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
/* sun shadows: PCF with a blur radius = soft-edged shadows (PCFSoft ignores radius) */
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(50,1,.1,260);
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.anisotropy=4;return t;}
const skyTex=canvasTex(64,256,()=>{});scene.background=skyTex;
scene.fog=new THREE.Fog(0xfaf0dc,95,240);
/* lavender sky/ground light: anything the sun doesn't reach (shade side, cast shadows) reads soft blue-purple, never black */
const hemi=new THREE.HemisphereLight(0xf2ecff,0xcbbbe8,.55);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1d8,.58);
/* toon shading: 3 clear steps (shade / half / lit). Tweak TOON_STEPS to change the bands (0–255). */
const TOON_STEPS=[95,180,255];
const TOON_GRAD=(()=>{const d=new Uint8Array(TOON_STEPS.length*4);TOON_STEPS.forEach((v,i)=>{d.set([v,v,v,255],i*4);});const t=new THREE.DataTexture(d,TOON_STEPS.length,1,THREE.RGBAFormat);
  t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();
function Toon(p){return new THREE.MeshToonMaterial(Object.assign({gradientMap:TOON_GRAD},p));}sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:150});sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);

const matC={},emC={};
function M(c){if(!matC[c])matC[c]=Toon({color:c});return matC[c];}
function ME(c){if(!emC[c])emC[c]=Toon({color:c,emissive:c,emissiveIntensity:.55});return emC[c];}
const G={box:new THREE.BoxGeometry(1,1,1),sph:new THREE.SphereGeometry(1,18,12),sphL:new THREE.SphereGeometry(1,8,6),cyl:new THREE.CylinderGeometry(1,1,1,16),cylL:new THREE.CylinderGeometry(1,1,1,8),
 cone:new THREE.ConeGeometry(1,1,14),coneL:new THREE.ConeGeometry(1,1,7),cone4:new THREE.ConeGeometry(1,1,4),oct:new THREE.OctahedronGeometry(1),dodec:new THREE.DodecahedronGeometry(1),
 torus:new THREE.TorusGeometry(1,.12,10,28),shade:new THREE.CylinderGeometry(.6,1,1,16),pot:new THREE.CylinderGeometry(1,.75,1,12),
 prism:(()=>{const g=new THREE.CylinderGeometry(1,1,1,3);g.rotateZ(-Math.PI/2);g.rotateX(-Math.PI/2);return g;})(),
 coneDown:(()=>{const g=new THREE.ConeGeometry(1,1,4);g.rotateX(Math.PI);return g;})(),
 star:(()=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.45:1,a=i/10*Math.PI*2-Math.PI/2;i?s.lineTo(Math.cos(a)*r,-Math.sin(a)*r):s.moveTo(Math.cos(a)*r,-Math.sin(a)*r);}const g=new THREE.ExtrudeGeometry(s,{depth:.3,bevelEnabled:false});g.center();return g;})()};
/* see-through registry: big things (trees, lamps, fountain, buildings) record their meshes / instances while they are built,
   plus simple volumes (vertical cylinders / boxes) that fx.js tests against the camera → player line */
const OCCS=[];let OCC_CUR=null;
const occCyl=(x,z,r,y0,y1)=>({c:1,x,z,r,y0,y1}),occBox=(x0,x1,z0,z1,y1,y0)=>({c:0,x0,x1,z0,z1,y0:y0||0,y1});
function occBegin(vols){if(OCC_CUR)return false;OCC_CUR={vols,meshes:[],insts:[],p:0,on:false,g:null};return true;}
function occAdd(m){if(OCC_CUR)OCC_CUR.meshes.push(m);return m;}
function occEnd(){const o=OCC_CUR;OCC_CUR=null;if(!o||!(o.meshes.length||o.insts.length))return;
  o.bx0=Math.min(...o.vols.map(v=>v.c?v.x-v.r:v.x0));o.bx1=Math.max(...o.vols.map(v=>v.c?v.x+v.r:v.x1));
  o.bz0=Math.min(...o.vols.map(v=>v.c?v.z-v.r:v.z0));o.bz1=Math.max(...o.vols.map(v=>v.c?v.z+v.r:v.z1));o.cx=(o.bx0+o.bx1)/2;o.cz=(o.bz0+o.bz1)/2;OCCS.push(o);}
function mk(geo,mat,sx,sy,sz,x,y,z,parent,shadow){const m=new THREE.Mesh(geo,typeof mat==='number'?M(mat):mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);if(shadow!==false){m.castShadow=true;m.receiveShadow=true;}(parent||scene).add(m);return occAdd(m);}
const box=(w,h,d,c,x,y,z,p,sh)=>mk(G.box,c,w,h,d,x,y,z,p,sh);
const cyl=(r,h,c,x,y,z,p,sh)=>mk(G.cyl,c,r,h,r,x,y,z,p,sh);
const sph=(rx,ry,rz,c,x,y,z,p,sh)=>mk(G.sph,c,rx,ry,rz,x,y,z,p,sh);
const cone=(r,h,c,x,y,z,p,sh)=>mk(G.cone,c,r,h,r,x,y,z,p,sh);
function beam(a,b,r,c,p){const d=new V3().subVectors(b,a);const m=mk(G.cylL,c,r,d.length(),r,0,0,0,p);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());return m;}
const darken=(h,f)=>new THREE.Color(h).multiplyScalar(f).getHex();
/* ===== chunky toy shapes (cached by size) ===== */
const RGEO={};
/* rounded box: grid packed toward the edges, then edge vertices pushed onto a radius-r rounding; per-face planar UVs kept */
function roundBoxGeo(w,h,d,r){r=Math.max(.02,Math.min(r,w/2-.005,h/2-.005,d/2-.005));const key='b'+[w,h,d,r].map(v=>v.toFixed(3)).join('_');if(RGEO[key])return RGEO[key];
  const k=3,n=2*k+1,g=new THREE.BoxGeometry(w,h,d,n,n,n),p=g.attributes.position,nm=g.attributes.normal,uv=g.attributes.uv,v=new V3(),c=new V3(),o=new V3();
  const remap=(a,L)=>{const u=Math.round((a/L+.5)*n*1e4)/1e4;let q;if(u<=k)q=u/k*r;else if(u>=n-k)q=L-(n-u)/k*r;else q=r+(u-k)*(L-2*r);return q-L/2;};
  for(let i=0;i<p.count;i++){v.set(remap(p.getX(i),w),remap(p.getY(i),h),remap(p.getZ(i),d));o.fromBufferAttribute(nm,i);
    if(o.y)uv.setXY(i,v.x/w+.5,o.y>0?.5-v.z/d:v.z/d+.5);else if(o.x)uv.setXY(i,o.x>0?.5-v.z/d:v.z/d+.5,v.y/h+.5);else uv.setXY(i,o.z>0?v.x/w+.5:.5-v.x/w,v.y/h+.5);
    c.set(clamp(v.x,-w/2+r,w/2-r),clamp(v.y,-h/2+r,h/2-r),clamp(v.z,-d/2+r,d/2-r));v.sub(c);if(v.lengthSq()<1e-10)v.copy(o);v.normalize();
    p.setXYZ(i,c.x+v.x*r,c.y+v.y*r,c.z+v.z*r);nm.setXYZ(i,v.x,v.y,v.z);}
  p.needsUpdate=nm.needsUpdate=uv.needsUpdate=true;g.computeBoundingSphere();return RGEO[key]=g;}
/* rounded cylinder (soft top & bottom edges) via lathe */
function roundCylGeo(r,h,rr){rr=Math.min(rr,r-.01,h/2-.005);const key='c'+[r,h,rr].map(v=>v.toFixed(3)).join('_');if(RGEO[key])return RGEO[key];
  const pts=[new THREE.Vector2(0,-h/2)];for(let i=0;i<=4;i++){const a=-Math.PI/2+i/4*Math.PI/2;pts.push(new THREE.Vector2(r-rr+Math.cos(a)*rr,-h/2+rr+Math.sin(a)*rr));}
  for(let i=0;i<=4;i++){const a=i/4*Math.PI/2;pts.push(new THREE.Vector2(r-rr+Math.cos(a)*rr,h/2-rr+Math.sin(a)*rr));}pts.push(new THREE.Vector2(0,h/2));
  const g=new THREE.LatheGeometry(pts,18);g.computeVertexNormals();return RGEO[key]=g;}
const rbox=(w,h,d,r,c,x,y,z,p,sh)=>mk(roundBoxGeo(w,h,d,r),c,1,1,1,x,y,z,p,sh);
const rcyl=(r,h,rr,c,x,y,z,p,sh)=>mk(roundCylGeo(r,h,rr),c,1,1,1,x,y,z,p,sh);
/* chunky street lamp: fat base, thick post, round glowing bulb, mushroom cap */
function toyLamp(x,z,h){const pc=LAMPPOST,dk=LAMPBASE;occBegin([occCyl(x,z,.6,0,h+1.45)]);blobAt(x,z,.9);rcyl(.5,.36,.16,dk,x,.18,z);rcyl(.22,h,.1,pc,x,h/2,z);rcyl(.36,.22,.09,dk,x,h,z);
  mk(G.sph,LAMPMAT,.44,.48,.44,x,h+.5,z);sph(.58,.26,.58,pc,x,h+.98,z);sph(.15,.15,.15,0xffd45c,x,h+1.26,z);occEnd();addCircle(x,z,.45);glowAt(x,z,3.8);}
/* soft-edged dirt road texture: opaque middle, wobbly feathered edges across V, repeats along U */
const ROAD_PAD=.9;
/* smooth value noise (bilinear + smoothstep, wraps every P cells along x) — no blocky cells */
const hash2=(a,b)=>{const s=Math.sin(a*12.9898+b*78.233)*43758.5453;return s-Math.floor(s);};
function vnoise(x,y,P){const xi=Math.floor(x),yi=Math.floor(y),u=x-xi,v=y-yi,su=u*u*(3-2*u),sv=v*v*(3-2*v),w=a=>((a%P)+P)%P;
  const h00=hash2(w(xi),yi),h10=hash2(w(xi+1),yi),h01=hash2(w(xi),yi+1),h11=hash2(w(xi+1),yi+1);return (h00*(1-su)+h10*su)*(1-sv)+(h01*(1-su)+h11*su)*sv;}
/* 512 px along the road (5 m) × 256 px across (~5 m): noise y is scaled ×2 so grain stays round, not streaked */
const ROAD_TEX=(()=>{const Wd=512,H=256,cv=document.createElement('canvas');cv.width=Wd;cv.height=H;const cx=cv.getContext('2d'),id=cx.createImageData(Wd,H);
  const sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  for(let i=0;i<Wd;i++){const t=i/Wd*Math.PI*2,e1=.24+.05*Math.sin(t*3+1)+.035*Math.sin(t*7)+.02*Math.sin(t*13+2),e2=.24+.05*Math.sin(t*2+4)+.035*Math.sin(t*5+1)+.02*Math.sin(t*11);
    for(let j=0;j<H;j++){const v=j/(H-1),a=Math.min(sm(.02,e1,v),sm(.02,e2,1-v)),n=.55*vnoise(i/32,j*2/32,Wd/32)+.3*vnoise(i/16,j*2/16,Wd/16)+.15*vnoise(i/8,j*2/8,Wd/8);
      const k=clamp((n-.5)*1.6,-1,1),col=k<0?[214+(196-214)*-k,174+(150-174)*-k,128+(106-128)*-k]:[214+(232-214)*k,174+(198-174)*k,128+(154-128)*k];
      id.data.set([col[0]|0,col[1]|0,col[2]|0,Math.round(a*255)],(j*Wd+i)*4);}}
  cx.putImageData(id,0,0);const tx=new THREE.CanvasTexture(cv);tx.wrapS=THREE.RepeatWrapping;tx.wrapT=THREE.ClampToEdgeWrapping;tx.anisotropy=8;return tx;})();
/* soft round contact shadows (blob decals): static ones are instanced, characters get their own that follow them */
const BLOBS=[];const blobAt=(x,z,rx,rz)=>BLOBS.push([x,z,rx,rz||rx]);
const BLOB_GEO=(()=>{const g=new THREE.PlaneGeometry(2,2,6,6);g.rotateX(-Math.PI/2);return g;})();
const BLOBMAT=new THREE.MeshBasicMaterial({map:canvasTex(128,128,(c)=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(112,96,176,.26)');g.addColorStop(.55,'rgba(112,96,176,.16)');g.addColorStop(1,'rgba(112,96,176,0)');c.fillStyle=g;c.fillRect(0,0,128,128);}),
  transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
function buildBlobs(){const im=new THREE.InstancedMesh(BLOB_GEO,BLOBMAT,BLOBS.length);BLOBS.forEach(([x,z,rx,rz],i)=>{dummy.position.set(x,.045,z);dummy.rotation.set(0,0,0);dummy.scale.set(rx,1,rz);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);});
  im.frustumCulled=false;im.renderOrder=1.5;scene.add(im);}
function makeBlob(r){const m=new THREE.Mesh(BLOB_GEO,BLOBMAT);m.scale.set(r,1,r);m.renderOrder=1.5;m.userData.r=r;scene.add(m);return m;}
/* flower & grass clumps (gathered along roads and at tree roots). Flowers = little 5-petal heads with a center, white / yellow / pink */
const FLOWER_GEO=(()=>{const P=[],N=5,seg=7;for(let p=0;p<N;p++){const a=p/N*Math.PI*2,cx=Math.cos(a)*.5,cz=Math.sin(a)*.5;for(let i=0;i<seg;i++){const b0=i/seg*Math.PI*2,b1=(i+1)/seg*Math.PI*2;
    P.push(cx,0,cz, cx+Math.cos(b1)*.45,0,cz+Math.sin(b1)*.45, cx+Math.cos(b0)*.45,0,cz+Math.sin(b0)*.45);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));const nm=new Float32Array(P.length);for(let i=1;i<nm.length;i+=3)nm[i]=1;g.setAttribute('normal',new THREE.BufferAttribute(nm,3));return g;})();
const FLOWER_COLS=[0xffffff,0xfff4a8,0xffe066,0xffb8cc,0xff9fbb],ROOTS=[];
function grassClump(x,z,s){s=s||1;for(let k=0;k<5;k++){const a=k*1.26+Math.random(),r=Math.random()*.28*s,hh=(.3+Math.random()*.18)*s;inst('tuft',G.coneL,x+Math.cos(a)*r,hh/2,z+Math.sin(a)*r,.09*s,hh,.09*s,pick([0x9cb866,0x8aab5c,0xaec476]),0,false);}}
function flowerClump(x,z){const col=pick(FLOWER_COLS);grassClump(x,z,1);const n=3+(Math.random()*3|0);for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,r=.1+Math.random()*.36,fx=x+Math.cos(a)*r,fz=z+Math.sin(a)*r,y=.34+Math.random()*.12,c=Math.random()<.75?col:pick(FLOWER_COLS);
  inst('flower',FLOWER_GEO,fx,y,fz,.14,1,.14,c,Math.random()*3,false);inst('fcenter',G.oct,fx,y+.01,fz,.05,.025,.05,c===0xffe066||c===0xfff4a8?0xf2a33a:0xffd23f,0,false);}}
/* a few muted pebbles, only by the roadside */
/* acorns under the trees (it's an acorn village): brown nut + darker cap, lying in the grass */
const ACORN_GEO=new THREE.SphereGeometry(1,7,5);
function acornsUnder(x,z,s){const n=Math.random()<.35?0:1+(Math.random()*3|0);for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,r=(.7+Math.random()*1.1)*s,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(!decorOK(px,pz))continue;
  inst('acorn',ACORN_GEO,px,.13,pz,.13,.16,.13,pick([0xc0874e,0xb47a42,0xcc9558]),0,false);inst('acorncap',ACORN_GEO,px,.25,pz,.15,.07,.15,0x7a5532,0,false);}}
/* ===== cozy plaza surroundings: flower beds, low wooden fences, pots, stumps, small bushes ===== */
function flowerBed(x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);rbox(2.2,.36,1.1,.14,0xb98257,0,.18,0,g);rbox(1.95,.1,.86,.05,0x8a5f3c,0,.37,0,g,false);
  const col=pick([[0xffffff,0xffe066],[0xffb8cc,0xffffff],[0xffe066,0xff9fbb],[0xffb8cc,0xffe066]]);for(let i=0;i<7;i++){const lx=-.75+i*.25,lz=(i%2?.18:-.18),c=col[i%2];
    const wx=x+lx*Math.cos(ry)+lz*Math.sin(ry),wz=z-lx*Math.sin(ry)+lz*Math.cos(ry);inst('tuft',G.coneL,wx,.52,wz,.08,.3,.08,0x88b85a,0,false);inst('flower',FLOWER_GEO,wx,.62,wz,.15,1,.15,c,i,false);inst('fcenter',G.oct,wx,.63,wz,.05,.025,.05,0xffc83a,0,false);}
  addCircle(x,z,.95);blobAt(x,z,1.5,1.2);}
function fenceRun(x,z,ry,n){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);const L=(n-1)*1.1;
  for(let i=0;i<n;i++){const lx=-L/2+i*1.1;rcyl(.12,.8,.06,0xc9955f,lx,.4,0,g);sph(.13,.08,.13,0xc9955f,lx,.82,0,g);addCircle(x+lx*Math.cos(ry),z-lx*Math.sin(ry),.2);}
  [.32,.62].forEach(y=>rbox(L+.3,.13,.09,.045,0xd9a46c,0,y,.02,g));blobAt(x,z,L/2+.6,.6);}
function potPlant(x,z){mk(G.pot,0xd4845a,.32,.42,.32,x,.21,z);sph(.26,.05,.26,0x7a5532,x,.43,z,null,false);sph(.36,.32,.36,pick([0x88b85a,0x9cc566,0x7aa852]),x,.66,z);if(Math.random()<.6)for(let k=0;k<3;k++){const a=k*2.1;inst('flower',FLOWER_GEO,x+Math.cos(a)*.22,.92,z+Math.sin(a)*.22,.12,1,.12,pick(FLOWER_COLS),k,false);}
  addCircle(x,z,.4);blobAt(x,z,.6);}
function stump(x,z){const r=.38+Math.random()*.12;rcyl(r,.42,.08,0x9a6a44,x,.21,z);cyl(r*.82,.03,0xe2c08e,x,.43,z,null,false);cyl(r*.45,.032,0xc9a170,x,.435,z,null,false);addCircle(x,z,r+.05);blobAt(x,z,r+.35);}
function smallBush(x,z){const s=.55+Math.random()*.25;inst('bush',G.sph,x,.36*s/.6,z,s,.7*s,s,pick([0x8cc46a,0x7db862,0x9ccb72,0xb7c870]));addCircle(x,z,s*.8);blobAt(x,z,s+.3);}
function decoratePlaza(){const near=(x,z,d)=>FRIENDS.some(f=>Math.hypot(f.x-x,f.z-z)<d)||INTER.some(it=>Math.hypot(it.x-x,it.z-z)<d);
  const ok=(x,z,r)=>decorOK(x,z,r)&&!near(x,z,2.4+r)&&!(Math.abs(x)<2.9+r||Math.abs(z)<2.9+r);
  /* inner ring (just outside the plaza edge): pots, stumps, bushes, flower clumps */
  const inner=[potPlant,smallBush,stump,potPlant,smallBush,flowerClump];for(let i=0;i<40;i++){const a=i/40*Math.PI*2+.07,r=8.5+((i*7)%5)*.25,x=Math.cos(a)*r,z=Math.sin(a)*r;if(ok(x,z,.5))inner[i%inner.length](x,z);}
  /* outer ring: flower beds and low wooden fences facing the plaza, gaps filled with bushes & flowers */
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2+.2,r=11.6,x=Math.cos(a)*r,z=Math.sin(a)*r,ry=-a+Math.PI/2;
    if(i%2){const ends=[-1.2,1.2].map(d=>[x+d*Math.cos(ry),z-d*Math.sin(ry)]);if(ok(x,z,.4)&&ends.every(([ex,ez])=>ok(ex,ez,.3)))fenceRun(x,z,ry,3);else if(ok(x,z,.3))flowerClump(x,z);}
    else if(ok(x,z,1))flowerBed(x,z,ry);else if(ok(x,z,.4))smallBush(x,z);}
  for(let i=0;i<30;i++){const a=Math.random()*Math.PI*2,r=9.6+Math.random()*3.6,x=Math.cos(a)*r,z=Math.sin(a)*r;if(ok(x,z,.2))(Math.random()<.6?flowerClump:grassClump)(x,z);}}
/* is (x,z) free for a decoration of radius r? (r = the new item's own size, so items never sink into each other) */
function decorOK(x,z,r){r=r||0;if(z>52||blocked(x,z))return false;for(const q of ROADS)if(x>q[0]-.4-r&&x<q[1]+.4+r&&z>q[2]-.4-r&&z<q[3]+.4+r)return false;
  for(const b of boxes)if(x>b.x0-.3-r&&x<b.x1+.3+r&&z>b.z0-.3-r&&z<b.z1+.3+r)return false;for(const c of circles)if((x-c.x)**2+(z-c.z)**2<(c.r+.15+r)**2)return false;return true;}
function scatterClumps(){
  ROADS.forEach(([x0,x1,z0,z1])=>{const ax=x1-x0>=z1-z0,len=ax?x1-x0:z1-z0;for(let t=1;t<len;t+=2.2+Math.random()*2.5)[-1,1].forEach(sd=>{if(Math.random()<.35)return;const off=.7+Math.random()*.9;
    const x=ax?x0+t:(sd<0?x0-off:x1+off),z=ax?(sd<0?z0-off:z1+off):z0+t;if(!decorOK(x,z))return;(Math.random()<.55?flowerClump:grassClump)(x,z);});});
  ROOTS.forEach(([x,z,s])=>{const n=Math.random()<.5?2:1;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=(.9+Math.random()*.5)*s,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(decorOK(px,pz))(Math.random()<.55?flowerClump:grassClump)(px,pz);}});
  for(let i=0;i<260;i++){const x=-118+Math.random()*236,z=-118+Math.random()*170;if(freeSpot(x,z,.4))(Math.random()<.2?flowerClump:grassClump)(x,z,.9);}
  ROOTS.forEach(([x,z,s])=>acornsUnder(x,z,s));}
let ROOM=null;const DOORS={};
const WINMAT=Toon({color:0xa9def7,emissive:0xffa64d,emissiveIntensity:0});
const LAMPMAT=Toon({color:0xffe6b8,emissive:0xffa850,emissiveIntensity:.3});
/* night light pools: cheap additive glow decals on the ground (no real point lights → light on phones) */
/* k = brightness of this pool (lamps 1, doors .8, windows .5) */
const GLOWS=[];const glowAt=(x,z,r,k)=>GLOWS.push([x,z,r||3,k==null?1:k]);
/* lamp post materials: own copies so they can catch a little warm light from their bulb at night (not black) */
const LAMPPOST=Toon({color:0x3f6e52,emissive:0xffb070,emissiveIntensity:0}),LAMPBASE=Toon({color:0x325a43,emissive:0xffb070,emissiveIntensity:0});
const GLOWMAT=new THREE.MeshBasicMaterial({map:canvasTex(128,128,(c)=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,160,72,.85)');g.addColorStop(.45,'rgba(255,130,56,.4)');g.addColorStop(1,'rgba(255,110,40,0)');c.fillStyle=g;c.fillRect(0,0,128,128);}),
  transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function buildGlow(){const geo=new THREE.PlaneGeometry(2,2);geo.rotateX(-Math.PI/2);const im=new THREE.InstancedMesh(geo,GLOWMAT,GLOWS.length);
  GLOWS.forEach(([x,z,r,k],i)=>{dummy.position.set(x,.07,z);dummy.rotation.set(0,0,0);dummy.scale.set(r,1,r);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);im.setColorAt(i,tmpC.setRGB(k,k,k));});
  im.frustumCulled=false;im.renderOrder=2;im.visible=false;scene.add(im);W.glow=im;}
const SIDING=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){c.fillStyle='rgba(120,90,60,.18)';c.fillRect(0,y,w,2);c.fillStyle='rgba(255,255,255,.6)';c.fillRect(0,y+2,w,2);}for(let i=0;i<40;i++){c.fillStyle='rgba(120,90,60,.06)';c.fillRect(Math.random()*w,Math.random()*h,8,1);}});
const SHINGLE=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=3;for(let y=0;y<h+16;y+=16)for(let x=-16;x<w+16;x+=24){c.beginPath();c.arc(x+((y/16)%2)*12,y,12,0,Math.PI);c.stroke();}},true);SHINGLE.repeat.set(3,3);
const texMatC={};function MT(c,map){const k=c+'_'+map.uuid;if(!texMatC[k])texMatC[k]=Toon({color:c,map});return texMatC[k];}

/* instancing for static decor */
const INST={},dummy=new THREE.Object3D(),tmpC=new THREE.Color();
let INST_TAG=null; /* set by tree(): {t:type,r:random} so season.js can colour every part of one tree the same way */
function inst(key,geo,x,y,z,sx,sy,sz,col,ry,shadow){const d=INST[key]||(INST[key]={geo,items:[],shadow:shadow!==false});d.items.push([x,y,z,sx,sy,sz,col,ry||0,INST_TAG]);if(OCC_CUR)OCC_CUR.insts.push([key,d.items.length-1]);}
function buildInst(){for(const k in INST){const d=INST[k];const mat=Toon({color:0xffffff});
  if(['leaf','pine','bush'].includes(k))swayMaterial(mat,.045);else if(k==='flower'||k==='fcenter'||k==='tuft')swayMaterial(mat,.14);if(k==='flower')mat.side=THREE.DoubleSide;
  if(k==='sakuraBloom'){mat.vertexColors=true;swayMaterial(mat,.09,.8);mat.customProgramCacheKey=()=>'sakuraBloomSway';} /* blossom clumps: slow, gentle sway each with its own phase */
  const im=new THREE.InstancedMesh(d.geo,mat,d.items.length);
  d.items.forEach((it,i)=>{dummy.position.set(it[0],it[1],it[2]);dummy.scale.set(it[3],it[4],it[5]);dummy.rotation.set(0,it[7],0);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);im.setColorAt(i,tmpC.setHex(it[6]));});
  im.castShadow=d.shadow;im.receiveShadow=true;im.frustumCulled=false;scene.add(im);d.im=im;}}

/* colliders & walkability */
const circles=[],boxes=[],PLATS=[],ROADS=[],KEEP=[],WALK=[];
function addCircle(x,z,r){const c={x,z,r};circles.push(c);return c;}
function addBox(cx,cz,w,d,top,plat){const b={x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2,top:top==null?99:top,on:true,plat:!!plat};boxes.push(b);if(plat)PLATS.push(b);return b;}
function blocked(x,z){if(ROOM){const zmax=Math.abs(x-ROOM.cx)<1.2?ROOM.z1-.15:ROOM.z1-.6;return !(x>ROOM.x0+.45&&x<ROOM.x1-.45&&z>ROOM.z0+.5&&z<zmax);}
  if(x<-122||x>122||z<-122||z>124)return true;for(const r of WALK)if(x>r[0]&&x<r[1]&&z>r[2]&&z<r[3])return false;
  if(z>72)return Math.hypot(x-70,z-108)>15.3;if(x>36.6&&x<43.4&&z<74)return true;return false;}
function freeSpot(x,z,rad){if(blocked(x,z)||(z>53&&z<75))return false;
  for(const r of ROADS)if(x>r[0]-rad&&x<r[1]+rad&&z>r[2]-rad&&z<r[3]+rad)return false;
  for(const k of KEEP)if((x-k[0])**2+(z-k[1])**2<(k[2]+rad)**2)return false;
  for(const b of boxes)if(x>b.x0-rad&&x<b.x1+rad&&z>b.z0-rad&&z<b.z1+rad)return false;
  for(const c of circles)if((x-c.x)**2+(z-c.z)**2<(c.r+rad)**2)return false;return true;}
function groundAt(x,z,y){let g=0;for(const b of PLATS)if(b.on&&x>b.x0-.2&&x<b.x1+.2&&z>b.z0-.2&&z<b.z1+.2&&y>=b.top-STEP_UP-.05)g=Math.max(g,b.top);return g;}

/* text */
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
/* text may hold [漢字|かんじ] (kanji.js): drawn for the player's grade, redrawn by kjRefresh() when the grade changes */
function textCanvasTex(text,W,H,bg,fg){const draw=c=>{const s=kj(text);c.clearRect(0,0,W,H);c.fillStyle=bg;rrect(c,6,6,W-12,H-12,Math.min(40,H/3));c.fill();c.lineWidth=8;c.strokeStyle='#7a4f2a';c.stroke();c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let fs=Math.round(H*.5);c.font=`900 ${fs}px "Zen Maru Gothic",sans-serif`;while(c.measureText(s).width>W-40&&fs>10){fs-=2;c.font=`900 ${fs}px "Zen Maru Gothic",sans-serif`;}c.fillText(s,W/2,H/2+3);};
  const t=canvasTex(W,H,draw);if(String(text).indexOf('|')>=0)KJ_TEX.push(()=>{draw(t.image.getContext('2d'));t.needsUpdate=true;});return t;}
function textPlane(text,w,h,bg,fg,parent,x,y,z,ry){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:textCanvasTex(text,512,Math.round(512*h/w),bg||'#fffbef',fg||'#4a3523'),transparent:true}));m.position.set(x,y,z);m.rotation.y=ry||0;(parent||scene).add(m);return occAdd(m);}
function labelSprite(text,bg,fg,sc){const t=textCanvasTex(text,512,128,bg||'#fffbef',fg||'#4a3523');const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));s.scale.set(2.6*(sc||1),.65*(sc||1),1);return s;}
function bubbleSprite(ch,bg){const t=canvasTex(128,128,c=>{c.fillStyle=bg||'#fffbef';c.beginPath();c.arc(64,58,50,0,7);c.fill();c.lineWidth=7;c.strokeStyle='#7a4f2a';c.stroke();c.fillStyle='#ff6f91';c.font='900 64px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(ch,64,62);});const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));s.scale.set(.75,.75,1);return s;}

/* ===== characters ===== */
function makeChar(L){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);const k=L.kind,fur=L.fur,dark=darken(fur,.72);
  const piv=(x,y,z,p)=>{const g=new THREE.Group();g.position.set(x,y,z);(p||body).add(g);return g;};
  const limb=k==='panda'?0x333333:fur;
  const legL=piv(-.17,.36,0),legR=piv(.17,.36,0);
  for(const l of [legL,legR]){sph(.15,.2,.15,limb,0,-.16,0,l);sph(.16,.09,.2,(k==='pengin'||k==='fukurou')?0xf0a040:dark,0,-.33,.05,l);}
  const torso=sph(.42,.42,.37,L.shirt,0,.68,0,body);
  if(k==='pengin')sph(.3,.32,.1,0xffffff,0,.66,.3,body);
  const armL=piv(-.42,.88,0),armR=piv(.42,.88,0);sph(.12,.22,.12,limb,0,-.17,0,armL);sph(.12,.22,.12,limb,0,-.17,0,armR);armL.rotation.z=.25;armR.rotation.z=-.25;
  const head=piv(0,1.38,0);sph(.52,.47,.48,fur,0,0,0,head);const eyes=[];
  const S2=[-1,1];
  if(k==='usagi')S2.forEach(s=>{const e=sph(.1,.36,.08,fur,s*.17,.6,0,head);e.rotation.z=-s*.12;const i=sph(.05,.26,.04,0xffb3c6,s*.17,.6,.06,head);i.rotation.z=-s*.12;});
  if(k==='kuma'||k==='panda'||k==='hamster')S2.forEach(s=>{sph(k==='hamster'?.11:.15,k==='hamster'?.11:.15,.08,k==='panda'?0x222222:fur,s*.36,.36,0,head);if(k!=='panda')sph(.07,.07,.04,0xffc4c4,s*.36,.36,.05,head);});
  if(k==='neko'||k==='kitsune'||k==='risu')S2.forEach(s=>{const big=k==='kitsune';const e=cone(big?.17:.15,big?.38:.3,fur,s*.3,.44,0,head);e.rotation.z=-s*.35;const i=cone(.08,.16,big?0x3a2a1e:0xffb3c6,s*.3,.44,.07,head);i.rotation.z=-s*.35;});
  if(k==='inu')S2.forEach(s=>{const e=sph(.12,.27,.08,dark,s*.48,-.02,0,head);e.rotation.z=s*.35;});
  if(k==='fukurou')S2.forEach(s=>{const e=cone(.1,.22,dark,s*.3,.44,0,head);e.rotation.z=-s*.4;});
  if(k==='hitsuji'){[[0,.38,0],[-.25,.32,.05],[.25,.32,.05],[-.38,.15,0],[.38,.15,0],[0,.3,-.25]].forEach(p=>sph(.17,.15,.17,0xffffff,p[0],p[1],p[2],head));S2.forEach(s=>sph(.15,.06,.08,fur,s*.52,.05,0,head));}
  if(k==='dragon'){S2.forEach(s=>{cone(.07,.24,0xffd54f,s*.2,.5,-.05,head);const w=cone(.3,.5,0x81c784,s*.38,.9,-.33,body);w.scale.z=.06;w.rotation.z=s*1.1;});const t=cone(.16,.6,fur,0,.45,-.45,body);t.rotation.x=-1.2;}
  if(k==='risu'){sph(.22,.42,.2,fur,0,.85,-.45,body);sph(.18,.3,.16,fur,0,1.25,-.55,body);}
  if(k==='kitsune'){const t=sph(.18,.38,.18,fur,0,.6,-.48,body);t.rotation.x=-.9;sph(.12,.15,.12,0xffffff,0,.82,-.72,body);}
  if(k==='kame'){sph(.5,.45,.42,0x6d8b3a,0,.72,-.2,body);sph(.2,.18,.06,0x8bae4a,0,.85,-.6,body);}
  if(k==='kaeru')S2.forEach(s=>{sph(.15,.15,.15,fur,s*.2,.38,.15,head);sph(.1,.1,.06,0xffffff,s*.2,.42,.27,head);sph(.05,.06,.03,0x111111,s*.2,.42,.32,head);});
  else{
    if(k==='panda')S2.forEach(s=>sph(.13,.15,.05,0x222222,s*.18,.04,.42,head));
    if(k==='fukurou')S2.forEach(s=>sph(.17,.17,.06,0xfff8e1,s*.18,.04,.42,head));
    if(k==='pengin')sph(.4,.32,.12,0xffffff,0,-.04,.36,head);
    S2.forEach(s=>{const e=sph(.07,.09,.04,0x1d1410,s*.17,.04,.45,head);eyes.push(e);eyes.push(sph(.026,.026,.02,0xffffff,s*.145,.085,.485,head,false));});
  }
  S2.forEach(s=>sph(.09,.06,.03,0xff9fb2,s*.3,-.1,.39,head,false));
  if(['kuma','inu','panda','hamster','hitsuji'].includes(k)){sph(.17,.12,.1,0xfff0dc,0,-.12,.42,head);sph(.06,.045,.04,0x3a2a1e,0,-.07,.51,head);}
  else if(k==='kitsune'){sph(.16,.12,.14,0xffffff,0,-.12,.44,head);sph(.05,.04,.04,0x3a2a1e,0,-.08,.57,head);}
  else if(k==='pengin'||k==='fukurou'){const b=cone(.07,.16,0xf0a040,0,-.06,.5,head);b.rotation.x=Math.PI/2;}
  else if(k==='dragon'){sph(.2,.14,.14,0x9ccc65,0,-.1,.42,head);}
  else if(k!=='kaeru'&&k!=='kame')sph(.045,.035,.03,0xff8fa3,0,-.06,.47,head);
  const h=L.hat;
  if(h==='ribbon'){sph(.07,.07,.07,0xff5a7a,.22,.42,0,head);S2.forEach(s=>{const c=cone(.12,.22,0xff5a7a,.22+s*.13,.42,0,head);c.rotation.z=s*Math.PI/2;});}
  if(h==='cap'){sph(.5,.3,.48,0xef5350,0,.22,0,head);box(.5,.04,.35,0xef5350,0,.24,.4,head);}
  if(h==='straw'){cyl(.75,.04,0xf2d27a,0,.36,0,head);cyl(.42,.25,0xf2d27a,0,.5,0,head);cyl(.43,.06,0xef5350,0,.42,0,head);}
  if(h==='beanie'){sph(.53,.36,.5,0x7e57c2,0,.18,0,head);sph(.12,.12,.12,0xffffff,0,.56,0,head);}
  if(h==='flower'){for(let i=0;i<6;i++){const a=i/6*Math.PI*2;sph(.08,.05,.08,0xfff1f5,.26+Math.cos(a)*.1,.38,.12+Math.sin(a)*.1,head);}sph(.06,.05,.06,0xffd54f,.26,.4,.12,head);}
  if(h==='chef'){cyl(.32,.35,0xffffff,0,.55,0,head);sph(.42,.25,.42,0xffffff,0,.78,0,head);}
  if(h==='witch'){cyl(.7,.04,0x5e35b1,0,.36,0,head);const c=cone(.4,.9,0x5e35b1,0,.85,0,head);c.rotation.z=.15;}
  if(h==='pirate'){box(.9,.32,.3,0x222222,0,.5,0,head);sph(.06,.06,.03,0xffffff,0,.52,.16,head);}
  if(h==='crown'){cyl(.3,.2,0xffd54f,0,.52,0,head);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;cone(.06,.16,0xffd54f,Math.cos(a)*.27,.69,Math.sin(a)*.27,head);}sph(.05,.05,.05,0xef5350,0,.53,.3,head);}
  const a=L.acc;
  if(a==='glasses'){S2.forEach(s=>mk(G.torus,0x333333,.1,.1,.1,s*.17,.04,.47,head));box(.1,.02,.02,0x333333,0,.05,.48,head);}
  if(a==='scarf'){const t=mk(G.torus,0xe53935,.4,.4,.5,0,1.03,0,body);t.rotation.x=Math.PI/2;box(.12,.32,.06,0xe53935,.16,.85,.34,body);}
  if(a==='bag'){box(.5,.55,.25,0xffa726,0,.72,-.42,body);box(.52,.2,.27,0xfb8c00,0,.9,-.42,body);}
  if(a==='bow')S2.forEach(s=>{const c=cone(.08,.16,0x3949ab,s*.08,1.0,.36,body);c.rotation.z=-s*Math.PI/2;});
  if(a==='cape'){const c=box(.78,.85,.04,0xd32f2f,0,.62,-.37,body);c.rotation.x=.12;}
  if(a==='star')mk(G.oct,ME(0xffd54f),.08,.08,.08,0,.85,.38,body);
  root.userData={body,torso,legL,legR,armL,armR,head,eyes,ey:eyes.map(e=>e.scale.y),ph:Math.random()*5};return root;
}
function animChar(m,t,moving,air){const u=m.userData,sw=moving?Math.sin(t*11)*.7:0;
  u.legL.rotation.x=sw;u.legR.rotation.x=-sw;u.armL.rotation.x=-sw*.8;u.armR.rotation.x=sw*.8;
  u.body.position.y=air?0:moving?Math.abs(Math.sin(t*11))*.07:Math.sin(t*2.2)*.012;
  u.armL.rotation.z=air?1.1:.25;u.armR.rotation.z=air?-1.1:-.25;u.head.rotation.z=moving?0:Math.sin(t*1.3)*.04;
  if(u.eyes){const bl=((t+u.ph)%3.4)<.13?.12:1;u.eyes.forEach((e,i)=>e.scale.y=u.ey[i]*bl);}}

/* ===== furniture models ===== */
/* furniture: boxes and cylinders get soft rounded edges (same chunky toy look as the village); very thin parts stay plain */
function fb(id){const g=new THREE.Group();
  const B=(w,h,d,c,x,y,z)=>{const m=Math.min(w,h,d);return m>=.06?rbox(w,h,d,Math.min(.12,m*.38),c,x,y,z,g):box(w,h,d,c,x,y,z,g);},
    C=(r,h,c,x,y,z)=>h>=.06&&r>=.05?rcyl(r,h,Math.min(.08,h*.38,r*.45),c,x,y,z,g):cyl(r,h,c,x,y,z,g),P=(a,b,d,c,x,y,z)=>sph(a,b,d,c,x,y,z,g),K=(r,h,c,x,y,z)=>cone(r,h,c,x,y,z,g);
  switch(id){
  case 'chair':B(.7,.08,.7,0xe0a96d,0,.5,0);for(const[x,z]of[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]])B(.08,.5,.08,0xb07a45,x,.25,z);B(.7,.7,.08,0xe0a96d,0,.9,-.31);break;
  case 'table':C(.55,.08,0xe8c08a,0,.72,0);C(.08,.7,0xb07a45,0,.36,0);C(.3,.05,0xb07a45,0,.03,0);break;
  case 'bed':B(1,.3,1.1,0xb07a45,0,.2,0);B(.95,.15,1.05,0xffffff,0,.42,0);B(.97,.12,.7,0xff8fab,0,.5,.17);B(.5,.12,.25,0xffffff,0,.55,-.38);B(1,.8,.08,0xb07a45,0,.45,-.55);break;
  case 'sofa':B(1.1,.35,.6,0x7ec8e3,0,.25,0);B(1.1,.55,.18,0x6bb5d0,0,.55,-.22);B(.16,.45,.6,0x6bb5d0,-.55,.4,0);B(.16,.45,.6,0x6bb5d0,.55,.4,0);break;
  case 'lamp':C(.22,.05,0x8d6e63,0,.03,0);C(.03,1.3,0x8d6e63,0,.66,0);mk(G.shade,ME(0xfff1a8),.3,.35,.3,0,1.4,0,g);break;
  case 'plant':mk(G.pot,0xd97b4f,.22,.35,.22,0,.17,0,g);P(.3,.35,.3,0x4caf50,0,.6,0);P(.2,.25,.2,0x66bb6a,.15,.8,.05);P(.2,.22,.2,0x43a047,-.14,.75,-.05);break;
  case 'rug':C(.58,.02,0xb39ddb,0,.01,0);C(.4,.025,0xd1c4e9,0,.015,0);break;
  case 'tv':B(.95,.35,.42,0xb07a45,0,.18,0);B(.9,.56,.08,0x222222,0,.66,0);B(.8,.46,.02,ME(0x6ec6ff),0,.66,.05);break;
  case 'shelf':B(1,1.6,.4,0xb07a45,0,.8,-.3);for(let i=0;i<3;i++){B(.94,.05,.36,0xc8955c,0,.3+i*.5,-.28);for(let j=0;j<5;j++)B(.13,.32,.26,[0xef5350,0x42a5f5,0x66bb6a,0xffca28,0xab47bc][j],-.35+j*.17,.5+i*.5,-.28);}break;
  case 'piano':B(1,.8,.5,0x222222,0,.45,-.1);B(.94,.05,.2,0xffffff,0,.86,.22);B(.9,.3,.05,0x222222,0,1.05,-.33);break;
  case 'clock':{B(.45,1.6,.35,0x8d6e63,0,.8,-.2);const f=C(.17,.04,0xffffff,0,1.35,-.01);f.rotation.x=Math.PI/2;B(.02,.12,.02,0x222222,0,1.4,.02);P(.08,.08,.03,0xffd54f,0,.6,-.01);break;}
  case 'teddy':{const t=makeChar({kind:'kuma',fur:0xc58b5a,shirt:0xff8fab,hat:'ribbon',acc:'none'});t.scale.setScalar(.45);g.add(t);break;}
  case 'desk':B(1,.06,.6,0xc8955c,0,.75,-.1);B(.06,.72,.56,0xb07a45,-.45,.36,-.1);B(.3,.6,.55,0xb07a45,.33,.4,-.1);B(.3,.05,.22,0x42a5f5,-.2,.8,-.1);break;
  case 'globe':C(.2,.05,0x8d6e63,0,.03,0);C(.03,.5,0x8d6e63,0,.28,0);P(.3,.3,.3,0x42a5f5,0,.75,0);P(.14,.12,.08,0x66bb6a,.12,.82,.2);P(.1,.12,.08,0x66bb6a,-.15,.65,.22);break;
  case 'tank':B(.95,.5,.5,0x8d6e63,0,.25,0);mk(G.box,Toon({color:0x9fe3ff,transparent:true,opacity:.45}),.9,.55,.45,0,.78,0,g,false);P(.08,.06,.03,0xff8a3d,-.2,.8,0);P(.07,.05,.03,0xffd54f,.2,.7,.05);B(.9,.05,.45,0xf2dcb0,0,.53,0);break;
  case 'xmas':C(.08,.3,0x8d6e63,0,.15,0);K(.5,.6,0x2e7d32,0,.55,0);K(.4,.5,0x388e3c,0,.9,0);K(.28,.4,0x43a047,0,1.2,0);mk(G.oct,ME(0xffd54f),.12,.12,.12,0,1.45,0,g);for(let i=0;i<6;i++)P(.05,.05,.05,[0xef5350,0x42a5f5,0xffca28][i%3],Math.cos(i)*.33,.6+i*.1,Math.sin(i)*.33);break;
  case 'snowman':{P(.35,.32,.35,0xffffff,0,.32,0);P(.25,.24,.25,0xffffff,0,.82,0);C(.18,.25,0x222222,0,1.15,0);C(.26,.03,0x222222,0,1.03,0);const n=K(.04,.18,0xff8a3d,0,.82,.3);n.rotation.x=Math.PI/2;break;}
  case 'rocket':{C(.22,.9,0xffffff,0,.65,0);K(.22,.35,0xef5350,0,1.27,0);for(const a of [0,2.1,4.2]){const f=B(.04,.35,.25,0xef5350,Math.cos(a)*.22,.3,Math.sin(a)*.22);f.rotation.y=-a;}const w=C(.09,.03,0x42a5f5,0,.8,.21);w.rotation.x=Math.PI/2;break;}
  case 'mush':C(.12,.45,0xfff3e0,0,.22,0);P(.45,.25,.45,0xe53935,0,.48,0);for(let i=0;i<5;i++)P(.06,.04,.06,0xffffff,Math.cos(i*1.3)*.28,.62,Math.sin(i*1.3)*.28);break;
  case 'palm':mk(G.pot,0xd97b4f,.22,.3,.22,0,.15,0,g);C(.07,1.1,0xa0784f,0,.85,0);for(let i=0;i<5;i++){const l=P(.5,.06,.15,0x4caf50,Math.cos(i*1.26)*.4,1.4,Math.sin(i*1.26)*.4);l.rotation.y=-i*1.26;}break;
  case 'slideM':{B(.42,.05,.42,0xffd45c,-.28,.62,0);for(const[x,z]of[[-.45,-.17],[-.11,-.17],[-.45,.17],[-.11,.17]])C(.025,.6,0xff8fab,x,.3,z);for(let i=1;i<5;i++)B(.3,.03,.07,0xffd45c,-.6,i*.12,0);
    const s=B(.9,.04,.3,0x64b5f6,.28,.34,0);s.rotation.z=-.62;B(.25,.04,.3,0x64b5f6,.75,.05,0);break;}
  case 'trophy':B(.35,.15,.35,0x5d4037,0,.08,0);C(.05,.25,0xffd54f,0,.28,0);mk(G.pot,ME(0xffd54f),.22,.3,.22,0,.55,0,g);break;
  case 'chest':{B(.8,.45,.5,0x8d5a2b,0,.23,0);const l=C(.25,.8,0x8d5a2b,0,.45,0);l.rotation.z=Math.PI/2;B(.82,.06,.52,0xffd54f,0,.45,0);B(.1,.14,.05,0xffd54f,0,.36,.26);break;}
  case 'ferrisM':{B(.6,.06,.4,0x8d6e63,0,.03,0);mk(G.torus,0xff8fab,.4,.4,.4,0,.62,0,g);beam(new V3(-.2,0,0),new V3(0,.62,0),.03,0x8d6e63,g);beam(new V3(.2,0,0),new V3(0,.62,0),.03,0x8d6e63,g);for(let i=0;i<6;i++)B(.1,.1,.1,[0xef5350,0x42a5f5,0xffca28][i%3],0,.62+Math.sin(i)*.4,Math.cos(i)*.4);break;}
  case 'honey':P(.3,.28,.3,0xffb300,0,.3,0);C(.18,.08,0xffe082,0,.58,0);B(.25,.12,.02,0xfff8e1,0,.33,.29);break;
  case 'cattower':C(.06,1.3,0xd7ccc8,-.25,.65,0);C(.06,.8,0xd7ccc8,.25,.4,0);B(.5,.06,.5,0xf8bbd0,-.25,1.3,0);B(.5,.06,.5,0xf8bbd0,.25,.8,0);B(1,.08,.7,0xf8bbd0,0,.04,0);P(.1,.1,.1,0xff7043,.25,.95,.2);break;
  case 'lily':C(.45,.2,0x8d6e63,0,.1,0);C(.4,.02,0x4fc3f7,0,.2,0);C(.13,.02,0x66bb6a,-.15,.22,.1);C(.11,.02,0x66bb6a,.15,.22,-.1);P(.08,.06,.08,0xf48fb1,.12,.27,.12);break;
  case 'iceseat':mk(G.box,Toon({color:0xb3e5fc,transparent:true,opacity:.85}),.6,.5,.6,0,.25,0,g);B(.6,.4,.12,0xb3e5fc,0,.65,-.24);break;
  case 'bamboo':mk(G.pot,0xd97b4f,.25,.3,.25,0,.15,0,g);for(let i=0;i<3;i++)C(.05,1.2+i*.25,0x7cb342,(i-1)*.12,.75+i*.12,0);P(.25,.05,.1,0x8bc34a,.15,1.4,0);break;
  case 'ball':{P(.3,.3,.3,0xef5350,0,.3,0);const t=mk(G.torus,0xffffff,.3,.3,.3,0,.3,0,g);t.rotation.y=Math.PI/2;break;}
  case 'egg':{const t=mk(G.torus,0x8d6e63,.3,.3,.6,0,.08,0,g);t.rotation.x=Math.PI/2;P(.22,.3,.22,0xfff3e0,0,.3,0);P(.05,.05,.03,0x66bb6a,.1,.38,.18);P(.04,.04,.03,0x66bb6a,-.08,.25,.2);break;}
  }
  return g;}

/* ===== world ===== */
const W={water:[],drops:null,fw:null,gond:[],carousel:null,horses:[],cups:null,clouds:[],gates:[],fences:{},stars:[],shards:[],bugs:[],shells:[],signs:{},clockTex:null,foam:null,flagT:0,chests:{}};
const INTER=[];
function planeUV(w,h,ru,rv){const g=new THREE.PlaneGeometry(w,h,Math.min(120,Math.ceil(w/4)),Math.min(120,Math.ceil(h/4)));const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*ru,uv.getY(i)*rv);return g;}
function flat(w,d,mat,x,y,z,uvs){const m=new THREE.Mesh(planeUV(w,d,uvs?uvs[0]:w/4,uvs?uvs[1]:d/4),mat);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;}
function noiseTex(base,dots,n){return canvasTex(256,256,(c,w,h)=>{c.fillStyle=base;c.fillRect(0,0,w,h);for(let i=0;i<n;i++){c.fillStyle=pick(dots);const s=2+Math.random()*4;c.fillRect(Math.random()*w,Math.random()*h,s,s);}},true);}
function waterTex(base){return canvasTex(256,256,(c,w,h)=>{c.fillStyle=base;c.fillRect(0,0,w,h);c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=3;for(let i=0;i<16;i++){const x=Math.random()*w,y=Math.random()*h;c.beginPath();c.arc(x,y,10+Math.random()*8,Math.PI*1.15,Math.PI*1.85);c.stroke();}},true);}
/* road: wider than its walkable rect, with feathered dirt edges (collision/map still use the exact rect) */
function road(x0,x1,z0,z1){ROADS.push([x0,x1,z0,z1]);const ax=x1-x0>=z1-z0,len=(ax?x1-x0:z1-z0)+ROAD_PAD,wid=(ax?z1-z0:x1-x0)+ROAD_PAD*2;
  const g=new THREE.PlaneGeometry(len,wid,Math.min(120,Math.ceil(len/4)),1),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len/5+x0*.13+z0*.17);
  const m=new THREE.Mesh(g,W.pathMat);m.rotation.x=-Math.PI/2;if(!ax)m.rotation.z=Math.PI/2;m.position.set((x0+x1)/2,.02,(z0+z1)/2);m.receiveShadow=true;m.renderOrder=1;scene.add(m);}

function building(o){const g=new THREE.Group();g.position.set(o.x,0,o.z);if(o.face===-1)g.rotation.y=Math.PI;scene.add(g);
  const ownOcc=occBegin([occBox(o.x-o.w/2-.8,o.x+o.w/2+.8,o.z-o.d/2-1,o.z+o.d/2+1,o.h+(o.rh||2.6)+.2)]);
  const rh=o.rh||2.6,nw=o.win||2,F=o.d/2;
  if(o.toy){/* chunky toy version: soft rounded walls, fat round pillars, puffy trims, thick frames */
    mk(roundBoxGeo(o.w,o.h,o.d,.7),MT(o.wall,SIDING),1,1,1,0,o.h/2,0,g);rbox(o.w+.5,.6,o.d+.5,.28,0xd9c6a8,0,.3,0,g);
    [-1,1].forEach(s=>{rcyl(.5,o.h+.1,.2,0xffffff,s*(o.w/2),o.h/2,F,g);sph(.56,.32,.56,0xffffff,s*o.w/2,o.h+.12,F,g);});rbox(o.w+.6,.5,.8,.24,0xffffff,0,o.h,F,g);
    mk(G.prism,MT(o.roof,SHINGLE),o.w+1.1,rh/1.5,(F+.75)/.866,0,o.h+.5*rh/1.5,0,g);
    rbox(2.5,3,.34,.16,0xffffff,0,1.5,F+.05,g);rbox(1.8,2.6,.3,.16,0x9a6a44,0,1.3,F+.1,g);box(1.2,.8,.04,WINMAT,0,1.9,F+.26,g,false);sph(.13,.13,.13,0xffd54f,.55,1.2,F+.3,g);
    rbox(2.8,.24,1.6,.11,0xd9c6a8,0,.12,F+.9,g);
    for(let i=0;i<nw;i++){const x=nw===1?0:-o.w/2+1.4+i*((o.w-2.8)/(nw-1));if(Math.abs(x)<1.3)continue;const wy=o.h*.56;
      rbox(1.9,1.7,.26,.13,0xffffff,x,wy,F+.06,g,false);box(1.45,1.25,.1,WINMAT,x,wy,F+.16,g,false);rbox(.18,1.25,.16,.07,0xffffff,x,wy,F+.2,g,false);rbox(1.45,.18,.16,.07,0xffffff,x,wy,F+.2,g,false);
      rbox(1.9,.4,.5,.16,0x9a6a44,x,wy-1.02,F+.3,g);for(let k=0;k<4;k++)sph(.17,.15,.17,pick([0xff9fb8,0xfff07a,0xffffff,0xc9b3f0]),x-.6+k*.4,wy-.76,F+.32,g,false);}
    if(o.label)textPlane(o.label,Math.min(o.w-1,5),1,'#fffbef','#4a3523',g,0,o.h-.85,F+.12);}
  else{
  mk(G.box,MT(o.wall,SIDING),o.w,o.h,o.d,0,o.h/2,0,g);box(o.w+.2,.5,o.d+.2,0xcbb79c,0,.25,0,g);
  [-1,1].forEach(s=>box(.25,o.h,.25,0xffffff,s*(o.w/2+.02),o.h/2,o.d/2+.02,g));box(o.w+.3,.25,.3,0xffffff,0,o.h,o.d/2,g);
  mk(G.prism,MT(o.roof,SHINGLE),o.w+.9,rh/1.5,(o.d/2+.6)/.866,0,o.h+.5*rh/1.5,0,g);
  box(2.1,2.8,.16,0xffffff,0,1.4,o.d/2+.03,g);box(1.7,2.5,.2,0x8a5a33,0,1.25,o.d/2+.05,g);box(1.2,.8,.02,WINMAT,0,1.9,o.d/2+.16,g,false);sph(.09,.09,.09,0xffd54f,.5,1.2,o.d/2+.2,g);
  box(2.2,.12,1.4,0xbfa98a,0,.06,o.d/2+.8,g);
  for(let i=0;i<nw;i++){const x=nw===1?0:-o.w/2+1.4+i*((o.w-2.8)/(nw-1));if(Math.abs(x)<1.3)continue;const wy=o.h*.58;
    box(1.6,1.4,.1,0xffffff,x,wy,o.d/2+.03,g,false);box(1.35,1.15,.12,WINMAT,x,wy,o.d/2+.05,g,false);box(.08,1.15,.14,0xffffff,x,wy,o.d/2+.07,g,false);box(1.35,.08,.14,0xffffff,x,wy,o.d/2+.07,g,false);
    box(1.6,.3,.35,0x8a5a33,x,wy-.85,o.d/2+.2,g);for(let k=0;k<4;k++)sph(.14,.12,.14,pick([0xff6f91,0xffd54f,0xffffff,0xb39ddb]),x-.55+k*.37,wy-.62,o.d/2+.22,g,false);}
  if(o.label)textPlane(o.label,Math.min(o.w-1,5),1,'#fffbef','#4a3523',g,0,o.h-.55,o.d/2+.09);}
  if(o.chim)box(.7,1.6,.7,0x8f6a52,o.w/2-1.2,o.h+1.2,-.6,g);
  addBox(o.x,o.z,o.w+.3,o.d+.3);KEEP.push([o.x,o.z,Math.max(o.w,o.d)/2+2]);blobAt(o.x,o.z,o.w/2+1.6,o.d/2+1.6);
  {const fs=o.face===-1?-1:1;glowAt(o.x,o.z+fs*(o.d/2+1.4),2.6,.8);for(let i=0;i<nw;i++){const x=nw===1?0:-o.w/2+1.4+i*((o.w-2.8)/(nw-1));if(Math.abs(x)<1.3)continue;glowAt(o.x+fs*x,o.z+fs*(o.d/2+1.3),2.4,.68);}}
  if(ownOcc)occEnd();return {g,door:{x:o.x,z:o.z+(o.face===-1?-1:1)*(o.d/2+1.3)}};}
function doorInter(id,door,face){DOORS[id]={x:door.x,z:door.z,face};INTER.push({x:door.x,z:door.z-face*.6,r:2.4,y:3.6,label:'[入|はい]る',fn:()=>enterRoom(id)});}
/* ===== sakura (cherry): cute but detailed =====
   one shared trunk+branches geometry (curved, bumpy, dark brown) and one shared bumpy blossom-clump geometry,
   both drawn instanced for every cherry tree; 16–20 clumps per tree form a wide umbrella with a pink gradient */
const SAKURA=[];
function mergeGeos(list){const pos=[],nor=[];list.forEach(g=>{const n=g.index?g.toNonIndexed():g,p=n.attributes.position.array,q=n.attributes.normal.array;for(let i=0;i<p.length;i++){pos.push(p[i]);nor.push(q[i]);}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.computeBoundingSphere();return g;}
/* tapered tube along a curve; bump = knobbly bark */
function limbGeo(pts,r0,r1,bump,seg,rad){const curve=new THREE.CatmullRomCurve3(pts),g=new THREE.TubeGeometry(curve,seg,1,rad,false),p=g.attributes.position,c=new V3(),v=new V3();
  for(let i=0;i<=seg;i++){curve.getPointAt(i/seg,c);const t=i/seg,r=(r0+(r1-r0)*t)*(t<.12?1+(.12-t)*3:1);for(let j=0;j<=rad;j++){const k=i*(rad+1)+j;v.fromBufferAttribute(p,k).sub(c);
    const b=1+bump*(Math.sin(i*1.9+j*2.7)*.6+Math.sin(i*3.3-j*1.3)*.4);v.multiplyScalar(r*b);p.setXYZ(k,c.x+v.x,c.y+v.y,c.z+v.z);}}
  g.computeVertexNormals();return g;}
const SAKURA_BR=[[.3,1.9,1.05],[2.4,1.7,1.25],[4.2,2.0,.9],[5.5,1.35,1.4]]; /* [angle, reach, rise] of the 4 thick branches */
const SAKURA_TIPS=SAKURA_BR.map(([a,l,u])=>[Math.cos(a)*l,2.1+u,Math.sin(a)*l]);
const SAKURA_TRUNK_GEO=(()=>{const parts=[limbGeo([new V3(0,0,0),new V3(.14,.8,.05),new V3(-.06,1.55,.1),new V3(.05,2.25,0)],.34,.22,.1,14,8)];
  SAKURA_BR.forEach(([a,l,u])=>parts.push(limbGeo([new V3(.04,2.0,.02),new V3(Math.cos(a)*l*.45,2.1+u*.62,Math.sin(a)*l*.45),new V3(Math.cos(a)*l,2.1+u,Math.sin(a)*l)],.17,.07,.12,8,6)));
  const cap=new THREE.SphereGeometry(.24,8,6);cap.translate(.05,2.25,0);parts.push(cap);return mergeGeos(parts);})();
/* blossom clump: bumpy ball (bumpy rim = many flowers), darker underneath via vertex color */
const SAKURA_BLOOM_GEO=(()=>{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position,v=new V3(),col=new Float32Array(p.count*3);
  /* smooth (spherical) normals: soft puffy shading; the bumpy silhouette still reads as many little flowers */
  const nm=g.attributes.normal;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).normalize();const n=Math.sin(v.x*6.1+.3)*Math.sin(v.y*5.3+1.1)*Math.sin(v.z*6.7+2.2)+.5*Math.sin(v.x*11+v.z*9);
    const r=1+.14*n;p.setXYZ(i,v.x*r,v.y*r,v.z*r);nm.setXYZ(i,v.x,v.y,v.z);const c=.8+.2*(v.y*.5+.5);col[i*3]=c;col[i*3+1]=c;col[i*3+2]=c;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;})();
const SAKURA_DARK=new THREE.Color(0xf088ae),SAKURA_LIGHT=new THREE.Color(0xffeef4),_sc=new THREE.Color();
/* fallen-petal ground under each cherry: soft pink decal sprinkled with petals */
const PETALGROUND=[];
function buildPetalGround(){if(!PETALGROUND.length)return;const tex=canvasTex(256,256,(c,w,h)=>{for(let i=0;i<520;i++){const a=Math.random()*Math.PI*2,r=Math.pow(Math.random(),.7)*118,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;
    c.save();c.translate(x,y);c.rotate(Math.random()*6.3);c.fillStyle=pick(['rgba(255,182,206,.85)','rgba(255,214,228,.85)','rgba(248,160,190,.75)','rgba(255,236,242,.8)']);c.beginPath();c.ellipse(0,0,3.2+Math.random()*2,2+Math.random()*1.3,0,0,7);c.fill();c.restore();}
    c.globalCompositeOperation='destination-in';const g=c.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'#000');g.addColorStop(.5,'rgba(0,0,0,.85)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  const mat=Toon({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});const im=new THREE.InstancedMesh(BLOB_GEO,mat,PETALGROUND.length);
  PETALGROUND.forEach(([x,z,r],i)=>{dummy.position.set(x,.04,z);dummy.rotation.set(0,Math.random()*6.3,0);dummy.scale.set(r,1,r);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);});
  im.receiveShadow=true;im.frustumCulled=false;im.renderOrder=1.4;scene.add(im);W.petalIM=im;}
function sakuraTree(x,z,s){const ry=Math.random()*Math.PI*2,cr=Math.cos(ry),sr=Math.sin(ry),W=(lx,lz)=>[x+(lx*cr+lz*sr)*s,z+(-lx*sr+lz*cr)*s];
  inst('sakuraTrunk',SAKURA_TRUNK_GEO,x,0,z,s,s,s,pick([0x5e3a26,0x66412b,0x573522]),ry);
  const R=2.6*s,base=3.0*s,h=1.0*s,pts=[];
  SAKURA_TIPS.forEach(([lx,ly,lz])=>{const[wx,wz]=W(lx,lz);for(let k=0;k<3;k++)pts.push([wx+(Math.random()-.5)*.9*s,(ly+.15+(Math.random()-.3)*.5)*s,wz+(Math.random()-.5)*.9*s]);});
  const nFill=4+(Math.random()*5|0);for(let k=0;k<nFill;k++){const a=Math.random()*Math.PI*2,rr=R*(.15+.85*Math.sqrt(Math.random()));pts.push([x+Math.cos(a)*rr,base+h*(1-(rr/R)**2)*.9+Math.random()*.25*s,z+Math.sin(a)*rr]);}
  pts.forEach(([px,py,pz])=>{const t=clamp(.55*Math.hypot(px-x,pz-z)/R+.45*(py-(base-.6*s))/(h+1.0*s),0,1),sz=(.62+.3*Math.random())*s;
    inst('sakuraBloom',SAKURA_BLOOM_GEO,px,py,pz,sz*1.15,sz*.75,sz*1.15,_sc.copy(SAKURA_DARK).lerp(SAKURA_LIGHT,t).getHex(),Math.random()*6);});
  SAKURA.push({x,z,s,R,top:base+h});PETALGROUND.push([x,z,2.9*s]);}
/* see-through volumes of a tree: thin trunk cylinder + crown cylinder (so a low camera under a crown does not fade it) */
function treeVols(x,z,type,s){if(type==='pine')return [occCyl(x,z,.3*s,0,1.2*s),occCyl(x,z,1.5*s,1.1*s,4.9*s)];
  if(type==='palm')return [occCyl(x+.25*s,z,.5*s,0,4.3*s),occCyl(x+.48*s,z,2*s,4.1*s,5*s)];
  if(type==='sakura')return [occCyl(x,z,.45*s,0,2.2*s),occCyl(x,z,3.1*s,2*s,4.9*s)];
  return [occCyl(x,z,.3*s,0,1.3*s),occCyl(x,z,1.9*s,1.2*s,4*s)];}
function tree(x,z,type,s){s=s||1;occBegin(treeVols(x,z,type,s));INST_TAG={t:type,r:Math.random()};
  if(type==='pine'){inst('trunk',G.cylL,x,.6*s,z,.22*s,1.2*s,.22*s,0x9a6a44);inst('pine',G.coneL,x,2.2*s,z,1.5*s,2.2*s,1.5*s,0x5cb86a);inst('pine',G.coneL,x,3.3*s,z,1.1*s,1.8*s,1.1*s,0x6ac377);inst('pine',G.coneL,x,4.2*s,z,.7*s,1.4*s,.7*s,0x7bcd85);}
  else if(type==='palm'){for(let i=0;i<5;i++)inst('trunk',G.cylL,x+i*.12*s,(.5+i*.9)*s,z,.2*s,.95*s,.2*s,0xa0784f);for(let k=0;k<6;k++){const a=k/6*Math.PI*2;inst('leaf',G.sphL,x+.48*s+Math.cos(a)*1.1*s,4.6*s,z+Math.sin(a)*1.1*s,1.3*s,.18*s,.45*s,0x4caf50,-a);}inst('fruit',G.sphL,x+.5*s,4.3*s,z,.22,.22,.22,0x8d6e63);}
  else if(type==='sakura')sakuraTree(x,z,s);
  else{const col=type==='autumn'?pick([0xffb347,0xffa24a,0xffcf5a,0xffc04d,0xff9358,0xffdb6e]):pick([0x8fd66a,0xa3de6e,0x7fcc60,0xb5e27a]);
    inst('trunk',G.cylL,x,.8*s,z,.25*s,1.6*s,.25*s,0x9a6a44);inst('leaf',G.sph,x,2.6*s,z,1.5*s,1.35*s,1.5*s,col);inst('leaf',G.sph,x+.7*s,2.2*s,z+.3*s,s,.9*s,s,col);inst('leaf',G.sph,x-.6*s,2.3*s,z-.4*s,s,.9*s,s,col);
    if(type==='fruit')for(let i=0;i<5;i++){const a=i*1.3;inst('fruit',G.sphL,x+Math.cos(a)*1.3*s,2.3*s+(i%2)*.6,z+Math.sin(a)*1.3*s,.18,.18,.18,0xff5a5a);}}
  INST_TAG=null;occEnd();if(type!=='palm')ROOTS.push([x,z,s]);blobAt(type==='palm'?x+.4*s:x,z,(type==='pine'?1.6:type==='palm'?1.5:1.9)*s);addCircle(x,z,.55*s);}
function signPost(x,z,text,ry){const own=occBegin([occCyl(x,z,1.8,0,2.6)]);cyl(.12,2.2,0x8a5a33,x,1.1,z);textPlane(text,3.4,.9,'#fffbef','#4a3523',null,x,2.1,z+.14,ry||0);if(own)occEnd();addCircle(x,z,.3);}
function dock(x0,x1,z0,z1,top){WALK.push([x0,x1,z0,z1]);box(x1-x0,.2,z1-z0,0xc08a52,(x0+x1)/2,top-.1,(z0+z1)/2);addBox((x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0,top,true);
  for(const[px,pz]of[[x0+.2,z0+.2],[x1-.2,z0+.2],[x0+.2,z1-.2],[x1-.2,z1-.2]])cyl(.12,1.2,0x8f6236,px,top-.5,pz);}
function fishSpot(x,z,type){const r=mk(G.torus,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6}),.8,.8,.8,x,.08,z,null,false);r.rotation.x=Math.PI/2;W.water.push({ring:r});
  INTER.push({x,z,r:3.2,y:1.8,label:'つる',fn:()=>fishing(type),py:0});}

/* clouds: round puffy clusters (flat-ish bottom row of puffs + 2 on top), merged into one mesh each.
   No fog and no world bend (they used to fade into flat pale boxes far away); lavender emissive keeps the shade side soft */
const CLOUDMAT=Toon({color:0xffffff,emissive:0x8c88a8,fog:false});CLOUDMAT.userData.noCurve=true;CLOUDMAT.customProgramCacheKey=()=>'cloudNoCurve';
function cloudGeo(){const parts=[],n=4+(Math.random()*3|0),s=.9+Math.random()*.4,puff=(r,yk,x,y,z)=>{const g=new THREE.SphereGeometry(1,16,12);g.scale(r,r*yk,r*.9);g.translate(x,y,z);parts.push(g);};
  for(let k=0;k<n;k++){const off=k-(n-1)/2,r=(3.4-Math.abs(off)*.55+Math.random()*.5)*s;puff(r,.82,off*2.7*s,r*.82-1.4*s,(Math.random()-.5)*1.6*s);}
  for(let k=0;k<2;k++){const r=(2.6+Math.random()*.6)*s;puff(r,.85,(k-.5)*2.4*s,r*.85+.6*s,(Math.random()-.5)*s);}
  return mergeGeos(parts);}
function buildWorld(){
  /* reserve the athletic / amusement / ruins areas BEFORE random trees are placed (they used to reserve too late, so trees grew inside the ruins) */
  KEEP.push([-76,-32,25],[-72,30,21],[-30,-96,22]);
  FRIENDS.forEach(f=>KEEP.push([f.x,f.z,3.2]));SHARDS.forEach(p=>KEEP.push([p[0],p[2],1.6]));[[70,-40],[95,-70],[90,10],[60,-90],[105,-20]].forEach(c=>KEEP.push([c[0],c[1],4]));
  /* mottled lawn: soft light & darker green blotches (tile wraps seamlessly), plus larger patches from vertex colors */
  const grassT=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#adc27a';c.fillRect(0,0,w,h);
    /* blobs fade to the SAME color at alpha 0 (fading to black-transparent leaves grey fringes) */
    const blob=(x,y,r,col)=>{const c0=col.replace(/[\d.]+\)$/,'0)');for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const g=c.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);g.addColorStop(0,col);g.addColorStop(1,c0);c.fillStyle=g;c.fillRect(x+ox-r,y+oy-r,r*2,r*2);}};
    for(let i=0;i<26;i++)blob(Math.random()*w,Math.random()*h,60+Math.random()*80,'rgba(122,152,80,.36)');
    for(let i=0;i<24;i++)blob(Math.random()*w,Math.random()*h,52+Math.random()*72,'rgba(200,214,146,.4)');
    /* fine grain: tiny soft round dots instead of square pixels */
    for(let i=0;i<1400;i++){c.fillStyle=pick(['rgba(255,255,255,.08)','rgba(90,140,60,.1)']);c.beginPath();c.arc(Math.random()*w,Math.random()*h,1+Math.random()*1.6,0,7);c.fill();}},true);
  grassT.anisotropy=8;
  {const seg=planeUV(360,360,45,45);
   const pos=seg.attributes.position,col=new Float32Array(pos.count*3),a=new THREE.Color(0xfffbe4),b=new THREE.Color(0xf0f0d8),c2=new THREE.Color(0xc4d2a0),tc=new THREE.Color();
   for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);const n=(Math.sin(x*.06)+Math.sin(y*.05+1.3)+Math.sin((x+y)*.11)*.6+Math.sin(x*.27-y*.21)*.8+Math.sin(x*.41+y*.37+2)*.6)/3.4;
     tc.copy(b).lerp(n>0?a:c2,Math.min(1,Math.abs(n)*1.4));col[i*3]=tc.r;col[i*3+1]=tc.g;col[i*3+2]=tc.b;}
   seg.setAttribute('color',new THREE.BufferAttribute(col,3));const gm=new THREE.Mesh(seg,Toon({map:grassT,vertexColors:true}));W.grassMat=gm.material;gm.rotation.x=-Math.PI/2;gm.receiveShadow=true;scene.add(gm);}
  W.pathMat=Toon({map:ROAD_TEX,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const sandMat=Toon({map:noiseTex('#f3dfa6',['#e3c98a','#fff0c8'],700)});
  flat(360,22,sandMat,0,.015,64);
  const rt=waterTex('#5ab9e8'),st=waterTex('#4aa6dc');W.water.push({tex:rt,v:-.12},{tex:st,v:.03});
  flat(6,236,new THREE.MeshPhongMaterial({map:rt,shininess:90,specular:0x9fc8e8,transparent:true,opacity:.93}),40,.03,-44,[1.5,59]);
  flat(460,300,new THREE.MeshPhongMaterial({map:st,shininess:120,specular:0xb0d4f0}),0,.035,222,[115,75]);
  flat(6.8,236,Toon({color:0x6d8f5a}),40,.012,-44,[1,1]);
  flat(360,2.4,Toon({color:0xd9c18a}),0,.02,71.2,[1,1]);
  W.foam=flat(360,1.4,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6}),0,.045,72.4,[1,1]);
  /* roads */
  road(-62,-10,-1.6,1.6);road(10,36.5,-1.6,1.6);road(43.5,112,-1.6,1.6);road(-1.6,1.6,-29,-10);road(-1.6,1.6,10,56);road(-22,22,23.5,28.5);
  road(-61.6,-58.4,-12,-1.6);road(-61.6,-58.4,1.6,12);road(-15.6,-12.4,-76,-1.6);road(-24,-12.4,-77.5,-74.5);road(77.5,80.5,-95,-1.6);road(-27,-25,-2.5,-1.6);
  {const pt=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#d2ab7c';c.fillRect(0,0,w,h);
     for(let i=0;i<40;i++){const x=Math.random()*w,y=Math.random()*h,r=30+Math.random()*60,col=pick(['200,160,112','224,192,146']),g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},.35)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
     for(let i=0;i<1600;i++){c.fillStyle=pick(['rgba(180,140,96,.25)','rgba(236,206,160,.3)','rgba(196,156,108,.2)']);c.beginPath();c.arc(Math.random()*w,Math.random()*h,1.2+Math.random()*2.4,0,7);c.fill();}
     c.globalCompositeOperation='destination-in';const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'#000');g.addColorStop(.66,'#000');g.addColorStop(.86,'rgba(0,0,0,.45)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
   /* subdivided square (not a circle fan) so the rolling-world bend can't sink it under the grass; the texture makes it round */
   const plaza=new THREE.Mesh(new THREE.PlaneGeometry(15,15,10,10),Toon({map:pt,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));plaza.rotation.x=-Math.PI/2;plaza.position.y=.025;plaza.receiveShadow=true;plaza.renderOrder=1;scene.add(plaza);}
  KEEP.push([0,0,13]);
  /* the plaza is now smaller: short dirt paths join the 4 existing roads to its edge */
  road(-10.6,-5.4,-1.6,1.6);road(5.4,10.6,-1.6,1.6);road(-1.6,1.6,-10.6,-5.4);road(-1.6,1.6,5.4,10.6);
  /* park */
  /* chunky fountain: fat round basin with a thick rolled rim, stacked round column, soft upper bowl */
  {const st=0xeae2d2,rim=0xf6f0e4,wc=0x8fd3f2;occBegin([occCyl(0,0,3.7,0,3.1)]);rcyl(3.6,.7,.3,st,0,.35,0);const r1=mk(new THREE.TorusGeometry(3.32,.34,10,48),rim,1,1,1,0,.74,0);r1.rotation.x=Math.PI/2;
   cyl(3.05,.1,wc,0,.74,0,null,false);rcyl(1,.5,.22,st,0,.95,0);rcyl(.58,1.3,.22,rim,0,1.75,0);sph(1.32,.34,1.32,st,0,2.36,0);
   const r2=mk(new THREE.TorusGeometry(1.18,.17,8,32),rim,1,1,1,0,2.66,0);r2.rotation.x=Math.PI/2;cyl(1.05,.06,wc,0,2.67,0,null,false);sph(.26,.26,.26,rim,0,2.8,0);occEnd();addCircle(0,0,3.8);blobAt(0,0,4.7);}
  W.drops=new THREE.InstancedMesh(G.sphL,Toon({color:0xbfe9ff,emissive:0x3a7ca5}),48);W.drops.frustumCulled=false;scene.add(W.drops);
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,x=Math.cos(a)*7.6,z=Math.sin(a)*7.6,g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=-a-Math.PI/2;scene.add(g);occBegin([occCyl(x,z,1.3,0,1.45)]);rbox(2.4,.34,.82,.15,0xe0a066,0,.6,0,g);rbox(2.4,.66,.28,.13,0xe0a066,0,1.08,-.32,g).rotation.x=-.12;rbox(.42,.48,.72,.16,0xa8703f,-.86,.24,0,g);rbox(.42,.48,.72,.16,0xa8703f,.86,.24,0,g);occEnd();addCircle(x,z,1.2);blobAt(x,z,1.5);}
  /* park lamps: 3 (was 6), at angles clear of the benches (45°+90°k), the 4 paths and the notice board (135°) */
  [20,160,290].forEach(d=>{const a=d*Math.PI/180;toyLamp(Math.cos(a)*9.6,Math.sin(a)*9.6,2.6);});
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.31;if(Math.abs(Math.sin(a*2))<.25)continue;tree(Math.cos(a)*14,Math.sin(a)*14,'sakura',1);}
  /* notice board: moved ~1.1 m outward from (-7,7) so it no longer touches the bench */
  {const BX=-7.8,BZ=7.8;const g=new THREE.Group();g.position.set(BX,0,BZ);g.rotation.y=Math.PI*.75;scene.add(g);occBegin([occCyl(BX,BZ,1.3,0,2.95)]);box(.15,2.2,.15,0x7a4f2a,-1,1.1,0,g);box(.15,2.2,.15,0x7a4f2a,1,1.1,0,g);box(2.4,1.4,.12,0xb07a45,0,1.7,0,g);box(.7,.8,.02,0xffffff,-.5,1.75,.08,g);box(.6,.6,.02,0xfff3b0,.45,1.65,.08,g);textPlane('けいじ[板|ばん]',1.8,.45,'#fffbef','#4a3523',g,0,2.65,.05);occEnd();addCircle(BX,BZ,1.1);
   INTER.push({x:BX,z:BZ,r:2.8,y:3.4,label:'みる',fn:()=>openMissions()});}
  /* school */
  occBegin([occBox(-9.8,9.8,-40,-28,13.2)]); /* school + clock tower fade together */
  const sch=building({x:0,z:-34,w:18,d:10,h:6,wall:0xfff1d6,roof:0xe0675a,label:'どんぐり [学|がっ][校|こう]',win:4,toy:true});
  rbox(3.6,4.2,3.6,.6,0xfff1d6,0,8,-34);rbox(4.2,.5,4.2,.24,0xffffff,0,10.1,-34);mk(G.cone,0xe0675a,2.9,2.4,2.9,0,11.5,-34);sph(.36,.36,.36,0xffd45c,0,12.8,-34);
  W.clockTex=canvasTex(256,256,()=>{});const cf=new THREE.Mesh(new THREE.CircleGeometry(1.25,32),new THREE.MeshBasicMaterial({map:W.clockTex}));cf.position.set(0,8.3,-32.17);scene.add(cf);occAdd(cf);occEnd();drawSchoolClock();
  flat(30,15,Toon({map:noiseTex('#e9d7b0',['#dcc596'],300)}),0,.018,-20.5);KEEP.push([0,-21,12]);
  rcyl(.42,.4,.15,0xd9c6a8,11,.2,-24);rcyl(.17,6,.08,0xeeeeee,11,3,-24);sph(.26,.26,.26,0xffd45c,11,6.1,-24);W.flag=rbox(1.6,1,.14,.06,0x64b5f6,11.95,5.4,-24);addCircle(11,-24,.45);
  rcyl(.2,1.75,.1,0xffffff,-12,.87,-19);rcyl(.2,1.75,.1,0xffffff,-12,.87,-15);mk(roundCylGeo(.2,4.4,.1),0xffffff,1,1,1,-12,1.65,-17).rotation.x=Math.PI/2;addBox(-12,-17,.5,4.4);
  doorInter('school',sch.door,1);
  /* shops */
  const SH=[{id:'shopFurn',x:-14,label:'[家|か][具|ぐ]や',wall:0xffe6b8,roof:0xe4685c,aw:['#e4685c','#fff']},{id:'shopCloth',x:0,label:'[洋|よう][服|ふく][屋|や]',wall:0xe8f0ff,roof:0x5a8ed6,aw:['#5a8ed6','#fff']},{id:'shopZakka',x:14,label:'[雑|ざっ][貨|か][屋|や]',wall:0xe0fff0,roof:0x3daf88,aw:['#3daf88','#fff']}];
  SH.forEach(s=>{occBegin([occBox(s.x-5.3,s.x+5.3,28.6,38.5,7.4)]);const b=building({x:s.x,z:34,w:9,d:7,h:4.6,wall:s.wall,roof:s.roof,label:s.label,face:-1,win:2});doorInter(s.id,b.door,-1);
    const t=canvasTex(64,16,(c,w,h)=>{for(let i=0;i<8;i++){c.fillStyle=s.aw[i%2];c.fillRect(i*8,0,8,h);}});const aw=mk(G.box,Toon({map:t}),6,.12,1.8,s.x,3.3,29.8);aw.rotation.x=-.35;occEnd();});
  cyl(.1,5,0x8a5a33,-22.5,2.5,26);cyl(.1,5,0x8a5a33,22.5,2.5,26);addCircle(-22.5,26,.3);addCircle(22.5,26,.3);
  for(let x=-22;x<=22;x+=1.2){const y=4.6-.9*(1-(x/22)**2);inst('flag',G.coneDown,x,y,26,.22,.42,.06,pick([0xff6f91,0xffd45c,0x6dbb58,0x64b5f6,0xb39ddb]),0,false);}
  /* homes */
  const home=building({x:-26,z:-6,w:8,d:7,h:4.5,wall:0xffe0ea,roof:0x5a8ed6,label:'[私|わたし]の [家|いえ]',chim:1});
  doorInter('home',home.door,1);
  box(.5,1,.4,0xef5350,-21,.9,-1.8);cyl(.06,.6,0x8a5a33,-21,.3,-1.8);
  [['hMoko',26,-8,'モコの [家|いえ]',0xf2e2ff,0x9a6fd6],['hMii',26,12,'ミィの [家|いえ]',0xe0fff0,0x3daf88],['hPochi',-26,14,'ポチの [家|いえ]',0xfff3c4,0xf2a53a]].forEach(([id,x,z,l,w,r])=>{const b=building({x,z,w:7,d:6,h:4,wall:w,roof:r,label:l,chim:1});doorInter(id,b.door,1);
    box(.45,.9,.35,0x64b5f6,x+2.4,.95,z+4.4);cyl(.06,.6,0x8a5a33,x+2.4,.3,z+4.4);addCircle(x+2.4,z+4.4,.35);});
  /* street lamps & fences */
  [[-30,2.6],[-45,2.6],[20,-2.6],[30,2.6],[2.6,52],[2.6,40],[-2.6,-18],[-11,-30],[-11,-55],[60,2.6],[90,-2.6],[-58,-6],[-62,8]].forEach(([x,z])=>toyLamp(x,z,2.8));
  for(let x=-24;x<=-14;x+=1.25){inst('fence',G.box,x,.45,-1.9,.12,.9,.12,0xffffff);}inst('fence',G.box,-19,.7,-1.9,10,.1,.08,0xffffff);
  /* extra streetscape (town.js) — before the random trees so they grow around it */
  buildTown();
  /* river, bridge, docks */
  box(9,.3,5,0xc08a52,40,.15,0);box(9,.6,.2,0x8f6236,40,.6,2.45);box(9,.6,.2,0x8f6236,40,.6,-2.45);WALK.push([35.5,44.5,-2.3,2.3]);addBox(40,0,9,4.6,.3,true);
  for(let z=-118;z<72;z+=3.2){inst('rock',G.dodec,36.4,.15,z+Math.random(),.45,.3,.45,0x9e9a92);inst('rock',G.dodec,43.6,.15,z+Math.random(),.45,.3,.45,0xa8a397);}
  dock(34,39.5,-21,-19,.25);fishSpot(38.8,-20,'river');KEEP.push([36,-20,4]);
  dock(40.5,46,39,41,.25);fishSpot(41.2,40,'river');KEEP.push([44,40,4]);
  dock(-41,-39,70,78,.25);fishSpot(-40,77.2,'sea');dock(9,11,70,78,.25);fishSpot(10,77.2,'sea');
  /* island */
  cyl(16,1.2,0xf3dfa6,70,-.55,108);cyl(9,.1,0x8ccf6e,70,.05,108,null,false);
  dock(68.5,71.5,70,93.5,.25);
  [[60,100],[78,100],[65.5,119],[80,114],[74,120],[58,108],[83,106]].forEach(([x,z])=>tree(x,z,'palm',.9)); /* (62,116) moved: it stood inside the lighthouse */
  occBegin([occCyl(62,116,1.6,0,9.6)]);for(let i=0;i<5;i++){cyl(1.5-i*.12,1.6,i%2?0xffffff:0xef5350,62,.8+i*1.6,116+0);} mk(G.sph,ME(0xfff59d),.8,.8,.8,62,8.8,116);occEnd();addCircle(62,116,1.6);
  W.chests.island=fb('chest');W.chests.island.scale.setScalar(1.6);W.chests.island.position.set(77,0,113);scene.add(W.chests.island);addCircle(77,113,.9);
  INTER.push({x:77,z:113,r:2.6,y:2.4,label:'[開|あ]ける',fn:()=>openChest('island')});
  dock(84,91.5,107,109,.25);fishSpot(90.8,108,'island');
  /* forest */
  for(let i=0;i<400;i++){const x=48+Math.random()*72,z=-118+Math.random()*168;if(z>50)continue;if(freeSpot(x,z,1.8))tree(x,z,Math.random()<.25?'pine':Math.random()<.6?'autumn':'round',.9+Math.random()*.5);}
  /* village decor */
  for(let i=0;i<260;i++){const x=-118+Math.random()*152,z=-118+Math.random()*170;if(freeSpot(x,z,2.4))tree(x,z,Math.random()<.15?'fruit':Math.random()<.3?'autumn':Math.random()<.25?'pine':'round',.9+Math.random()*.5);}
  for(let i=0;i<160;i++){const x=-118+Math.random()*236,z=-118+Math.random()*170;if(freeSpot(x,z,1)){inst('bush',G.sph,x,.45,z,1,.75,1,pick([0x8cc46a,0x7db862,0x9ccb72,0xffc04d]));addCircle(x,z,.8);}}
  for(let i=0;i<10;i++){const x=-60+Math.random()*120,z=57+Math.random()*12;if(Math.abs(x-40)>5&&Math.abs(x-70)>4)tree(x,z,'palm',.8);}
  /* mountains */
  for(let i=0;i<46;i++){const t=i/46;let x,z;if(t<.33){x=-140;z=-140+t*3*200;}else if(t<.66){x=-140+(t-.33)*3*280;z=-140;}else{x=140;z=-140+(t-.66)*3*200;}
    x+=(Math.random()-.5)*16;z+=(Math.random()-.5)*16;const r=14+Math.random()*14,h=18+Math.random()*24;inst('mount',G.coneL,x,h/2,z,r,h,r,pick([0x9ccf8a,0xb0d890,0xe8c27a]),Math.random(),false);inst('snow',G.coneL,x,h*.86,z,r*.28,h*.28,r*.28,0xffffff,0,false);}
  /* clouds */
  for(let i=0;i<14;i++){const m=new THREE.Mesh(cloudGeo(),CLOUDMAT);m.position.set(-200+Math.random()*400,40+Math.random()*20,-160+Math.random()*260);m.rotation.y=(Math.random()-.5)*.6;scene.add(m);W.clouds.push(m);}
  /* signs */
  signPost(-56,3,'アスレチック・[遊|ゆう][園|えん][地|ち]');signPost(-10,-4,'[遺|い]せき（ぼうけん）');signPost(33,-4,'はしの むこうは [森|もり]');signPost(3,50,'[砂|すな]はま');
  buildAthletic();buildAmuse();buildRuins();buildFences();buildCollect();decoratePlaza();scatterClumps();buildInst();buildGlow();buildBlobs();buildPetalGround();
}
function drawSchoolClock(){const c=W.clockTex.image.getContext('2d');const d=new Date(),h=d.getHours(),m=d.getMinutes();c.fillStyle='#fffbef';c.fillRect(0,0,256,256);c.strokeStyle='#7a4f2a';c.lineWidth=14;c.beginPath();c.arc(128,128,118,0,7);c.stroke();
  c.fillStyle='#4a3523';c.font='900 30px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;c.fillText(i,128+Math.sin(a)*88,128-Math.cos(a)*88);}
  const ha=((h%12)+m/60)/12*Math.PI*2,ma=m/60*Math.PI*2;c.lineCap='round';c.lineWidth=12;c.beginPath();c.moveTo(128,128);c.lineTo(128+Math.sin(ha)*50,128-Math.cos(ha)*50);c.stroke();c.strokeStyle='#ff6f91';c.lineWidth=8;c.beginPath();c.moveTo(128,128);c.lineTo(128+Math.sin(ma)*78,128-Math.cos(ma)*78);c.stroke();W.clockTex.needsUpdate=true;}
function buildAthletic(){const cx=-70,cz=-25;KEEP.push([-76,-32,25]); /* sand ground + the other playground equipment: athletic.js */
  /* 12 pillars spiral up less than one full turn (step .483 rad ≈ 1/13 turn, ~1.2 m gaps) — at the old .62 step the last two
     wrapped around onto the first two, burying the low starting platforms inside 7.7 / 8.4 m pillars */
  const P=[];for(let i=0;i<12;i++){const a=i*.483;P.push([cx+Math.cos(a)*8,cz+Math.sin(a)*8,.7+i*.7,2.6]);}P.push([cx+Math.cos(5.6)*4.5,cz+Math.sin(5.6)*4.5,8.85,2.6]);P.push([cx,cz,9.3,4]);
  P.forEach(([x,z,top,w],i)=>{box(w,top-.2,w,0xb88a5a,x,(top-.2)/2,z);box(w+.15,.22,w+.15,[0xff8fab,0xffd45c,0x81c784,0x64b5f6][i%4],x,top-.11,z);addBox(x,z,w,w,top,true);});
  /* the first platform (top .7) is the way in: two walk-up steps on its outer (east) side + a "start" label.
     (the platforms nearest the entrance are 1.4 / 2.1 high — too high to jump onto from the ground) */
  {const[x0,z0]=P[0];[[.25,x0+2.2],[.5,x0+1.6]].forEach(([t,x],k)=>{box(.6,t,1.4,k?0xffe58a:0xffd45c,x,t/2,z0);addBox(x,z0,.6,1.4,t,true);});
   const s=labelSprite('ここから のぼろう','#fffbef','#d0661f',.6);s.position.set(x0+1.3,2.1,z0);scene.add(s);}
  cyl(.08,3,0xeeeeee,cx,10.8,cz);box(1.4,.9,.04,0xff6f91,cx+.75,11.8,cz);
  [1,3,5,7,9,11,12,13].forEach(i=>{const p=P[i];const m=mk(G.star,ME(0xffc400),.55,.55,.55,p[0],p[2]+1,p[1]);W.stars.push({m,x:p[0],y:p[2]+1,z:p[1],got:false});});
  signPost(cx+10,cz+12,'[星|ほし]を [全|ぜん][部|ぶ] [集|あつ]めよう！');buildPlayground();}
function buildAmuse(){const cx=-72,cz=30;KEEP.push([cx,cz,21]);
  /* ferris */
  const fw=new THREE.Group();fw.position.set(-86,0,34);scene.add(fw);
  [-1.6,1.6].forEach(x=>{beam(new V3(x,0,-4.5),new V3(x,10.5,0),.22,0xeeeeee,fw);beam(new V3(x,0,4.5),new V3(x,10.5,0),.22,0xeeeeee,fw);});
  const wheel=new THREE.Group();wheel.position.y=10.5;fw.add(wheel);W.fw=wheel;
  [-.6,.6].forEach(x=>{const t=new THREE.Mesh(new THREE.TorusGeometry(8.5,.16,8,72),M(0xff8fab));t.position.x=x;t.rotation.y=Math.PI/2;t.castShadow=true;wheel.add(t);});cyl(.5,1.6,0xffffff,0,0,0,wheel).rotation.z=Math.PI/2;
  const cols=[0xef5350,0xffca28,0x66bb6a,0x42a5f5,0xab47bc,0xff7043,0x26c6da,0xec407a];
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,y=Math.sin(a)*8.5,z=Math.cos(a)*8.5;beam(new V3(0,0,0),new V3(0,y,z),.08,0xffffff,wheel);const g=new THREE.Group();g.position.set(0,y,z);wheel.add(g);const b=new THREE.Group();b.position.y=-1.1;g.add(b);box(1.6,1.1,1.6,cols[i],0,0,0,b);box(1.3,.5,1.3,0xbfe9ff,0,.4,0,b,false);mk(G.cone4,cols[i],1.2,.6,1.2,0,.95,0,b).rotation.y=Math.PI/4;W.gond.push(g);
    mk(G.sphL,ME(0xfff59d),.18,.18,.18,0,Math.sin(a+.4)*8.5,Math.cos(a+.4)*8.5,wheel,false);}
  addBox(-86,34,4,10);
  box(2,2.2,2,0xff8fab,-80,1.1,28);textPlane('[観|かん][覧|らん][車|しゃ]',2.6,.7,'#fffbef','#4a3523',null,-80,2.6,29.05);addCircle(-80,28,1.3);
  INTER.push({x:-80,z:28,r:2.8,y:3.6,label:'[乗|の]る',fn:()=>rideFerris()});
  /* carousel */
  const ca=new THREE.Group();ca.position.set(-64,0,22);scene.add(ca);cyl(4.2,.5,0xffc1d6,0,.25,0,ca);cyl(.35,4.5,0xffd54f,0,2.6,0,ca);
  const rt=canvasTex(64,8,(c)=>{for(let i=0;i<8;i++){c.fillStyle=i%2?'#fff':'#ff6f91';c.fillRect(i*8,0,8,8);}});mk(G.cone,Toon({map:rt}),4.8,2,4.8,0,5.6,0,ca);sph(.35,.35,.35,0xffd54f,0,6.7,0,ca);
  const spin=new THREE.Group();ca.add(spin);W.carousel=spin;
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=Math.cos(a)*3,z=Math.sin(a)*3;cyl(.06,4,0xffd54f,x,2.5,z,spin);const h=new THREE.Group();h.position.set(x,1.3,z);h.rotation.y=-a;spin.add(h);const c=[0xffffff,0xfff3b0,0xd1c4e9][i%3];sph(.7,.35,.3,c,0,0,0,h);sph(.25,.3,.22,c,.0,.35,.0,h).position.set(0,.35,0);box(.15,.5,.15,c,0,.5,.35,h).position.set(0,.4,.0);W.horses.push(h);}
  addCircle(-64,22,4.4);INTER.push({x:-64,z:27.2,r:2.6,y:3,label:'[遊|あそ]ぶ',fn:()=>speedGame()});textPlane('スピードチャレンジ',3.4,.7,'#fffbef','#4a3523',null,-64,7.6,22);
  /* mole tent */
  const st=canvasTex(64,16,(c)=>{for(let i=0;i<8;i++){c.fillStyle=i%2?'#fff':'#5a8ed6';c.fillRect(i*8,0,8,16);}});
  mk(G.box,Toon({map:st}),4,2.4,3,-58,1.2,40);mk(G.cone4,0x5a8ed6,3,2,3,-58,3.4,40).rotation.y=Math.PI/4;textPlane('もぐらたたき',3,.7,'#fffbef','#4a3523',null,-58,1.9,41.55);addBox(-58,40,4.2,3.2);
  INTER.push({x:-58,z:42.6,r:2.4,y:3,label:'[遊|あそ]ぶ',fn:()=>moleGame()});
  /* cups */
  const cups=new THREE.Group();cups.position.set(-80,0,16);scene.add(cups);cyl(4,.3,0xb3e5fc,0,.15,0,cups);W.cups=new THREE.Group();cups.add(W.cups);
  [0xff8fab,0xffd54f,0x81c784].forEach((c,i)=>{const a=i/3*Math.PI*2;cyl(1,.9,c,Math.cos(a)*2.2,.75,Math.sin(a)*2.2,W.cups);});addCircle(-80,16,4.2);
  /* arch & balloons */
  [-63.5,-56.5].forEach(x=>cyl(.4,5,0xff8fab,x,2.5,12.5));box(8,1.2,.6,0xffd54f,-60,5.2,12.5);textPlane('[遊|ゆう][園|えん][地|ち]',4.5,1,'#fffbef','#ff6f91',null,-60,5.2,12.85);addCircle(-63.5,12.5,.5);addCircle(-56.5,12.5,.5);
  for(let i=0;i<7;i++){const x=-66+Math.random()*2,z=16+Math.random()*2;mk(G.sph,pick([0xef5350,0xffca28,0x42a5f5,0xab47bc,0x66bb6a]),.45,.55,.45,x,4+Math.random()*1.2,z);}
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;tree(cx+Math.cos(a)*18,cz+Math.sin(a)*18,'sakura',.9);}}
function buildRuins(){const cx=-30,cz=-96;KEEP.push([cx,cz,22]);const stone=0x9e9a8c;
  flat(20,40,Toon({map:noiseTex('#b7b2a4',['#a7a294','#c8c3b5'],600)}),cx,.022,cz,[5,10]);
  box(1,3.6,34,stone,-36.5,1.8,-97);addBox(-36.5,-97,1,34);box(1,3.6,34,stone,-23.5,1.8,-97);addBox(-23.5,-97,1,34);box(14,3.6,1,stone,-30,1.8,-114.5);addBox(-30,-114.5,14,1);
  [-80,-114].forEach(z=>[-37,-23].forEach(x=>{box(1.6,5,1.6,0xb0ab9d,x,2.5,z);mk(G.sph,ME(0xff9800),.3,.4,.3,x,5.3,z);addCircle(x,z,1);glowAt(x,z,3.6);}));
  [-88,-97,-106].forEach((z,i)=>{const m=box(12,3.4,.8,0x8d8a7f,-30,1.7,z);const rune=textPlane(['ひ','か','り'][i],1.2,1.2,'#5c6bc0','#fff59d',null,-30,2,z+.42);const b=addBox(-30,z,12,.9);
    W.gates.push({m,rune,b,z,open:false,anim:0});INTER.push({x:-30,z:z+2,r:2.8,y:4,label:'とびら',fn:()=>gateQuiz(i),cond:()=>!W.gates[i].open});});
  W.chests.ruins=fb('chest');W.chests.ruins.scale.setScalar(1.8);W.chests.ruins.position.set(-30,0,-111.5);scene.add(W.chests.ruins);addCircle(-30,-111.5,1);
  INTER.push({x:-30,z:-111.5,r:2.8,y:2.6,label:'[開|あ]ける',fn:()=>openChest('ruins')});
  /* rubble: 14 blocks, each only where it touches no wall, pillar, chest or other block */
  const free=(x,z)=>!circles.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1.1)&&!boxes.some(b=>x>b.x0-1.1&&x<b.x1+1.1&&z>b.z0-1.1&&z<b.z1+1.1)&&!blocked(x,z);
  for(let i=0,n=0;i<300&&n<14;i++){const a=Math.random()*Math.PI*2,r=13+Math.random()*6,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(!free(x,z))continue;const h=1+Math.random()*3;box(1.2,h,1.2,0xb0ab9d,x,h/2,z);addCircle(x,z,.9);n++;}}
function buildFences(){REG.forEach(r=>{const g=new THREE.Group();scene.add(g);W.fences[r.id]=g;
  if(r.c){const[cx,cz,R]=r.c;const t=new THREE.Mesh(new THREE.TorusGeometry(R,.08,6,96),M(0xffd45c));t.position.set(cx,.9,cz);t.rotation.x=Math.PI/2;g.add(t);for(let i=0;i<40;i++){const a=i/40*Math.PI*2;cyl(.12,1.2,0x8a5a33,cx+Math.cos(a)*R,.6,cz+Math.sin(a)*R,g);}}
  else{const[x0,x1,z0]=r.rect;box(x1-x0+2,1,.3,0xffd45c,(x0+x1)/2,.6,z0,g);}
  cyl(.12,2.4,0x8a5a33,r.sign[0],1.2,r.sign[1],g);const s=labelSprite(`🔒 レベル${r.lv}で [開|ひら]くよ`,'#fffbef','#c94a6d',1.3);s.position.set(r.sign[0],3,r.sign[1]);g.add(s);});}
function buildCollect(){
  SHARDS.forEach((p,i)=>{const m=mk(G.oct,ME(0xffe066),.32,.48,.32,p[0],p[1],p[2]);W.shards.push({m,x:p[0],y:p[1],z:p[2],i});});
  for(let i=0;i<5;i++)W.bugs.push(makeBug(pick([[70,-40],[95,-70],[90,10],[60,-90],[105,-20]])));
  for(let i=0;i<6;i++)W.shells.push(makeShell());}
function makeBug(c){const g=new THREE.Group();scene.add(g);const col=pick([0xff9ac1,0xffd45c,0x9fd5ff,0xc7a6ff,0xffffff]);
  sph(.06,.06,.22,0x4a3523,0,0,0,g,false);const wm=Toon({color:col,side:THREE.DoubleSide});
  const wl=new THREE.Group(),wr=new THREE.Group();g.add(wl,wr);const pl=new THREE.Mesh(new THREE.PlaneGeometry(.4,.32),wm);pl.position.x=-.2;pl.rotation.x=-Math.PI/2;wl.add(pl);const pr=pl.clone();pr.position.x=.2;wr.add(pr);
  const sp=bubbleSprite('!','#fff3b0');sp.scale.set(.5,.5,1);sp.position.y=.7;g.add(sp);
  const b={g,wl,wr,cx:c[0],cz:c[1],a:Math.random()*6,on:true,t:Math.random()*5};g.position.set(c[0],1.4,c[1]);return b;}
function makeShell(){const g=new THREE.Group();scene.add(g);let x,z;for(let k=0;k<50;k++){x=-60+Math.random()*120;z=57+Math.random()*12;if(Math.abs(x-40)>5)break;}
  g.position.set(x,0,z);sph(.3,.14,.24,pick([0xffc1d3,0xfff3e0,0xffd8b0]),0,.08,0,g);const sp=mk(G.oct,ME(0xffffff),.1,.18,.1,0,.5,0,g,false);return {g,sp,on:true};}
