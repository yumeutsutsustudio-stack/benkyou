'use strict';
/* ===== state ===== */
/* accounts: several players on one device. ACC_KEY holds {cur,list:[{id,name}]}; each account has its own save.
   The first account 'a1' keeps the old key 'donguri3d-v2', so an existing save becomes プレイヤー1. */
const ACC_KEY='donguri3d-accounts';
const accKey=id=>id==='a1'?'donguri3d-v2':'donguri3d-v2:'+id;
let NO_SAVE=false; /* set right before a reload that switches/deletes an account so nothing writes the old save back */
const ACC=(()=>{let A=null;try{A=JSON.parse(localStorage.getItem(ACC_KEY));}catch(e){}
  if(!A||!Array.isArray(A.list)||!A.list.length)A={cur:'a1',list:[{id:'a1',name:'プレイヤー1'}]};
  if(!A.list.some(a=>a.id===A.cur))A.cur=A.list[0].id;return A;})();
function accSave(){try{localStorage.setItem(ACC_KEY,JSON.stringify(ACC));}catch(e){}}
accSave();
const SAVE_KEY=accKey(ACC.cur);
function fresh(){return {grade:1,look:{animal:'usagi',shirt:'pink',hat:'ribbon',acc:'none'},own:{hat:['none','ribbon'],shirt:['pink','blue','yellow'],acc:['none'],furn:{chair:1,table:1,plant:1,bed:1},wall:['w0'],floor:['f0']},
  room:{items:[{id:'bed',x:1,z:1,r:0},{id:'table',x:4,z:4,r:0},{id:'chair',x:4,z:5,r:2},{id:'plant',x:0,z:6,r:0}],wall:'w0',floor:'f0'},yen:100,xp:0,level:1,
  st:{correct:0,math:0,kokugo:0,rika:0,eigo:0,shakai:0,art:0,topic:{},streak:0,best:0,fish:{},bugs:{},shells:0,shards:[],ath:0,athBest:0,speedBest:0,ferris:0,gates:[0,0,0],ruinsChest:0,islandChest:0,chestDay:{},mdays:0,met:{}},
  hearts:{},gifts:{},ach:{},missions:null,q:{},track:null,tod:'day',todV:1,fav:[],favMode:'more',season:'real',sound:true,quality:matchMedia('(pointer:coarse)').matches?'low':'high',pos:[0,15],rot:Math.PI,intro:false};}
let S=fresh(),hadSave=false;
try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const L=JSON.parse(raw);const f=fresh();S=Object.assign(f,L);S.st=Object.assign(f.st,L.st||{});S.own=Object.assign(fresh().own,L.own||{});S.look=Object.assign(fresh().look,L.look||{});S.room=L.room||f.room;if(!L.todV){S.tod='day';S.todV=1;}if(!S.gradeTop&&S.intro)S.gradeTop=S.grade;hadSave=true;}}catch(e){}
function save(){if(NO_SAVE)return;try{if(P){S.pos=[+P.pos.x.toFixed(2),+P.pos.z.toFixed(2)];S.rot=P.rot;}localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
let mode='title',camMode='title';
const cam={yaw:Math.PI,pitch:CAM_PITCH,dist:CAM_DIST,tgt:new V3()};
function applyQuality(){const low=S.quality==='low';renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1.2:2));const n=low?1024:2048;sun.shadow.mapSize.set(n,n);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}resize();}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();HOME.cam.aspect=w/h;HOME.cam.updateProjectionMatrix();resizeFX();}

/* ===== player ===== */
const P={pos:new V3(),vy:0,ground:true,rot:Math.PI,model:null,t:0,moving:false,riding:null,lastSafe:new V3()};
const lookOf=l=>({kind:ANIMALS[l.animal].kind,fur:ANIMALS[l.animal].fur,shirt:SHIRTS[l.shirt].c,hat:l.hat,acc:l.acc});
function rebuildPlayer(){if(P.model)scene.remove(P.model);P.model=makeChar(lookOf(S.look));scene.add(P.model);P.model.position.copy(P.pos);P.model.rotation.y=P.rot;if(HOME.avatar)placeAvatar();}
/* ===== npcs ===== */
const npcs=[];
function spawnNPCs(){FRIENDS.forEach(f=>{const m=makeChar({kind:f.kind,fur:f.fur,shirt:f.shirt,hat:f.hat,acc:f.acc});scene.add(m);const n={f,model:m,pos:new V3(f.x,0,f.z),home:new V3(f.x,0,f.z),tgt:null,timer:Math.random()*3,t:Math.random()*5,hop:0,rot:f.static?Math.PI:0};
  n.blob=makeBlob(.62);const lab=labelSprite(f.n);lab.position.y=2.7;m.add(lab);n.label=lab;const bub=bubbleSprite(f.role==='school'?'📚':f.role?'🛒':'?');bub.position.y=2.55;m.add(bub);n.bub=bub;npcs.push(n);});}
function updateNPCs(dt){for(const n of npcs){n.t+=dt;const d=Math.hypot(P.pos.x-n.pos.x,P.pos.z-n.pos.z);let moving=false;
  if(n.talking||d<3.2||busy||n.f.static||n.fixed||n.inRoom){if(d<5||n.talking)n.rot=lerpAng(n.rot,Math.atan2(P.pos.x-n.pos.x,P.pos.z-n.pos.z),dt*6);}
  else{n.timer-=dt;if(n.timer<=0){n.timer=2+Math.random()*3;n.tgt=Math.random()<.4?null:new V3(n.home.x+(Math.random()-.5)*7,0,n.home.z+(Math.random()-.5)*7);}
    if(n.tgt){const dx=n.tgt.x-n.pos.x,dz=n.tgt.z-n.pos.z,l=Math.hypot(dx,dz);if(l<.2)n.tgt=null;else{const nx=n.pos.x+dx/l*1.6*dt,nz=n.pos.z+dz/l*1.6*dt;if(!blocked(nx,nz)){n.pos.x=nx;n.pos.z=nz;resolve(n.pos,.45,true);moving=true;}else n.tgt=null;n.rot=lerpAng(n.rot,Math.atan2(dx,dz),dt*6);}}}
  if(n.hop>0)n.hop-=dt;n.model.position.set(n.pos.x,n.pos.y+(n.hop>0?Math.sin(n.hop*Math.PI*2)*.25:0),n.pos.z);n.blob.position.set(n.pos.x,(n.pos.y||0)+.045,n.pos.z);n.model.rotation.y=n.rot;animChar(n.model,n.t,moving,false);
  /* while speaking: small nods (body + head dip in rhythm), easing in and out */
  {const u=n.model.userData;n.nod=(n.nod||0)+((n.speaking?1:0)-(n.nod||0))*Math.min(1,dt*8);const nd=Math.max(0,Math.sin(n.t*8));u.body.rotation.x=n.nod*.07*nd;u.head.rotation.x=n.nod*.12*Math.max(0,Math.sin(n.t*8-.6));}
  if(n.emoT>0)updateEmote(n,dt);
  n.label.visible=d<7;n.bub.visible=d>=7&&d<40&&!!n.f.role;n.bub.position.y=2.55+Math.sin(n.t*3)*.08; /* plain villagers: ？ only when they have a request */
  updateReqMark(n,d);}}
/* ===== villager emotes (♪ happy / ！ surprised) and the "はなす" bubble ===== */
const EMO_TEX={};
function emoTex(ch,col){return EMO_TEX[ch]||(EMO_TEX[ch]=canvasTex(128,128,c=>{c.fillStyle='#fffbef';c.beginPath();c.arc(64,60,46,0,7);c.fill();c.lineWidth=6;c.strokeStyle='#7a4f2a';c.stroke();
  c.fillStyle=col;c.font='900 68px "Zen Maru Gothic","Segoe UI Symbol",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(ch,64,64);}));}
function npcEmote(n,kind){if(!n.emo){n.emo=new THREE.Sprite(new THREE.SpriteMaterial({map:emoTex('♪','#ff6f91'),transparent:true,depthTest:false}));n.emo.renderOrder=300;n.model.add(n.emo);}
  n.emo.material.map=kind==='happy'?emoTex('♪','#ff6f91'):emoTex('！','#f08a1a');n.emoT=1.7;n.emo.visible=true;if(kind==='surprise')n.hop=.35;}
function updateEmote(n,dt){n.emoT-=dt;const a=1.7-n.emoT,e=n.emo;if(n.emoT<=0){e.visible=false;return;}
  const p=Math.min(1,a/.25),pop=1+2.2*Math.pow(p-1,3)+1.2*Math.pow(p-1,2); /* quick pop with a little overshoot */
  e.scale.setScalar(1.05*pop);e.position.set(.6,3.45+Math.min(a,.5)*.3+Math.sin(a*6)*.05,0);e.material.opacity=Math.min(1,n.emoT/.3);}
const TALKB=(()=>{const t=canvasTex(256,140,c=>{c.fillStyle='#fffbef';c.strokeStyle='#7a4f2a';c.lineWidth=8;rrect(c,8,8,240,92,40);c.fill();c.stroke();
  c.beginPath();c.moveTo(108,96);c.lineTo(128,128);c.lineTo(148,96);c.closePath();c.fill();c.stroke();c.fillRect(104,88,48,10);
  c.fillStyle='#4a3523';c.font='900 50px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('[話|はな]す',128,56);});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.renderOrder=300;s.visible=false;scene.add(s);return {s,n:null,t:0};})();
/* bubble over the villager you can talk to right now (pops in, bobs gently); hidden while talking */
function updateTalkBubble(dt){const n=target&&target.npc&&!busy&&mode==='world'?target.npc:null;
  if(n!==TALKB.n){TALKB.n=n;TALKB.t=0;}TALKB.s.visible=!!n;if(!n)return;TALKB.t+=dt;
  const p=Math.min(1,TALKB.t/.22),pop=1+2.2*Math.pow(p-1,3)+1.2*Math.pow(p-1,2);TALKB.s.scale.set(1.05*pop,.575*pop,1);
  TALKB.s.position.set(n.model.position.x,n.model.position.y+(n.reqShown?4.15:3.45)+Math.sin(time*3)*.06,n.model.position.z);}
function lerpAng(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*Math.min(1,t);}

/* ===== collisions ===== */
const regLocked=r=>S.level<r.lv;
/* だんさ： STEP_UP(m) までの だんさは あるいて のぼれる（トランポリン .45 は ジャンプ）。のれる だい（plat）には からだを PLAT_R に ほそくして ぶつかる
   → かいだんの つぎの だんに ひっかからず、よこから こすっても すべりおちにくい。 STEP_DOWN までの くだりは じめんに すいつく（ういて ジャンプできない のを ふせぐ） */
const STEP_UP=.4,STEP_DOWN=.45,PLAT_R=.35;
function resolve(p,r,npc){for(const c of circles){const dx=p.x-c.x,dz=p.z-c.z,m=c.r+r,d2=dx*dx+dz*dz;if(d2<m*m){const d=Math.sqrt(d2)||.001;p.x=c.x+dx/d*m;p.z=c.z+dz/d*m;}}
  const r0=r;for(const b of boxes){if(!b.on||p.y>=b.top-(npc?.35:STEP_UP))continue;r=b.plat&&!npc?Math.min(r0,PLAT_R):r0;const cx=clamp(p.x,b.x0,b.x1),cz=clamp(p.z,b.z0,b.z1),dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;if(d2>=r*r)continue;
    if(d2>1e-6){const d=Math.sqrt(d2);p.x=cx+dx/d*r;p.z=cz+dz/d*r;}else{const l=p.x-b.x0,rr=b.x1-p.x,t=p.z-b.z0,bb=b.z1-p.z,m=Math.min(l,rr,t,bb);if(m===l)p.x=b.x0-r;else if(m===rr)p.x=b.x1+r;else if(m===t)p.z=b.z0-r;else p.z=b.z1+r;}}
  let hit=null;for(const g of REG){if(!regLocked(g))continue;if(g.c){const[cx,cz,R]=g.c,dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);if(d<R+.6){p.x=cx+dx/(d||1)*(R+.6);p.z=cz+dz/(d||1)*(R+.6);hit=g;}}
    else{const[x0,x1,z0,z1]=g.rect;if(p.x>x0&&p.x<x1&&p.z>z0&&p.z<z1){p.z=z0-.05;hit=g;}}}
  if(!npc){for(const n of npcs){const dx=p.x-n.pos.x,dz=p.z-n.pos.z,m=.9,d2=dx*dx+dz*dz;if(d2<m*m){const d=Math.sqrt(d2)||.001;p.x=n.pos.x+dx/d*m;p.z=n.pos.z+dz/d*m;}}
    if(hit&&time-lockToastT>4){lockToastT=time;toast(`「${hit.n}」は レベル${hit.lv}に なると [入|はい]れるよ！`);}}}
let lockToastT=-9;
function refreshRegions(){REG.forEach(r=>{W.fences[r.id].visible=regLocked(r);});}
function openGate(i,anim){const g=W.gates[i];g.open=true;g.b.on=false;if(!anim){g.m.position.y=-1.8;g.rune.visible=false;}else g.anim=1.5;}

/* ===== ferris ride ===== */
function rideFerris(){if(P.riding)return;let best=0,by=1e9;const wp=new V3();W.gond.forEach((g,i)=>{g.getWorldPosition(wp);if(wp.y<by){by=wp.y;best=i;}});P.riding={i:best,t:0};S.st.ferris++;checkAch();ev('ferris');save();toast('[観|かん][覧|らん][車|しゃ]に [乗|の]ったよ！ ゆっくり ながめてね');cam.dist=22*FOV_K;}
function endRide(){P.riding=null;P.pos.set(-80,0,25.5);P.vy=0;cam.dist=CAM_DIST;}

/* ===== home (interior) ===== */
const HOME={scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(45,1,.1,100),yaw:.78,pitch:.8,dist:13,group:new THREE.Group(),sel:-1,place:null,tab:'furn',avatar:null};
const CELL=1.2,NC=8,HALF=NC*CELL/2,cellP=i=>(i-NC/2+.5)*CELL;
const texCache={};
function patTex(key,c0,c1,kind,stars){if(texCache[key])return texCache[key];const t=canvasTex(128,128,(c,w,h)=>{c.fillStyle=c0;c.fillRect(0,0,w,h);c.fillStyle=c1;if(kind==='wall'){for(let x=0;x<w;x+=32)c.fillRect(x,0,16,h);}else{for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32)if((x+y)/32%2)c.fillRect(x,y,32,32);}if(stars){c.fillStyle='#fff59d';for(let i=0;i<14;i++)c.fillRect(Math.random()*w,Math.random()*h,3,3);}},true);t.repeat.set(kind==='wall'?4:4,kind==='wall'?2:4);texCache[key]=t;return t;}
function setupHome(){const s=HOME.scene;s.background=new THREE.Color(0xf3e3c8);s.add(new THREE.HemisphereLight(0xfff6ea,0xd2c2e6,.6));const d=new THREE.DirectionalLight(0xfff2dc,.5);d.position.set(6,12,8);d.castShadow=true;Object.assign(d.shadow.camera,{left:-8,right:8,top:8,bottom:-8});s.add(d);
  HOME.floor=new THREE.Mesh(new THREE.PlaneGeometry(NC*CELL,NC*CELL),Toon());HOME.floor.rotation.x=-Math.PI/2;HOME.floor.receiveShadow=true;s.add(HOME.floor);box(NC*CELL+.4,.4,NC*CELL+.4,0xa9805a,0,-.21,0,s);
  HOME.wallB=new THREE.Mesh(new THREE.PlaneGeometry(NC*CELL,4.2),Toon());HOME.wallB.position.set(0,2.1,-HALF);HOME.wallB.receiveShadow=true;s.add(HOME.wallB);
  HOME.wallL=new THREE.Mesh(new THREE.PlaneGeometry(NC*CELL,4.2),Toon());HOME.wallL.position.set(-HALF,2.1,0);HOME.wallL.rotation.y=Math.PI/2;HOME.wallL.receiveShadow=true;s.add(HOME.wallL);
  box(NC*CELL+.6,4.2,.3,0xe8d5b5,0,2.1,-HALF-.16,s);box(.3,4.2,NC*CELL+.6,0xe8d5b5,-HALF-.16,2.1,0,s);box(2.2,1.5,.06,0xbfe8ff,1.6,2.5,-HALF+.04,s,false);box(2.4,.12,.1,0xffffff,1.6,1.7,-HALF+.06,s);box(.06,4.2*0+1.5,.08,0xffffff,1.6,2.5,-HALF+.07,s,false);
  HOME.grid=new THREE.GridHelper(NC*CELL,NC,0x9a7b5a,0x9a7b5a);HOME.grid.position.y=.012;HOME.grid.material.transparent=true;HOME.grid.material.opacity=.35;s.add(HOME.grid);
  HOME.ring=new THREE.Mesh(new THREE.TorusGeometry(.62,.06,8,32),new THREE.MeshBasicMaterial({color:0xff6f91}));HOME.ring.rotation.x=-Math.PI/2;HOME.ring.position.y=.04;HOME.ring.visible=false;s.add(HOME.ring);s.add(HOME.group);}
function placeAvatar(){if(HOME.avatar)HOME.scene.remove(HOME.avatar);HOME.avatar=makeChar(lookOf(S.look));HOME.avatar.position.set(HALF+.9,0,HALF-1.2);HOME.avatar.rotation.y=-.4;HOME.scene.add(HOME.avatar);}
function applyRoom(){const w=WALLS[S.room.wall],f=FLOORS[S.room.floor];HOME.wallB.material.map=patTex('w'+S.room.wall,w.c[0],w.c[1],'wall',w.stars);HOME.wallL.material.map=HOME.wallB.material.map;HOME.floor.material.map=patTex('f'+S.room.floor,f.c[0],f.c[1],'floor');
  [HOME.wallB,HOME.wallL,HOME.floor].forEach(m=>m.material.needsUpdate=true);
  while(HOME.group.children.length)HOME.group.remove(HOME.group.children[0]);
  S.room.items.forEach((it,idx)=>{const g=fb(it.id);g.position.set(cellP(it.x),0,cellP(it.z));g.rotation.y=it.r*Math.PI/2;g.userData.idx=idx;HOME.group.add(g);});
  const s=S.room.items[HOME.sel];HOME.ring.visible=!!s;if(s)HOME.ring.position.set(cellP(s.x),.04,cellP(s.z));HOME.grid.visible=true;} /* the grid (ます目) is always shown while redecorating */
const placed=id=>S.room.items.filter(i=>i.id===id).length;
function enterHome(){mode='home';setBusy(0);$('#hud').hidden=true;$('#controls').hidden=true;$('#keyhint').hidden=true;$('#homeUI').hidden=false;HOME.sel=-1;HOME.place=null;HOME.drag=null;HOME.pitch=Math.max(HOME.pitch,1.05);placeAvatar(); /* look down from above */applyRoom();renderHomeUI();}
function exitHome(){mode='world';$('#homeUI').hidden=true;$('#hud').hidden=false;$('#controls').hidden=false;$('#keyhint').hidden=false;setBusy(0);rebuildHomeRoom();save();}
/* wallpaper / floor previews: a tiny room corner drawn with the real patterns (the same textures the room uses) */
const PAT_URL={};
function patURL(kind,id){const k=kind+id;if(PAT_URL[k])return PAT_URL[k];const v=kind==='wall'?WALLS[id]:FLOORS[id];
  return PAT_URL[k]=patTex((kind==='wall'?'w':'f')+id,v.c[0],v.c[1],kind,v.stars).image.toDataURL();}
function roomPrev(wall,floor){return `<span class="rmprev"><i class="pw" style="background-image:url(${patURL('wall',wall)})"></i><i class="pf" style="background-image:url(${patURL('floor',floor)})"></i><i class="pb"></i></span>`;}
function renderHomeUI(){const t=HOME.tab;$('#homeTabs').innerHTML=[['furn','[持|も]ち[物|もの]'],['wall','かべ[紙|がみ]'],['floor','ゆか']].map(([k,n])=>`<button class="tab${k===t?' on':''}" type="button" data-tab="${k}">${n}</button>`).join('');
  $('#homeTabs').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{HOME.tab=b.dataset.tab;HOME.place=null;applyRoom();renderHomeUI();});
  const sel=$('#homeSel');sel.hidden=HOME.sel<0;if(HOME.sel>=0){const it=S.room.items[HOME.sel];sel.innerHTML=`<span style="align-self:center">${FURN[it.id].e} ${FURN[it.id].n}</span><button class="big-btn calm" type="button" data-a="rot">[回|まわ]す</button><button class="big-btn calm" type="button" data-a="move">[動|うご]かす</button><button class="big-btn calm" type="button" data-a="put">しまう</button>`;
    onAct(sel,{rot:()=>{it.r=(it.r+1)%4;ev('room');applyRoom();save();},move:()=>{HOME.place={move:HOME.sel};applyRoom();renderHomeUI();},put:()=>{S.room.items.splice(HOME.sel,1);HOME.sel=-1;ev('room');applyRoom();renderHomeUI();save();}});}
  let list;
  if(t==='furn')list=Object.entries(S.own.furn).filter(([,c])=>c>0).map(([id,c])=>({id,e:FURN[id].e,n:FURN[id].n,sub:`[残|のこ]り ${c-placed(id)}`,dis:c-placed(id)<=0,sel:HOME.place&&HOME.place.id===id}));
  /* wallpaper / floor: owned ones switch at once; the others show their acorn price and can be bought right here */
  else{const src=t==='wall'?WALLS:FLOORS;list=Object.keys(src).map(id=>{const own=S.own[t].includes(id);return {id,e:t==='wall'?roomPrev(id,S.room.floor):roomPrev(S.room.wall,id),n:src[id].n,sel:S.room[t]===id,sub:own?(S.room[t]===id?'[使|つか]っている':''):`どんぐり ${src[id].p}こ`};});}
  $('#homeList').innerHTML=list.map(it=>`<button class="item${it.sel?' sel':''}" type="button" data-id="${it.id}"${it.dis?' disabled':''}><span class="ie">${it.e}</span>${it.n}${it.sub?`<span class="sub">${it.sub}</span>`:''}</button>`).join('')||'<p class="mnote">まだ ないよ。 [商|しょう][店|てん][街|がい]で かってね</p>';
  $('#homeList').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id;if(t==='furn'){HOME.place={id};HOME.sel=-1;}
    else if(S.own[t].includes(id)){S.room[t]=id;ev('room');save();}
    else{const src=t==='wall'?WALLS:FLOORS,v=src[id];if(S.yen<v.p){sfx('tap');return toast(`${v.n}は どんぐり ${v.p}こ。 あと ${v.p-S.yen}こ [集|あつ]めたら かえるよ！`);}
      return payGame({name:v.n,e:t==='wall'?'🧻':'🟫',price:v.p,who:FR('hana'),kind:t,back:closeModal,onPaid:()=>{S.own[t].push(id);S.room[t]=id;ev('room');applyRoom();renderHomeUI();}});}
    applyRoom();renderHomeUI();});
  $('#homeMsg').textContent=HOME.place?'ゆかの おきたい ます を タッチしてね':'[家|か][具|ぐ]は ゆびで ドラッグして [動|うご]かせるよ。 タッチすると [回|まわ]す・しまう が できるよ';}
/* drag a placed piece of furniture with a finger / the mouse; it snaps to the grid and goes back if the square is taken */
const _hr=new THREE.Raycaster();
function homeRay(cx,cy){HOME.scene.updateMatrixWorld();const r=canvas.getBoundingClientRect(); /* furniture may have just been rebuilt this frame */_hr.setFromCamera(new THREE.Vector2((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1),HOME.cam);return _hr;}
function homeCellAt(cx,cy){const h=homeRay(cx,cy).intersectObject(HOME.floor);if(!h.length)return null;const i=Math.floor((h[0].point.x+HALF)/CELL),j=Math.floor((h[0].point.z+HALF)/CELL);return i<0||j<0||i>=NC||j>=NC?null:{i,j};}
function homeDragStart(e){if(HOME.place!=null)return;const hits=homeRay(e.clientX,e.clientY).intersectObjects(HOME.group.children,true);let o=hits.length?hits[0].object:null;while(o&&o.userData.idx==null)o=o.parent;if(!o)return;
  const it=S.room.items[o.userData.idx];HOME.drag={pid:e.pointerId,idx:o.userData.idx,obj:o,i:it.x,j:it.z,moved:false};}
function homeDragMove(e){const D=HOME.drag,c=homeCellAt(e.clientX,e.clientY);if(!c)return;if(c.i===D.i&&c.j===D.j&&D.moved)return;
  if(!D.moved){D.moved=true;HOME.sel=D.idx;}D.i=c.i;D.j=c.j;D.obj.position.set(cellP(c.i),.12,cellP(c.j));HOME.ring.visible=true;HOME.ring.position.set(cellP(c.i),.04,cellP(c.j));
  const busyCell=S.room.items.some((it,k)=>k!==D.idx&&it.x===c.i&&it.z===c.j);HOME.ring.material.color.set(busyCell?0xbdbdbd:0xff6f91);}
function homeDragEnd(){const D=HOME.drag;HOME.drag=null;HOME.ring.material.color.set(0xff6f91);if(!D||!D.moved)return false;const it=S.room.items[D.idx];
  if(S.room.items.some((o,k)=>k!==D.idx&&o.x===D.i&&o.z===D.j)){toast('そこには もう おいて あるよ');}else{it.x=D.i;it.z=D.j;sfx('tap');ev('room');save();}
  HOME.sel=D.idx;applyRoom();renderHomeUI();return true;}
function homeTap(cx,cy){HOME.scene.updateMatrixWorld();const r=canvas.getBoundingClientRect(),ndc=new THREE.Vector2((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(ndc,HOME.cam);
  if(HOME.place==null){const hits=ray.intersectObjects(HOME.group.children,true);let o=hits.length?hits[0].object:null;while(o&&o.userData.idx==null)o=o.parent;HOME.sel=o?o.userData.idx:-1;applyRoom();renderHomeUI();return;}
  const h=ray.intersectObject(HOME.floor);if(!h.length)return;const i=Math.floor((h[0].point.x+HALF)/CELL),j=Math.floor((h[0].point.z+HALF)/CELL);if(i<0||j<0||i>=NC||j>=NC)return;
  const mv=HOME.place.move;const occ=S.room.items.findIndex((it,k)=>it.x===i&&it.z===j&&k!==mv);if(occ>=0){sfx('ng');return toast('そこには もう おいて あるよ');}
  if(mv!=null){S.room.items[mv].x=i;S.room.items[mv].z=j;HOME.sel=mv;}else{S.room.items.push({id:HOME.place.id,x:i,z:j,r:0});questEvent('place');if(S.own.furn[HOME.place.id]-placed(HOME.place.id)<=0)HOME.place=null;}
  if(mv!=null)HOME.place=null;sfx('tap');ev('room');save();applyRoom();renderHomeUI();}
$('#homeExit').onclick=exitHome;

/* ===== input ===== */
const keys={};const joy={x:0,y:0,id:null};let jumpReq=false;
const KM={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',s:'d',a:'l',d:'r',W:'u',S:'d',A:'l',D:'r'};
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return; /* typing a name on the title */
  if(KM[e.key]){keys[KM[e.key]]=true;if(mode==='world')e.preventDefault();}if(e.key==='Shift')keys.run=true;
  if(e.key==='Escape'){if(!modal.hidden)closeModal();else if(dressOpen)closeDress();}
  const ae=document.activeElement;if(ae&&ae.tagName==='BUTTON')return;
  if(e.key===' '){e.preventDefault();if(dlgAdv)dlgAdv();else jumpReq=true;}
  if(e.key==='e'||e.key==='E'||e.key==='Enter'||e.key==='z'||e.key==='Z'){e.preventDefault();doAction();}});
addEventListener('keyup',e=>{if(KM[e.key])keys[KM[e.key]]=false;if(e.key==='Shift')keys.run=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const joyEl=$('#joy'),knob=$('#knob');
joyEl.addEventListener('pointerdown',e=>{joy.id=e.pointerId;joyEl.setPointerCapture(e.pointerId);moveJoy(e);});
joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joy.id)moveJoy(e);});
const endJoy=e=>{if(e.pointerId!==joy.id)return;joy.id=null;joy.x=joy.y=0;knob.style.transform='';};joyEl.addEventListener('pointerup',endJoy);joyEl.addEventListener('pointercancel',endJoy);
function moveJoy(e){const r=joyEl.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const l=Math.hypot(dx,dy),m=48;if(l>m){dx*=m/l;dy*=m/l;}joy.x=dx/m;joy.y=dy/m;knob.style.transform=`translate(${dx}px,${dy}px)`;}
$('#actBtn').addEventListener('pointerdown',e=>e.preventDefault());$('#actBtn').onclick=()=>doAction();
$('#jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();jumpReq=true;});
document.querySelectorAll('.hbtn').forEach(b=>b.addEventListener('pointerdown',e=>e.preventDefault()));
$('#bMenu').onclick=openMenu;$('#qtrack').onclick=()=>{if(!busy&&mode==='world')openQuests();};$('#bMission').onclick=()=>{if(!busy)openMissions();};$('#mini').onclick=()=>{if(!busy&&mode==='world')openMap();};
const ptrs=new Map();let pinch0=0,downAt=null;
canvas.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});downAt={x:e.clientX,y:e.clientY,moved:false};if(dlgAdv&&mode==='world'){dlgAdv();downAt=null;}if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);if(mode==='home'&&HOME.drag){HOME.drag=null;applyRoom();}}
  else if(mode==='home')homeDragStart(e);});
canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;const C=mode==='home'?HOME:cam;
  if(mode==='home'&&HOME.drag&&HOME.drag.pid===e.pointerId){if(downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)>6){downAt.moved=true;homeDragMove(e);}return;} /* dragging furniture, not the camera */
  if(ptrs.size===1){if(downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)>6)downAt.moved=true;if(downAt&&downAt.moved&&FP.on){FP.yaw=clamp(FP.yaw-dx*.006,-2.4,2.4);FP.pitch=clamp(FP.pitch-dy*.004,-1.1,1.1);camDragT=time;}
    else if(downAt&&downAt.moved){C.yaw-=dx*.006;camDragT=time;C.pitch=clamp(C.pitch+dy*.004,mode==='home'?.35:curRoom?.5:CAM_PITCH_MIN,mode==='home'?1.3:curRoom?1.15:CAM_PITCH_MAX);}}
  else if(ptrs.size===2){const[a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0){C.dist=clamp(C.dist*pinch0/d,mode==='home'?7:curRoom?7*FOV_K:CAM_DIST_MIN,mode==='home'?20:curRoom?16*FOV_K:CAM_DIST_MAX);}pinch0=d;if(downAt)downAt.moved=true;}});
const pUp=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=0;if(mode==='home'&&HOME.drag&&HOME.drag.pid===e.pointerId)homeDragEnd();if(downAt&&!downAt.moved&&mode==='home'&&ptrs.size===0)homeTap(e.clientX,e.clientY);if(ptrs.size===0)downAt=null;};
canvas.addEventListener('pointerup',pUp);canvas.addEventListener('pointercancel',pUp);
canvas.addEventListener('wheel',e=>{e.preventDefault();const C=mode==='home'?HOME:cam;C.dist=clamp(C.dist*(1+e.deltaY*.001),mode==='home'?7:curRoom?7*FOV_K:CAM_DIST_MIN,mode==='home'?20:curRoom?16*FOV_K:CAM_DIST_MAX);},{passive:false});
let target=null;
function doAction(){if(mode!=='world')return;if(dlgAdv){dlgAdv();return;}if(busy)return;if(P.riding){if(P.riding.act)P.riding.act();else if(!P.riding.upd)endRide();return;}if(target){sfx('tap');target.fn();}}

/* ===== update ===== */
let time=0,saveT=0,areaT2=0,curArea='',miniT=0,exiting=false;
const marker=mk(G.coneDown,ME(0xff6f91),.28,.45,.28,0,-10,0,null,false);
function updatePlayer(dt){
  /* playground rides (athletic.js): the ride moves the player itself */
  if(P.riding&&P.riding.upd){if(P.blob)P.blob.visible=false;const R=P.riding;if(jumpReq&&R.jumpExit&&!busy){jumpReq=false;R.exit();return;}jumpReq=false;R.upd(dt);
    P.model.position.copy(P.pos);P.model.rotation.y=P.rot;P.model.userData.body.rotation.set(0,0,0);P.model.userData.body.scale.set(1,1,1);animChar(P.model,P.t+=dt,false,!!R.air);return;}
  if(P.riding){if(P.blob)P.blob.visible=false;const g=W.gond[P.riding.i],wp=new V3();g.getWorldPosition(wp);P.pos.set(wp.x,wp.y-1.6,wp.z);P.riding.t+=dt;if(P.riding.t>2*Math.PI/.22)endRide();P.model.position.copy(P.pos);P.model.rotation.y=Math.PI/2;P.model.userData.body.rotation.set(0,0,0);P.model.userData.body.scale.set(1,1,1);animChar(P.model,P.t+=dt,false,false);return;}
  let ix=0,iy=0;if(!busy&&mode==='world'){ix=(keys.r?1:0)-(keys.l?1:0)+joy.x;iy=(keys.u?1:0)-(keys.d?1:0)-joy.y;}
  const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=-fz,rz=fx;let vx=rx*ix+fx*iy,vz=rz*ix+fz*iy;const len=Math.hypot(vx,vz);P.moving=false;P.running=false;P.mag=Math.min(1,len);P.input=len>.08||jumpReq;
  if(len>.08){const mag=Math.min(1,len),sp=(keys.run||mag>.95&&joy.id!=null?9.5:7)*mag;P.running=sp>9;vx/=len;vz/=len;P.rot=lerpAng(P.rot,Math.atan2(vx,vz),1-Math.exp(-dt*TURN_RATE));
    const ox=P.pos.x,oz=P.pos.z,nx=ox+vx*sp*dt,nz=oz+vz*sp*dt;if(!blocked(nx,oz))P.pos.x=nx;if(!blocked(P.pos.x,nz))P.pos.z=nz;resolve(P.pos,.5);if(blocked(P.pos.x,P.pos.z)){P.pos.x=ox;P.pos.z=oz;}P.moving=Math.hypot(P.pos.x-ox,P.pos.z-oz)>.001;}
  if(jumpReq)P.jumpT=time;if(P.ground&&!busy)athBounce(); /* trampoline */
  if(jumpReq&&P.ground&&!busy){P.vy=9.5;P.ground=false;sfx('jump');}jumpReq=false;
  const wasGround=P.ground,y0=P.pos.y;
  P.vy-=24*dt;P.pos.y+=P.vy*dt;const g=groundAt(P.pos.x,P.pos.z,P.pos.y);if(P.pos.y<=g){P.pos.y=g;P.vy=0;P.ground=true;}else P.ground=P.pos.y-g<.05;
  if(!P.ground&&wasGround&&P.vy<=0&&y0-g<=STEP_DOWN){P.pos.y=g;P.vy=0;P.ground=true;} /* walking down steps: stay on the ground */
  /* the body snaps a whole step at once; the model eases over it so going up / down stairs looks smooth */
  const sy=P.visY==null||!P.ground||Math.abs(P.visY-P.pos.y)>.7?P.pos.y:P.visY+(P.pos.y-P.visY)*(1-Math.exp(-dt*18));P.visY=sy;
  P.t+=dt;P.model.position.set(P.pos.x,sy,P.pos.z);P.model.rotation.y=P.rot;animPlayer(dt);
  if(!P.blob)P.blob=makeBlob(.62);P.blob.visible=true;const bs=.62*clamp(1-(P.pos.y-g)*.12,.45,1);P.blob.position.set(P.pos.x,g+.045,P.pos.z);P.blob.scale.set(bs,1,bs);}
function findTarget(){let best=null,bd=1e9;const px=P.pos.x,pz=P.pos.z;
  for(const n of npcs){const d=Math.hypot(n.pos.x-px,n.pos.z-pz);if(d<2.8&&d<bd){bd=d;best={label:n.f.role==='school'?'[授|じゅ][業|ぎょう]':n.f.role?'お[店|みせ]':'[話|はな]す',fn:()=>talkTo(n),x:n.pos.x,z:n.pos.z,y:3.3,npc:n};}}
  for(const it of INTER){if(it.cond&&!it.cond())continue;const d=Math.hypot(it.x-px,it.z-pz);if(d<it.r&&d<bd&&(P.pos.y<3||it.high)){bd=d;best=it;}}
  for(const b of W.bugs){if(!b.on)continue;const d=Math.hypot(b.g.position.x-px,b.g.position.z-pz);if(d<2.6&&d<bd){bd=d;best={label:'つかまえる',fn:()=>bugGame(b),x:b.g.position.x,z:b.g.position.z,y:b.g.position.y+1.2};}}
  for(const s of W.shells){if(!s.on)continue;const d=Math.hypot(s.g.position.x-px,s.g.position.z-pz);if(d<2&&d<bd){bd=d;best={label:'ひろう',fn:()=>shellGame(s),x:s.g.position.x,z:s.g.position.z,y:1.4};}}
  return best;}
const athState={t:0,run:false};
function updateWorld(dt){
  W.water.forEach(w=>{if(w.tex)w.tex.offset.y+=w.v*dt;if(w.ring){const s=.6+((time*.6)%1)*.8;w.ring.scale.set(s,s,s);w.ring.material.opacity=.7-((time*.6)%1)*.7;}});
  W.foam.material.opacity=.45+Math.sin(time*1.5)*.2;W.foam.position.z=72.4+Math.sin(time*1.5)*.3;
  for(let i=0;i<48;i++){const ph=(time*.8+i/48)%1,a=i*2.4,r=ph*2.6;dummy.position.set(Math.cos(a)*r,2.7+4.8*ph*(1-ph)-2*ph,Math.sin(a)*r);dummy.scale.setScalar(.09);dummy.rotation.set(0,0,0);dummy.updateMatrix();W.drops.setMatrixAt(i,dummy.matrix);}W.drops.instanceMatrix.needsUpdate=true;
  W.fw.rotation.x+=.22*dt;W.gond.forEach(g=>g.rotation.x=-W.fw.rotation.x);W.carousel.rotation.y+=.5*dt;W.horses.forEach((h,i)=>h.position.y=1.3+Math.sin(time*2.5+i)*.3);W.cups.rotation.y+=.6*dt;W.cups.children.forEach(c=>c.rotation.y+=2*dt);
  W.clouds.forEach(c=>{c.position.x+=1.4*dt;if(c.position.x>220)c.position.x=-220;});W.flag.rotation.y=Math.sin(time*2)*.25;if(W.mill)W.mill.rotation.z+=.45*dt;if(W.wheel)W.wheel.rotation.x-=.7*dt;
  W.gates.forEach(g=>{if(g.anim>0){g.anim-=dt;g.m.position.y=-1.8+3.5*Math.max(0,g.anim/1.5);g.rune.position.y=g.m.position.y+.3;if(g.anim<=0)g.rune.visible=false;}});
  W.bugs.forEach(b=>{if(!b.on)return;b.t+=dt;b.a+=(Math.random()-.5)*dt*3;const x=b.g.position.x+Math.cos(b.a)*1.3*dt,z=b.g.position.z+Math.sin(b.a)*1.3*dt;if(Math.hypot(x-b.cx,z-b.cz)>6)b.a+=Math.PI*dt*4;else{b.g.position.x=x;b.g.position.z=z;}b.g.position.y=1.3+Math.sin(b.t*2)*.35;b.g.rotation.y=-b.a+Math.PI/2;const f=Math.sin(b.t*18)*.9;b.wl.rotation.z=f;b.wr.rotation.z=-f;});
  W.shells.forEach(s=>{s.sp.rotation.y+=dt*2;s.sp.position.y=.5+Math.sin(time*3)*.12;});
  const hp=new V3(P.pos.x,P.pos.y+1,P.pos.z);
  W.shards.forEach(s=>{if(S.st.shards.includes(s.i)){s.m.visible=false;return;}s.m.rotation.y+=dt*2;s.m.position.y=s.y+Math.sin(time*2+s.i)*.2;if(hp.distanceTo(s.m.position)<1.5){S.st.shards.push(s.i);S.yen+=5;addXP(10);sfx('star');toast(`[星|ほし]の かけらを [見|み]つけた！ (${S.st.shards.length}/15) どんぐり 5こ`);
    if(S.st.shards.length>=15&&!S.own.acc.includes('star')){S.own.acc.push('star');toast('かけらが [全|ぜん][部|ぶ] そろった！ 「[星|ほし]の ペンダント」を もらったよ');confetti(60);}checkAch();save();}});
  W.stars.forEach(s=>{s.m.visible=!s.got;if(s.got)return;s.m.rotation.y+=dt*2.5;if(hp.distanceTo(s.m.position)<1.4){s.got=true;sfx('star');if(!athState.run){athState.run=true;athState.t=0;}const left=W.stars.filter(x=>!x.got).length;
    if(left){toast(`[星|ほし] ゲット！ あと ${left}こ`);}else{athState.run=false;const t=Math.round(athState.t);const best=!S.st.athBest||t<S.st.athBest;if(best)S.st.athBest=t;S.st.ath++;S.yen+=15;addXP(30);ev('ath');athStamp('stars');checkAch();save();confetti(50);sfx('fan');toast(`[全|ぜん][部|ぶ] [集|あつ]めた！ ${t}びょう${best?'（[最|さい][高|こう] [記|き][録|ろく]！）':''} どんぐり 15こ`);later(()=>W.stars.forEach(x=>x.got=false),4000);}}});
  if(athState.run)athState.t+=dt;updatePlay(dt);}
/* athletic area: camera swings around by itself — behind the player while walking forward (sideways/backward input doesn't pull it,
   so it never spins in circles), along the ride while on the slide / zip line, from the side on the swing; waits a bit after a manual drag */
let camDragT=-99;
function camAuto(dt){if(camMode!=='follow'||curRoom||mode!=='world'||busy||time-camDragT<CAM_AUTO_WAIT)return;
  if(Math.hypot(P.pos.x+76,P.pos.z+32)>24)return;const R=P.riding;
  if(R&&R.upd){const want=R.jumpExit?Math.PI/2:P.rot+Math.PI;cam.yaw=lerpAng(cam.yaw,want,1-Math.exp(-dt*CAM_AUTO_RIDE_RATE));return;}
  if(R||!P.moving)return;const fwd=-Math.sin(P.rot)*Math.sin(cam.yaw)-Math.cos(P.rot)*Math.cos(cam.yaw); /* 1 = walking away from the camera */
  if(fwd>0)cam.yaw=lerpAng(cam.yaw,P.rot+Math.PI,1-Math.exp(-dt*CAM_AUTO_RATE*fwd*P.mag));}
/* first person while on a ride (slide, zip line, swing, ferris wheel): eye at the character's head, looking where the ride goes.
   Drag to look around; the look eases back to the front a little after letting go. The character is hidden, the world is flat (no bend). */
const FP={on:false,yaw:0,pitch:0};
function fpBase(){const R=P.riding;
  if(R&&R.upd){if(R.jumpExit)return [P.rot,(SW.ang[SW.rider]||0)*.8];return [P.rot,-.3];} /* swing: look up / down with the seat; slide & zip: a bit down the slope */
  return [P.model.rotation.y,-.1];}                                                      /* ferris wheel: out of the gondola */
function updateFP(dt){const want=RIDE_FP&&camMode==='follow'&&mode==='world'&&!curRoom&&!!P.riding;
  if(want!==FP.on){FP.on=want;FP.yaw=FP.pitch=0;P.model.visible=!want;camera.fov=want?FP_FOV:CAM_FOV;camera.updateProjectionMatrix();
    if(!want){cam.yaw=P.rot+Math.PI;cam.tgt.set(P.pos.x,P.pos.y+1.3,P.pos.z);}}
  if(!FP.on)return false;
  if(time-camDragT>CAM_AUTO_WAIT){const k=Math.exp(-dt*2);FP.yaw*=k;FP.pitch*=k;}
  const[by,bp]=fpBase(),th=by+FP.yaw,ph=clamp(bp+FP.pitch,-1.3,1.3),e=new V3(P.pos.x,P.pos.y+FP_EYE,P.pos.z);
  camera.position.copy(e);camera.lookAt(e.x+Math.sin(th)*Math.cos(ph),e.y+Math.sin(ph),e.z+Math.cos(th)*Math.cos(ph));
  cam.yaw=P.rot+Math.PI;updateCurve(true);updateOcc(false);
  sun.position.set(P.pos.x+sunOff.x,sunOff.y,P.pos.z+22);sun.target.position.copy(P.pos);return true;}
function updateCam(dt){if(updateFP(dt))return;camAuto(dt);const t=cam.tgt;t.lerp(new V3(P.pos.x,P.pos.y+1.3,P.pos.z),Math.min(1,dt*8));let yaw=cam.yaw,pitch=cam.pitch,dist=cam.dist;
  if(camMode!=='title'&&!curRoom){cam.pitch=clamp(cam.pitch,CAM_PITCH_MIN,CAM_PITCH_MAX);if(!P.riding)cam.dist=clamp(cam.dist,CAM_DIST_MIN,CAM_DIST_MAX);pitch=cam.pitch;dist=cam.dist;}
  if(camMode==='title'){yaw=P.rot+.5+Math.sin(time*.3)*.3;pitch=TITLE_PITCH;dist=7.5*FOV_K;t.set(P.pos.x,P.pos.y+1.3,P.pos.z);}
  else if(curRoom){cam.yaw=clamp(cam.yaw,-.55,.55);cam.pitch=clamp(cam.pitch,.5,1.15);cam.dist=clamp(cam.dist,7*FOV_K,16*FOV_K);yaw=cam.yaw;pitch=cam.pitch;dist=cam.dist;
    t.set((curRoom.cx+P.pos.x)/2,1.2,(curRoom.cz+P.pos.z)/2+.5);}
  if(camMode==='dress'){yaw=P.rot+.35;pitch=.15;dist=4.4*FOV_K;t.set(P.pos.x,P.pos.y+1.3,P.pos.z);}
  /* below 0°: "look up" mode — camera sinks to near the ground, comes a bit closer, and tilts upward (g = 0 at 0°, 1 at the lowest) */
  let g=0;if(camMode==='follow'&&!curRoom&&pitch<0){g=Math.min(1,pitch/CAM_PITCH_MIN);dist*=1-(1-CAM_LOW_NEAR)*g;pitch=0;}
  camera.position.set(t.x+Math.sin(yaw)*Math.cos(pitch)*dist,t.y+Math.sin(pitch)*dist,t.z+Math.cos(yaw)*Math.cos(pitch)*dist);
  if(g>0)camera.position.y=t.y-(t.y-(P.pos.y+CAM_EYE_LOW))*g;if(camera.position.y<.4)camera.position.y=.4;
  /* title: look at the ground a bit in front of the character so it sits in the strip above the title card (no sky) */
  if(camMode==='title'){const hx=camera.position.x-P.pos.x,hz=camera.position.z-P.pos.z,hl=Math.hypot(hx,hz)||1;camera.lookAt(P.pos.x+hx/hl*2.2,P.pos.y,P.pos.z+hz/hl*2.2);}
  else if(g>0){const hd=Math.hypot(t.x-camera.position.x,t.z-camera.position.z);camera.lookAt(t.x,camera.position.y+(t.y-camera.position.y)+Math.tan(CAM_LOOKUP_MAX*g)*hd,t.z);}
  else camera.lookAt(t);updateCurve(!!curRoom);updateOcc(camMode==='follow'&&mode==='world'&&!P.riding);
  sun.position.set(P.pos.x+sunOff.x,sunOff.y,P.pos.z+22);sun.target.position.copy(P.pos);}
/* ===== time of day (follows the real clock) ===== */
const sunOff={x:30,y:55};let todNight=0;
/* [hour, sky top, sky bottom, fog/air, sun color, sun intensity, hemi intensity, night 0-1, hemi sky, hemi ground]
   day = pastel & warm, shade = lavender; night = blue-purple sky and air */
/* toon note: lit step ≈ sun + hemi, so keep that near 1.1 or pale colors clip to flat white */
/* night: brighter, bluer moonlight + lavender sky light so the village reads blue-purple, not grey */
const TODK=[[0,'#231f5c','#4b3f8f',0x3a3272,0xa4b4ff,.24,.6,1,0x8c88ff,0x5a4fa8],
  [5,'#3d3a86','#f2b0a0',0x9a88b8,0xffb890,.3,.5,.7,0xc8b0e8,0x8a78b0],
  [7,'#8fd0f5','#ffeedd',0xf6ead8,0xffe6c4,.55,.54,0,0xf0e8ff,0xc8b8e6],
  [12,'#86cbf3','#fff4e2',0xfaf0dc,0xfff1d8,.58,.55,0,0xf2ecff,0xcbbbe8],
  [16.5,'#90c8ef','#ffe8c8',0xf6e2c8,0xffdcb0,.56,.54,0,0xf2e6ff,0xc8b4e0],
  [18.3,'#6a64b8','#ffaf86',0xd8a090,0xff9e6a,.42,.5,.45,0xd8b8f0,0x9a80c0],
  [19.6,'#231f5c','#4b3f8f',0x3a3272,0xa4b4ff,.24,.6,1,0x8c88ff,0x5a4fa8],
  [24,'#231f5c','#4b3f8f',0x3a3272,0xa4b4ff,.24,.6,1,0x8c88ff,0x5a4fa8]];
let testHour=null; /* test-only override from the menu (not saved) */
/* せっていの 「そらの じかん」： えらんだ じかんの とき（'real' は ほんとうの とけい） */
const TOD_H={morning:7.5,day:12,evening:18.2,night:21.5};
function applyTOD(){const d=new Date();const h=testHour!=null?testHour:TOD_H[S.tod]!=null?TOD_H[S.tod]:d.getHours()+d.getMinutes()/60;let i=0;while(i<TODK.length-2&&h>=TODK[i+1][0])i++;const A=TODK[i],B=TODK[i+1],t=(h-A[0])/(B[0]-A[0]);
  const C=(a,b)=>new THREE.Color(a).lerp(new THREE.Color(b),t),L=(a,b)=>a+(b-a)*t;const top=C(A[1],B[1]),bot=C(A[2],B[2]);todNight=L(A[7],B[7]);
  const c=skyTex.image.getContext('2d'),g=c.createLinearGradient(0,0,0,256);g.addColorStop(0,'#'+top.getHexString());g.addColorStop(1,'#'+bot.getHexString());c.fillStyle=g;c.fillRect(0,0,64,256);
  if(todNight>.3){c.fillStyle=`rgba(255,255,230,${todNight*.8})`;for(let k=0;k<26;k++){const x=(k*37)%64,y=(k*53)%150;c.fillRect(x,y,1,1);}}skyTex.needsUpdate=true;
  scene.fog.color.copy(C(A[3],B[3]));sun.color.copy(C(A[4],B[4]));sun.intensity=L(A[5],B[5]);hemi.intensity=L(A[6],B[6]);hemi.color.copy(C(A[8],B[8]));hemi.groundColor.copy(C(A[9],B[9]));
  GLOWMAT.opacity=todNight*.7;LAMPPOST.emissiveIntensity=LAMPBASE.emissiveIntensity=todNight*.22;if(W.glow)W.glow.visible=todNight>.03;
  sunOff.x=clamp((h-12)*-6,-40,40)||30;sunOff.y=Math.max(25,58-Math.abs(h-12)*3.5);
  WINMAT.emissiveIntensity=todNight*.9;LAMPMAT.emissiveIntensity=.3+todNight*1.3;
  /* indoors: about the same light as the redecorating screen (hemi .6 + sun .5 ≈ 1.1) so wallpaper / floor / furniture colours look the same in both.
     (it used to add up to ≈2 with the room lamp, which washed pale wallpaper and floors out to white / yellow) */
  if(curRoom){hemi.intensity=ROOM_HEMI;hemi.color.set(0xfff4e6);hemi.groundColor.set(0xd8c8e8);sun.intensity=ROOM_SUN;WINMAT.emissiveIntensity=Math.max(.2,todNight*.3);}}
function areaName(x,z){if(z>72)return Math.hypot(x-70,z-108)<17?'[宝|たから][島|じま]':'[海|うみ]';for(const r of REG)if(r.c&&Math.hypot(x-r.c[0],z-r.c[1])<r.c[2])return r.n;if(z>53)return '[砂|すな]はま';if(x>46)return 'どんぐりの [森|もり]';if(x>34)return 'せせらぎの [川|かわ]';
  if(Math.hypot(x,z)<13)return '[広|ひろ][場|ば] [公|こう][園|えん]';if(Math.abs(x)<16&&z<-12&&z>-42)return 'どんぐり [学|がっ][校|こう]';if(Math.abs(x)<23&&z>21&&z<40)return '[商|しょう][店|てん][街|がい]';if(Math.hypot(x+26,z+6)<8)return '[私|わたし]の [家|いえ]';return '';}

/* ===== map ===== */
const MAPC=document.createElement('canvas');MAPC.width=MAPC.height=480;
function m2(x,z,s){return [(x+125)/250*s,(z+125)/250*s];}
function buildMapBase(){const c=MAPC.getContext('2d'),s=480;c.fillStyle='#8fd16f';c.fillRect(0,0,s,s);c.fillStyle='#5aa84d';let[a,b]=m2(46,-125,s);c.fillRect(a,b,s-a,m2(0,53,s)[1]-b);
  c.fillStyle='#f3dfa6';c.fillRect(0,m2(0,53,s)[1],s,m2(0,72,s)[1]-m2(0,53,s)[1]);c.fillStyle='#5ab9e8';c.fillRect(0,m2(0,72,s)[1],s,s);c.fillRect(m2(37,0,s)[0],0,m2(43,0,s)[0]-m2(37,0,s)[0],m2(0,74,s)[1]);
  c.fillStyle='#f3dfa6';c.beginPath();[a,b]=m2(70,108,s);c.arc(a,b,16/250*s,0,7);c.fill();c.fillStyle='#ead3a0';ROADS.forEach(r=>{const p=m2(r[0],r[2],s),q=m2(r[1],r[3],s);c.fillRect(p[0],p[1],Math.max(2,q[0]-p[0]),Math.max(2,q[1]-p[1]));});
  c.fillStyle='#c97b63';boxes.forEach(bx=>{if(bx.plat||bx.top<99)return;const p=m2(bx.x0,bx.z0,s),q=m2(bx.x1,bx.z1,s);if(q[0]-p[0]>2.5&&q[1]-p[1]>2.5)c.fillRect(p[0],p[1],q[0]-p[0],q[1]-p[1]);});}
function drawMap(cv,big){const c=cv.getContext('2d'),s=cv.width;c.drawImage(MAPC,0,0,s,s);c.textAlign='center';c.textBaseline='middle';
  REG.forEach(r=>{if(!r.c)return;const[a,b]=m2(r.c[0],r.c[1],s);c.strokeStyle=regLocked(r)?'rgba(80,60,40,.6)':'#ff6f91';c.lineWidth=big?4:3;c.beginPath();c.arc(a,b,r.c[2]/250*s,0,7);c.stroke();if(regLocked(r)){c.font=`${big?34:22}px sans-serif`;c.fillText('🔒',a,b);}});
  if(regLocked(REG[2])){const[a,b]=m2(70,108,s);c.font=`${big?34:22}px sans-serif`;c.fillText('🔒',a,b);}
  if(big){c.font='900 18px "Zen Maru Gothic",sans-serif';c.fillStyle='#4a3523';[['[公|こう][園|えん]',0,0],['[学|がっ][校|こう]',0,-34],['[商|しょう][店|てん][街|がい]',0,31],['[私|わたし]の [家|いえ]',-26,-6],['[森|もり]',82,-50],['[川|かわ]',40,-80],['[砂|すな]はま',-20,63],['[宝|たから][島|じま]',70,100],['アスレチック',-70,-25],['[遊|ゆう][園|えん][地|ち]',-72,30],['[遺|い]せき',-30,-96],['どんぐりどおり',-39.5,24],['[風|ふう][車|しゃ]',-39.5,47],['[水|すい][車|しゃ]ごや',31,-37]].forEach(([n,x,z])=>{const[a,b]=m2(x,z,s);c.lineWidth=5;c.strokeStyle='#fffbef';n=kj(n);c.strokeText(n,a,b-16);c.fillText(n,a,b-16);});
    c.font='22px sans-serif';FRIENDS.forEach(f=>{const[a,b]=m2(f.x,f.z,s);c.fillText(f.em,a,b+6);});c.fillStyle='#ffc400';c.font='18px sans-serif';SHARDS.forEach((p,i)=>{if(S.st.shards.includes(i))return;});}
  questMapMark(c,s);const pp=curRoom?DOORS[curRoom.id]:P.pos;const[a,b]=m2(pp.x,pp.z,s);c.save();c.translate(a,b);c.rotate(-P.rot+Math.PI);c.fillStyle='#ff3d6e';c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();const k=big?14:16;c.moveTo(0,-k);c.lineTo(k*.7,k*.7);c.lineTo(-k*.7,k*.7);c.closePath();c.stroke();c.fill();c.restore();}

/* ===== loop ===== */
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  if(mode==='home'){updateCurve(true);updateOcc(false);HOME.cam.position.set(Math.sin(HOME.yaw)*Math.cos(HOME.pitch)*HOME.dist,Math.sin(HOME.pitch)*HOME.dist+.5,Math.cos(HOME.yaw)*Math.cos(HOME.pitch)*HOME.dist);HOME.cam.lookAt(0,.8,0);if(HOME.avatar)animChar(HOME.avatar,time,false,false);renderer.render(HOME.scene,HOME.cam);}
  else{updatePlayer(dt);updateNPCs(dt);updateWorld(dt);updateCam(dt);updateLife(dt);updateSeasonFX(dt);updateAmbience(dt);
    if(mode==='world'){target=busy||P.riding?null:findTarget();const ab=$('#actBtn'),lab=P.riding?(P.riding.upd?(P.riding.label||'…'):'おりる'):target?target.label:'A';if(ab.textContent!==lab)ab.textContent=lab;ab.classList.toggle('ready',!!target||!!P.riding);
      updateTalkBubble(dt);
      if(target&&target.y!=null&&!target.npc){marker.position.set(target.x,target.y+Math.sin(time*5)*.15,target.z);marker.rotation.y+=dt*2;}else marker.position.y=-10;
      if(curRoom&&!busy&&P.pos.z>curRoom.z1-.5&&Math.abs(P.pos.x-curRoom.cx)<1.2&&!exiting){exiting=true;exitRoom();later(()=>exiting=false,600);}
      updateQuests();
      areaT2+=dt;if(areaT2>.5&&!curRoom){areaT2=0;const n=areaName(P.pos.x,P.pos.z);if(n&&n!==curArea)areaToast(n);curArea=n;}
      miniT+=dt;if(miniT>.15){miniT=0;drawMap($('#mini'),false);}
      saveT+=dt;if(saveT>8){saveT=0;save();}
      if(P.pos.y<-5)P.pos.set(0,0,15);}
    if(Math.floor(time)%30===0&&Math.floor(time-dt)%30!==0){drawSchoolClock();applyTOD();applySeason();}
    renderWorld();}
  requestAnimationFrame(loop);}

/* ===== title & boot ===== */
function markSel(){document.querySelectorAll('#pickGrade button').forEach(b=>b.classList.toggle('sel',+b.dataset.g===S.grade));document.querySelectorAll('#pickAnimal button').forEach(b=>b.classList.toggle('sel',b.dataset.a===S.look.animal));}
/* ===== accounts on the title: pick who plays, add / rename / delete ===== */
function accInfo(id){try{const L=JSON.parse(localStorage.getItem(accKey(id))||'null');if(L&&L.look)return {em:(ANIMALS[L.look.animal]||{}).em||'🙂',lv:L.level||1,g:L.grade||1};}catch(e){}return null;}
function accSwitch(id){if(mode!=='title')save();NO_SAVE=true;ACC.cur=id;accSave();if(location.hash)history.replaceState(null,'',location.pathname+location.search);location.reload();}
let accEdit=false,accForm=null; /* accForm: {kind:'new'|'rename'|'del', id} */
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
function renderAccounts(){const box=$('#pickAcc'),fm=$('#accForm');box.innerHTML='';
  ACC.list.forEach(a=>{const cur=a.id===ACC.cur,inf=cur?(hadSave?{em:ANIMALS[S.look.animal].em,lv:S.level,g:S.grade}:null):accInfo(a.id);
    const w=el('div','acc');const b=el('button',cur?'sel':'');b.type='button';
    b.append(el('span','pe',inf?inf.em:'🌱'),el('span','an',a.name),el('small','',inf?`${inf.g}[年|ねん][生|せい]・レベル${inf.lv}`:'[新|あたら]しい'));
    b.onclick=()=>{if(accEdit)return;if(!cur)accSwitch(a.id);};w.append(b);
    if(accEdit){const t=el('div','acc-ed');const r=el('button','','✏️');r.type='button';r.title='なまえを [変|か]える';r.onclick=()=>{accForm={kind:'rename',id:a.id};renderAccounts();};t.append(r);
      if(ACC.list.length>1){const d=el('button','','🗑️');d.type='button';d.title='けす';d.onclick=()=>{accForm={kind:'del',id:a.id};renderAccounts();};t.append(d);}w.append(t);}
    box.append(w);});
  if(!accEdit&&ACC.list.length<8){const w=el('div','acc');const b=el('button','add');b.type='button';b.append(el('span','pe','➕'),el('span','an','[新|あたら]しく つくる'));b.onclick=()=>{accForm={kind:'new'};renderAccounts();};w.append(b);box.append(w);}
  $('#accEditBtn').textContent=accEdit?'おわる':'なまえを [変|か]える・けす';
  fm.innerHTML='';fm.hidden=!accForm;if(!accForm)return;
  const close=()=>{accForm=null;renderAccounts();};const A=accForm.id&&ACC.list.find(x=>x.id===accForm.id);
  if(accForm.kind==='del'){fm.append(el('div','',`「${A.name}」を けす？ [遊|あそ]んだ [記|き][録|ろく]も [全|ぜん][部|ぶ] [消|き]えて、もとに もどせないよ。`));
    const row=el('div','btn-row');const no=el('button','big-btn calm','やめる');no.type='button';no.onclick=close;const yes=el('button','big-btn','けす');yes.type='button';
    yes.onclick=()=>{try{localStorage.removeItem(accKey(A.id));}catch(e){}ACC.list=ACC.list.filter(x=>x!==A);accSave();
      if(A.id===ACC.cur)accSwitch(ACC.list[0].id);else{accForm=null;if(ACC.list.length<2)accEdit=false;renderAccounts();}};
    row.append(no,yes);fm.append(row);return;}
  fm.append(el('div','',accForm.kind==='new'?'なまえを [入|い]れてね':'[新|あたら]しい なまえ'));
  const inp=el('input');inp.id='accName';inp.maxLength=10;inp.autocomplete='off';inp.value=A?A.name:'';fm.append(inp);
  const row=el('div','btn-row');const no=el('button','big-btn calm','やめる');no.type='button';no.onclick=close;const ok=el('button','big-btn',accForm.kind==='new'?'つくる':'[変|か]える');ok.type='button';
  const go=()=>{const nm=inp.value.trim().slice(0,10);if(!nm){inp.focus();return;}
    if(accForm.kind==='new'){const id='p'+Date.now().toString(36);ACC.list.push({id,name:nm});accSave();accSwitch(id);}
    else{A.name=nm;accSave();close();}};
  ok.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing)go();};row.append(no,ok);fm.append(row);later(()=>inp.focus(),30);}
function setupAccounts(){$('#accEditBtn').onclick=()=>{accEdit=!accEdit;accForm=null;renderAccounts();};renderAccounts();}
function setupTitle(){setupAccounts();const pa=$('#pickAnimal');Object.entries(ANIMALS).forEach(([id,a])=>{const b=document.createElement('button');b.type='button';b.dataset.a=id;b.innerHTML=`<span class="pe">${a.em}</span>${a.n}`;b.onclick=()=>{S.look.animal=id;rebuildPlayer();markSel();renderAccounts();};pa.appendChild(b);});
  document.querySelectorAll('#pickGrade button').forEach(b=>b.onclick=()=>{if(S.grade!==+b.dataset.g)adaptReset();S.grade=+b.dataset.g;markSel();kjRefresh();});markSel();if(hadSave)$('#startBtn').textContent='[続|つづ]きから [遊|あそ]ぶ！';$('#startBtn').onclick=startGame;}
async function startGame(){initAudio();$('#startBtn').blur();$('#title').hidden=true;mode='world';camMode='follow';cam.yaw=P.rot+Math.PI;cam.pitch=CAM_PITCH;$('#hud').hidden=false;$('#controls').hidden=false;$('#keyhint').hidden=false;setBusy(0);ensureMissions();updateHUD();save();if(S.sound)bgmStart();
  if(!S.intro){S.intro=true;save();const hoo=FR('hoo');await talk(hoo,['ホッホー、 ようこそ どんぐりむらへ！ わしは [学|がっ][校|こう]の ホー[先|せん][生|せい] じゃ。','[村|むら]の [友|とも]だちに [話|はな]しかけると、 クイズや ゲームで [遊|あそ]べるぞ。','[問|もん][題|だい]に [答|こた]えると どんぐりと [経|けい][験|けん][値|ち]が もらえる。 まちがえても だいじょうぶ、 ヒントが でるからのう。','どんぐりで [家|か][具|ぐ]や ふくと [交|こう]かん して、 おうちを すてきに しよう。 レベルが [上|あ]がると [新|あたら]しい [場|ば][所|しょ]にも いけるぞ！','たてものには [入|はい]る ことも できるぞ。 [中|なか]で [困|こま]っている [人|ひと]の 「クエスト」を [手|て][伝|つだ]って あげてごらん。','まずは [商|しょう][店|てん][街|がい]の [家|か][具|ぐ]やで [家|か][具|ぐ]を かって、 おうちを かざって みよう！ ピンクの やじるしに ついていけば だいじょうぶ。']);startQuest('home1');}updateTracker();
  /* first start: the grade picked on the title is the starting grade (no gift). Later: a higher grade picked on the title is celebrated. */
  if(!S.gradeTop){S.gradeTop=S.grade;save();}else later(gradeUp,600);}
function boot(){try{applyQuality();buildWorld();buildMapBase();setupHome();spawnNPCs();buildRooms();qInit();applyTOD();initLife();applySeason(true);initFX();
  P.pos.set(S.pos[0],0,S.pos[1]);if(blocked(P.pos.x,P.pos.z))P.pos.set(0,0,15);P.rot=S.rot||Math.PI;rebuildPlayer();
  S.st.gates.forEach((g,i)=>{if(g)openGate(i,false);});refreshRegions();setupTitle();kjRefresh();addEventListener('resize',resize);resize();
  document.addEventListener('visibilitychange',()=>{if(document.hidden){bgmStop();save();}else if(mode!=='title'&&S.sound)bgmStart();});
  $('#loadMsg').hidden=true;if(location.hash==='#play')startGame();else $('#title').hidden=false;requestAnimationFrame(loop);}
  catch(e){$('#loadMsg').textContent='エラーが おきました： '+e.message;console.error(e);}}
if(!window.THREE)$('#loadMsg').textContent='3Dの [読|よ]みこみに [失|しっ][敗|ぱい] しました。 インターネットに つないで、 もう[一|いち][度|ど] [開|ひら]いてね。';
else Promise.race([Promise.all(['900 40px "Zen Maru Gothic"','400 40px "Mochiy Pop One"'].map(f=>document.fonts?document.fonts.load(f):0)),new Promise(r=>setTimeout(r,2500))]).catch(()=>{}).then(boot);
