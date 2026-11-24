'use strict';
/* ===== すきな きょうか =====
   1) せってい → 「すきな きょうか」： S.fav = [きょうかの key …]、 S.favMode = 'more'（おおめに でる） | 'only'（すきな きょうか だけ）
      つり・むしとり・かいがら・いせき 3つめの とびら・むらびとの おねがい・ミッションで すきな きょうかが でやすく なる。
      なにも えらばなければ いままでと まったく おなじ。
   2) メニュー（と きょうしつ）→ 「べんきょう」： きょうかを えらんで、 その きょうかの いろんな たんげんを 5もん／10もん／エンドレスで とく ドリル。 */
const FAV_MORE=3;           // 「おおめ」の とき、 すきな きょうかが でる おもさ（ほかの きょうかの なんばい）
const FAV_SWAP=.35;         // 「おおめ」の とき、 きょうかが きまっている ばしょ（つり＝さんすう など）で すきな きょうかに かわる かくりつ
const FAV_REQ_MORE=.75;     // 「おおめ」の とき、 すきな きょうかを もつ むらびとが その きょうかを きく かくりつ
const DRILL_LEN=[5,10,0];   // ドリルの もんだいすう（0 = エンドレス）
const DRILL_BONUS=2;        // ドリルを おえた ときの ボーナス どんぐり（1もん あたり）

const favs=()=>(S.fav||[]).filter(k=>SUBJ[k]);
const isFav=k=>favs().includes(k);
/* pick a subject from a list (duplicates = more weight), favourites weighted up / only favourites */
function favPick(list){const F=favs();if(!F.length)return pick(list);
  if(S.favMode==='only'){const inF=list.filter(isFav);return inF.length?pick(inF):pick(F);}
  const w=list.map(k=>isFav(k)?FAV_MORE:1),sum=w.reduce((a,b)=>a+b,0);let r=Math.random()*sum;
  for(let i=0;i<list.length;i++){r-=w[i];if(r<0)return list[i];}return list[list.length-1];}
/* a place with a fixed subject (e.g. つり = さんすう): keep it, unless favourites say otherwise */
function favSubj(def){const F=favs();if(!F.length||isFav(def))return def;return S.favMode==='only'||Math.random()<FAV_SWAP?pick(F):def;}
/* villager requests: a villager who can ask a favourite subject prefers it */
function favReqSubj(subjs){const F=subjs.filter(isFav);if(!F.length)return pick(subjs);return S.favMode==='only'||Math.random()<FAV_REQ_MORE?pick(F):pick(subjs);}
/* today's missions: make sure one of them is about a favourite subject */
function favMission(list){const F=favs();if(!F.length||list.some(m=>F.includes(m.t.replace('subj:',''))))return;
  const m=MPOOL.find(x=>x.t==='subj:'+pick(F));if(m)list[list.length-1]={t:m.t,g:m.g,x:m.x,n:0,done:false};}

/* ----- せってい の らん ----- */
function favSettingsHTML(){const F=favs();
  return `<p class="sec">[好|す]きな [教|きょう][科|か] <small style="font-size:12px">（[選|えら]ぶと [村|むら]の あちこちで でやすく なるよ。 いくつでも）</small></p><div class="tabs">${Object.keys(SUBJ).map(k=>`<button class="tab${isFav(k)?' on':''}" type="button" data-fav="${k}">${isFav(k)?'⭐ ':''}${SUBJ[k].n}</button>`).join('')}</div>`+
    (F.length?`<div class="tabs" style="margin-top:6px"><button class="tab${S.favMode!=='only'?' on':''}" type="button" data-fm="more">[多|おお]めに でる</button><button class="tab${S.favMode==='only'?' on':''}" type="button" data-fm="only">[好|す]きな [教|きょう][科|か] だけ</button></div><p class="mnote" style="font-size:12px">つり・[虫|むし]とり・[貝|かい]がら・お[願|ねが]い・ミッションに はんえい されるよ（ミッションは [次|つぎ]の ひから）。 ホー[先|せん][生|せい]の [教|きょう][室|しつ]は [今|いま]まで どおり [全|ぜん][部|ぶ] [選|えら]べるよ。</p>`:'');}
function favSettingsWire(card,reopen){
  card.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{const k=b.dataset.fav,F=favs();S.fav=F.includes(k)?F.filter(x=>x!==k):F.concat(k);if(!S.favMode)S.favMode='more';sfx('tap');save();reopen();});
  card.querySelectorAll('[data-fm]').forEach(b=>b.onclick=()=>{S.favMode=b.dataset.fm;sfx('tap');save();reopen();});}

/* ----- べんきょう（きょうかべつ ドリル） ----- */
/* にがて ふくしゅう: 3もん いじょう といて、 1かいめで せいかいが 8わり みまんの しゅるいを わるい じゅんに 5つまで（S.rec.types から） */
function weakTopics(){recInit();const ok=k=>TOPICS[k]&&TOPICS[k].g<=S.grade&&GEN[k]&&!['dokkai','narabe','letters'].includes(k),r=o=>o.first/o.n;
  return Object.entries(S.rec.types).filter(([k,o])=>ok(k)&&o.n>=3&&r(o)<.8).sort((a,b)=>r(a[1])-r(b[1])).slice(0,5).map(([k])=>k);}
const drillName=s=>s==='weak'?'にがて ふくしゅう':SUBJ[s].n;
function openDrill(){const hoo=FR('hoo'),card=openModal(),keys=Object.keys(SUBJ),order=keys.filter(isFav).concat(keys.filter(k=>!isFav(k)));
  card.innerHTML=head('[勉|べん][強|きょう]',hoo)+`<p class="mnote">どの [教|きょう][科|か]を [勉|べん][強|きょう] する？ その [教|きょう][科|か]の いろんな [問|もん][題|だい]が でるよ。</p><div class="btn-row"><button class="big-btn" type="button" data-a="weak">🔁 にがて ふくしゅう</button></div><div class="topics">${order.map(k=>`<button class="topic" type="button" data-ds="${k}"><span class="ti">${SUBJ[k].ic}</span>${isFav(k)?'⭐ ':''}${SUBJ[k].n}<span class="tc">これまで ${S.st[k]||0}もん</span></button>`).join('')}</div>`;
  wire(card);onAct(card,{weak:()=>{const w=weakTopics();if(!w.length){sfx('tap');return toast('まだ にがてな [問|もん][題|だい]は ないよ。 いろいろ といて みてね！');}drillLen('weak');}});card.querySelectorAll('[data-ds]').forEach(b=>b.onclick=()=>drillLen(b.dataset.ds));}
function drillLen(subj){const hoo=FR('hoo'),card=openModal();
  card.innerHTML=head(subj==='weak'?drillName(subj):`${drillName(subj)}の [勉|べん][強|きょう]`,hoo)+`<p class="mnote">${subj==='weak'?'にがてな しゅるい： '+weakTopics().map(k=>TOPICS[k].n).join('・')+'<br>':''}なんもん やる？</p><div class="topics">${DRILL_LEN.map(n=>`<button class="topic" type="button" data-dl="${n}"><span class="ti">${n?n:'∞'}</span>${n?n+'もん':'エンドレス'}<span class="tc">${n?`ボーナス どんぐり ${n*DRILL_BONUS}こ`:'[好|す]きなだけ [解|と]けるよ'}</span></button>`).join('')}</div><button class="big-btn calm" type="button" data-a="back">もどる</button>`;
  wire(card);onAct(card,{back:openDrill});card.querySelectorAll('[data-dl]').forEach(b=>b.onclick=()=>drillRun(subj,+b.dataset.dl));}
function drillRun(subj,len){const hoo=FR('hoo'),card=openModal(),gen=modalGen;let n=0,first=0,last='',ended=false;
  card.innerHTML=head(subj==='weak'?drillName(subj):`${drillName(subj)}の [勉|べん][強|きょう]`,hoo)+`<div class="dots-prog"></div><div class="score" style="text-align:center">1[回|かい][目|め]で [正|せい][解|かい] <b>0</b> もん</div><div class="qbox"></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="stop">[終|お]わる</button></div>`;wire(card);
  const dots=card.querySelector('.dots-prog'),sc=card.querySelector('.score b'),qb=card.querySelector('.qbox'),stopRow=card.querySelector('[data-a=stop]').parentNode;
  const finish=()=>{if(gen!==modalGen||ended)return;ended=true;stopRow.remove();dots.innerHTML='';
    if(!n){closeModal();return;}
    const bonus=n*DRILL_BONUS,all=first===n;S.yen+=bonus;addXP(n);S.st.drill=(S.st.drill||0)+1;updateHUD();save();sfx('fan');confetti(all?50:24);
    qb.innerHTML=`<div class="catch"><div class="stamp">${all?'💮':'⭐'}</div><div class="nm">${n}もん がんばった！</div><p class="mnote">1[回|かい][目|め]で [正|せい][解|かい] ${first}/${n}もん${all?' ― [花|はな]まる！':''}<br>ボーナス どんぐり ${bonus}こ ＋ [経|けい][験|けん][値|ち]${n}</p></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="again">もう[一|いっ][回|かい]</button><button class="big-btn calm" type="button" data-a="other">ほかの [教|きょう][科|か]</button><button class="big-btn" type="button" data-a="end">[終|お]わる</button></div>`;
    onAct(qb,{again:()=>drillRun(subj,len),other:openDrill,end:closeModal});};
  const next=()=>{if(gen!==modalGen||ended)return;if(len&&n>=len)return finish();
    dots.innerHTML=len?Array.from({length:len},(_,k)=>`<i class="${k<n?'done':k===n?'now':''}"></i>`).join(''):`<b>${n+1}もんめ</b>`;
    const tl=subj==='weak'?(weakTopics().length?weakTopics():allowed('math')):allowed(subj);let q;for(let t=0;t<6;t++){q=genQ(pick(tl));if(q.speak!==last)break;}last=q.speak; /* おなじ もんだいが つづかない ように */
    renderQ(qb,q,t=>{if(t===0){first++;sc.textContent=first;}n++;next();});card.scrollTop=0;};
  onAct(stopRow,{stop:finish});next();}
