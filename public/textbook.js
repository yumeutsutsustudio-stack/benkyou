'use strict';
/* ===== きょうかしょ（よむ → たしかめ） =====
   A unit = 2〜4 illustrated pages to read (🔊 reads them aloud), then 3 check questions from the unit's topic,
   made at the unit's grade (the same generators / problem bank as the classroom — the problem formats are unchanged).
   Finishing gives a 🏅 stamp (S.tb[id]) and, the first time, TB_BONUS acorns.
   Units are data in tdata/t{1..6}.js:
     tb(grade, subject, [ {id, ic:'えもじ', n:'たんげんの なまえ', topic:'TOPICS の キー', pages:[ページ, …]} ])
     ページ = { e:'大きな え（えもじ）', big:'大きく みせる しき など', t:'せつめいの ぶん', clock:[じ,ふん], html:'じぶんで かく HTML' }
   Text uses the [漢字|かんじ] markup (kanji.js), so kanji follow the player's grade. */
const TB=[],TB_BONUS=10;
/* several tb() calls for the same grade + subject just continue the list (tdata/t{g}b.js = つけたし) */
function tb(g,subj,list){list.forEach(l=>{l.g=g;l.s=subj;l.k=TB.filter(x=>x.g===g&&x.s===subj).length;l.id=g+subj+'_'+l.id;TB.push(l);});}
/* little drawing helpers for pages */
const TBH={
  row:(e,n)=>`<span style="white-space:nowrap">${Array.from({length:n},()=>e).join('')}</span>`,
  plates:(e,per,n)=>`<div class="pics">${Array.from({length:n},()=>`<span class="plate">${e.repeat(per)}</span>`).join('')}</div>`,
  coins:list=>`<div class="coins">${list.map(coin).join('')}</div>`,
  fr:(n,d)=>frH(`${n}/${d}`),
  box:s=>`<div class="tb-box">${s}</div>`};
const tbUnits=(g,s)=>TB.filter(l=>l.g===g&&(!s||l.s===s));
const tbDone=id=>!!(S.tb&&S.tb[id]);
function tbPageHTML(p){return (p.clock?`<div style="text-align:center">${clockSVG(p.clock[0],p.clock[1])}</div>`:'')+(p.e?`<div class="tb-pic">${p.e}</div>`:'')+(p.html||'')+
  (p.big?`<div class="tb-big">${p.big}</div>`:'')+(p.t?`<div class="tb-text">${p.t}</div>`:'');}

/* もくじ: grade tabs → subjects → units */
function openTextbook(g){g=g||S.tbG||S.grade;S.tbG=g;const hoo=FR('hoo'),card=openModal();
  const done=TB.filter(l=>tbDone(l.id)).length;
  card.innerHTML=head('📖 [教|きょう][科|か][書|しょ]',hoo)+`<p class="mnote">[読|よ]んで わかったら、 さいごに 3もん たしかめよう。 ぜんぶ [読|よ]むと 🏅 が もらえるよ（${done}/${TB.length}）</p>`+
    `<div class="tabs">${GRADES.map(x=>`<button class="tab${x===g?' on':''}" type="button" data-g="${x}">${x}[年|ねん][生|せい]</button>`).join('')}</div>`+
    Object.keys(SUBJ).map(s=>{const us=tbUnits(g,s);if(!us.length)return '';return `<h3 class="sec ${SUBJ[s].c}">${SUBJ[s].n}</h3><div class="topics">${us.map(l=>
      `<button class="topic" type="button" data-u="${l.id}"><span class="ti">${l.ic}</span>${l.n}<span class="tc">${tbDone(l.id)?'🏅 よんだ':l.pages.length+'ページ'}</span></button>`).join('')}</div>`;}).join('');
  wire(card);card.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{sfx('tap');openTextbook(+b.dataset.g);});
  card.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{sfx('tap');tbRead(TB.find(l=>l.id===b.dataset.u),0);});}

/* よむ */
function tbRead(l,i){const hoo=FR('hoo'),card=openModal(),p=l.pages[i],last=i===l.pages.length-1;
  card.innerHTML=head(`${l.ic} ${l.n}`,hoo)+`<p class="mnote" style="margin:0">${l.g}[年|ねん][生|せい] ${SUBJ[l.s].n}</p>`+
    `<div class="dots-prog">${l.pages.map((_,k)=>`<i class="${k<i?'done':k===i?'now':''}"></i>`).join('')}</div>`+
    `<div class="tb-page">${tbPageHTML(p)}</div><div class="qtools"><button class="speak" type="button">🔊 [読|よ]み[上|あ]げ</button></div>`+
    `<div class="btn-row">${i?'<button class="big-btn calm" type="button" data-a="prev">◀ まえ</button>':'<button class="big-btn calm" type="button" data-a="toc">もくじ</button>'}`+
    `<button class="big-btn" type="button" data-a="next">${last?'✏️ たしかめ もんだいへ':'つぎ ▶'}</button></div>`;
  wire(card);card.querySelector('.speak').onclick=()=>speak([p.big,p.t].filter(Boolean).join('。 '));
  onAct(card,{prev:()=>tbRead(l,i-1),toc:()=>openTextbook(l.g),next:()=>{sfx('tap');last?tbCheck(l):tbRead(l,i+1);}});card.scrollTop=0;}

/* たしかめ: 3 questions of the unit's topic, made at the unit's grade (kanji still follow the player's grade) */
function tbQ(l){const keep=S.grade;KJ_VIEW=keep;S.grade=l.g;let q;try{q=genQ(l.topic);}finally{S.grade=keep;KJ_VIEW=0;}return q;}
function tbCheck(l){const hoo=FR('hoo'),card=openModal(),gen=modalGen,N=3;let n=0,first=0,last='';
  card.innerHTML=head(`✏️ たしかめ ― ${l.n}`,hoo)+`<div class="dots-prog"></div><div class="qbox"></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="back">◀ もう[一|いち][度|ど] [読|よ]む</button></div>`;
  wire(card);onAct(card,{back:()=>tbRead(l,0)});const dots=card.querySelector('.dots-prog'),qb=card.querySelector('.qbox');
  const next=()=>{if(gen!==modalGen)return;if(n>=N)return finish();dots.innerHTML=Array.from({length:N},(_,k)=>`<i class="${k<n?'done':k===n?'now':''}"></i>`).join('');
    let q;for(let t=0;t<6;t++){q=tbQ(l);if(q.speak!==last)break;}last=q.speak;renderQ(qb,q,t=>{if(t===0)first++;n++;next();});card.scrollTop=0;};
  const finish=()=>{S.tb=S.tb||{};const firstTime=!S.tb[l.id];S.tb[l.id]=Math.max(S.tb[l.id]||0,first+1);if(firstTime){S.yen+=TB_BONUS;addXP(5);}updateHUD();save();sfx('fan');confetti(firstTime?40:20);
    const nx=TB.find(u=>u.g===l.g&&u.s===l.s&&u.k===l.k+1);card.querySelector('[data-a=back]').parentNode.remove();dots.innerHTML='';
    qb.innerHTML=`<div class="catch"><div class="stamp">🏅</div><div class="nm">「${l.n}」 わかった！</div><p class="mnote">1[回|かい][目|め]で [正|せい][解|かい] ${first}/${N}もん${firstTime?`<br>はじめて [読|よ]んだ ごほうび どんぐり ${TB_BONUS}こ！`:''}</p></div>`+
      `<div class="btn-row"><button class="big-btn calm" type="button" data-a="again">もう[一|いち][度|ど] [読|よ]む</button>${nx?'<button class="big-btn" type="button" data-a="nx">つぎの たんげん ▶</button>':''}<button class="big-btn calm" type="button" data-a="toc">もくじ</button></div>`;
    onAct(qb,{again:()=>tbRead(l,0),nx:()=>tbRead(nx,0),toc:()=>openTextbook(l.g)});};
  next();}
