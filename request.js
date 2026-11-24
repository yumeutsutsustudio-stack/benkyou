'use strict';
/* ===== villager requests (おねがい): a villager with ？ over the head asks for help with a small study question
   tied to them / the village. Answer from big choice buttons (existing question UI). Grades 1–6 via S.grade.
   The problems themselves live in qdata/g{1..6}_{math,kokugo,rika,eigo,shakai,art}.js (one file per grade & subject) — add problems there.
   This file: the problem bank, how each villager asks, and the question builders. ===== */
const REQ_COOLDOWN=[150,330];   // おねがいを かなえた あと、 つぎの ？が でるまでの びょうすう（ランダム）
const REQ_BONUS=10;             // おねがいを かなえた ときの おれい（どんぐりの かず）
const REQ_BONUS_LEARN=3;        // 3かい まちがえて 「いっしょに おぼえた」 ときの おれい

/* ----- problem bank: QBANK[grade][subject] = [entries]; data files call qbank(grade, subject, [...]) ----- */
const GRADES=[1,2,3,4,5,6];   // えらべる がくねん（せってい・タイトルの ボタンも この かず）
const QBANK=Object.fromEntries(GRADES.map(g=>[g,{}]));
function qbank(grade,subj,list){list.forEach(e=>{e.grade=grade;e.subj=subj;});(QBANK[grade][subj]||(QBANK[grade][subj]=[])).push(...list);}
const bankAll=g=>QBANK[g]?Object.values(QBANK[g]).flat():[];
const bankUpTo=(g,type)=>GRADES.filter(x=>x<=g).flatMap(x=>bankAll(x)).filter(e=>e.type===type);

/* ----- which kind of problem each villager asks, and how they say it ({…} is filled in) ----- */
/* types: 'rika' 'shakai' 'art' = そのきょうかの もんだい、 'eng' = えいご。 lead: その もんだいの まえに いう ことば */
const REQ_WHO={
  moko:{types:['calc']},
  kuri:{types:['calc','rika'],lead:{rika:'[森|もり]で [不|ふ][思|し][議|ぎ]な ことを [見|み]つけたんだ。'}},
  pochi:{types:['calc','shakai'],lead:{shakai:'ワン！ [村|むら]の みまわり ちゅう なんだ。'}},
  pyon:{types:['calc','art'],lead:{art:'[遊|ゆう][園|えん][地|ち]の パレードの [準|じゅん][備|び]を してるの！'}},
  hoo:{types:['clock'],intro:'ホッホー。 [学|がっ][校|こう]の [時|と][計|けい]を [見|み]ておくれ。',say:'[時|と][計|けい]の はりは なん[時|じ]を [指|さ]しているかな？'},
  pen:{types:['clock','eng'],intro:'つりの [約|やく][束|そく]の [時|じ][間|かん]を [忘|わす]れちゃった。',say:'この [時|と][計|けい]の はりは なん[時|じ]を [指|さ]しているかな？',lead:{eng:'いつか [世|せ][界|かい]を たびしたいんだ。 [英|えい][語|ご]を [教|おし]えて！'}},
  rin:{types:['kanji','art'],mode:'read',say:'この [看|かん][板|ばん]の [読|よ]み[方|かた]を [教|おし]えて！',lead:{art:'[図|ず][工|こう]と [音|おん][楽|がく]の [宿|しゅく][題|だい]、 [手|て][伝|つだ]って！'}},
  dora:{types:['kanji'],mode:'write',say:'[遺|い]せきの かべに 「{r}」って [書|か]いて あるんだって。 どの [漢|かん][字|じ]かな？'},
  mii:{types:['kana','eng'],read:'お[店|みせ]の [看|かん][板|ばん]の カタカナ、 なんて [読|よ]むの？',write:'[新|あたら]しい [看|かん][板|ばん]を [作|つく]るの。 「{h}」は カタカナで どう [書|か]くの？',hira:'[手|て][紙|がみ]を [書|か]きたいの。 この [絵|え]の [名|な][前|まえ]、 ひらがなで どう [書|か]くの？',lead:{eng:'[英|えい][語|ご]の かんばんも [作|つく]りたいの。'}},
  kero:{types:['group','rika'],odd:'[言|こと][葉|ば]の [仲|なか][間|ま][分|わ]けを してるの。 [仲|なか][間|ま]はずれは どれ？',which:'「{name}」の [仲|なか][間|ま]は どれかな？ [教|おし]えて！',lead:{rika:'ケロ！ [生|い]き[物|もの]の こと、 しってる？'}},
  jiji:{types:['group','shakai','koku'],odd:'ほっほ。 [仲|なか][間|ま]はずれの [言|こと][葉|ば]は どれじゃ？',which:'「{name}」の [仲|なか][間|ま]は どれじゃろう？',lead:{shakai:'ほっほ。 [町|まち]の ことを きいても よいかの？',koku:'ほっほ。 [昔|むかし]からの [言|こと][葉|ば]を しっておるかの？'}}
};

/* ----- small helpers ----- */
const sayBox=(f,s)=>`<div class="story">${f.em} ${s}</div>`;
const QX={};const qx=(ex,v)=>{const k=Object.keys(v).join(',')+'|'+ex;try{return (QX[k]||(QX[k]=new Function(...Object.keys(v),'return ('+ex+');')))(...Object.values(v));}catch(e){return null;}};
const fill=(s,v)=>String(s||'').replace(/\{([^}]+)\}/g,(_,ex)=>{const r=qx(ex,v);return r==null?'':r;});
/* exactly n unique choices (answer + wrongs, in order of preference) */
function choicesN(ans,wrongs,n,cls){const seen=new Set([String(ans)]),vals=[ans];for(const w of wrongs){if(vals.length>=n)break;if(w==null||w==='')continue;const k=String(w);if(seen.has(k))continue;seen.add(k);vals.push(w);}
  return vals.length<n?null:shuffle(vals).map(v=>({label:String(v),value:String(v),cls}));}
/* difficulty step of the request being built (-2 … +2, from record.js adaptL): easier → 3 choices, smaller numbers, simpler clocks */
let REQ_L=0;
/* requests use 4 choices when there are enough good wrong answers, else 3 (3 when the child is finding it hard) */
const ch4=(a,w,c)=>REQ_L<0?choicesN(a,w,3,c):choicesN(a,w,4,c)||choicesN(a,w,3,c);
/* number range by difficulty: easier keeps the lower part of [lo,hi], harder the upper part (fb = fall back to the full range) */
function rng(r,fb){const[lo,hi]=r,s=hi-lo;if(fb||!REQ_L||s<2)return ri(lo,hi);const p=REQ_L===-2?[0,.4]:REQ_L===-1?[0,.65]:REQ_L===1?[.35,1]:[.6,1];return ri(Math.round(lo+s*p[0]),Math.round(lo+s*p[1]));}
const CLOCK_EASY={'1':'5','5':'half','half':'hour','hour':'hour'},CLOCK_HARD={'hour':'half','half':'5','5':'1','1':'1'};

/* picture aid shown after 2 wrong answers: lay the acorns (or the entry's picture) out so they can be counted */
function calcAid(e,v,ans){const P=e.pic||'🌰',row=(n,faint)=>{let s='';for(let i=0;i<n;i++){s+=faint?`<span style="opacity:.25">${P}</span>`:P;if(i%5===4)s+=' ';}return s;};
  if(e.ans==='a+b'&&ans<=20)return `<div class="pics">${row(v.a)} <b>＋</b> ${row(v.b)}</div>[全|ぜん][部|ぶ] [数|かぞ]えて みよう`;
  if(e.ans==='a-b'&&v.a<=20)return `<div class="pics">${row(v.a-v.b)}${row(v.b,true)}</div>うすい ${v.b}こを とったら、 [残|のこ]りは いくつ？`;
  if(e.ans==='a*b'&&ans<=45)return `<div class="pics">${Array(v.b).fill(`<span class="plate">${P.repeat(v.a)}</span>`).join('')}</div>${v.a}こずつ [数|かぞ]えて みよう`;
  if(e.ans==='a'&&v.a<=20)return `<div class="pics">${row(v.a)}</div>5こずつ まとまりに したよ`;
  if(e.ans==='a*10+b')return `<div class="pics">${Array(v.a).fill('<span class="plate">🌰×10</span>').join('')} ${P.repeat(v.b)}</div>10の まとまりを [先|さき]に [数|かぞ]えよう`;
  return '';}
/* ----- builders: entry → {intro:[lines], q} ----- */
const BUILD={
  /* けいさん・かずの かぞえかた: random numbers in ranges, answer from a formula */
  calc(e,f){for(let t=0;t<80;t++){const v={};['a','b','c'].forEach(k=>{if(e[k])v[k]=rng(e[k],t>=40);});
      if(e.when&&!qx(e.when,v))continue;const ans=qx(e.ans,v);if(typeof ans!=='number'||ans<0||ans!==Math.floor(ans))continue;
      const say=fill(e.say,v),n=e.show?qx(e.show,v):0;
      const pic=e.plates?`<div class="pics">${Array(qx(e.plates[0],v)).fill(`<span class="plate">${e.pic.repeat(qx(e.plates[1],v))}</span>`).join('')}</div>`:e.pic?(n&&n<=15?`<div class="pics">${e.pic.repeat(n)}</div>`:`<div class="pic">${e.pic}</div>`):'';
      const wr=shuffle((e.wrong||[]).map(w=>qx(w,v))).concat(shuffle([ans+1,ans-1,ans+2]),[ans-2,ans+10,ans-10,ans+3]).filter(w=>typeof w==='number'&&w>=0&&w!==ans);
      const ch=ch4(ans,wr);if(!ch)continue;ch.forEach(c=>c.label+=e.unit||'');
      const q=Q(pic+sayBox(f,say),say,ch,ans,fill(e.hint,v)||'ゆっくり [考|かんが]えて みよう');q.topic=e.topic||'story';q.aid=calcAid(e,v,ans);return {intro:[say],q};}
    return null;},
  /* とけい: hour / half / 5 minutes / 1 minute (by entry), labels by grade */
  clock(e,f,w){let mn=e.min;if(REQ_L<0)mn=CLOCK_EASY[mn];if(REQ_L<-1)mn=CLOCK_EASY[mn];if(REQ_L>0)mn=CLOCK_HARD[mn];e={min:mn};
    const g=S.grade,h=ri(1,12),m=e.min==='hour'?0:e.min==='half'?pick([0,30]):e.min==='5'?ri(0,11)*5:ri(0,59),L=(H,M)=>clabel(H,((M%60)+60)%60,g);
    const nh=h%12+1,ph=h===1?12:h-1,ans=L(h,m);
    const wr=e.min==='hour'||e.min==='half'?[L(nh,m),L(ph,m),L(h,m===0?30:0),m/5>=1&&m/5<=12?L(m/5,h*5%60):null]:[L(nh,m),L(h,m+5),L(h,m-5),L(ph,m),L(h,m+10)];
    const ch=ch4(ans,wr.filter(Boolean),'long');if(!ch)return null;
    const q=Q(clockSVG(h,m)+`<div class="legend">[短|みじか]い はり＝なん[時|じ] ／ <span class="lm">[長|なが]い はり＝なん[分|ぷん]</span></div>`+sayBox(f,w.say),w.say,ch,ans,
      e.min==='hour'||e.min==='half'?'[短|みじか]い はりが [指|さ]している [数|すう][字|じ]が 「なん[時|じ]」。 [長|なが]い はりが 6なら 「[半|はん]」 だよ':'[長|なが]い はりの [数|すう][字|じ] × 5 が 「なん[分|ぷん]」。 1なら 5[分|ふん]、 3なら 15[分|ふん] だよ');
    q.topic='clock';return {intro:[w.intro,w.say].filter(Boolean),q};},
  /* かんじ: read a sign (rin) or pick the kanji for a reading (dora); wrong choices from this grade and below */
  kanji(e,f,w){let pool=shuffle(bankUpTo(S.grade,'kanji').filter(o=>o!==e&&o.r!==e.r&&o.k!==e.k));
    if(REQ_L>0){const n=s=>Array.from(s).length;pool=pool.sort((a,b)=>Math.abs(n(a.r)-n(e.r))-Math.abs(n(b.r)-n(e.r)));} /* harder: wrong choices of similar length */
    if(w.mode==='write'){const say=fill(w.say,e),ch=ch4(e.k,pool.map(o=>o.k),'kj');if(!ch)return null;
      const q=Q(`<div class="pic">${e.e}</div>`+sayBox(f,say),say,ch,e.k,'[絵|え]と [漢|かん][字|じ]の [形|かたち]を [比|くら]べて みよう');q.topic='kanji';return {intro:[say],q};}
    const say=w.say,ch=ch4(e.r,pool.map(o=>o.r),'long');if(!ch)return null;
    const sign=`<div style="display:inline-block;background:#e9c08a;border:5px solid #9a6a44;border-radius:14px;padding:4px 22px;box-shadow:0 4px 0 #7a4f2a"><span class="kanji">${e.k}</span></div>`;
    const q=Q(sign+sayBox(f,say),say,ch,e.r,'[絵|え]を [見|み]て、 なにの [看|かん][板|ばん]か [考|かんが]えて みよう');q.aid=`<div class="pic">${e.e}</div>`;q.topic='kanji';return {intro:['ねえねえ、 '+say],q};},
  /* ひらがな・カタカナ: katakana → read it / write it in katakana; hiragana → pick the right spelling */
  kana(e,f,w){const isK=/[ァ-ヶ]/.test(e.w),L=Array.from(e.w).length,pool=bankUpTo(S.grade,'kana').filter(o=>o!==e&&o.w!==e.w),
      near=list=>[0,1,2].flatMap(d=>shuffle(list.filter(o=>Math.abs(Array.from(o.w).length-L)===d)));
    const kata=pool.filter(o=>/[ァ-ヶ]/.test(o.w)),hira=pool.filter(o=>!/[ァ-ヶ]/.test(o.w));
    if(isK&&(S.grade===1||Math.random()<.5)){const h=toHira(e.w),say=w.read;
      const ch=ch4(h,[makeTrap(h,SIM_H)].concat(near(kata).map(o=>toHira(o.w))),'long');if(!ch)return null;
      const q=Q(`<div class="pic">${e.e}</div><div class="word">${e.w}</div>`+sayBox(f,say),say,ch,h,`[最|さい][初|しょ]の 「${e.w[0]}」は ひらがなで 「${h[0]}」`);q.topic='kata';return {intro:[say],q};}
    if(isK){const h=toHira(e.w),say=fill(w.write,{h});
      const ch=ch4(e.w,[makeTrap(e.w,SIM_K),makeTrap(e.w,SIM_K)].concat(near(kata).map(o=>o.w)),'long');if(!ch)return null;
      const q=Q(`<div class="pic">${e.e}</div>`+sayBox(f,say),say,ch,e.w,`「${h[0]}」は カタカナで 「${e.w[0]}」。 [似|に]ている [文字|もじ]に [注|ちゅう][意|い]！`);q.topic='kata';return {intro:[say],q};}
    const big=e.w.replace(/[ゃゅょっ]/g,c=>({'ゃ':'や','ゅ':'ゆ','ょ':'よ','っ':'つ'})[c]),say=w.hira;
    const ch=ch4(e.w,[big!==e.w?big:null,makeTrap(e.w,SIM_H),makeTrap(e.w,SIM_H)].concat(near(hira).map(o=>o.w)),'long');if(!ch)return null;
    const q=Q(`<div class="pic">${e.e}</div>`+sayBox(f,say),say,ch,e.w,`ゆっくり [声|こえ]に [出|だ]して [読|よ]んで みよう。 ${L}[文字|もじ]の ことばだよ`);q.topic='hira';return {intro:[say],q};},
  /* なかまわけ: odd one out (4 choices) or "which belongs to …" (3 choices) */
  group(e,f,w){const others=bankUpTo(S.grade,'group').filter(o=>o!==e&&o.name!==e.name);if(!others.length)return null;
    if(REQ_L<0?false:REQ_L>0?true:Math.random()<.5){const o=pick(others),odd=pick(o.words.filter(x=>!e.words.includes(x))),ins=shuffle(e.words).slice(0,3);if(!odd||ins.length<3)return null;
      const ch=shuffle([odd,...ins]).map(x=>({label:x,value:x,cls:'long'})),say=w.odd;
      const q=Q(`<div class="pic">🧐</div>`+sayBox(f,say),say,ch,odd,`3つは 「${e.name}」の [仲|なか][間|ま]。 ちがうのは どれかな？`);q.topic='group';return {intro:[say],q};}
    const right=pick(e.words),wr=shuffle(others).flatMap(o=>shuffle(o.words)).filter(x=>!e.words.includes(x)),say=fill(w.which,e);
    const ch=ch4(right,wr,'long');if(!ch)return null;
    const q=Q(`<div class="pic">🧐</div>`+sayBox(f,say),say,ch,right,`「${e.name}」には どんな ものが あるかな？ [思|おも]いうかべて みよう`);q.topic='group';return {intro:[say],q};}
};
/* せいかつ・りか／しゃかい／おんがく・ずこう／えいご: entries from qdata (shared with the classroom, see quiz.js fromEntry) */
['rika','shakai','art','eng','koku'].forEach(t=>BUILD[t]=(e,f,w)=>{const q=fromEntry(e,ch4,(w.lead||{})[t],s=>sayBox(f,s));return q?{intro:[q.sayText],q}:null;});
/* pick a problem for villager id: their own entries at the player's grade (falls back to lower grades) */
function makeReq(id,f){const w=REQ_WHO[id],mine=(g,s)=>bankAll(g).filter(e=>w.types.includes(e.type)&&(!e.who||e.who===id)&&(!s||e.subj===s));
  /* a villager with 2 subjects asks one of them at random (only subjects that have problems for this grade or below) */
  const subjs=[...new Set(GRADES.filter(g=>g<=S.grade).flatMap(g=>mine(g)).map(e=>e.subj))];if(!subjs.length)return null;
  const subj=favReqSubj(subjs);REQ_L=adaptL(subj); /* すきな きょうかを えらびやすく（study.js） */
  /* much easier: start from the grade below (still only things that grade has already learned) */
  for(let g=REQ_L<=-2&&S.grade>1?S.grade-1:S.grade;g>=1;g--){const cand=mine(g,subj);if(!cand.length)continue;
    for(let t=0;t<12;t++){const e=pick(cand),r=BUILD[e.type](e,f,w);if(r){r.intro=r.intro.map(s=>kj(s));r.q.subj=subj;r.L=REQ_L;REQ_L=0;return r;}}}
  REQ_L=0;return null;}
const REQ=Object.fromEntries(Object.keys(REQ_WHO).map(id=>[id,f=>makeReq(id,f)]));

const REQ_THANKS=['ありがとう！ たすかったよ！','わーい、 ありがとう！ きみって すごいね！','やったあ！ [本|ほん][当|とう]に ありがとう！'];
const reqTime=()=>Date.now()/1000;
/* does this villager have a request right now? (first visit: yes; after helping: wait a few minutes) */
function reqOn(n){if(!REQ[n.f.id])return false;const t=(S.req||{})[n.f.id];return !t||reqTime()>=t;}
/* ----- gentle question card for requests -----
   wrong: no buzzer / ×, the villager says "うーん、 ちがうみたい…"; 2nd wrong: hint with a picture aid;
   3rd wrong: the villager shows the answer ("いっしょに おぼえようね").
   right: ♪ + hop (card face and the villager in the world), sparkle chime and sparkles, acorns as a reward */
const REQ_WRONG='うーん、 ちがうみたい。 もう [一|いち][度|ど] [考|かんが]えて みよう！',REQ_HINT='ヒントを だすね。 よく みて [考|かんが]えて みよう！',
  REQ_RIGHT=['やったー！ [正|せい][解|かい]！','わーい！ あたり！ すごいね！','ばっちり！ ありがとう！'];
function sparkle(el){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  for(let i=0;i<14;i++){const s=document.createElement('i');s.className='spark';s.textContent=pick(['✨','⭐','✨','💛']);const a=i/14*Math.PI*2+Math.random()*.3,d=60+Math.random()*60;
    s.style.left=cx+'px';s.style.top=cy+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');s.style.animationDelay=Math.random()*.12+'s';document.body.appendChild(s);later(()=>s.remove(),1200);}}
function renderReqQ(box,q,f,n,done){
  box.innerHTML=`<div class="q-prompt">${q.prompt}</div><div class="qtools"><button class="speak" type="button">🔊 [読|よ]み[上|あ]げ</button><button class="hintb" type="button">💡 ヒント</button></div><div class="choices"></div><div class="req-talk" hidden></div><div class="feedback" aria-live="polite"></div>`;
  const ce=box.querySelector('.choices'),fb=box.querySelector('.feedback'),tk=box.querySelector('.req-talk'),btns=[];let tries=0,fin=false,sayT=null;
  const hintHTML=()=>`<div class="hintbox">${q.aid?q.aid+'<br>':''}ヒント： ${q.hint}</div>`;
  /* the villager talks inside the card: typed out with their voice */
  const say=s=>{s=kj(s);tk.hidden=false;tk.innerHTML=`<div class="story req-say"><span class="rf">${f.em}</span><span class="rt"></span></div>`;const t=tk.querySelector('.rt'),C=Array.from(s),base=voiceOf(f);let k=0;clearTimeout(sayT);
    const step=()=>{if(!t.isConnected)return;k++;t.textContent=C.slice(0,k).join('');const c=C[k-1];if(!/[\s、。！？!?…「」]/.test(c))voiceBlip(base,k,1,0);if(k<C.length)sayT=setTimeout(step,/\s/.test(c)?25:TYPE_MS*.8+(TYPE_PAUSE[c]||0)*.6);};step();};
  box.querySelector('.speak').onclick=()=>speak(q.speak,q.en);if(q.en&&q.enAuto)later(()=>speak('',q.en),400);box.querySelector('.hintb').onclick=()=>{fb.innerHTML=hintHTML();};
  q.choices.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='choice'+(c.cls?' '+c.cls:'');b.innerHTML=c.label;btns.push([b,c]);ce.appendChild(b);
    b.onclick=()=>{if(fin||b.disabled)return;
      if(c.value===q.answer){fin=true;b.classList.add('right');const r=award(q.topic,tries,true);sfx('kira');sparkle(b);
        const face=box.closest('.card')&&box.closest('.card').querySelector('.m-face');if(face){face.classList.remove('hop');void face.offsetWidth;face.classList.add('hop');const nt=document.createElement('span');nt.className='note';nt.textContent='♪';face.appendChild(nt);later(()=>nt.remove(),1300);}
        if(n){npcEmote(n,'happy');n.hop=.5;}
        say(pick(REQ_RIGHT));fb.innerHTML=`<span class="good">+どんぐり ${r.yen}こ</span>　＋[経|けい][験|けん][値|ち]${r.xp}`;later(()=>done({revealed:false,tries}),2000);return;}
      tries++;b.disabled=true;b.classList.add('soft');
      if(tries===1){say(REQ_WRONG);return;}
      if(tries===2){say(REQ_HINT);fb.innerHTML=hintHTML();return;}
      /* 3rd miss: show the answer together */
      fin=true;recAnswer(q.topic,tries,true);save();btns.forEach(([bb,cc])=>{bb.disabled=true;if(cc.value===q.answer){bb.classList.remove('soft');bb.classList.add('reveal');}else bb.classList.add('soft');});
      say(`[答|こた]えは 「${c&&btns.find(([,cc])=>cc.value===q.answer)[1].label.replace(/<[^>]+>/g,'')}」 だよ。 いっしょに [覚|おぼ]えようね。`);
      fb.innerHTML=hintHTML()+`<div class="btn-row"><button class="big-btn" type="button" data-a="got">わかった！</button></div>`;onAct(fb,{got:()=>done({revealed:true,tries})});};});}
/* talk → ask → question card → thanks */
async function doRequest(n){const f=n.f,R=REQ[f.id](f);if(!R)return;
  const r=await talk(f,[...R.intro],['いいよ！','あとでね']);
  if(r!==0){await talk(f,['そっか。 また [今|こん][度|ど] お[願|ねが]いね！']);return;}
  const card=openModal(),gen=modalGen;card.innerHTML=head(`${f.n}の お[願|ねが]い`,f)+'<div class="qbox"></div>';wire(card);const qb=card.querySelector('.qbox');
  renderReqQ(qb,R.q,f,n,res=>{if(gen!==modalGen)return;S.req=S.req||{};S.req[f.id]=reqTime()+REQ_COOLDOWN[0]+Math.random()*(REQ_COOLDOWN[1]-REQ_COOLDOWN[0]);
    adaptUpdate(R.q.subj||topicSubj(R.q.topic),res.tries,res.revealed); /* run of right answers → a bit harder, stumbling → a bit easier */
    const bonus=res.revealed?REQ_BONUS_LEARN:REQ_BONUS;S.yen+=bonus;S.st.req=(S.st.req||0)+1;updateHUD();save();sfx(res.revealed?'tap':'fan');if(!res.revealed)confetti(24);
    qb.innerHTML=`<div class="catch"><div class="stamp">${f.em}</div><div class="nm">${res.revealed?'いっしょに [覚|おぼ]えたね！':f.n+'の お[願|ねが]いを かなえた！'}</div><p class="mnote">お[礼|れい]に どんぐり ${bonus}こ もらったよ</p></div><div class="btn-row"><button class="big-btn" type="button" data-a="ok">${res.revealed?'[次|つぎ]は がんばる！':'どういたしまして！'}</button></div>`;
    onAct(qb,{ok:()=>{closeModal();later(()=>talk(f,[res.revealed?'[手|て][伝|つだ]って くれて ありがとう！ また いっしょに [考|かんが]えようね。':pick(REQ_THANKS)]),250);}});});}
/* ？ over a villager who has a request (shown far and near; above the name when near, under the quest ！ if any) */
function updateReqMark(n,d){if(!REQ[n.f.id])return;if(!n.rq){n.rq=bubbleSprite('？','#fff3c4');n.rq.renderOrder=290;n.model.add(n.rq);}
  if((n.reqT=(n.reqT||0)-1)<=0){n.reqT=30;n.req=reqOn(n);}
  const show=n.req&&!n.talking&&d<40&&!(n.qb&&n.qb.visible);n.rq.visible=show;n.reqShown=show;
  if(show){n.bub.visible=false;n.rq.position.y=(d<7?3.4:2.6)+Math.abs(Math.sin(n.t*3))*.15;}}
