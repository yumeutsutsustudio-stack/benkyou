'use strict';
/* ===== building interiors (rooms live far east of the map, x>=400) ===== */
const ROOMS={};let curRoom=null;
const roomLight=new THREE.PointLight(0xffe2b0,0,34,1.4);scene.add(roomLight);
/* indoor light (keep the total near 1.1 like the redecorating screen, or pale colours clip to white in toon shading) */
const ROOM_HEMI=.55,ROOM_SUN=.3,ROOM_LAMP=.35;
const plankTex=(c0,c1)=>canvasTex(128,128,(c,w,h)=>{c.fillStyle=c0;c.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){c.fillStyle=c1;c.fillRect(0,y,w,2);const o=(y/16%2)*40;for(let x=o;x<w;x+=80)c.fillRect(x,y,2,16);}for(let i=0;i<60;i++){c.fillStyle='rgba(90,60,30,.06)';c.fillRect(Math.random()*w,Math.random()*h,10,1);}},true);
function emojiSprite(e,s){const t=canvasTex(128,128,c=>{c.font='96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(e,64,70);});const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));sp.scale.set(s||1,s||1,1);return sp;}
function makeRoom(id,o){const i=Object.keys(ROOMS).length,cx=400+i*40,cz=0;
  const R=Object.assign({id,cx,cz,x0:cx-o.w/2,x1:cx+o.w/2,z0:cz-o.d/2,z1:cz+o.d/2,g:new THREE.Group()},o);ROOMS[id]=R;scene.add(R.g);
  const fl=new THREE.Mesh(planeUV(o.w,o.d,o.w/3,o.d/3),Toon({map:o.floorTex||plankTex('#d9a46c','#b9844f')}));fl.rotation.x=-Math.PI/2;fl.position.set(cx,.01,cz);fl.receiveShadow=true;R.g.add(fl);
  box(o.w+1,.4,o.d+1,0x8a6a4a,cx,-.2,cz,R.g);
  const wt=patTex('room_'+id,o.wall[0],o.wall[1],'wall');const wm=Toon({map:wt});const H=4.2;
  const back=new THREE.Mesh(new THREE.PlaneGeometry(o.w,H),wm);back.position.set(cx,H/2,R.z0);back.receiveShadow=true;R.g.add(back);
  [-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(o.d,H),wm);m.position.set(cx+s*o.w/2,H/2,cz);m.rotation.y=-s*Math.PI/2;m.receiveShadow=true;R.g.add(m);box(.3,H,o.d+.3,0xe8d5b5,cx+s*(o.w/2+.15),H/2,cz,R.g);box(.06,.25,o.d,0xffffff,cx+s*(o.w/2-.03),.12,cz,R.g,false);});
  box(o.w+.6,H,.3,0xe8d5b5,cx,H/2,R.z0-.15,R.g);box(o.w,.25,.06,0xffffff,cx,.12,R.z0+.03,R.g,false);box(o.w+.6,.3,.3,0xd9c4a0,cx,H+.15,R.z0-.15,R.g);
  [-1,1].forEach(s=>box(o.w/2-1.3,.5,.25,0xe8d5b5,cx+s*(o.w/4+.65),.25,R.z1,R.g));
  box(2,.04,1,o.mat||0xc0504d,cx,.03,R.z1-.6,R.g,false);textPlane('でぐち',1.2,.35,'#fffbef','#4a3523',R.g,cx,.06,R.z1-.6).rotation.x=-Math.PI/2;
  (o.windows||[-o.w/4,o.w/4]).forEach(x=>{box(2,1.6,.1,0xffffff,cx+x,2.5,R.z0+.06,R.g,false);box(1.75,1.35,.06,WINMAT,cx+x,2.5,R.z0+.1,R.g,false);box(.08,1.35,.1,0xffffff,cx+x,2.5,R.z0+.12,R.g,false);box(2.2,.12,.3,0xffffff,cx+x,1.68,R.z0+.15,R.g,false);});
  [-1,1].forEach(s=>{box(.3,.3,.3,0x8a5a33,cx+s*(o.w/2-.2),3,cz-o.d/4,R.g);mk(G.sph,LAMPMAT,.22,.22,.22,cx+s*(o.w/2-.35),3.25,cz-o.d/4,R.g,false);});
  R.spot={x:cx,z:cz};return R;}
function put(R,id,x,z,rot,sc,col){const g=fb(id);g.position.set(R.cx+x,0,R.cz+z);g.rotation.y=(rot||0)*Math.PI/2;if(sc)g.scale.setScalar(sc);R.g.add(g);if(col!==false)addCircle(R.cx+x,R.cz+z,(col||.5)*(sc||1));return g;}
function rInter(R,x,z,label,fn,y,r,cond){INTER.push({x:R.cx+x,z:R.cz+z,r:r||2.2,y:y||2.4,label,fn,cond});}
function counter(R,z,w,col){box(w,1.1,.9,col||0xb07a45,R.cx,.55,R.cz+z,R.g);box(w+.2,.1,1.1,0xe8c08a,R.cx,1.15,R.cz+z,R.g);addBox(R.cx,R.cz+z,w,.9);
  mk(G.box,ME(0xfff3b0),.5,.35,.3,R.cx+w/2-.6,1.38,R.cz+z,R.g);}
function placeNPC(id,R,x,z,rot){const n=npcs.find(n=>n.f.id===id);n.pos.set(R.cx+x,0,R.cz+z);n.home.copy(n.pos);n.fixed=true;n.rot=rot==null?0:rot;n.f.room=R.id;}

let homeR=null,homeCols=[];
function rebuildHomeRoom(){const R=homeR;if(!R)return;if(R.furn)R.g.remove(R.furn);homeCols.forEach(c=>{const i=circles.indexOf(c);if(i>=0)circles.splice(i,1);});homeCols=[];
  R.furn=new THREE.Group();R.g.add(R.furn);const ox=R.cx-1.2,oz=R.cz-1.2;
  S.room.items.forEach(it=>{const g=fb(it.id);g.position.set(ox+cellP(it.x),0,oz+cellP(it.z));g.rotation.y=it.r*Math.PI/2;R.furn.add(g);if(it.id!=='rug')homeCols.push(addCircle(g.position.x,g.position.z,.5));});
  const w=WALLS[S.room.wall],f=FLOORS[S.room.floor];R.wallMat.map=patTex('w'+S.room.wall,w.c[0],w.c[1],'wall',w.stars);R.wallMat.needsUpdate=true;R.floorMesh.material.map=patTex('f'+S.room.floor,f.c[0],f.c[1],'floor');R.floorMesh.material.needsUpdate=true;}

function buildRooms(){
  /* my home: 8x8 furniture grid (1.2) shifted back-left, free strip right/front */
  homeR=makeRoom('home',{name:'[私|わたし]の [家|いえ]',w:12,d:12,wall:['#fff3dc','#ffe9c4'],mat:0x64b5f6});
  homeR.wallMat=homeR.g.children[2].material;homeR.floorMesh=new THREE.Mesh(new THREE.PlaneGeometry(9.6,9.6),Toon());homeR.floorMesh.rotation.x=-Math.PI/2;homeR.floorMesh.position.set(homeR.cx-1.2,.02,homeR.cz-1.2);homeR.floorMesh.receiveShadow=true;homeR.g.add(homeR.floorMesh);
  box(.8,1.2,.5,0xffd45c,homeR.cx+4.9,.6,homeR.cz-3,homeR.g);textPlane('[模|も][様|よう]がえ',1.4,.4,'#fffbef','#4a3523',homeR.g,homeR.cx+4.9,1.5,homeR.cz-2.74);addCircle(homeR.cx+4.9,homeR.cz-3,.5);
  rInter(homeR,4.9,-2,'[模|も][様|よう]がえ',()=>enterHome(),2.4);
  box(.7,.9,.5,0xef5350,homeR.cx+4.9,.45,homeR.cz+1.5,homeR.g);addCircle(homeR.cx+4.9,homeR.cz+1.5,.45);rInter(homeR,4.9,2.4,'ポスト',()=>openMail(),2);
  rebuildHomeRoom();
  /* school */
  const sc=makeRoom('school',{name:'どんぐり [学|がっ][校|こう]',w:16,d:12,wall:['#fff6e5','#fdebd0'],floorTex:plankTex('#c98f58','#a97240'),mat:0x3f8a35,windows:[-5.5,5.5]});
  box(6,2.4,.12,0x2e5d3b,sc.cx,2.2,sc.z0+.1,sc.g);box(6.3,.12,.3,0xb07a45,sc.cx,.95,sc.z0+.2,sc.g);textPlane('[今日|きょう]も がんばろう！',4,.7,'#2e5d3b','#ffffff',sc.g,sc.cx,2.6,sc.z0+.18);
  const cf=new THREE.Mesh(new THREE.CircleGeometry(.6,24),new THREE.MeshBasicMaterial({map:W.clockTex}));cf.position.set(sc.cx,3.85,sc.z0+.1);sc.g.add(cf);
  put(sc,'desk',0,-3.6,2,1.2,.8);
  for(let r=0;r<2;r++)for(let c=-1;c<=1;c++){put(sc,'desk',c*3.6,-.6+r*2.8,2,1,.7);put(sc,'chair',c*3.6,.3+r*2.8,2,.9,false);}
  put(sc,'shelf',-7.2,-2,1,1.2,.7);put(sc,'shelf',-7.2,.5,1,1.2,.7);put(sc,'globe',6.8,-3.8,0,1.2,.5);put(sc,'plant',6.8,4.4,0,1.3,.4);put(sc,'plant',-6.8,4.4,0,1.3,.4);put(sc,'tank',6.8,-.5,3,1.1,.6);
  rInter(sc,0,-3.4,'こくばん',()=>openSchoolTalk(),3.4,2.6);
  box(2.2,1.4,.06,0xb07a45,sc.cx-7.95+0.05,2.4,sc.cz+2.5,sc.g).rotation.y=Math.PI/2;textPlane('けいじ[板|ばん]',1.6,.4,'#fffbef','#4a3523',sc.g,sc.cx-7.86,3.3,sc.cz+2.5,Math.PI/2);rInter(sc,-6.6,2.5,'みる',()=>openMissions(),3);
  placeNPC('hoo',sc,-2.4,-4.2,0);
  /* furniture shop */
  const fs=makeRoom('shopFurn',{name:'[家|か][具|ぐ]や',w:13,d:10,wall:['#ffe6b8','#fff2d8'],mat:0xe4685c});
  counter(fs,-3.2,4);placeNPC('merry',fs,0,-4.2,0);
  [['sofa',-4.5,-1.2],['piano',4.5,-1.2],['tv',-4.5,2],['xmas',4.5,2],['rocket',-1.8,2.6],['tank',1.8,2.6]].forEach(([id,x,z])=>{box(1.6,.2,1.6,0xf5ead0,fs.cx+x,.1,fs.cz+z,fs.g);put(fs,id,x,z,0,1.1,.9);
    textPlane(`${FURN[id].n} どんぐり${FURN[id].p}こ`,1.8,.4,'#fffbef','#d0661f',fs.g,fs.cx+x,.42,fs.cz+z+.85).rotation.x=-.6;
    rInter(fs,x,z+1.1,'[調|しら]べる',()=>buyOne(id),2.2,1.6);});
  /* clothes shop */
  const cs=makeRoom('shopCloth',{name:'[洋|よう][服|ふく][屋|や]',w:12,d:10,wall:['#e8f0ff','#f4f8ff'],mat:0x5a8ed6});
  counter(cs,-3.2,3.4);placeNPC('kon',cs,0,-4.2,0);
  [['cap',-4,-1],['straw',-4,1.6],['witch',4,-1],['chef',4,1.6]].forEach(([h,x,z])=>{box(1.2,.3,1.2,0xffffff,cs.cx+x,.15,cs.cz+z,cs.g);const m=makeChar({kind:'kuma',fur:0xeeeeee,shirt:0xd7ccc8,hat:h,acc:'none'});m.position.set(cs.cx+x,.3,cs.cz+z);cs.g.add(m);addCircle(cs.cx+x,cs.cz+z,.6);rInter(cs,x,z+1,'みる',()=>openClothes('hat'),2.6,1.5);});
  for(let i=0;i<6;i++)box(.5,.7,.1,Object.values(SHIRTS)[i+3].c,cs.cx-1.6+i*.65,1.5,cs.cz+2.6,cs.g);box(4.2,.06,.06,0x9e9e9e,cs.cx,1.9,cs.cz+2.6,cs.g);[-2.1,2.1].forEach(x=>cyl(.04,1.9,0x9e9e9e,cs.cx+x,.95,cs.cz+2.6,cs.g));addBox(cs.cx,cs.cz+2.6,4.4,.5);rInter(cs,0,3.5,'ふく',()=>openClothes('shirt'),2.4,1.8);
  box(1.4,2.4,.15,0xb07a45,cs.cx+5.9,1.3,cs.cz-1.5,cs.g).rotation.y=Math.PI/2;box(1.1,2,.05,0xd9f2ff,cs.cx+5.8,1.3,cs.cz-1.5,cs.g,false).rotation.y=Math.PI/2;rInter(cs,4.8,-1.5,'[鏡|かがみ]',()=>{closeModal();openDress();},2.8,1.6);
  /* zakka */
  const zs=makeRoom('shopZakka',{name:'[雑|ざっ][貨|か][屋|や]',w:12,d:10,wall:['#e0fff0','#f2fff8'],mat:0x3daf88});
  counter(zs,-3.2,3.4);placeNPC('hana',zs,0,-4.2,0);
  Object.entries(WALLS).forEach(([k,v],i)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.6),Toon({map:patTex('w'+k,v.c[0],v.c[1],'wall',v.stars)}));p.position.set(zs.cx-5.95,1.8,zs.cz-3+i*1.4);p.rotation.y=Math.PI/2;zs.g.add(p);});rInter(zs,-4.8,0,'かべ[紙|がみ]',()=>openZakka('wall'),2.8,2.2);
  Object.entries(FLOORS).forEach(([k,v],i)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),Toon({map:patTex('f'+k,v.c[0],v.c[1],'floor')}));p.rotation.x=-Math.PI/2;p.position.set(zs.cx+2.5+(i%3)*1.5-1.5,.03,zs.cz+.5+Math.floor(i/3)*1.5);zs.g.add(p);});rInter(zs,2.5,1.2,'ゆか',()=>openZakka('floor'),1.5,2.4);
  put(zs,'plant',5,-4,0,1.2,.4);put(zs,'lily',-5,4,0,1.2,.5);put(zs,'globe',5,4,0,1,.4);
  /* friend houses */
  const hm=makeRoom('hMoko',{name:'モコの [家|いえ]',w:11,d:9,wall:['#f2e2ff','#faf2ff'],host:'moko',mat:0x9a6fd6});
  box(3.4,1,.8,0xffffff,hm.cx-3.4,.5,hm.z0+.6,hm.g);box(1.2,1.1,.9,0x9e9e9e,hm.cx-.9,.55,hm.z0+.6,hm.g);box(.8,.5,.05,ME(0xff9a3c),hm.cx-.9,.55,hm.z0+1.06,hm.g,false);addBox(hm.cx-2.4,hm.z0+.6,5.4,.9);
  put(hm,'honey',-4.6,-3.4+.3,0,1,false);put(hm,'table',1.5,0,0,1.2,.7);put(hm,'chair',.4,0,1,1,false);put(hm,'chair',2.6,0,3,1,false);put(hm,'bed',4.3,-2.8,0,1.3,.8);put(hm,'rug',1.5,2.2,0,1.8,false);put(hm,'plant',-4.6,3.4,0,1.2,.4);
  hm.spot={x:hm.cx+1.5,z:hm.cz+1.6};
  const hi=makeRoom('hMii',{name:'ミィの [家|いえ]',w:11,d:9,wall:['#e0fff0','#f0fff8'],host:'mii',mat:0x3daf88});
  put(hi,'cattower',-4,-3,0,1.2,.8);put(hi,'desk',3.6,-3.4,0,1.1,.7);put(hi,'chair',3.6,-2.6,2,.9,false);put(hi,'sofa',-1,-3.2,0,1.3,.9);put(hi,'shelf',4.5,1,3,1.1,.6);put(hi,'rug',0,.5,0,2,false);put(hi,'plant',-4.6,3.2,0,1.2,.4);put(hi,'clock',-4.8,0,1,1.1,.4);
  hi.spot={x:hi.cx,z:hi.cz+1.2};
  const hp=makeRoom('hPochi',{name:'ポチの [家|いえ]',w:11,d:9,wall:['#fff3c4','#fff9e0'],host:'pochi',mat:0xf2a53a});
  put(hp,'tv',0,-3.6,0,1.2,.7);put(hp,'sofa',0,-1,2,1.4,.9);put(hp,'ball',-3.5,1.5,0,1,.4);put(hp,'bed',4.2,-2.8,0,1.3,.8);put(hp,'rug',0,1.8,0,1.9,false);put(hp,'lamp',-4.6,-3.4,0,1,.3);put(hp,'plant',4.6,3.2,0,1.2,.4);
  hp.spot={x:hp.cx-1.5,z:hp.cz+1.5};
}
function buyOne(id){const f=FURN[id];if(S.yen<f.p){return talk(FR('merry'),[`${f.n}は どんぐり ${f.p}こ です。`,`[今|いま] ${S.yen}こ だから、 あと ${f.p-S.yen}こ [集|あつ]めたら かえるよ！`]);}
  payGame({name:f.n,e:f.e,price:f.p,who:FR('merry'),kind:'furn',back:closeModal,onPaid:()=>{S.own.furn[id]=(S.own.furn[id]||0)+1;}});}
function openMail(){const card=openModal();const n=Object.values(S.q||{}).filter(q=>q.done).length;
  card.innerHTML=head('ポスト',null)+`<div class="story">${n?`${S.level>=3?'[遊|ゆう][園|えん][地|ち]の ピョンより：<br>':'ホー[先|せん][生|せい]より：<br>'}いつも [村|むら]の みんなを たすけて くれて ありがとう！ これからも よろしくね。`:'まだ [手|て][紙|がみ]は ないよ。 [村|むら]の みんなの お[手|て][伝|つだ]い（クエスト）を すると、 お[礼|れい]の [手|て][紙|がみ]が [届|とど]くかも！'}</div><div class="btn-row"><button class="big-btn" type="button" data-a="ok">[閉|と]じる</button></div>`;wire(card);onAct(card,{ok:closeModal});}
/* enter / exit */
function fade(fn){const f=$('#fade');f.classList.add('on');later(()=>{fn();later(()=>f.classList.remove('on'),60);},260);}
function enterRoom(id){const R=ROOMS[id];if(!R)return;sfx('tap');fade(()=>{curRoom=R;ROOM=R;P.riding=null;P.pos.set(R.cx,0,R.z1-2);P.rot=Math.PI;P.vy=0;cam.yaw=0;cam.pitch=.82;cam.dist=12.5*FOV_K;cam.tgt.set(R.cx,1.3,R.cz);
  if(R.host){const n=npcs.find(n=>n.f.id===R.host);n.out={p:n.pos.clone(),h:n.home.clone()};n.pos.set(R.spot.x,0,R.spot.z);n.home.copy(n.pos);n.inRoom=true;}
  scene.fog.near=40;scene.fog.far=90;roomLight.position.set(R.cx,7,R.cz+2);roomLight.intensity=ROOM_LAMP;applyTOD();areaToast(R.name);questEvent('enter',id);curArea=R.name;});}
function exitRoom(){const R=curRoom;if(!R)return;fade(()=>{curRoom=null;ROOM=null;const d=DOORS[R.id];P.pos.set(d.x,0,d.z);P.rot=d.face===-1?Math.PI:0;cam.yaw=P.rot+Math.PI;cam.pitch=CAM_PITCH;cam.dist=CAM_DIST;
  if(R.host){const n=npcs.find(n=>n.f.id===R.host);if(n.out){n.pos.copy(n.out.p);n.home.copy(n.out.h);}n.inRoom=false;}
  scene.fog.near=95;scene.fog.far=240;roomLight.intensity=0;applyTOD();curArea='';});}
