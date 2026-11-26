'use strict';
/* ===== friends & places ===== */
const FR=id=>FRIENDS.find(f=>f.id===id);
async function talkTo(n){const f=n.f;n.hop=.5;if(!S.st.met[f.id]){S.st.met[f.id]=1;checkAch();}ev('talk');
  if(await questTalk(n))return;
  if(REQ[f.id]&&reqOn(n)){await doRequest(n);return;} /* ？ over the head → a request */
  if(f.role==='furn'){await talk(f,f.lines);return openFurnShop();}
  if(f.role==='clothes'){await talk(f,f.lines);return openClothes();}
  if(f.role==='zakka'){await talk(f,f.lines);return openZakka();}
  if(f.role==='school')return openSchoolTalk();
  const h=S.hearts[f.id]||0;const r=await talk(f,[...f.lines,...(h>=3?['いつも ありがとう！ [大|だい][好|す]きな [友|とも]だちだよ。']:[])],['やる！','おしゃべり','またね']);
  if(r===0)runSet({title:`${f.n}の [問|もん][題|だい]`,who:f,topics:f.topics,onDone:()=>friendDone(f)});
  else if(r===1)talk(f,[pick(f.talk),`なかよしど： ${'❤'.repeat(h)}${'♡'.repeat(5-h)}`]);
  else talk(f,['うん、 また [遊|あそ]ぼうね！']);}
function friendDone(f){const h=Math.min(5,(S.hearts[f.id]||0)+1);S.hearts[f.id]=h;let s=`<p class="heart">${f.n}との なかよしど ${'❤'.repeat(h)}${'♡'.repeat(5-h)}</p>`;
  if(h>=3&&f.gift&&!S.gifts[f.id]){S.gifts[f.id]=1;S.own.furn[f.gift]=(S.own.furn[f.gift]||0)+1;s+=`<p class="gift">🎁 ${f.n}から プレゼント！ 「${FURN[f.gift].n}」を もらったよ。 おうちに かざろう！</p>`;}
  checkAch();return s;}
async function openSchoolTalk(){const hoo=FR('hoo');if(!S.st.met.hoo){S.st.met.hoo=1;checkAch();}await talk(hoo,hoo.lines);openSchool();}
function openSchool(){const hoo=FR('hoo'),card=openModal();
  const btn=k=>{const t=TOPICS[k];return `<button class="topic" type="button" data-t="${k}"><span class="ti">${t.ic}</span>${t.n}<span class="tc">[正|せい][解|かい] ${S.st.topic[k]||0}もん</span>${t.g>S.grade?`<span class="tg">${t.g}[年|ねん][生|せい]〜</span>`:''}</button>`;};
  card.innerHTML=head('ホー[先|せん][生|せい]の [教|きょう][室|しつ]',hoo)+`<p class="mnote">[好|す]きな [勉|べん][強|きょう]を [選|えら]んでね。 なんど でも ちょう[戦|せん] できるよ！</p><div class="btn-row"><button class="big-btn" type="button" data-a="book">📗 [教|きょう][科|か][書|しょ]で [読|よ]む</button><button class="big-btn" type="button" data-a="drill">📚 [教|きょう][科|か]を [選|えら]んで まとめて [勉|べん][強|きょう]</button></div>${Object.keys(SUBJ).map(s=>`<h3 class="sec ${SUBJ[s].c}">${SUBJ[s].n}${isFav(s)?' ⭐':''}</h3><div class="topics">${Object.keys(TOPICS).filter(k=>TOPICS[k].s===s).map(btn).join('')}</div>`).join('')}`;
  wire(card);onAct(card,{drill:openDrill,book:()=>openTextbook(S.grade)});card.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const k=b.dataset.t;if(k==='kuku')return kukuMenu();runSet({title:TOPICS[k].n,who:hoo,topics:[k]});});}
function kukuMenu(){const hoo=FR('hoo'),card=openModal();card.innerHTML=head('くくの [練|れん][習|しゅう]',hoo)+`<p class="mnote">どの だんを [練|れん][習|しゅう] する？</p><div class="topics">${[1,2,3,4,5,6,7,8,9].map(d=>`<button class="topic" type="button" data-d="${d}"><span class="ti">${d}</span>${d}の だん</button>`).join('')}<button class="topic" type="button" data-d="0"><span class="ti">🎲</span>ばらばら</button></div><button class="big-btn calm" type="button" data-a="back">もどる</button>`;
  wire(card);onAct(card,{back:openSchool});card.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const d=+b.dataset.d;runSet({title:d?`${d}の だん`:'くく ばらばら',who:hoo,rounds:5,gen:()=>genQ('kuku',d||undefined)});});}

/* ===== mini games ===== */
function fishing(where){const card=openModal(),gen=modalGen;
  card.innerHTML=head({river:'[川|かわ]で [魚|さかな]つり',sea:'[海|うみ]で [魚|さかな]つり',island:'[島|しま]で [魚|さかな]つり'}[where],null)+`<div class="pond ${where}"><div class="bobber"></div><div class="bang" hidden>！</div></div><p class="mnote">うきが しずんだら 「ひく！」を おしてね</p><button class="big-btn" type="button" data-a="pull">ひく！</button><div class="qbox"></div>`;wire(card);
  const bob=card.querySelector('.bobber'),bang=card.querySelector('.bang'),msg=card.querySelector('.mnote'),btn=card.querySelector('[data-a=pull]'),qb=card.querySelector('.qbox');let state='wait',tm=null;
  const wait=()=>{state='wait';bob.classList.remove('bite');bang.hidden=true;clearTimeout(tm);tm=later(()=>{if(gen!==modalGen)return;state='bite';bob.classList.add('bite');bang.hidden=false;sfx('bite');},1300+Math.random()*2200);};wait();
  btn.onclick=()=>{if(state==='wait'){msg.textContent='まだ だよ。 うきが しずむまで まってね';wait();return;}if(state!=='bite')return;state='q';btn.hidden=true;bang.hidden=true;bob.classList.remove('bite');msg.textContent='[魚|さかな]が かかった！ [問|もん][題|だい]に [答|こた]えて つりあげよう！';
    renderQ(qb,mixedQ(favSubj('math')),()=>{if(gen!==modalGen)return;const f=wpick(FISH[where]);const isNew=!S.st.fish[f[0]];S.st.fish[f[0]]=(S.st.fish[f[0]]||0)+1;ev('fish');save();card.querySelector('.pond').hidden=true;msg.hidden=true;if(isNew)confetti(18);
      qb.innerHTML=`<div class="catch"><div class="pic">${f[2]}</div><div class="nm">${f[1]}を つった！</div>${isNew?'<span class="new-tag">[図|ず]かんに [登|とう][録|ろく]！</span>':''}</div><div class="btn-row"><button class="big-btn calm" type="button" data-a="again">もう[一|いち][度|ど] つる</button><button class="big-btn" type="button" data-a="end">[終|お]わる</button></div>`;onAct(qb,{again:()=>fishing(where),end:closeModal});});};}
function bugGame(wb){const card=openModal(),gen=modalGen,r0=Math.random(),q=mixedQ(favSubj(r0<.4?'math':r0<.7?'kokugo':pick(['rika','eigo','shakai','art'])));
  card.innerHTML=head('[虫|むし]とり',null)+`<div class="q-prompt">${q.prompt}<div style="font-size:16px">[答|こた]えを [持|も]った [虫|むし]を タッチ！</div></div><div class="qtools"><button class="speak" type="button">🔊 [読|よ]み[上|あ]げ</button></div><div class="arena"></div><div class="feedback" aria-live="polite"></div>`;wire(card);
  card.querySelector('.speak').onclick=()=>speak(q.speak,q.en);if(q.en&&q.enAuto)speak('',q.en);const ar=card.querySelector('.arena'),fb=card.querySelector('.feedback');let tries=0,fin=false;const sp=S.grade===1?40:55;
  const list=q.choices.map((c,i)=>{const b=document.createElement('button');b.type='button';b.className='wbug';b.innerHTML=`<span class="e">${['🦋','🐞','🐝'][i%3]}</span><span class="n">${c.label.replace(/<[^>]+>/g,'')}</span>`;ar.appendChild(b);
    const o={el:b,c,x:Math.random()*200,y:Math.random()*160,vx:(Math.random()<.5?-1:1)*sp,vy:(Math.random()<.5?-1:1)*sp,alive:true};
    b.onclick=()=>{if(fin||!o.alive)return;if(c.value===q.answer){fin=true;const r=award(q.topic,tries);const bug=wpick(BUGS);const isNew=!S.st.bugs[bug[0]];S.st.bugs[bug[0]]=(S.st.bugs[bug[0]]||0)+1;ev('bug');wb.on=false;wb.g.visible=false;later(()=>{wb.on=true;wb.g.visible=true;},15000);save();if(isNew)confetti(18);
      later(()=>{if(gen!==modalGen)return;ar.hidden=true;fb.innerHTML=`<div class="catch"><span class="good">${pick(PRAISE)}</span><div class="pic">${bug[2]}</div><div class="nm">${bug[1]}を つかまえた！</div>${isNew?'<span class="new-tag">[図|ず]かんに [登|とう][録|ろく]！</span>':''}<div>+どんぐり ${r.yen}こ</div></div><div class="btn-row"><button class="big-btn" type="button" data-a="end">やったね！</button></div>`;onAct(fb,{end:closeModal});},600);}
      else{tries++;o.alive=false;b.classList.add('gone');sfx('ng');fb.innerHTML=`<b>にげちゃった！</b> もう[一|いち][度|ど]<div class="hintbox">ヒント： ${q.hint}</div>`;}};return o;});
  let lt=performance.now();const step=now=>{if(gen!==modalGen)return;const dt=Math.min(.05,(now-lt)/1000);lt=now;const W2=ar.clientWidth-90,H2=ar.clientHeight-90;
    for(const o of list){if(!o.alive||fin)continue;o.x+=o.vx*dt;o.y+=o.vy*dt;if(o.x<0||o.x>W2){o.vx*=-1;o.x=clamp(o.x,0,W2);}if(o.y<0||o.y>H2){o.vy*=-1;o.y=clamp(o.y,0,H2);}o.el.style.transform=`translate(${o.x}px,${o.y}px)`;}requestAnimationFrame(step);};requestAnimationFrame(step);}
function shellGame(sh){const card=openModal(),gen=modalGen;card.innerHTML=head('[貝|かい]がら ひろい',null)+'<div class="qbox"></div>';wire(card);const qb=card.querySelector('.qbox');
  renderQ(qb,mixedQ(),()=>{if(gen!==modalGen)return;S.st.shells++;ev('shell');sh.on=false;sh.g.visible=false;later(()=>{const x=-60+Math.random()*120;sh.g.position.set(Math.abs(x-40)<5?x+10:x,0,57+Math.random()*12);sh.on=true;sh.g.visible=true;},12000);save();
    qb.innerHTML=`<div class="catch"><div class="pic">🐚</div><div class="nm">きれいな [貝|かい]がら！</div><p class="mnote">[集|あつ]めた [貝|かい]がら： ${S.st.shells}こ</p></div><div class="btn-row"><button class="big-btn" type="button" data-a="end">やったね！</button></div>`;onAct(qb,{end:closeModal});});}
function speedGame(){const card=openModal();const cats=[['calc','[計|けい][算|さん]','🧮'],['kuku','くく','九九'],['kanji','[漢|かん][字|じ]','字'],['kata','カタカナ','ア'],['clock','[時|と][計|けい]','🕒'],['eng','[英|えい][語|ご]','ABC']];
  card.innerHTML=head('スピードチャレンジ',FR('pyon'))+`<p class="mnote">60[秒|びょう]で なんもん [解|と]けるかな？ まちがえても だいじょうぶ！<br>[最|さい][高|こう] [記|き][録|ろく]： <b>${S.st.speedBest}</b>もん</p><div class="topics">${cats.map(c=>`<button class="topic" type="button" data-c="${c[0]}"><span class="ti">${c[2]}</span>${c[1]}</button>`).join('')}</div>`;wire(card);
  card.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const c=b.dataset.c;const g=()=>c==='calc'?genQ(pick(S.grade===1?['add','sub']:S.grade===2?['add','sub','mul']:['add','sub','mul','div'])):c==='eng'?genQ(pick(['eword','ecolor'])):genQ(c);
    const gen=modalGen;let score=0,left=60;card.innerHTML=head('スピードチャレンジ',FR('pyon'))+`<div class="timer"><i style="width:100%"></i></div><div class="score">[正|せい][解|かい] <b>0</b> もん</div><div class="qbox"></div>`;wire(card);
    const bar=card.querySelector('.timer i'),sc=card.querySelector('.score b'),qb=card.querySelector('.qbox');
    const next=()=>{const q=g();qb.innerHTML=`<div class="q-prompt">${q.prompt}</div><div class="choices"></div>`;const ce=qb.querySelector('.choices');
      q.choices.forEach(ch=>{const bt=document.createElement('button');bt.type='button';bt.className='choice'+(ch.cls?' '+ch.cls:'');bt.innerHTML=ch.label;ce.appendChild(bt);bt.onclick=()=>{if(left<=0)return;if(ch.value===q.answer){score++;sc.textContent=score;sfx('ok');recAnswer(q.topic,0,false);S.st.correct++;S.st.topic[q.topic]=(S.st.topic[q.topic]||0)+1;next();}else{sfx('ng');recAnswer(q.topic,1,true);bt.classList.add('wrong');[...ce.children].forEach((x,i)=>{if(q.choices[i].value===q.answer)x.classList.add('right');});later(next,700);}};});};next();
    const iv=setInterval(()=>{if(gen!==modalGen){clearInterval(iv);return;}left-=.25;bar.style.width=(left/60*100)+'%';if(left<=0){clearInterval(iv);const best=score>S.st.speedBest;if(best)S.st.speedBest=score;S.yen+=score;addXP(score*2);ev('speed');checkAch();save();sfx('fan');confetti();
      qb.innerHTML=`<div class="catch"><div class="stamp">⏱️</div><div class="nm">${score}もん [正|せい][解|かい]！</div><p class="mnote">${best?'[最|さい][高|こう] [記|き][録|ろく] こうしん！ ':''}どんぐり ${score}こ ＋ [経|けい][験|けん][値|ち]${score*2}</p></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="again">もう[一|いち][度|ど]</button><button class="big-btn" type="button" data-a="end">[終|お]わる</button></div>`;onAct(qb,{again:speedGame,end:closeModal});}},250);});}
function moleGame(){const card=openModal(),gen=modalGen;const g=S.grade;let target,make;
  if(g===1){target=pick([8,9,10,12]);make=ok=>{let a=ri(1,target-1);if(ok)return `${a}+${target-a}`;let b;do{b=ri(1,9);}while(a+b===target);return `${a}+${b}`;};}
  else{target=pick([12,18,24,16,36,8,6,20]);const pairs=[];for(let a=1;a<=9;a++)for(let b=1;b<=9;b++)if(a*b===target)pairs.push([a,b]);make=ok=>{if(ok){if(g>=3&&Math.random()<.35){const b=ri(2,9);return `${target*b}÷${b}`;}const p=pick(pairs);return `${p[0]}×${p[1]}`;}let a,b;do{a=ri(2,9);b=ri(1,9);}while(a*b===target);return `${a}×${b}`;};}
  card.innerHTML=head('もぐらたたき',FR('pyon'))+`<p class="mnote">[答|こた]えが <b style="font-size:28px;color:var(--berry)">${target}</b> に なる もぐらを たたこう！</p><div class="timer"><i style="width:100%"></i></div><div class="score">ポイント <b>0</b></div><div class="moles">${Array(9).fill('<button class="hole3" type="button"><span class="mole"></span></button>').join('')}</div>`;wire(card);
  const holes=[...card.querySelectorAll('.hole3')],bar=card.querySelector('.timer i'),sc=card.querySelector('.score b');let score=0,left=30;const st=holes.map(()=>({up:false,ok:false,t:0}));
  holes.forEach((h,i)=>h.onclick=()=>{const s=st[i];if(!s.up||left<=0)return;s.up=false;if(s.ok){score++;sc.textContent=score;sfx('ok');h.classList.add('hit');}else{sfx('ng');h.classList.add('miss');}later(()=>h.classList.remove('up','hit','miss'),300);});
  const iv=setInterval(()=>{if(gen!==modalGen){clearInterval(iv);return;}left-=.2;bar.style.width=(left/30*100)+'%';
    st.forEach((s,i)=>{if(s.up){s.t-=.2;if(s.t<=0){s.up=false;holes[i].classList.remove('up');}}});
    if(Math.random()<.45){const free=st.map((s,i)=>i).filter(i=>!st[i].up);if(free.length){const i=pick(free),ok=Math.random()<.45;st[i]={up:true,ok,t:1.8};holes[i].querySelector('.mole').textContent=make(ok);holes[i].classList.add('up');}}
    if(left<=0){clearInterval(iv);S.yen+=score;addXP(score*2);ev('mole');save();sfx('fan');confetti();card.innerHTML=head('もぐらたたき',FR('pyon'))+`<div class="catch"><div class="stamp">🔨</div><div class="nm">${score}ポイント！</div><p class="mnote">どんぐり ${score}こ ＋ [経|けい][験|けん][値|ち]${score*2}</p></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="again">もう[一|いち][度|ど]</button><button class="big-btn" type="button" data-a="end">[終|お]わる</button></div>`;wire(card);onAct(card,{again:moleGame,end:closeModal});}},200);}
function gateQuiz(i){const dora=FR('dora');runSet({title:`[遺|い]せきの とびら ${i+1}`,who:dora,gen:()=>i===0?mixedQ('math'):i===1?mixedQ('kokugo'):mixedQ(),onDone:()=>{S.st.gates[i]=1;openGate(i,true);return '<p class="gift">ゴゴゴ… とびらが [開|ひら]いた！</p>';}});}
function openChest(which){const day=new Date().toDateString();
  if(which==='ruins'&&!W.gates.every(g=>g.open))return talk(null,['とびらが しまっていて、 まだ [届|とど]かない…']);
  if(which==='island'&&!S.st.islandChest)return runSet({title:'[宝|たから][箱|ばこ]の なぞなぞ',who:FR('jiji'),topics:['dokkai','imi','story'],onDone:()=>{S.st.islandChest=1;S.own.hat.includes('pirate')||S.own.hat.push('pirate');S.own.furn.chest=(S.own.furn.chest||0)+1;S.yen+=50;checkAch();return '<p class="gift">🧰 [宝|たから][箱|ばこ]が あいた！ 「かいぞくぼう」と 「[宝|たから][箱|ばこ]」、 どんぐり 50こを てにいれた！</p>';}});
  if(which==='ruins'&&!S.st.ruinsChest){S.st.ruinsChest=1;S.own.hat.includes('crown')||S.own.hat.push('crown');S.yen+=70;checkAch();save();confetti(60);sfx('fan');return talk(null,['[宝|たから][箱|ばこ]を [開|あ]けた！','きらきら [光|ひか]る 「[王|おう]かん」と どんぐり 70こを てにいれた！ [着|き]せかえで かぶって みよう！']);}
  if(S.st.chestDay[which]===day)return talk(null,['からっぽ みたい。 また [明日|あした] きてみよう！']);
  S.st.chestDay[which]=day;S.yen+=10;updateHUD();save();sfx('coin');talk(null,['[宝|たから][箱|ばこ]の そこに どんぐり 10こ [入|はい]ってた！ また [明日|あした] きてね。']);}

/* ===== shops (paid in acorns: 1 / 10 / 100 tokens — place value practice) ===== */
const dgTok=v=>`<span class="y dg dg${v}">🌰<small>${v}</small></span>`;
function payGame(o){const card=openModal();
  card.innerHTML=head(`${o.name}を かう`,o.who)+`<div class="pay-target"><span class="pic-s">${o.e}</span> [必|ひつ][要|よう]な どんぐり <span class="num">${o.price}</span> こ</div><p class="mnote">${S.grade===1?'どんぐりを ちょうど だそう！':'どんぐりを だそう。 [多|おお]く だしたら おつりを [計|けい][算|さん] しよう'}</p><div class="purse">${[1,10,100].map(v=>`<button type="button" data-v="${v}">${dgTok(v)}</button>`).join('')}</div><div class="tray"></div><div class="total">だした どんぐり： <b>0</b> こ<br><small>[持|も]っている どんぐり： ${S.yen}こ</small></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="back">もどる</button><button class="big-btn" type="button" data-a="pay">はらう！</button></div><div class="feedback" aria-live="polite"></div>`;wire(card);
  const tray=card.querySelector('.tray'),tot=card.querySelector('.total b'),fb=card.querySelector('.feedback');const sel=[];let tries=0;const sum=()=>sel.reduce((a,b)=>a+b,0);
  const draw=()=>{tray.innerHTML='';sel.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML=dgTok(v);b.onclick=()=>{sel.splice(i,1);sfx('tap');draw();};tray.appendChild(b);});tot.textContent=sum();};
  card.querySelectorAll('.purse button').forEach(b=>b.onclick=()=>{const v=+b.dataset.v;if(sum()+v>S.yen){sfx('ng');fb.textContent='[持|も]っている どんぐりより [多|おお]く なっちゃうよ';return;}sel.push(v);sel.sort((a,b)=>b-a);sfx('tap');fb.textContent='';draw();});
  const finish=()=>{S.yen-=o.price;o.onPaid();S.st.math++;ev('buy');questEvent('buy',o.kind||'');ev('subj:math');addXP(8);save();sfx('fan');confetti();
    card.innerHTML=head('おかいもの [成|せい][功|こう]！',o.who)+`<div class="catch"><div class="pic">${o.e}</div><div class="nm">${o.name}を かったよ！</div><p class="mnote">${tries===0?'ばっちり！ ':''}[経|けい][験|けん][値|ち] +8</p></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="more">ほかも みる</button><button class="big-btn" type="button" data-a="end">お[店|みせ]を でる</button></div>`;wire(card);onAct(card,{more:o.back,end:closeModal});};
  onAct(card,{back:o.back,pay:()=>{const s=sum();if(s===o.price)return finish();
    if(s<o.price){tries++;sfx('ng');fb.innerHTML=`<b>[足|た]りないよ！</b> ${o.price}こに するには あと なんこ かな？`;return;}
    if(S.grade===1){tries++;sfx('ng');fb.innerHTML='<b>[多|おお]すぎるよ！</b> ちょうどに しよう。 [下|した]の どんぐりを タッチすると もどせるよ';return;}
    const ch=s-o.price;fb.innerHTML='';const q=Q(`どんぐりを ${s}こ だしたね。 おつりは なんこ？`,'おつりは なんこ？',numC(ch,[ch+10,ch-10,ch+1,ch-1,ch+100],'こ').map(LG),ch,`${s} − ${o.price} を [計|けい][算|さん] しよう`);q.topic='sub';
    const box=document.createElement('div');box.className='qbox';fb.appendChild(box);renderQ(box,q,()=>finish());}});}
function shopGrid(list){return `<div class="grid-items">${list.map(it=>`<button class="item${it.sel?' sel':''}" type="button" data-id="${it.id}"${it.dis?' disabled':''}><span class="ie">${it.e}</span>${it.n}${it.p!=null?`<span class="ip">🌰${it.p}こ</span>`:''}${it.sub?`<span class="${it.own?'own':'sub'}">${it.sub}</span>`:''}</button>`).join('')}</div>`;}
/* furniture shop (かぐや): today's stock as big picture cards, prices in acorns.
   Not enough acorns → メリー gently says how many more are needed (with the little subtraction shown). */
const FURN_CORE=['plant','chair','table'];  // いつも おいて ある かぐ（さいしょの クエスト ようにも やすい もの）
const FURN_ROT=['lamp','rug','bed','snowman','teddy','desk','globe','shelf','sofa','tank','clock','xmas','tv','rocket','piano'];
const FURN_ROT_N=4;                          // ひがわりで ならぶ かずの かず
function seedRand(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return ()=>{h=Math.imul(h^(h>>>15),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;return (h>>>0)/4294967296;};}
/* same list all day, a little different each day */
function furnStock(day){const r=seedRand('furn'+(day||dayKey())),rot=FURN_ROT.slice();for(let i=rot.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[rot[i],rot[j]]=[rot[j],rot[i]];}
  return FURN_CORE.concat(rot.slice(0,FURN_ROT_N)).sort((a,b)=>FURN[a].p-FURN[b].p);}
function furnShort(f){const n=f.p-S.yen;return [`${f.n}は どんぐり ${f.p}こ。 [今|いま] ${S.yen}こ だから、 あと ${n}こ [集|あつ]めたら かえるよ！`,`<div class="eqchip">${f.p} − ${S.yen} = ${n}</div>`];}
function openFurnShop(msg){const who=FR('merry'),card=openModal(),list=furnStock();
  card.innerHTML=head('メリーの [家|か][具|ぐ]や',who)+`<div class="req-talk"></div><p class="mnote">[今日|きょう]の [品|しな][物|もの] ／ [持|も]っている どんぐり： <b>${S.yen}</b>こ</p><div class="fcards">${list.map(id=>{const f=FURN[id],own=S.own.furn[id]||0,short=f.p-S.yen;
      return `<button class="fcard${short>0?' short':''}" type="button" data-id="${id}"><span class="fe">${f.e}</span><span class="fn">${f.n}</span><span class="fp">どんぐり ${f.p}こ</span>${own?`<span class="fo">[持|も]っている ${own}こ</span>`:''}${short>0?`<span class="fs">あと ${short}こ</span>`:''}</button>`;}).join('')}</div><p class="mnote">[品|しな][物|もの]は ひに よって [少|すこ]し [変|か]わるよ。 かった [家|か][具|ぐ]は おうちの 「[模|も][様|よう]がえ」で おけるよ</p>`;wire(card);
  const tk=card.querySelector('.req-talk');typeSay(tk,who,msg||pick(['いらっしゃいませ〜！ [今日|きょう]の [品|しな][物|もの]は こちらよ。','いらっしゃい！ どれでも ゆっくり みてね。']));
  card.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id,f=FURN[id];
    if(S.yen<f.p){sfx('tap');const[s,eq]=furnShort(f);typeSay(tk,who,s,eq);return;}
    payGame({name:f.n,e:f.e,price:f.p,who,kind:'furn',back:()=>openFurnShop('ほかにも みていってね。'),onPaid:()=>{S.own.furn[id]=(S.own.furn[id]||0)+1;}});});}
function openClothes(tab){tab=tab||'hat';const who=FR('kon'),card=openModal();const src=tab==='hat'?HATS:tab==='acc'?ACCS:SHIRTS;const ownL=S.own[tab==='shirt'?'shirt':tab];
  const list=Object.entries(src).filter(([id,v])=>!v.gift||ownL.includes(id)).map(([id,v])=>{const own=ownL.includes(id);return {id,e:tab==='shirt'?`<span class="sw" style="background:#${v.c.toString(16).padStart(6,'0')}"></span>`:v.e,n:v.n,p:own?null:v.p,sub:own?(S.look[tab]===id?'きている':'[持|も]っている'):'',own};});
  card.innerHTML=head('コンの [洋|よう][服|ふく][屋|や]',who)+`<div class="tabs">${[['hat','ぼうし'],['shirt','ふく'],['acc','こもの']].map(([k,n])=>`<button class="tab${k===tab?' on':''}" type="button" data-tab="${k}">${n}</button>`).join('')}</div><p class="mnote">どんぐり： <b>${S.yen}</b>こ ／ [持|も]っている ものを タッチすると きがえるよ</p>`+shopGrid(list);wire(card);
  card.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openClothes(b.dataset.tab));
  card.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id,v=src[id];if(ownL.includes(id)){S.look[tab]=id;rebuildPlayer();save();sfx('tap');toast('きがえたよ！');return openClothes(tab);}
    if(S.yen<v.p){sfx('ng');return toast(`あと どんぐり ${v.p-S.yen}こ [足|た]りないよ`);}payGame({name:v.n,e:tab==='shirt'?'👕':v.e,price:v.p,who,back:()=>openClothes(tab),onPaid:()=>{ownL.push(id);S.look[tab]=id;rebuildPlayer();checkAch();}});});}
function openZakka(tab){tab=tab||'wall';const who=FR('hana'),card=openModal();const src=tab==='wall'?WALLS:FLOORS;const ownL=S.own[tab];
  const list=Object.entries(src).map(([id,v])=>{const own=ownL.includes(id);return {id,e:tab==='wall'?roomPrev(id,S.room.floor):roomPrev(S.room.wall,id),n:v.n,p:own?null:v.p,sub:own?'[持|も]っている':'',own};});
  card.innerHTML=head('ハナの [雑|ざっ][貨|か][屋|や]',who)+`<div class="tabs"><button class="tab${tab==='wall'?' on':''}" type="button" data-tab="wall">かべ[紙|がみ]</button><button class="tab${tab==='floor'?' on':''}" type="button" data-tab="floor">ゆか</button></div><p class="mnote">どんぐり： <b>${S.yen}</b>こ ／ かったら おうちの [部|へ][屋|や]で はりかえてね</p>`+shopGrid(list);wire(card);
  card.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openZakka(b.dataset.tab));
  card.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id,v=src[id];if(ownL.includes(id))return toast('もう [持|も]っているよ。 おうちで はりかえてね');if(S.yen<v.p){sfx('ng');return toast(`あと どんぐり ${v.p-S.yen}こ [足|た]りないよ`);}
    payGame({name:v.n,e:tab==='wall'?'🧻':'🟫',price:v.p,who,back:()=>openZakka(tab),onPaid:()=>{ownL.push(id);}});});}

/* ===== dress-up panel ===== */
let dressOpen=false;
function openDress(tab){tab=tab||'animal';if(!dressOpen){dressOpen=true;setBusy(1);camMode='dress';}const p=$('#panel');p.hidden=false;
  const opts=tab==='animal'?Object.entries(ANIMALS).map(([id,a])=>[id,a.em,a.n]):tab==='hat'?S.own.hat.map(id=>[id,HATS[id].e,HATS[id].n]):tab==='acc'?S.own.acc.map(id=>[id,ACCS[id].e,ACCS[id].n]):S.own.shirt.map(id=>[id,`<span class="sw" style="background:#${SHIRTS[id].c.toString(16).padStart(6,'0')}"></span>`,SHIRTS[id].n]);
  p.innerHTML=`<div class="m-head"><span class="m-face">👗</span><h2>[着|き]せかえ</h2><button class="m-close" type="button" aria-label="とじる">×</button></div><div class="tabs">${[['animal','[動|どう][物|ぶつ]'],['hat','ぼうし'],['shirt','ふく'],['acc','こもの']].map(([k,n])=>`<button class="tab${k===tab?' on':''}" type="button" data-tab="${k}">${n}</button>`).join('')}</div><div class="grid-items">${opts.map(([id,e,n])=>`<button class="item${S.look[tab]===id?' sel':''}" type="button" data-id="${id}"><span class="ie">${e}</span>${n}</button>`).join('')}</div><p class="mnote">ほかの ふくや ぼうしは [商|しょう][店|てん][街|がい]の 「[洋|よう][服|ふく][屋|や]」で かえるよ</p>`;
  p.querySelector('.m-close').onclick=closeDress;p.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openDress(b.dataset.tab));
  p.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{S.look[tab]=b.dataset.id;rebuildPlayer();save();sfx('tap');openDress(tab);});}
function closeDress(){if(!dressOpen)return;dressOpen=false;$('#panel').hidden=true;camMode='follow';setBusy(-1);}

/* ===== menus ===== */
function openMenu(){if(busy||mode!=='world')return;const card=openModal();
  card.innerHTML=head('メニュー',null)+`<div class="menu-grid">${[['book','📗','[教|きょう][科|か][書|しょ]'],['study','📚','[勉|べん][強|きょう]'],['quest','📜','クエスト'],['dress','👗','[着|き]せかえ'],['zukan','📖','[図|ず]かん'],['ach','🏆','[実|じっ][績|せき]'],['mission','📋','ミッション'],['map','🗺️','[地|ち][図|ず]'],['bag','🎒','[持|も]ち[物|もの]'],['rec','📊','[記|き][録|ろく]'],['set','⚙️','[設|せっ][定|てい]']].map(([k,i,n])=>`<button type="button" data-a="${k}"><span class="mi">${i}</span>${n}</button>`).join('')}</div>
  <p class="sec">[時|じ][間|かん]（テストよう）</p><div class="tabs">${[['7.5','🌅 [朝|あさ]'],['12','☀️ [昼|ひる]'],['18.3','🌇 [夕|ゆう][方|がた]'],['21','🌙 [夜|よる]'],['','もとに もどす']].map(([h,n])=>`<button class="tab${(h===''?testHour==null:testHour===+h)?' on':''}" type="button" data-th="${h}">${n}</button>`).join('')}</div>`;wire(card);
  card.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{testHour=b.dataset.th===''?null:+b.dataset.th;applyTOD();closeModal();toast(testHour==null?'[時|じ][間|かん]を もとに もどしたよ':b.textContent+' に したよ（テスト）');});
  onAct(card,{book:()=>openTextbook(),study:openDrill,quest:openQuests,dress:()=>{closeModal();openDress();},zukan:openZukan,ach:openAch,mission:openMissions,map:openMap,bag:openBag,rec:openRecord,set:openSettings});}
function openMissions(){ensureMissions();const card=openModal();const L=S.missions.list;
  card.innerHTML=head('[今日|きょう]の ミッション',null)+`<ul class="mlist">${L.map(m=>`<li class="${m.done?'done':''}"><span class="chk">${m.done?'✓':''}</span><div class="mt">${m.x}<div class="bar"><i style="width:${Math.min(100,m.n/m.g*100)}%"></i></div></div><b>${Math.min(m.n,m.g)}/${m.g}</b></li>`).join('')}</ul><p class="mnote">1つ クリアで どんぐり 10こ。 [全|ぜん][部|ぶ] クリアで さらに どんぐり 20こ！<br>ミッションは [毎|まい][日|にち] [変|か]わるよ。</p><div class="btn-row"><button class="big-btn" type="button" data-a="ok">がんばる！</button></div>`;wire(card);onAct(card,{ok:closeModal});}
function openZukan(){const card=openModal();const cell=(have,e,n,c)=>`<div class="${have?'':'no'}"><span class="ze">${e}</span>${have?`${n}<br>×${c}`:'？？？'}</div>`;const fz=l=>l.map(f=>cell(S.st.fish[f[0]],f[2],f[1],S.st.fish[f[0]])).join('');
  card.innerHTML=head('[生|い]き[物|もの] [図|ず]かん',null)+`<h3 class="sec">[川|かわ]の [魚|さかな]</h3><div class="zk">${fz(FISH.river)}</div><h3 class="sec">[海|うみ]の [魚|さかな]</h3><div class="zk">${fz(FISH.sea)}</div><h3 class="sec">[島|しま]の [魚|さかな]</h3><div class="zk">${fz(FISH.island)}</div><h3 class="sec">[森|もり]の [虫|むし]</h3><div class="zk">${BUGS.map(b=>cell(S.st.bugs[b[0]],b[2],b[1],S.st.bugs[b[0]])).join('')}</div>
  <h3 class="sec">[友|とも]だち</h3><div class="zk">${FRIENDS.map(f=>`<div class="${S.st.met[f.id]?'':'no'}"><span class="ze">${f.em}</span>${S.st.met[f.id]?f.n+(f.role?'':`<br>${'❤'.repeat(S.hearts[f.id]||0)}`):'？？？'}</div>`).join('')}</div>`;wire(card);}
function openAch(){const card=openModal();const n=Object.keys(S.ach).length;card.innerHTML=head(`[実|じっ][績|せき] ${n}/${ACH.length}`,null)+`<ul class="mlist">${ACH.map(([id,nm,d])=>`<li class="${S.ach[id]?'done':''}"><span class="chk">${S.ach[id]?'🏆':''}</span><div class="mt">${nm}<div class="md">${d}</div></div></li>`).join('')}</ul><p class="mnote">[実|じっ][績|せき] 1つで どんぐり 20こ。 10こで トロフィーが もらえるよ！</p>`;wire(card);}
function openBag(){const card=openModal();const fi=Object.entries(S.own.furn).filter(([,c])=>c>0);
  card.innerHTML=head('[持|も]ち[物|もの]',null)+`<div class="statgrid"><div>どんぐり<b>${S.yen}こ</b></div><div>[貝|かい]がら<b>${S.st.shells}</b></div><div>[星|ほし]の かけら<b>${S.st.shards.length}/15</b></div>${Object.keys(SUBJ).map(s=>`<div>${SUBJ[s].n}<b>${S.st[s]||0}もん</b></div>`).join('')}<div>れんぞく [最|さい][高|こう]<b>${S.st.best}</b></div></div><h3 class="sec">[家|か][具|ぐ]</h3>`+shopGrid(fi.map(([id,c])=>({id,e:FURN[id].e,n:FURN[id].n,sub:`×${c}`,own:true})));wire(card);}
function openSettings(){const card=openModal();
  card.innerHTML=head('[設|せっ][定|てい]',null)+`<p class="sec">[学|がく][年|ねん]（[問|もん][題|だい]の [難|むずか]しさ）</p><div class="tabs">${GRADES.map(g=>`<button class="tab${S.grade===g?' on':''}" type="button" data-g="${g}">${g}[年|ねん][生|せい]</button>`).join('')}</div>${favSettingsHTML()}<p class="sec">おと</p><div class="tabs"><button class="tab${S.sound?' on':''}" type="button" data-s="1">ON</button><button class="tab${S.sound?'':' on'}" type="button" data-s="0">OFF</button></div>
  <p class="sec">[空|そら]の [時|じ][間|かん]</p><div class="tabs">${[['real','[本|ほん][当|とう]の [時|じ][間|かん]'],['morning','[朝|あさ]'],['day','[昼|ひる]'],['evening','[夕|ゆう][方|がた]'],['night','[夜|よる]']].map(([k,n])=>`<button class="tab${(TOD_H[S.tod]!=null?S.tod:'real')===k?' on':''}" type="button" data-t="${k}">${n}</button>`).join('')}</div>
  <p class="sec">[季|き][節|せつ]</p><div class="tabs">${[['real','[本|ほん][当|とう]の [季|き][節|せつ]'],...SEASONS].map(([k,n])=>`<button class="tab${(S.season||'real')===k?' on':''}" type="button" data-se="${k}">${n}</button>`).join('')}</div>${(S.season||'real')==='real'?`<p class="mnote">[今|いま]は ${seasonName(curSeason())} だよ</p>`:''}
  <p class="sec">がしつ</p><div class="tabs"><button class="tab${S.quality==='high'?' on':''}" type="button" data-q="high">きれい</button><button class="tab${S.quality==='low'?' on':''}" type="button" data-q="low">[軽|かる]い</button></div>
  <p class="sec">アカウント</p><div class="btn-row"><button class="big-btn calm" type="button" data-a="acc">👥 [他|ほか]の [人|ひと]に かわる</button></div>
  <button class="small-link" type="button" data-a="reset">[最|さい][初|しょ]から やりなおす</button><div class="confirm" hidden><div>[本|ほん][当|とう]に [全|ぜん][部|ぶ] けして [最|さい][初|しょ]から？</div><div class="btn-row"><button class="big-btn calm" type="button" data-a="no">やめる</button><button class="big-btn" type="button" data-a="yes">けす</button></div></div>`;wire(card);
  favSettingsWire(card,openSettings);card.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{if(S.grade!==+b.dataset.g)adaptReset();S.grade=+b.dataset.g;save();kjRefresh();if(!gradeUp())openSettings();});
  card.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{S.sound=b.dataset.s==='1';initAudio();S.sound?bgmStart():bgmStop();save();openSettings();});
  card.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.tod=b.dataset.t;applyTOD();save();openSettings();});
  card.querySelectorAll('[data-se]').forEach(b=>b.onclick=()=>{S.season=b.dataset.se;applySeason();save();openSettings();});
  card.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{S.quality=b.dataset.q;applyQuality();save();openSettings();});
  const cf=card.querySelector('.confirm');onAct(card,{acc:()=>{save();NO_SAVE=true;if(location.hash)history.replaceState(null,'',location.pathname+location.search);location.reload();},
    reset:()=>{cf.hidden=false;},no:()=>{cf.hidden=true;},yes:()=>{NO_SAVE=true;try{localStorage.removeItem(SAVE_KEY);}catch(e){}location.reload();}});}
const WARPS=[['[広|ひろ][場|ば] [公|こう][園|えん]','⛲',0,14],['どんぐり [学|がっ][校|こう]','🏫',0,-27.6],['[商|しょう][店|てん][街|がい]','🛍️',0,25.5],['[私|わたし]の [家|いえ]','🏠',-26,-1.4],['どんぐりの [森|もり]','🌲',79,-8],['せせらぎの [川|かわ]','🏞️',30,0],['[砂|すな]はま','🏖️',0,56],['アスレチック','🧗',-60,-12,'ath'],['[遊|ゆう][園|えん][地|ち]','🎡',-60,15,'amuse'],['[宝|たから][島|じま]','🏝️',70,96,'island'],['[遺|い]せき','🏛️',-30,-79,'ruins']];
function openMap(){const card=openModal();
  card.innerHTML=head('[地|ち][図|ず]',null)+`<canvas id="bigmap" width="640" height="640"></canvas><p class="mnote">[地|ち][図|ず]の [場|ば][所|しょ]か、 [下|した]の ボタンを タッチすると ワープできるよ！ ⭐は クエストの [行|い]き[先|さき]</p><div class="topics">${WARPS.map((w,i)=>{const r=w[4]&&REG.find(g=>g.id===w[4]);const lk=r&&regLocked(r);return `<button class="topic" type="button" data-w="${i}"${lk?' disabled':''}><span class="ti">${lk?'🔒':w[1]}</span>${w[0]}${lk?`<span class="tc">レベル${r.lv}で いける</span>`:''}</button>`;}).join('')}</div>`;
  wire(card);const cv=$('#bigmap');drawMap(cv,true);
  card.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>warpTo(WARPS[+b.dataset.w]));
  cv.onclick=e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*250-125,z=(e.clientY-r.top)/r.height*250-125;let best=null,bd=22;
    WARPS.forEach(w=>{const d=Math.hypot(w[2]-x,w[3]-z);if(d<bd){bd=d;best=w;}});if(!best)return toast('[近|ちか]くの [場|ば][所|しょ]を タッチしてね');const g=best[4]&&REG.find(q=>q.id===best[4]);if(g&&regLocked(g)){sfx('ng');return toast(`「${best[0]}」は レベル${g.lv}で いけるよ`);}warpTo(best);};}
function warpTo(w){closeModal();sfx('star');fade(()=>{
  if(curRoom){const R=curRoom;if(R.host){const n=npcs.find(n=>n.f.id===R.host);if(n.out){n.pos.copy(n.out.p);n.home.copy(n.out.h);}n.inRoom=false;}curRoom=null;ROOM=null;scene.fog.near=95;scene.fog.far=240;roomLight.intensity=0;}
  P.riding=null;P.vy=0;P.pos.set(w[2],0,w[3]);P.rot=Math.PI;cam.yaw=0;cam.pitch=CAM_PITCH;cam.dist=CAM_DIST;cam.tgt.set(w[2],1.3,w[3]);applyTOD();curArea='';later(()=>areaToast(w[0]),300);});}
