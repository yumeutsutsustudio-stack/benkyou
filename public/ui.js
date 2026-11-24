'use strict';
/* ===== audio & speech ===== */
let AC=null,bgmTimer=null,beat=0;
function initAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){AC=null;}}
function tone(f,d,type,vol,when){if(!AC||!S.sound)return;try{const t=AC.currentTime+(when||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.1,t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.05);}catch(e){}}
function sfx(n){(({ok:()=>{tone(784,.14,'triangle',.13);tone(1047,.3,'triangle',.13,.11);},ng:()=>{tone(330,.16,'sine',.08);tone(262,.22,'sine',.08,.12);},coin:()=>{tone(1319,.08,'square',.035);tone(1760,.15,'square',.035,.07);},
  blip:()=>tone(620+Math.random()*120,.04,'sine',.025),bite:()=>{tone(440,.08,'sine',.14);tone(660,.1,'sine',.14,.09);},fan:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.25,'triangle',.11,i*.12)),
  tap:()=>tone(880,.05,'triangle',.05),
  kira:()=>{[1568,2093,2637,3136].forEach((f,i)=>tone(f,.22,'triangle',.05,i*.07));tone(4186,.35,'sine',.025,.3);}, /* cute sparkle chime (right answer in a request) */jump:()=>{tone(400,.08,'sine',.08);tone(700,.1,'sine',.06,.05);},star:()=>{tone(1047,.1,'triangle',.1);tone(1568,.18,'triangle',.1,.08);}})[n]||(()=>{}))();}
const MEL=[523,587,659,784,880,784,659,587];
function bgmStart(){if(bgmTimer||!AC||!S.sound)return;bgmTimer=setInterval(()=>{beat++;if(Math.random()<.65)tone(pick(MEL)*(Math.random()<.2?.5:1),.45,'sine',.026);if(beat%4===0)tone([131,175,196,165][(beat/4)%4|0],.9,'triangle',.032);},430);}
function bgmStop(){clearInterval(bgmTimer);bgmTimer=null;}
/* en: an English word / phrase read after the Japanese (えいごの もんだい) */
function speak(text,en){try{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const t=kana(String(text||'')).replace(/<[^>]+>/g,'');
  if(t){const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.9;u.pitch=1.15;speechSynthesis.speak(u);}
  if(en){const v=new SpeechSynthesisUtterance(en);v.lang='en-US';v.rate=.8;v.pitch=1.1;speechSynthesis.speak(v);}}catch(e){}}

/* ===== small feedback ===== */
const toastQ=[];let toastBusy=false;
function toast(msg){toastQ.push(msg);if(!toastBusy)nextToast();}
function nextToast(){const t=$('#toast');if(!toastQ.length){toastBusy=false;return;}toastBusy=true;t.textContent=toastQ.shift();t.classList.add('show');later(()=>{t.classList.remove('show');later(nextToast,300);},2300);}
let areaT=null;function areaToast(n){const a=$('#areaToast');a.textContent=n;a.classList.add('show');clearTimeout(areaT);areaT=later(()=>a.classList.remove('show'),2200);}
function confetti(n){const cols=['#ff6f91','#ffd45c','#6dbb58','#8fd3f4','#b39ddb'];for(let i=0;i<(n||26);i++){const d=document.createElement('i');d.className='confetti';d.style.left=Math.random()*100+'vw';d.style.background=pick(cols);d.style.animationDelay=Math.random()*.4+'s';d.style.borderRadius=Math.random()<.5?'50%':'2px';document.body.appendChild(d);later(()=>d.remove(),2300);}}
let busy=0;function setBusy(d){busy=Math.max(0,busy+d);document.body.classList.toggle('busy',busy>0||mode!=='world');}

/* phones / iPad: WebAudio only starts inside a user gesture — unlock it on the very first tap / key, and wake it again if the OS suspended it */
function unlockAudio(){initAudio();if(!AC)return;try{if(AC.state!=='running')AC.resume();
  if(!unlockAudio.done){const s=AC.createBufferSource();s.buffer=AC.createBuffer(1,1,22050);s.connect(AC.destination);s.start(0);unlockAudio.done=true;}}catch(e){}}
['pointerdown','touchend','keydown'].forEach(n=>addEventListener(n,unlockAudio,{capture:true,passive:true}));

/* ===== villager voices: short soft "po / pi" blips, pitch per animal (owl low, bear middle, rabbit / panda high) ===== */
const VOICE={fukurou:250,kame:300,dragon:340,kuma:410,kaeru:440,inu:470,hitsuji:510,kitsune:530,neko:560,pengin:590,risu:630,panda:650,hamster:680,usagi:700};
const VOICE_VOL=.04;          // こえの おおきさ（ちいさめ）
function voiceOf(who){if(!who)return 0;let h=0;for(const c of String(who.id||who.n||''))h=(h*31+c.charCodeAt(0))%997;return (VOICE[who.kind]||520)*(.95+(h%11)/100);} /* same animal, slightly different voice per villager */
function voiceBlip(base,k,mod,rise){if(!AC||!S.sound||!base)return;try{const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(),f=base*mod*(1+Math.sin(k*2.3)*.06+(Math.random()-.5)*.05);
  o.type='triangle';if(rise){o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*rise,t+.07);}else{o.frequency.setValueAtTime(f*1.18,t);o.frequency.exponentialRampToValueAtTime(f,t+.035);}
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(VOICE_VOL,t+.006);g.gain.exponentialRampToValueAtTime(.0004,t+(rise?.1:.075));o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.12);}catch(e){}}
/* happy line → ♪ over the head, surprised line → ！ */
const EMO_SURPRISE=/^(えっ|ええ|わっ|あっ|おお|おや|ほう|なんと|びっくり)|！？|？！|!\?|\?!/,EMO_HAPPY=/ありがとう|うれしい|やった|すごい|だいすき|わーい|たのしい|よかった|♪|おめでとう|ようこそ|わくわく|いいね|すてき|かわいい|なかよし/;
const lineEmo=s=>EMO_SURPRISE.test(s)?'surprise':EMO_HAPPY.test(s)?'happy':null;

/* ===== dialog ===== */
const TYPE_MS=58;             // 1もじの はやさ（≒ 1びょうに 17もじ）
const TYPE_PAUSE={'、':170,'，':170,',':170,'。':300,'！':260,'？':300,'!':260,'?':300,'…':200};
const SENT_END=/[。！？!?]/;
let dlgAdv=null;
function talk(who,lines,choices){const raw=lines.map(String);lines=raw.map(s=>kj(s));if(choices)choices=choices.map(s=>kj(s)); /* [漢字|かんじ] → this grade (kanji.js) before typing */
  return new Promise(res=>{
  setBusy(1);const dlg=$('#dialog');dlg.hidden=false;$('#dlgName').textContent=who?who.n:'';$('#dlgFace').textContent=who?who.em:'';
  let i=0,typing=null;const text=$('#dlgText'),ch=$('#dlgChoices'),nx=$('#dlgNext');
  const npc=who&&typeof npcs!=='undefined'?npcs.find(n=>n.f===who):null,base=voiceOf(who);if(npc)npc.talking=true;
  const speaking=on=>{if(npc)npc.speaking=on;};
  const fin=()=>{speaking(false);if(i===lines.length-1&&choices){ch.innerHTML='';choices.forEach((lab,idx)=>{const b=document.createElement('button');b.type='button';b.className='dlg-choice'+(idx?' alt':'');b.textContent=lab;b.onclick=e=>{e.stopPropagation();close(idx);};ch.appendChild(b);});ch.firstChild.focus({preventScroll:true});}else nx.hidden=false;};
  /* type one character at a time (pause after 、。！？), a voice blip per spoken character; ！ sentences a bit higher, ？ rises at the end */
  const show=()=>{const s=lines[i],C=Array.from(s);text.textContent='';ch.innerHTML='';nx.hidden=true;let k=0;speaking(true);
    const emo=lineEmo(kana(raw[i]));if(emo&&npc&&typeof npcEmote==='function')npcEmote(npc,emo);
    const tail=C.map((c,j)=>{for(let q=j;q<C.length;q++)if(SENT_END.test(C[q]))return [C[q],q-j];return [null,99];});
    const step=()=>{k++;text.textContent=C.slice(0,k).join('');const c=C[k-1];
      if(!/[\s、。！？!?，,…・「」『』（）()〜ー]/.test(c)){const[e,dist]=tail[k-1];const loud=e==='！'||e==='!';voiceBlip(base,k,loud?1.13:1,(e==='？'||e==='?')&&dist<=1?1.35:0);}
      if(k>=C.length){typing=null;fin();return;}typing=setTimeout(step,/\s/.test(c)?25:TYPE_MS+(TYPE_PAUSE[c]||0));};
    typing=setTimeout(step,TYPE_MS);};
  const adv=()=>{if(typing){clearTimeout(typing);typing=null;text.textContent=lines[i];fin();return;}if(i===lines.length-1&&choices)return;i++;if(i>=lines.length)close(-1);else show();};
  const close=v=>{if(typing)clearTimeout(typing);speaking(false);if(npc)npc.talking=false;dlg.hidden=true;dlg.onclick=null;dlgAdv=null;setBusy(-1);res(v);};
  dlg.onclick=e=>{if(e.target.closest('.dlg-choice'))return;adv();};dlgAdv=adv;show();});}

/* a villager's line inside a card (shop etc.): typed out with their voice; extra HTML (e.g. a little sum) appears when done */
function typeSay(el,who,s,extra){s=kj(s);el.hidden=false;el.innerHTML=`<div class="story req-say"><span class="rf">${who.em}</span><span><span class="rt"></span><span class="rx"></span></span></div>`;
  const t=el.querySelector('.rt'),x=el.querySelector('.rx'),C=Array.from(s),base=voiceOf(who);let k=0;clearTimeout(el._sayT);
  const step=()=>{if(!t.isConnected)return;k++;t.textContent=C.slice(0,k).join('');const c=C[k-1];if(!/[\s、。！？!?…「」]/.test(c))voiceBlip(base,k,(SENT_END.exec(s.slice(k-1))||[''])[0]==='！'?1.13:1,0);
    if(k<C.length)el._sayT=setTimeout(step,/\s/.test(c)?25:TYPE_MS*.8+(TYPE_PAUSE[c]||0)*.6);else if(extra)x.innerHTML=extra;};step();}

/* ===== modal ===== */
const modal=$('#modal'),mcard=$('#mcard');let modalGen=0;
function openModal(){if(modal.hidden)setBusy(1);modal.hidden=false;modalGen++;mcard.innerHTML='';mcard.scrollTop=0;return mcard;}
function closeModal(){if(modal.hidden)return;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();modal.hidden=true;mcard.innerHTML='';modalGen++;setBusy(-1);try{speechSynthesis.cancel();}catch(e){}save();if(pendingLv.length)later(flushLevel,250);else if(pendingQ.length)later(flushQuest,300);updateTracker();}
function head(title,who){return `<div class="m-head"><span class="m-face">${who?who.em:''}</span><h2>${title}</h2><button class="m-close" type="button" aria-label="とじる">×</button></div>`;}
function wire(card){const x=card.querySelector('.m-close');if(x)x.onclick=closeModal;}
function onAct(card,map){for(const k in map){const b=card.querySelector(`[data-a="${k}"]`);if(b)b.onclick=map[k];}}

/* ===== progress: yen / xp / level / missions / achievements ===== */
const need=lv=>60+lv*30;const pendingLv=[];
function updateHUD(){$('#lvNum').textContent=S.level;$('#xpFill').style.width=Math.min(100,S.xp/need(S.level)*100)+'%';$('#yenNum').textContent=S.yen;
  const left=S.missions?S.missions.list.filter(m=>!m.done).length:0;$('#mBadge').textContent=left?String(left):'';}
function addXP(n){S.xp+=n;while(S.xp>=need(S.level)&&S.level<60){S.xp-=need(S.level);S.level++;S.yen+=15;pendingLv.push(S.level);}if(pendingLv.length&&modal.hidden&&!dlgAdv)later(flushLevel,200);updateHUD();}
function flushLevel(){if(!pendingLv.length||!modal.hidden)return;let lv=0;const unl=[];while(pendingLv.length){lv=pendingLv.shift();REG.filter(r=>r.lv===lv).forEach(r=>unl.push(r));}
  refreshRegions();checkAch();sfx('fan');confetti(50);const card=openModal();
  card.innerHTML=`<div class="catch"><div class="stamp">🎉</div><div class="nm">レベル ${lv}に なった！</div><p class="mnote">ごほうび どんぐり 15こ！</p>${unl.map(r=>`<p class="gift">🗺️ [新|あたら]しい [場|ば][所|しょ] 「${r.n}」に いけるように なったよ！ [地|ち][図|ず]で [探|さが]してみよう。</p>`).join('')}</div><div class="btn-row"><button class="big-btn" type="button" data-a="ok">やったー！</button></div>`;onAct(card,{ok:closeModal});}
/* grade went up past the highest grade so far → celebrate once per grade (going down and back up gives nothing). Returns true if it opened the popup. */
const GRADE_GIFT=30;
function gradeUp(){const from=S.gradeTop,g=S.grade;if(!from||g<=from)return false;const n=(g-from)*GRADE_GIFT;S.gradeTop=g;S.yen+=n;updateHUD();save();sfx('fan');confetti(60);const card=openModal();
  card.innerHTML=`<div class="catch"><div class="stamp">🎒</div><div class="nm">${g}[年|ねん][生|せい]に なったね！</div><p class="mnote">おめでとう！ ごほうびに どんぐり ${n}こ！</p><p class="gift">🌰 [集|あつ]めた どんぐりも レベルも そのままだよ。 ${g}[年|ねん][生|せい]の [新|あたら]しい [問|もん][題|だい]にも チャレンジしてみよう！</p></div><div class="btn-row"><button class="big-btn" type="button" data-a="ok">やったー！</button></div>`;onAct(card,{ok:closeModal});return true;}
function ensureMissions(){const today=new Date().toDateString();if(S.missions&&S.missions.date===today)return;
  const pool=MPOOL.filter(m=>(!m.lv||S.level>=m.lv)&&(!m.gr||S.grade>=m.gr));S.missions={date:today,bonus:false,list:shuffle(pool).slice(0,3).map(m=>({t:m.t,g:m.g,x:m.x,n:0,done:false}))};favMission(S.missions.list);}
function ev(type,n){if(S.missions){for(const m of S.missions.list)if(!m.done&&m.t===type){m.n+=n||1;if(m.n>=m.g){m.done=true;S.yen+=10;addXP(20);later(()=>{toast('ミッション クリア！ どんぐり 10こ ＋ [経|けい][験|けん][値|ち]20');sfx('fan');},500);}}
  if(!S.missions.bonus&&S.missions.list.every(m=>m.done)){S.missions.bonus=true;S.st.mdays++;S.yen+=20;later(()=>{toast('[今日|きょう]の ミッション [全|ぜん][部|ぶ] クリア！ ボーナス どんぐり 20こ');confetti(40);},2000);}}
  checkAch();updateHUD();}
function checkAch(){for(const [id,n] of ACH){if(S.ach[id])continue;const a=ACH.find(x=>x[0]===id);if(a[3](S)){S.ach[id]=Date.now();S.yen+=20;toast(`[実|じっ][績|せき] 「${n}」 たっせい！ どんぐり 20こ`);
  if(Object.keys(S.ach).length>=10&&!S.own.furn.trophy){S.own.furn.trophy=1;toast('[実|じっ][績|せき] 10こ！ トロフィーを もらったよ');}}}updateHUD();}
function award(topic,tries,quiet){const sub=topicSubj(topic);recAnswer(topic,tries,false);const yen=tries===0?10:5,xp=tries===0?10:6;S.yen+=yen;S.st.correct++;S.st[sub]++;S.st.topic[topic]=(S.st.topic[topic]||0)+1;
  if(tries===0){S.st.streak++;S.st.best=Math.max(S.st.best,S.st.streak);}else S.st.streak=0;
  if(!quiet){sfx('ok');later(()=>sfx('coin'),250);}addXP(xp);ev('correct');ev('topic:'+topic);ev('subj:'+sub);save();return {yen,xp,streak:S.st.streak};}
const PRAISE=['すごい！','[正|せい][解|かい]！','やったね！','ばっちり！','てんさい！','かんぺき！','いいね！'];

/* ===== question UI ===== */
function renderQ(box,q,done){if(q.type==='order')return renderOrder(box,q,done);
  box.innerHTML=`<div class="q-prompt">${q.prompt}</div><div class="qtools"><button class="speak" type="button">🔊 [読|よ]み[上|あ]げ</button><button class="hintb" type="button">💡 ヒント</button></div><div class="choices"></div><div class="feedback" aria-live="polite"></div>`;
  const ce=box.querySelector('.choices'),fb=box.querySelector('.feedback');let tries=0,fin=false;const btns=[];
  box.querySelector('.speak').onclick=()=>speak(q.speak,q.en);box.querySelector('.hintb').onclick=()=>{fb.innerHTML=`<div class="hintbox">ヒント： ${q.hint}</div>`;};
  if(q.en&&q.enAuto)speak('',q.en); /* 「この えいご なあに？」 → まず おとを きかせる */
  q.choices.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='choice'+(c.cls?' '+c.cls:'');b.innerHTML=c.label;btns.push([b,c]);ce.appendChild(b);
    b.onclick=()=>{if(fin||b.disabled)return;
      if(c.value===q.answer){fin=true;b.classList.add('right');const r=award(q.topic,tries);fb.innerHTML=`<span class="good">${pick(PRAISE)}</span>　+どんぐり ${r.yen}こ ＋[経|けい][験|けん][値|ち]${r.xp}${r.streak>=3?`<br>れんぞく [正|せい][解|かい] ${r.streak}！`:''}`;later(()=>done(tries),1150);}
      else{tries++;b.disabled=true;b.classList.add('wrong');sfx('ng');
        if(tries===1)fb.innerHTML=`<b>おしい！</b> もう[一|いち][度|ど] [考|かんが]えて みよう<div class="hintbox">ヒント： ${q.hint}</div>`;
        else{btns.forEach(([bb,cc])=>{if(cc.value===q.answer)bb.classList.add('glow');else{bb.disabled=true;bb.classList.add('wrong');}});fb.innerHTML=`だいじょうぶ！ [答|こた]えは [光|ひか]っている ものだよ。<br>タッチして たしかめよう<div class="hintbox">${q.hint}</div>`;}}};});}
function renderOrder(box,q,done){const pcs=q.pieces;let order;let n=0;do{order=shuffle(pcs.map((_,i)=>i));n++;}while(n<20&&order.map(i=>pcs[i]).join('')===q.answer);
  box.innerHTML=`<div class="q-prompt">${q.prompt}</div><div class="qtools"><button class="speak" type="button">🔊 [読|よ]み[上|あ]げ</button><button class="hintb" type="button">💡 ヒント</button></div><div class="slots ${q.chunk?'chunk':''}"></div><div class="tiles ${q.chunk?'chunk':''}"></div><div class="btn-row"><button class="big-btn calm" type="button" data-a="reset">やりなおす</button></div><div class="feedback" aria-live="polite"></div>`;
  const se=box.querySelector('.slots'),te=box.querySelector('.tiles'),fb=box.querySelector('.feedback');const filled=Array(pcs.length).fill(null);let fixed=0,tries=0,lock=false;
  const tiles=order.map(i=>{const t=document.createElement('button');t.type='button';t.className='tile';t.textContent=pcs[i];te.appendChild(t);return t;});
  const slots=pcs.map((_,i)=>{const s=document.createElement('button');s.type='button';s.className='slot';s.onclick=()=>{if(lock||i<fixed||filled[i]==null)return;tiles[filled[i]].disabled=false;filled[i]=null;draw();};se.appendChild(s);return s;});
  const draw=()=>slots.forEach((s,i)=>{s.textContent=filled[i]==null?'':tiles[filled[i]].textContent;s.classList.toggle('filled',filled[i]!=null);s.classList.toggle('fixed',i<fixed);});
  const clear=()=>{for(let i=fixed;i<filled.length;i++){if(filled[i]!=null)tiles[filled[i]].disabled=false;filled[i]=null;}draw();};
  const fix=k=>{for(let i=0;i<filled.length;i++){if(filled[i]!=null)tiles[filled[i]].disabled=false;filled[i]=null;}fixed=Math.min(k,pcs.length-1);for(let i=0;i<fixed;i++){const ti=tiles.findIndex(t=>!t.disabled&&t.textContent===pcs[i]);filled[i]=ti;tiles[ti].disabled=true;}draw();};
  tiles.forEach((t,ti)=>t.onclick=()=>{if(lock)return;const e=filled.indexOf(null);if(e<0)return;filled[e]=ti;t.disabled=true;sfx('tap');draw();check();});
  const check=()=>{if(filled.includes(null))return;const w=filled.map(i=>tiles[i].textContent).join('');
    if(w===q.answer||(q.alts||[]).includes(w)){lock=true;se.classList.add('good');const r=award(q.topic,tries);fb.innerHTML=`<span class="good">${pick(PRAISE)}</span>　+どんぐり ${r.yen}こ ＋[経|けい][験|けん][値|ち]${r.xp}`;speak(q.say||w);later(()=>done(tries),1500);}
    else{tries++;sfx('ng');se.classList.remove('bad');void se.offsetWidth;se.classList.add('bad');fb.innerHTML=`<b>おしい！</b> もう [少|すこ]し！ [前|まえ]から ${Math.min(tries,pcs.length-1)}つ [入|い]れて おいたよ`;later(()=>fix(tries),600);}};
  box.querySelector('.speak').onclick=()=>speak(q.speak);box.querySelector('.hintb').onclick=()=>{fb.innerHTML=`<div class="hintbox">ヒント： ${q.hint}</div>`;};
  box.querySelector('[data-a=reset]').onclick=clear;draw();}
function runSet(o){const card=openModal(),R=o.rounds||3,gen=modalGen;let i=0,perfect=0;
  card.innerHTML=head(o.title,o.who)+`<div class="dots-prog"></div><div class="qbox"></div>`;wire(card);const dots=card.querySelector('.dots-prog'),qb=card.querySelector('.qbox');
  const next=()=>{if(gen!==modalGen)return;
    if(i>=R){S.yen+=20;addXP(10);ev('set');const extra=o.onDone?o.onDone(perfect===R)||'':'';updateHUD();save();sfx('fan');confetti();
      qb.innerHTML=`<div class="catch"><div class="stamp">${perfect===R?'💮':'⭐'}</div><div class="nm">${R}もん クリア！</div><p class="mnote">${perfect===R?'[全|ぜん][部|ぶ] 1[回|かい][目|め]で [正|せい][解|かい]！ [花|はな]まる！':'さいごまで がんばったね！'}<br>ボーナス どんぐり 20こ ＋ [経|けい][験|けん][値|ち]10</p>${extra}</div><div class="btn-row"><button class="big-btn calm" type="button" data-a="again">もう[一|いっ][回|かい]</button><button class="big-btn" type="button" data-a="end">[終|お]わる</button></div>`;
      onAct(qb,{again:()=>runSet(o),end:closeModal});return;}
    dots.innerHTML=Array.from({length:R},(_,k)=>`<i class="${k<i?'done':k===i?'now':''}"></i>`).join('');
    renderQ(qb,o.gen?o.gen():genQ(pick(o.topics)),t=>{if(t===0)perfect++;i++;next();});card.scrollTop=0;};
  next();}
