'use strict';
/* ===== camera & "rolling log" world: tweak these numbers to adjust the look ===== */
const DEG=Math.PI/180;
const CAM_FOV=32;                 // がかく（たての ど）。せまいほど はしの ものが ななめに ゆがまない（まえは 50）
const FOV_K=Math.tan(25*DEG)/Math.tan(CAM_FOV/2*DEG); // がかくを せまくした ぶん カメラを とおざける ばいりつ ≒ 1.63（うつる はんいは まえと おなじ）
const CAM_PITCH=50*DEG;           // はじめる ときの みおろす かくど（やく 50ど）。ドラッグの はんいは したの MIN/MAX
const CAM_PITCH_MIN=-25*DEG,CAM_PITCH_MAX=80*DEG; // ドラッグで うごかせる はんい（-25〜80ど）。0ど より したは「みあげる」はんい
const CAM_LOOKUP_MAX=7*DEG;       // いちばん したに したとき、うえを みあげる かくど（キャラの あしもとまで がめんに はいる おおきさ）
const CAM_EYE_LOW=.45;            // みあげる ときの カメラの たかさ（じめん すれすれ）
const CAM_LOW_NEAR=.55;           // みあげる ときは きょりを この ばいりつまで ちかづける
const CAM_DIST=Math.hypot(10,8)*FOV_K;  // プレイヤーとの きょり ≒ 20.8（12.8 × 1.63）
const CAM_DIST_MIN=6.5*FOV_K,CAM_DIST_MAX=20*FOV_K; // ズームの はんい ≒ 10.6〜32.5（まえは 14.6〜27.7）
const TITLE_PITCH=40*DEG;         // タイトルがめんの かくど（ドラッグの はんいとは べつ）
const CAM_AUTO_RATE=1.6;          // アスレチックで カメラが プレイヤーの うしろへ まわりこむ はやさ（0で しない）
const CAM_AUTO_RIDE_RATE=3;       // のりもの（すべりだい・ジップライン・ブランコ）の ときの まわりこむ はやさ
const CAM_AUTO_WAIT=1.5;          // じぶんで カメラを ドラッグした あと、じどうで まわりはじめるまでの じかん（びょう）
const RIDE_FP=true;               // のりものに のっている あいだは キャラの めせん（いちにんしょう）に する（false で いままでどおり）
const FP_FOV=70;                  // いちにんしょうの ときの がかく（ひろいほど スピード かんが でる）
const FP_EYE=1.35;                // いちにんしょうの めの たかさ（あしもと から）
const SHADOW_STRENGTH=.6;       // たいようの かげの こさ（1で もとの こさ、0で かげなし）
camera.fov=CAM_FOV;camera.updateProjectionMatrix();
/* softer sun shadows: blend every shadow lookup toward "lit" so shade keeps 40% of the sun (reads light lavender, not dark) */
(()=>{const k='shadowmap_pars_fragment',src=THREE.ShaderChunk[k];if(!src.includes('return shadow;'))console.warn('shadow chunk not patched');
  THREE.ShaderChunk[k]=src.split('return shadow;').join(`return mix(1.0, shadow, ${SHADOW_STRENGTH.toFixed(2)});`);})();
const OCC_MIN_ALPHA=.3;   // カメラと プレイヤーの あいだを さえぎる ものの こさ（0で みえない、1で すけない）
const OCC_FADE_TIME=.2;   // すける ／ もどる のに かかる じかん（びょう）
const OCC_PAD=.15;        // さえぎり はんていを これだけ ひろげる(m)
const OCC_NEAR=4;         // カメラから この きょり(m) いないの ものも すかす
const CURVE_STRENGTH=.009;      // ちめんの まがりの つよさ（0で まったいら。おおきいほど とおくが はやく しずむ）
const CURVE_START_PAD=1.5;      // プレイヤーより これだけ さきから まげはじめる
const CURVE_CULL_MARGIN=14;     // まげて みえるように なった ものが きえないように する よゆう
const FOG_NEAR_PAD=12,FOG_FAR_PAD=40; // きり： カメラきょり＋この あたいで うすく → きえる
/* bend in view space along the camera's horizontal forward axis only (a cylinder, like a rolling log).
   uCurve.x = strength, uCurve.y = forward distance from the camera where bending starts. Shadows are unbent. */
const CURVE={value:new THREE.Vector2(CURVE_STRENGTH,6)};
(()=>{const bend=`
#if !defined(DEPTH_PACKING) && !defined(NO_CURVE)
 { vec3 cUp = viewMatrix[1].xyz; vec3 cF = normalize(vec3(0.,0.,-1.) + cUp*cUp.z);
   float cD = max(0., dot(mvPosition.xyz, cF) - uCurve.y); mvPosition.xyz -= cUp * (uCurve.x * cD * cD); }
#endif
 gl_Position = projectionMatrix * mvPosition;`;
  THREE.ShaderChunk.project_vertex=THREE.ShaderChunk.project_vertex.replace('gl_Position = projectionMatrix * mvPosition;',bend);
  THREE.ShaderLib.sprite.vertexShader=THREE.ShaderLib.sprite.vertexShader.replace('gl_Position = projectionMatrix * mvPosition;',bend);
  // things pushed down into view by the bend must not be frustum-culled: loosen the top plane a little
  const sfp=THREE.Frustum.prototype.setFromProjectionMatrix;THREE.Frustum.prototype.setFromProjectionMatrix=function(m){sfp.call(this,m);this.planes[3].constant+=CURVE_CULL_MARGIN;return this;};})();
function addCurve(sh,mat){if(!/<project_vertex>|projectionMatrix \* mvPosition/.test(sh.vertexShader))return;sh.uniforms.uCurve=CURVE;const flat=mat&&(mat.isMeshDepthMaterial||mat.isMeshDistanceMaterial||mat.userData.noCurve);
  sh.vertexShader=(flat?'#define NO_CURVE\n':'')+'uniform vec2 uCurve;\n'+sh.vertexShader;}
/* ===== see-through: a thing fades (smoothly, as a whole object) only when
   1) on screen it overlaps the player AND is in front of the player — tested with sight lines from the camera to a 3×3 grid
      over the player's body (feet → head, left → right), so it must actually cover part of the player, or
   2) it is within OCC_NEAR m of the camera. Everything else draws normally. =====
   Volumes & parts come from world.js (OCCS). While an object fades it is hidden and drawn by "ghost" copies instead:
   first a depth-only pass (so its own parts never show through each other), then the color pass at lowered opacity.
   The ghosts cast the same shadow as the original, so shadows never change. */
const _om=new THREE.Matrix4(),_oz=new THREE.Matrix4().makeScale(0,0,0),OCC_ON=[];let occT=0;
/* does segment a→b pass through volume v (vertical cylinder or box), grown by OCC_PAD? */
function occSlab(p,d,lo,hi,t){if(Math.abs(d)<1e-9)return p>=lo&&p<=hi;let a=(lo-p)/d,b=(hi-p)/d;if(a>b){const s=a;a=b;b=s;}if(a>t[0])t[0]=a;if(b<t[1])t[1]=b;return t[0]<=t[1];}
const _ot=[0,1];
function occSeg(v,ax,ay,az,bx,by,bz){const t=_ot;t[0]=0;t[1]=1;if(!occSlab(ay,by-ay,v.y0,v.y1+OCC_PAD,t))return false;const dx=bx-ax,dz=bz-az;
  if(v.c){const fx=ax-v.x,fz=az-v.z,r=v.r+OCC_PAD,A=dx*dx+dz*dz,B=fx*dx+fz*dz,C=fx*fx+fz*fz-r*r;if(A<1e-9)return C<=0;
    const D=B*B-A*C;if(D<0)return false;const s=Math.sqrt(D);return Math.max(t[0],(-B-s)/A)<=Math.min(t[1],(-B+s)/A);}
  return occSlab(ax,dx,v.x0-OCC_PAD,v.x1+OCC_PAD,t)&&occSlab(az,dz,v.z0-OCC_PAD,v.z1+OCC_PAD,t);}
/* ghost material: same shader (curve, sway) as the original, transparent */
function occMat(src,pre){const m=src.clone(),own=k=>Object.prototype.hasOwnProperty.call(src,k);if(own('onBeforeCompile'))m.onBeforeCompile=src.onBeforeCompile;if(own('customProgramCacheKey'))m.customProgramCacheKey=src.customProgramCacheKey;
  m.transparent=true;if(pre){m.colorWrite=false;m.depthWrite=true;}else m.depthWrite=false;m.userData.src=src;return m;}
function occBuild(o){const g=o.g={list:[],mats:[],saved:{},by:{}},mc=new Map();
  const mat=(src,pre)=>{const k=src.uuid+(pre?'p':'c');if(!mc.has(k)){const m=occMat(src,pre);mc.set(k,m);if(!pre)g.mats.push(m);}return mc.get(k);};
  /* depth pre-pass ghost (skipped for already-transparent things like sign labels) + color ghost */
  const put=(make,src,cast,recv)=>{if(!src.transparent){const p=make(mat(src,true));p.userData.pre=1;g.list.push(p);}
    const c=make(mat(src,false));c.castShadow=cast;c.receiveShadow=recv;g.list.push(c);};
  o.meshes.forEach(m=>{m.updateWorldMatrix(true,false);put(mt=>{const x=new THREE.Mesh(m.geometry,mt);x.matrixAutoUpdate=false;x.matrix.copy(m.matrixWorld);x.matrixWorldNeedsUpdate=true;x.frustumCulled=false;return x;},m.material,m.castShadow,m.receiveShadow);});
  o.insts.forEach(([k,i])=>(g.by[k]||(g.by[k]=[])).push(i));
  for(const k in g.by){const im=INST[k].im,ids=g.by[k];if(!im)continue;g.saved[k]=ids.map(i=>{im.getMatrixAt(i,_om);return _om.clone();});
    put(mt=>{const x=new THREE.InstancedMesh(im.geometry,mt,ids.length);ids.forEach((i,j)=>{x.setMatrixAt(j,g.saved[k][j]);if(im.instanceColor)x.setColorAt(j,tmpC.fromArray(im.instanceColor.array,i*3));});x.frustumCulled=false;return x;},im.material,im.castShadow,im.receiveShadow);}}
/* swap an object between its normal parts and its ghosts */
function occShow(o,on){if(on&&!o.g)occBuild(o);const g=o.g;o.on=on;g.list.forEach(x=>on?scene.add(x):scene.remove(x));o.meshes.forEach(m=>m.visible=!on);
  for(const k in g.saved){const im=INST[k].im;g.by[k].forEach((i,j)=>im.setMatrixAt(i,on?_oz:g.saved[k][j]));im.instanceMatrix.needsUpdate=true;}
  if(on)OCC_ON.push(o);else OCC_ON.splice(OCC_ON.indexOf(o),1);}
/* is volume v within OCC_NEAR of point c? */
function occNear(v,c){let dx,dz=0;if(v.c)dx=Math.max(0,Math.hypot(c.x-v.x,c.z-v.z)-v.r);else{dx=Math.max(v.x0-c.x,0,c.x-v.x1);dz=Math.max(v.z0-c.z,0,c.z-v.z1);}
  const dy=Math.max(v.y0-c.y,0,c.y-v.y1);return dx*dx+dz*dz+dy*dy<OCC_NEAR*OCC_NEAR;}
const _cr=new THREE.Vector3(),OCC_PTS=Array.from({length:9},()=>new THREE.Vector3());
/* per frame: find what covers the player or sits right at the camera, ease each object's opacity over OCC_FADE_TIME; off outside normal follow play */
function updateOcc(on){const now=performance.now(),dt=Math.min(.1,(now-occT)/1000);occT=now;if(!on&&!OCC_ON.length)return;
  const a=camera.position,px=P.pos.x,pz=P.pos.z;camera.updateMatrixWorld();_cr.setFromMatrixColumn(camera.matrixWorld,0);_cr.y=0;_cr.normalize();
  [.15,.85,1.6].forEach((h,i)=>[-.4,0,.4].forEach((s,j)=>OCC_PTS[i*3+j].set(px+_cr.x*s,P.pos.y+h,pz+_cr.z*s)));
  const m=.5+OCC_PAD,nx=Math.min(a.x,px)-m,xx=Math.max(a.x,px)+m,nz=Math.min(a.z,pz)-m,xz=Math.max(a.z,pz)+m;
  for(const o of OCCS){let hit=false;
    if(on){const near=o.bx0-OCC_NEAR<=a.x&&o.bx1+OCC_NEAR>=a.x&&o.bz0-OCC_NEAR<=a.z&&o.bz1+OCC_NEAR>=a.z,cover=o.bx1>=nx&&o.bx0<=xx&&o.bz1>=nz&&o.bz0<=xz;
      if(near||cover)for(const v of o.vols){if(near&&occNear(v,a)){hit=true;break;}
        if(cover)for(const q of OCC_PTS)if(occSeg(v,a.x,a.y,a.z,q.x,q.y,q.z)){hit=true;break;}if(hit)break;}}
    if(!hit&&!o.on)continue;
    o.p=clamp(o.p+(hit?dt:-dt)/OCC_FADE_TIME,0,1);
    if(o.p<=0){if(o.on)occShow(o,false);continue;}if(!o.on)occShow(o,true);
    const e=o.p*o.p*(3-2*o.p),al=1-(1-OCC_MIN_ALPHA)*e;
    for(const m of o.g.mats){const s=m.userData.src;m.opacity=s.opacity*al;if(s.emissiveIntensity!==undefined)m.emissiveIntensity=s.emissiveIntensity;}}
  /* draw fading objects far → near, each as [depth pass, color pass], after everything else */
  OCC_ON.forEach(o=>o.d=(o.cx-a.x)**2+(o.cz-a.z)**2);OCC_ON.sort((p,q)=>q.d-p.d);
  OCC_ON.forEach((o,k)=>o.g.list.forEach(x=>x.renderOrder=100+2*k+(x.userData.pre?0:1)));}
THREE.Material.prototype.onBeforeCompile=function(sh){addCurve(sh,this);};
/* per frame: start bending just past the player, fog follows zoom; flat inside rooms and the home editor */
function updateCurve(flat){if(flat){CURVE.value.x=0;return;}CURVE.value.x=CURVE_STRENGTH;const hd=Math.hypot(camera.position.x-cam.tgt.x,camera.position.z-cam.tgt.z);CURVE.value.y=hd+CURVE_START_PAD;
  if(!curRoom){const d=camera.position.distanceTo(cam.tgt);scene.fog.near=d+FOG_NEAR_PAD;scene.fog.far=d+FOG_FAR_PAD;}}
const WIND={value:0};
function swayMaterial(mat,amt,spd){spd=spd||1.7;mat.onBeforeCompile=sh=>{addCurve(sh);sh.uniforms.uTime=WIND;sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
vec4 ip = instanceMatrix * vec4(0.,0.,0.,1.);
float sw = sin(uTime*${spd.toFixed(2)} + ip.x*.35 + ip.z*.27${spd!==1.7?' + ip.y*1.3':''}) * ${amt} * (position.y + .5);
transformed.x += sw; transformed.z += sw*.6;
#endif`);};}

/* ===== post processing: depth-of-field "miniature" blur, bloom, warm grade, vignette ===== */
let composer=null,bloom=null,gradePass=null;
const GradeShader={uniforms:{tDiffuse:{value:null},res:{value:new THREE.Vector2(1,1)},focus:{value:.5},amount:{value:1.2},warm:{value:.5}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 res;uniform float focus,amount,warm;varying vec2 vUv;
  void main(){float d=abs(vUv.y-focus);float b=smoothstep(.3,.75,d)*amount;vec4 c=vec4(0.);
   for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++){c+=texture2D(tDiffuse,vUv+vec2(float(i),float(j))*b*1.4/res);}c/=25.;
   c.rgb=mix(c.rgb,c.rgb*vec3(1.04,1.0,.94),warm);c.rgb=(c.rgb-.5)*1.03+.5;
   float l=dot(c.rgb,vec3(.299,.587,.114));c.rgb=mix(vec3(l),c.rgb,.94);
   float v=smoothstep(.95,.3,length((vUv-.5)*vec2(1.1,1.)));c.rgb*=mix(.78,1.,v);gl_FragColor=c;}`};
function initFX(){if(!THREE.EffectComposer||!THREE.UnrealBloomPass)return;try{
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2());const rt=THREE.WebGLMultisampleRenderTarget&&renderer.capabilities.isWebGL2?new THREE.WebGLMultisampleRenderTarget(sz.x,sz.y,{format:THREE.RGBAFormat}):undefined;
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.35,.45,.82);composer.addPass(bloom);
  gradePass=new THREE.ShaderPass(GradeShader);composer.addPass(gradePass);resizeFX();}catch(e){console.warn(e);composer=null;}}
function resizeFX(){if(!composer)return;const sz=renderer.getDrawingBufferSize(new THREE.Vector2());composer.setPixelRatio(1);composer.setSize(sz.x,sz.y);gradePass.uniforms.res.value.set(sz.x,sz.y);}
function renderWorld(){if(composer&&S.quality!=='low'){bloom.strength=.12+todNight*.32;bloom.threshold=.94-todNight*.12;bloom.radius=.3;
    gradePass.uniforms.amount.value=curRoom?.6:camMode==='title'?1.6:1.2;gradePass.uniforms.focus.value=curRoom?.45:.42;gradePass.uniforms.warm.value=.6-todNight*.35;composer.render();}
  else renderer.render(scene,camera);}

/* ===== living nature ===== */
const LIFE={flies:[],birds:[],petals:null,ffl:null,dust:[],dustI:0};
function wingBug(col,scale){const g=new THREE.Group();const wm=Toon({color:col,side:THREE.DoubleSide});const wl=new THREE.Group(),wr=new THREE.Group();g.add(wl,wr);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(.36,.3),wm);pl.position.x=-.18;pl.rotation.x=-Math.PI/2;wl.add(pl);const pr=pl.clone();pr.position.x=.18;wr.add(pr);
  const b=new THREE.Mesh(G.sphL,M(0x4a3523));b.scale.set(.04,.04,.15);g.add(b);g.scale.setScalar(scale||1);scene.add(g);return {g,wl,wr};}
function initLife(){
  for(let i=0;i<18;i++){const c=[[0,0],[12,-12],[-14,8],[16,16],[-20,-20],[-8,40],[20,44],[-40,-6]][i%8];const b=wingBug(pick([0xffffff,0xfff59d,0xffb3d0,0xb3e5fc,0xffcc80]),.8);
    b.cx=c[0]+(Math.random()-.5)*10;b.cz=c[1]+(Math.random()-.5)*10;b.g.position.set(b.cx,1,b.cz);b.a=Math.random()*6;b.t=Math.random()*9;LIFE.flies.push(b);}
  for(let f=0;f<2;f++){const fl={cx:f?40:-50,cz:f?-60:20,r:30+f*10,a:Math.random()*6,y:24+f*4,b:[]};for(let i=0;i<6;i++){const g=new THREE.Group();const wm=M(0x5d5d6b);
    [-1,1].forEach(s=>{const w=new THREE.Mesh(G.box,wm);w.scale.set(.9,.05,.28);w.position.x=s*.45;w.userData.s=s;g.add(w);});const bd=new THREE.Mesh(G.sphL,wm);bd.scale.set(.15,.12,.4);g.add(bd);scene.add(g);fl.b.push({g,ox:(i%3-1)*1.6,oz:-Math.floor(i/3)*1.4-Math.abs(i%3-1)*1.2,ph:Math.random()*6});}LIFE.birds.push(fl);}
  const pg=new THREE.PlaneGeometry(.14,.1);LIFE.petals=new THREE.InstancedMesh(pg,new THREE.MeshBasicMaterial({color:0xffc6d6,side:THREE.DoubleSide}),70);LIFE.petals.frustumCulled=false;scene.add(LIFE.petals);
  LIFE.pd=Array.from({length:70},()=>({x:0,y:-5,z:0,v:0,ph:Math.random()*6}));
  LIFE.ffl=new THREE.InstancedMesh(G.sphL,new THREE.MeshBasicMaterial({color:0xfff59d}),50);LIFE.ffl.frustumCulled=false;scene.add(LIFE.ffl);
  LIFE.fd=Array.from({length:50},(_,i)=>{const near=i%2?[34+Math.random()*12,-80+Math.random()*120]:[50+Math.random()*40,-90+Math.random()*100];return {x:near[0],z:near[1],ph:Math.random()*6};});
  for(let i=0;i<16;i++){const m=new THREE.Mesh(G.sphL,new THREE.MeshBasicMaterial({color:0xf3e7cf,transparent:true,opacity:0}));m.visible=false;scene.add(m);LIFE.dust.push({m,t:0});}}
const sakuraSpots=[];
function updateLife(dt){WIND.value=time;
  LIFE.flies.forEach(b=>{b.t+=dt;b.a+=(Math.sin(b.t*.7)+(Math.random()-.5))*dt*2;const x=b.g.position.x+Math.cos(b.a)*1.2*dt,z=b.g.position.z+Math.sin(b.a)*1.2*dt;
    if(Math.hypot(x-b.cx,z-b.cz)>6)b.a+=Math.PI*dt*3;else{b.g.position.x=x;b.g.position.z=z;}b.g.position.y=.9+Math.sin(b.t*2.3)*.4;b.g.rotation.y=-b.a+Math.PI/2;const f=Math.sin(b.t*20)*1.1;b.wl.rotation.z=f;b.wr.rotation.z=-f;b.g.visible=todNight<.6;});
  LIFE.birds.forEach(fl=>{fl.a+=dt*.12;const hx=fl.cx+Math.cos(fl.a)*fl.r,hz=fl.cz+Math.sin(fl.a)*fl.r,yaw=-fl.a;
    fl.b.forEach(b=>{const c=Math.cos(yaw),s=Math.sin(yaw);b.g.position.set(hx+b.ox*c-b.oz*s,fl.y+Math.sin(time+b.ph)*.4,hz+b.ox*s+b.oz*c);b.g.rotation.y=yaw;b.g.children.forEach(w=>{if(w.userData.s)w.rotation.z=w.userData.s*Math.sin(time*7+b.ph)*.5;});b.g.visible=todNight<.7;});});
  /* petals drift down from the cherry trees near the player (list refreshed ~1×/s); none nearby → petals rest hidden */
  if((LIFE.nearT=(LIFE.nearT||0)-dt)<=0){LIFE.nearT=1;LIFE.near=SAKURA.filter(t=>Math.hypot(t.x-P.pos.x,t.z-P.pos.z)<45);}
  LIFE.pd.forEach((p,i)=>{if(p.y<0){const T=LIFE.near&&LIFE.near.length?LIFE.near[(Math.random()*LIFE.near.length)|0]:null;
      if(!T){p.y=-5;dummy.position.set(0,-50,0);dummy.updateMatrix();LIFE.petals.setMatrixAt(i,dummy.matrix);return;}
      const a=Math.random()*Math.PI*2,r=Math.random()*T.R;p.x=T.x+Math.cos(a)*r;p.z=T.z+Math.sin(a)*r;p.y=T.top*(.65+Math.random()*.3);p.v=.3+Math.random()*.35;}
    p.y-=p.v*dt;p.x+=Math.sin(time+p.ph)*dt*.6;p.z+=Math.cos(time*.7+p.ph)*dt*.4;dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(time*2+p.ph,time+p.ph,0);dummy.scale.setScalar(1);dummy.updateMatrix();LIFE.petals.setMatrixAt(i,dummy.matrix);});
  LIFE.petals.instanceMatrix.needsUpdate=true;
  LIFE.ffl.visible=todNight>.5;if(LIFE.ffl.visible){LIFE.fd.forEach((f,i)=>{const gl=.5+.5*Math.sin(time*2.5+f.ph);dummy.position.set(f.x+Math.sin(time*.5+f.ph)*1.5,1+Math.sin(time*.9+f.ph)*.6,f.z+Math.cos(time*.4+f.ph)*1.5);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.06+gl*.05);dummy.updateMatrix();LIFE.ffl.setMatrixAt(i,dummy.matrix);});LIFE.ffl.instanceMatrix.needsUpdate=true;}
  LIFE.dust.forEach(d=>{if(!d.m.visible)return;d.t+=dt;d.m.position.y+=dt*.6;d.m.scale.setScalar(.12+d.t*.5);d.m.material.opacity=Math.max(0,.55-d.t*.9);if(d.t>.6)d.m.visible=false;});}
/* ===== player feel: bouncy walk, run, smooth turns, breathing, blinking, looking around, footsteps by ground =====
   (NPCs keep the simple animChar; only the player uses this) */
const TURN_RATE=9;              // むきを かえる はやさ（おおきいほど はやい。まえは ほぼ パッと かわる 12×dt）
const WALK_FREQ=10.5,RUN_FREQ=15; // あしの うごく はやさ（1ほ = π）
const IDLE_LOOK_AFTER=7;         // この びょうすう そうさ しないと きょろきょろ する
const PF={ph:0,step:0,amp:0,runK:0,lean:0,land:0,air:false,prevRot:null,idle:0,headY:0,blinkT:2.5,blinkD:0,blink2:false,armZ:.25};
function animPlayer(dt){const m=P.model,u=m.userData,t=P.t;const moving=P.moving&&P.ground,air=!P.ground,run=moving&&P.running;
  /* gait: amplitude eases in/out (no snapping when starting/stopping); bigger & faster when running */
  const tgt=moving?(run?1:.62)*Math.max(.55,P.mag||1):0;PF.amp+=(tgt-PF.amp)*Math.min(1,dt*10);PF.runK+=((run?1:0)-PF.runK)*Math.min(1,dt*6);
  if(moving){PF.ph+=dt*(WALK_FREQ+(RUN_FREQ-WALK_FREQ)*PF.runK);const s=Math.floor(PF.ph/Math.PI);if(s!==PF.step){PF.step=s;playerStep(run,s&1);}}
  else if(PF.amp<.05)PF.ph=PF.step*Math.PI; /* settle on a neutral pose */
  const a=PF.amp,s1=Math.sin(PF.ph),hop=Math.abs(s1);
  u.legL.rotation.x=air?-.35:s1*a*.95;u.legR.rotation.x=air?.25:-s1*a*.95;u.armL.rotation.x=air?0:-s1*a*.85;u.armR.rotation.x=air?0:s1*a*.85;
  PF.armZ+=((air?1.1:.25+PF.runK*.15)-PF.armZ)*Math.min(1,dt*12);u.armL.rotation.z=PF.armZ;u.armR.rotation.z=-PF.armZ;
  /* lean into turns (from how fast the facing changes) */
  if(PF.prevRot==null)PF.prevRot=P.rot;let dr=((P.rot-PF.prevRot+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;PF.prevRot=P.rot;
  PF.lean+=(clamp(-dr/Math.max(dt,1e-3)*.045,-.16,.16)*(moving?1:.3)-PF.lean)*Math.min(1,dt*8);
  /* bounce "ぴょこぴょこ", side-to-side wobble, a little forward lean when running */
  const idleK=clamp(1-a/.4,0,1),breath=Math.sin(t*2.1);
  u.body.position.y=air?0:hop*a*.14+breath*.008*idleK;
  u.body.rotation.z=Math.sin(PF.ph)*.09*a+PF.lean;u.body.rotation.y=Math.sin(PF.ph)*.07*a;u.body.rotation.x=PF.runK*a*.14;
  /* landing squash (and a puff of dust) */
  if(PF.air&&!air){PF.land=1;if(!curRoom)for(let i=0;i<2;i++)puffDust(.4);}PF.air=air;PF.land=Math.max(0,PF.land-dt*5);
  const sq=PF.land*PF.land;u.body.scale.set(1+sq*.1,1-sq*.14,1+sq*.1);
  /* breathing: the tummy slowly swells a little while standing */
  if(u.torso){if(!u.tb)u.tb=u.torso.scale.clone();const k=1+breath*.025*idleK;u.torso.scale.set(u.tb.x*k,u.tb.y*(1+breath*.012*idleK),u.tb.z*k);}
  /* look around after a while without input */
  const still=!moving&&!air&&!P.input&&!busy&&mode==='world';PF.idle=still?PF.idle+dt:0;let hy=0,hz=Math.sin(t*1.3)*.04*idleK;
  if(PF.idle>IDLE_LOOK_AFTER){const c=(PF.idle-IDLE_LOOK_AFTER)%6.4;hy=c<.4?0:c<1.9?.65:c<2.3?.65:c<3.9?-.6:c<4.5?-.6:0;if(c>1.9&&c<2.3||c>3.9&&c<4.5)hz=.1*Math.sign(hy);}
  PF.headY+=(hy-PF.headY)*Math.min(1,dt*(hy?5:7));u.head.rotation.y=PF.headY;u.head.rotation.z=hz-u.body.rotation.z*.5;
  /* blink at random moments, sometimes twice */
  PF.blinkT-=dt;if(PF.blinkT<=0){PF.blinkD=.13;if(PF.blink2){PF.blink2=false;PF.blinkT=.22;}else{PF.blink2=Math.random()<.25;PF.blinkT=PF.blink2?.22:2+Math.random()*3;}}
  PF.blinkD-=dt;if(u.eyes){const bl=PF.blinkD>0?.12:1;u.eyes.forEach((e,i)=>e.scale.y=u.ey[i]*bl);}}
function puffDust(spread){const d=LIFE.dust[LIFE.dustI++%LIFE.dust.length];d.t=0;d.m.visible=true;d.m.position.set(P.pos.x+(Math.random()-.5)*spread,P.pos.y+.12,P.pos.z+(Math.random()-.5)*spread);}
/* one footfall: soft sound for the ground under the feet; running kicks up a little dust behind the foot */
function playerStep(run,side){stepSound(groundKind(P.pos.x,P.pos.z),run);
  if(run&&!curRoom&&P.pos.y<.2){const c=Math.cos(P.rot),s=Math.sin(P.rot),o=side?.17:-.17;const d=LIFE.dust[LIFE.dustI++%LIFE.dust.length];d.t=0;d.m.visible=true;
    d.m.position.set(P.pos.x+o*c-s*.25+(Math.random()-.5)*.1,P.pos.y+.1,P.pos.z-o*s-c*.25+(Math.random()-.5)*.1);}}
function groundKind(x,z){if(curRoom||P.pos.y>.2)return 'wood';if(z>53)return 'sand';if(Math.hypot(x,z)<7.4)return 'stone';
  for(const r of ROADS)if(x>r[0]&&x<r[1]&&z>r[2]&&z<r[3])return 'dirt';if(Math.abs(x)<15&&z>-28.5&&z<-13)return 'dirt';return 'grass';}
/* footstep voices: filtered noise bursts (+ a soft knock for stone/wood). Kept quiet and soft.
   dirt ザッ, grass サクッ (two tiny crisp bursts), stone コツ, sand (muffled), wood トン */
const STEP_SND={dirt:{type:'bandpass',f:1300,q:.8,v:.045,a:.008,d:.1},
  grass:{type:'highpass',f:3200,q:.6,v:.022,a:.002,d:.045,dbl:.028},
  stone:{type:'bandpass',f:3000,q:2.5,v:.014,a:.001,d:.03,tone:1150,td:.06,tv:.02},
  sand:{type:'lowpass',f:800,q:.5,v:.045,a:.012,d:.12},
  wood:{type:'bandpass',f:600,q:1.5,v:.02,a:.002,d:.05,tone:250,td:.08,tv:.03}};
let NOISE=null;
function stepSound(kind,run){if(!AC||!S.sound)return;try{
  if(!NOISE){const n=AC.sampleRate*.3|0;NOISE=AC.createBuffer(1,n,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}
  const K=STEP_SND[kind],vk=run?1.25:1,t0=AC.currentTime;
  [0,K.dbl].forEach((off,j)=>{if(j&&!off)return;const t=t0+(off||0),src=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();src.buffer=NOISE;
    f.type=K.type;f.frequency.value=K.f*(.88+Math.random()*.24);f.Q.value=K.q;const v=K.v*vk*(j?.6:1)*(.85+Math.random()*.3);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+K.a);g.gain.exponentialRampToValueAtTime(.0003,t+K.d);
    src.connect(f);f.connect(g);g.connect(AC.destination);src.start(t,Math.random()*.25);src.stop(t+K.d+.02);});
  if(K.tone)tone(K.tone*(.94+Math.random()*.12),K.td,'sine',K.tv*vk);}catch(e){}}

/* ===== ambience: birds by day, crickets by night, water nearby ===== */
let ambT=0,waterNode=null,waterGain=null;
function updateAmbience(dt){if(!AC||!S.sound)return;ambT-=dt;
  if(!waterNode){try{const len=AC.sampleRate*2,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);let last=0;for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3;}
    waterNode=AC.createBufferSource();waterNode.buffer=buf;waterNode.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;waterGain=AC.createGain();waterGain.gain.value=0;waterNode.connect(f);f.connect(waterGain);waterGain.connect(AC.destination);waterNode.start();}catch(e){waterNode=1;}}
  if(waterGain){const dr=Math.abs(P.pos.x-40),ds=Math.max(0,72-P.pos.z);const near=curRoom?0:Math.max(0,1-Math.min(dr,ds)/18);waterGain.gain.setTargetAtTime(near*.09,AC.currentTime,.3);}
  if(ambT<=0&&!curRoom){ambT=1.5+Math.random()*3;
    if(todNight<.5){const f=2000+Math.random()*1200;for(let i=0;i<3;i++)tone(f+i*120*(Math.random()<.5?1:-1),.07,'sine',.018,i*.09);}
    else{for(let i=0;i<4;i++)tone(4200,.03,'square',.006,i*.06);}}}
