'use strict';
/* ===== アスレチック ひろば: playground equipment =====
   すべりだい / ブランコ / トランポリン / ジップライン / いっぽんばし ＋ あそびの スタンプカード
   The area (REG 'ath' in data.js) is a circle at (-76,-32) r24; the old star tower stays at (-70,-25).
   Rides use P.riding = {upd(dt), act?(), label?, jumpExit?, exit?(), air?} (see updatePlayer in main.js). */
const PLAY=[['stars','⭐','ほしあつめ','[高|たか]い だいの [星|ほし]を [全|ぜん][部|ぶ] [集|あつ]めよう'],['slide','🎢','すべりだい','[階|かい][段|だん]を のぼって 「すべる」'],['swing','🌈','ブランコ','[乗|の]って A（こぐ）で たかーく こごう'],
  ['tramp','🤸','トランポリン','はねてる ときに ジャンプで スーパージャンプ'],['zip','🚡','ジップライン','[高|たか]い だいで 「つかまる」'],['beam','🪵','いっぽんばし','スタートから ゴールまで [落|お]ちずに わたろう']];
const PLAY_REWARD={yen:20,xp:40,furn:'slideM'};
const SL={x:-92,z:-27,top:2.4};
const ZP={x0:-96,z0:-37,y0:5.4,x1:-63.6,z1:-46.1,y1:2.4,sag:.7,top:3.6,busy:false,trolley:null};
const SW={z:-48,py:3.6,L:2.7,seats:[-81.6,-78.4],piv:[],ang:[0,0]};
const TR=[{x:-90,z:-43,sq:0},{x:-87,z:-47.5,sq:0}];
const BM={pts:[[-70.5,-38],[-64,-38],[-64,-42],[-58,-42]],top:.6,start:[-71.4,-38],goal:[-56.9,-42],armed:false,walked:false};
let trHint=false;
const zipPt=u=>new V3(ZP.x0+(ZP.x1-ZP.x0)*u,ZP.y0+(ZP.y1-ZP.y0)*u-ZP.sag*Math.sin(Math.PI*u),ZP.z0+(ZP.z1-ZP.z0)*u);

/* ----- build (called from buildAthletic in world.js) ----- */
function buildPlayground(){
  /* round sandy ground for the whole (bigger) area */
  const st=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#d9c39a';c.fillRect(0,0,w,h);for(let i=0;i<2600;i++){c.fillStyle=pick(['#c9ae80','#e6d3ad','#cfb68a']);c.beginPath();c.arc(Math.random()*w,Math.random()*h,1+Math.random()*2.2,0,7);c.fill();}
    c.globalCompositeOperation='destination-in';const g=c.createRadialGradient(256,256,0,256,256,256);g.addColorStop(0,'#000');g.addColorStop(.9,'#000');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  flat(52,52,Toon({map:st,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),-76,.02,-32,[1,1]);
  const stairs=(x,zTop,n,rise,dep,c0,c1)=>{for(let k=1;k<=n;k++){const t=rise*k,zc=zTop+(n+1-k)*dep-dep/2;box(1.6,t,dep,k%2?c0:c1,x,t/2,zc);addBox(x,zc,1.6,dep,t,true);}
    const zLow=zTop+n*dep;[-1,1].forEach(s=>beam(new V3(x+s*.85,rise+.75,zLow),new V3(x+s*.85,rise*n+.75,zTop),.05,0xffffff));};
  const deck=(x,z,top,col,post)=>{[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>cyl(.13,top,post,x+a*1.05,top/2,z+b*1.05));box(2.4,.25,2.4,col,x,top-.125,z);addBox(x,z,2.4,2.4,top,true);};

  /* すべりだい: stairs from the north, slide down to the south */
  /* see-through volumes avoid the places the player stands (stairs, deck floor), else they'd fade while climbing:
     the stairs are outside the group, the deck is split into "floor" (below the feet) and "roof" (above the head) */
  stairs(SL.x,SL.z+1.2,7,.3,.6,0xffd45c,0xffe58a);
  occBegin([occBox(SL.x-1.3,SL.x+1.3,SL.z-1.3,SL.z+1.3,SL.top-.45),occBox(SL.x-1.3,SL.x+1.3,SL.z-1.3,SL.z+1.3,SL.top+2.9,SL.top+1.7),occBox(SL.x-.8,SL.x+.8,-37.8,-28,SL.top+.6)]);
  deck(SL.x,SL.z,SL.top,0xffd45c,0xff8fab);
  [-1,1].forEach(s=>box(.1,.6,2.4,0xff8fab,SL.x+s*1.15,SL.top+.3,SL.z));
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>cyl(.07,1.7,0xffffff,SL.x+a*1.05,SL.top+.85,SL.z+b*1.05));mk(G.cone4,0x64b5f6,2,1.1,2,SL.x,SL.top+2.25,SL.z).rotation.y=Math.PI/4;
  {const zA=SL.z-1.2,yA=SL.top-.05,zB=-36,yB=.35,L=Math.hypot(zA-zB,yA-yB),th=-Math.atan2(yA-yB,zA-zB),zm=(zA+zB)/2,ym=(yA+yB)/2;
   mk(G.box,0x64b5f6,1.2,.12,L,SL.x,ym,zm).rotation.x=th;[-1,1].forEach(s=>mk(G.box,0xff8fab,.08,.32,L,SL.x+s*.62,ym+.14,zm).rotation.x=th);
   cyl(.08,1.4,0xff8fab,SL.x,.7,-32.5);box(1.2,.12,1.6,0x64b5f6,SL.x,.34,-36.8);addBox(SL.x,-32.1,1.4,8);addBox(SL.x,-36.9,1.4,1.6,.4,true);}
  occEnd();
  INTER.push({x:SL.x,z:SL.z-.7,r:1.3,y:SL.top+1.3,label:'すべる',fn:startSlide,cond:()=>P.pos.y>SL.top-.3,high:true});

  /* ジップライン: tall deck, cable with a sag down to a post across the sand */
  stairs(ZP.x0,ZP.z0+1.2,11,.3,.55,0x81c784,0xa5d6a7);
  occBegin([occBox(ZP.x0-1.3,ZP.x0+1.3,ZP.z0-1.3,ZP.z0+1.3,ZP.top-.45),occBox(ZP.x0-.3,ZP.x0+.3,ZP.z0-1.3,ZP.z0+1.3,ZP.y0+.5,ZP.y0+.1),occBox(ZP.x1-.5,ZP.x1+.5,ZP.z1-.5,ZP.z1+.5,2.8)]);
  deck(ZP.x0,ZP.z0,ZP.top,0x81c784,0x64b5f6);
  box(.1,.6,2.4,0x64b5f6,ZP.x0-1.15,ZP.top+.3,ZP.z0);box(2.4,.6,.1,0x64b5f6,ZP.x0,ZP.top+.3,ZP.z0-1.15);
  [-1,1].forEach(s=>cyl(.1,ZP.y0+.3-ZP.top,0xff8fab,ZP.x0,(ZP.y0+.3+ZP.top)/2,ZP.z0+s*1.05));box(.16,.16,2.3,0xff8fab,ZP.x0,ZP.y0+.3,ZP.z0);
  cyl(.16,ZP.y1+.4,0xff8fab,ZP.x1,(ZP.y1+.4)/2,ZP.z1);sph(.22,.22,.22,0xffd45c,ZP.x1,ZP.y1+.5,ZP.z1);addCircle(ZP.x1,ZP.z1,.3);
  occEnd();
  for(let i=0;i<16;i++)beam(zipPt(i/16),zipPt((i+1)/16),.035,0x5d5d6b);
  {const land=zipPt(.95);cyl(1.3,.06,0x64b5f6,land.x,.03,land.z);}
  {const g=new THREE.Group();box(.34,.2,.16,0xffd45c,0,0,0,g);beam(new V3(0,-.05,0),new V3(0,-.3,0),.03,0x8d6e63,g);box(.7,.07,.07,0xff6f91,0,-.32,0,g);g.position.copy(zipPt(0));scene.add(g);ZP.trolley=g;
   g.rotation.y=Math.atan2(ZP.x1-ZP.x0,ZP.z1-ZP.z0);}
  INTER.push({x:ZP.x0+.6,z:ZP.z0,r:1.5,y:ZP.top+1.4,label:'つかまる',fn:startZip,cond:()=>P.pos.y>ZP.top-.3&&!ZP.busy,high:true});

  /* ブランコ: A-frame with two seats (seats are outside the see-through group because they move) */
  occBegin([occBox(-84,-76,SW.z-1.6,SW.z+1.6,3.9)]);
  [-83.6,-76.4].forEach(x=>{[-1.3,1.3].forEach(dz=>{beam(new V3(x,0,SW.z+dz),new V3(x,3.7,SW.z),.12,0xff8fab);addCircle(x,SW.z+dz*.9,.3);});});
  beam(new V3(-83.8,3.7,SW.z),new V3(-76.2,3.7,SW.z),.13,0x64b5f6);
  occEnd();
  SW.seats.forEach((sx,i)=>{const g=new THREE.Group();g.position.set(sx,SW.py,SW.z);[-.34,.34].forEach(x=>box(.04,SW.L,.04,0x8d6e63,x,-SW.L/2,0,g));box(.8,.08,.4,0xffd45c,0,-SW.L,0,g);scene.add(g);SW.piv.push(g);
    INTER.push({x:sx,z:SW.z,r:1.3,y:2.3,label:'[乗|の]る',fn:()=>startSwing(i)});});

  /* トランポリン */
  TR.forEach(t=>{cyl(1.5,.36,0x64b5f6,t.x,.18,t.z);t.top=cyl(1.3,.06,0xff6f91,t.x,.42,t.z);addBox(t.x,t.z,2.4,2.4,.45,true);});

  /* いっぽんばし: start pad → 3 narrow beams → goal pad */
  for(let i=0;i<BM.pts.length-1;i++){const[a,b]=[BM.pts[i],BM.pts[i+1]],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,w=Math.abs(b[0]-a[0])+.5,d=Math.abs(b[1]-a[1])+.5;
    box(w,.15,d,0xffd45c,mx,BM.top-.075,mz);addBox(mx,mz,w,d,BM.top,true);[a,b,[mx,mz]].forEach(p=>cyl(.07,BM.top-.15,0x8d6e63,p[0],(BM.top-.15)/2,p[1]));}
  [[BM.start,0x81c784,'スタート'],[BM.goal,0xff8fab,'ゴール']].forEach(([p,c,n])=>{box(1.2,.3,1.2,c,p[0],.15,p[1]);addBox(p[0],p[1],1.2,1.2,.3,true);const s=labelSprite(n,'#fffbef','#d0661f',.6);s.position.set(p[0],1.6,p[1]);scene.add(s);});

  /* stamp card board near the entrance */
  {const x=-66,z=-13;occBegin([occBox(x-1.2,x+1.2,z-.3,z+.3,2.4)]);[-1,1].forEach(s=>cyl(.1,2.2,0x8a5a33,x+s*.95,1.1,z));box(2.3,1.1,.12,0xfff3d6,x,1.75,z);
   textPlane('[遊|あそ]びの スタンプカード',2.1,.5,'#fffbef','#d0661f',null,x,1.95,z+.08);textPlane('[全|ぜん][部|ぶ] [集|あつ]めよう！',1.6,.35,'#fffbef','#4a3523',null,x,1.45,z+.08);occEnd();addBox(x,z,2.3,.3);
   INTER.push({x,z:z+1.3,r:2,y:2.9,label:'みる',fn:openStampCard});}}

/* ----- rides ----- */
function rideStart(o){o.t=0;P.riding=o;P.vy=0;}
function rideEnd(){P.riding=null;P.vy=0;}
function startSlide(){if(P.riding)return;sfx('jump');P.rot=Math.PI;
  rideStart({air:true,upd(dt){const t=this.t+=dt,T=1.25,T2=.45;
    if(t<T){const u=Math.pow(t/T,1.5);P.pos.set(SL.x,SL.top+.05+(.4-SL.top-.05)*u,SL.z-1+(-36-(SL.z-1))*u);}
    else if(t<T+T2){const u=(t-T)/T2;P.pos.set(SL.x,.4,-36-1.3*(1-(1-u)*(1-u)));}
    else{P.pos.set(SL.x,.4,-37.3);rideEnd();athStamp('slide');}}});}
function startZip(){if(P.riding||ZP.busy)return;ZP.busy=true;sfx('jump');const dir=Math.atan2(ZP.x1-ZP.x0,ZP.z1-ZP.z0);
  rideStart({air:true,upd(dt){const u=Math.min(1,(this.t+=dt)/3.6),e=.95*u*u*(3-2*u),p=zipPt(e);ZP.trolley.position.copy(p);P.pos.set(p.x,p.y-1.8,p.z);P.rot=dir;
    if(u>=1){rideEnd();sfx('fan');athStamp('zip');later(()=>{ZP.trolley.position.copy(zipPt(0));ZP.busy=false;},1500);}}});}
function startSwing(i){if(P.riding)return;sfx('tap');toast('A（こぐ）で [高|たか]く！ ジャンプで おりるよ');
  rideStart({label:'こぐ',jumpExit:true,amp:.35,act(){this.amp=Math.min(1.05,this.amp+.14);sfx('tap');if(this.amp>.9&&!this.hi){this.hi=1;toast('たかーい！');athStamp('swing');}},
    upd(dt){this.t+=dt;this.amp=Math.max(.12,this.amp-.035*dt);const a=this.amp*Math.sin(this.t*1.9);SW.ang[i]=a;SW.piv[i].rotation.x=a;
      P.pos.set(SW.seats[i],SW.py-SW.L*Math.cos(a)-.4,SW.z-SW.L*Math.sin(a));P.rot=0;},
    exit(){rideEnd();P.pos.set(SW.seats[i],0,SW.z+2.2);}});SW.rider=i;}
/* trampoline: called from updatePlayer while standing; a jump pressed just before landing = super jump */
function athBounce(){for(const t of TR){if(Math.hypot(P.pos.x-t.x,P.pos.z-t.z)<1.3&&Math.abs(P.pos.y-.45)<.08){const sup=time-(P.jumpT||-9)<.4;P.vy=sup?16.5:12;P.ground=false;jumpReq=false;t.sq=1;sfx('jump');
  if(sup)athStamp('tramp');else if(!trHint){trHint=true;toast('ポヨーン！ はねてる ときに ジャンプを おすと もっと [高|たか]く [飛|と]べるよ');}return true;}}return false;}
/* per frame (from updateWorld) */
function updatePlay(dt){
  SW.piv.forEach((g,i)=>{if(P.riding&&SW.rider===i&&P.riding.jumpExit)return;SW.ang[i]*=Math.exp(-dt*1.2);g.rotation.x=SW.ang[i];});
  TR.forEach(t=>{if(t.sq>0){t.sq=Math.max(0,t.sq-dt*4);}t.top.position.y=.42-.16*Math.sin(t.sq*Math.PI);});
  if(Math.abs(P.pos.x+64)>16||Math.abs(P.pos.z+40)>8||P.riding)return;
  const on=(p,y)=>Math.abs(P.pos.x-p[0])<.75&&Math.abs(P.pos.z-p[1])<.75&&Math.abs(P.pos.y-y)<.08&&P.ground;
  if(on(BM.start,.3)){if(!BM.armed&&!BM.walked)BM.armed=true;}
  if(BM.armed&&P.pos.y>BM.top-.1)BM.walked=true;
  if(BM.armed&&P.ground&&P.pos.y<.05){BM.armed=false;if(BM.walked)toast('おっと！ スタートから もう[一|いち][度|ど]');BM.walked=false;}
  if(BM.armed&&BM.walked&&on(BM.goal,.3)){BM.armed=false;BM.walked=false;sfx('fan');confetti(20);toast('わたりきった！');athStamp('beam');}}

/* ----- stamp card ----- */
function athStamp(k){S.st.play=S.st.play||{};if(S.st.play[k])return;S.st.play[k]=1;const p=PLAY.find(x=>x[0]===k),n=PLAY.filter(x=>S.st.play[x[0]]).length;
  later(()=>{sfx('star');toast(`スタンプ ゲット！ 「${p[2]}」 (${n}/${PLAY.length})`);},600);
  if(n===PLAY.length){const r=PLAY_REWARD;S.yen+=r.yen;addXP(r.xp);S.own.furn[r.furn]=(S.own.furn[r.furn]||0)+1;
    later(()=>{confetti(60);sfx('fan');toast(`スタンプカード [完|かん][成|せい]！ 「${FURN[r.furn].n}」と どんぐり ${r.yen}こ を もらったよ`);},2600);}
  updateHUD();save();}
function openStampCard(){S.st.play=S.st.play||{};const card=openModal(),n=PLAY.filter(x=>S.st.play[x[0]]).length;
  card.innerHTML=head('[遊|あそ]びの スタンプカード',null)+`<p class="mnote">アスレチックで [全|ぜん][部|ぶ] [遊|あそ]んで スタンプを [集|あつ]めよう！ (${n}/${PLAY.length})</p>
  <div class="zk">${PLAY.map(([k,e,nm,hint])=>{const got=!!S.st.play[k];return `<div class="${got?'':'no'}"><span class="ze">${got?e:'❔'}</span>${nm}<br><small>${got?'できた！':hint}</small></div>`;}).join('')}</div>
  <p class="mnote">${n===PLAY.length?'[完|かん][成|せい]！ よく [遊|あそ]んだね！':`[全|ぜん][部|ぶ] [集|あつ]めると 「${FURN[PLAY_REWARD.furn].n}」と どんぐり ${PLAY_REWARD.yen}こ！`}</p>`;wire(card);}
