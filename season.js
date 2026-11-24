'use strict';
/* ===== きせつ（はる・なつ・あき・ふゆ）=====
   S.season: 'real'（ほんとうの きせつ）/ 'spring' / 'summer' / 'autumn' / 'winter'
   木・草・花・しげみの色（INSTANCE の色）、地面の色、さくらの ちった はなびら、まう はなびら、ちょうちょ・ほたる、ゆき を きりかえる。
   色の きまりは SEASON_RULES、地面は SEASON_GROUND を いじれば かわる。 */
const SEASONS=[['spring','[春|はる]'],['summer','[夏|なつ]'],['autumn','[秋|あき]'],['winter','[冬|ふゆ]']];
const AUT_COLS=[0xffb347,0xffa24a,0xffcf5a,0xff9358,0xf07a4a,0xffdb6e];      /* こうよう */
const SPRING_G=[0xb5e27a,0xa3de6e,0xc6ea8c,0x9fd96e],SUMMER_G=[0x5fb04c,0x6fbf5a,0x4fa244,0x79c45e];
const SNOW_C=0xf2f6fb;
/* ground: color = かける いろ、 em = たす いろ（ふゆの ゆきを あかるく するため。 よるは よわく なる） */
const SEASON_GROUND={spring:{color:0xffffff,em:0x000000},summer:{color:0xe2f0cc,em:0x000000},autumn:{color:0xffe0a0,em:0x000000},winter:{color:0x50565c,em:0x9ea8b8}};
const SNOW_N=180,SNOW_BOX=32,SNOW_TOP=14;

const _sa=new THREE.Color(),_sb=new THREE.Color();
const lerpHex=(a,b,t)=>_sa.setHex(a).lerp(_sb.setHex(b),t).getHex();
const pickR=(arr,r)=>arr[Math.min(arr.length-1,Math.floor(r*arr.length))];
const hashR=i=>((Math.imul(i+1,2654435761)>>>0)%1000)/1000;

/* each rule: (orig color, season, rnd 0-1 (same for every part of one tree), tree type) → new color */
const SEASON_RULES={
  leaf(c,s,r,t){if(t==='palm')return c;const aut=t==='autumn';
    if(s==='spring')return aut?pickR(SPRING_G,r):lerpHex(c,0xd6f29a,.2);
    if(s==='summer')return aut?pickR(SUMMER_G,r):lerpHex(c,0x4fa040,.3);
    if(s==='autumn')return aut?c:r<.75?pickR(AUT_COLS,r/.75):lerpHex(c,0xd8d070,.35);
    return lerpHex(c,SNOW_C,.82);},
  pine(c,s){return s==='winter'?lerpHex(c,0xf4f8fc,.6):s==='summer'?lerpHex(c,0x3f8f50,.25):c;},
  sakuraBloom(c,s){if(s==='spring')return c;const l=Math.max(0,Math.min(1,(_sa.setHex(c).g-.53)/.4));
    if(s==='summer')return lerpHex(0x6dbb58,0xa8dc78,l);if(s==='autumn')return lerpHex(0xe8603a,0xffb060,l);return lerpHex(0xdfe7f0,0xffffff,l);},
  tuft(c,s){return s==='summer'?lerpHex(c,0x5f9a40,.3):s==='autumn'?lerpHex(c,0xc9a85a,.6):s==='winter'?lerpHex(c,SNOW_C,.8):c;},
  flower(c,s,r){return s==='winter'?SNOW_C:s==='autumn'&&r<.5?pickR([0xffc04d,0xff9358,0xffdb6e],r*2):c;},
  fcenter(c,s){return s==='winter'?SNOW_C:c;},
  bush(c,s,r){return s==='spring'?lerpHex(c,0xd6f29a,.15):s==='summer'?lerpHex(c,0x4fa040,.25):s==='autumn'?(r<.6?pickR(AUT_COLS,r/.6):c):lerpHex(c,SNOW_C,.8);}};

function curSeason(){if(S.season&&S.season!=='real')return S.season;const m=new Date().getMonth();return m>=2&&m<=4?'spring':m>=5&&m<=7?'summer':m>=8&&m<=10?'autumn':'winter';}
const seasonName=s=>(SEASONS.find(x=>x[0]===s)||[])[1]||'';
let seasonNow=null,SNOW=null;
function applySeason(force){const s=curSeason();if(s===seasonNow&&!force)return;seasonNow=s;
  for(const k in SEASON_RULES){const d=INST[k];if(!d||!d.im)continue;const f=SEASON_RULES[k];
    d.items.forEach((it,i)=>{const tag=it[8];d.im.setColorAt(i,_sb.setHex(f(it[6],s,tag?tag.r:hashR(i),tag?tag.t:null)));});
    if(d.im.instanceColor)d.im.instanceColor.needsUpdate=true;}
  /* see-through ghosts copied the old colours: drop them so they are rebuilt with the new ones */
  OCCS.forEach(o=>{if(o.on)occShow(o,false);o.g=null;});
  const g=SEASON_GROUND[s];if(W.grassMat){W.grassMat.color.setHex(g.color);W.grassMat.emissive.setHex(g.em);}
  if(W.pathMat){W.pathMat.color.setHex(s==='winter'?0xc8c8cc:0xffffff);W.pathMat.emissive.setHex(s==='winter'?0x4a4c56:0);} /* ふゆの みちは うっすら ゆき */
  if(W.petalIM){W.petalIM.visible=s==='spring'||s==='autumn';W.petalIM.material.color.setHex(s==='autumn'?0xffa060:0xffffff);}
  if(LIFE.petals)LIFE.petals.material.color.setHex(s==='autumn'?0xf08a40:0xffc6d6);
  if(!SNOW){SNOW={im:new THREE.InstancedMesh(G.sphL,new THREE.MeshBasicMaterial({color:0xffffff}),SNOW_N),p:Array.from({length:SNOW_N},()=>({x:(Math.random()-.5)*SNOW_BOX,y:Math.random()*SNOW_TOP,z:(Math.random()-.5)*SNOW_BOX,v:.9+Math.random()*.7,ph:Math.random()*6,s:.05+Math.random()*.05}))};SNOW.im.frustumCulled=false;scene.add(SNOW.im);}
  SNOW.im.visible=s==='winter';}
/* every frame, after updateLife: hide what doesn't belong to this season, let the snow fall */
function updateSeasonFX(dt){const s=seasonNow;if(!s)return;
  if(LIFE.petals)LIFE.petals.visible=(s==='spring'||s==='autumn')&&!curRoom;
  if(s==='winter')LIFE.flies.forEach(b=>b.g.visible=false);
  if(LIFE.ffl&&(s==='autumn'||s==='winter'))LIFE.ffl.visible=false;
  if(W.grassMat)W.grassMat.emissiveIntensity=W.pathMat.emissiveIntensity=1-todNight*.65;
  if(!SNOW||!SNOW.im.visible)return;const on=!curRoom;SNOW.im.visible=true;if(!on){SNOW.im.count=0;return;}SNOW.im.count=SNOW_N;
  const cx=P.pos.x,cz=P.pos.z,h=SNOW_BOX/2;
  SNOW.p.forEach((p,i)=>{p.y-=p.v*dt;p.x+=Math.sin(time*.8+p.ph)*dt*.5;p.z+=Math.cos(time*.6+p.ph)*dt*.35;if(p.y<0){p.y=SNOW_TOP;p.x=(Math.random()-.5)*SNOW_BOX;p.z=(Math.random()-.5)*SNOW_BOX;}
    /* flakes live in a box that follows the player (wrap around its edges) */
    const wx=cx+((p.x+h)%SNOW_BOX+SNOW_BOX)%SNOW_BOX-h,wz=cz+((p.z+h)%SNOW_BOX+SNOW_BOX)%SNOW_BOX-h;
    dummy.position.set(wx,p.y,wz);dummy.rotation.set(0,0,0);dummy.scale.setScalar(p.s);dummy.updateMatrix();SNOW.im.setMatrixAt(i,dummy.matrix);});
  SNOW.im.instanceMatrix.needsUpdate=true;}
