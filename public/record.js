'use strict';
/* ===== learning records (saved with the game in localStorage, inside S.rec) and adaptive difficulty (S.adapt) =====
   S.rec.days[YYYY-MM-DD] = {n: answered, first: right on the 1st try, miss: wrong taps, help: answer shown}
   S.rec.types[topic]     = same counters per kind of problem → strong / weak kinds
   S.adapt[subject].L     = -2 … +2  (made easier after misses, harder after a run of 1st-try answers; villager requests use it) */
const REC_KEEP_DAYS=60;          // なんにちぶん のこすか
const ADAPT_UP=3,ADAPT_DOWN=2;   // 1かいめで せいかいが 3かい つづくと むずかしく ／ つまずきが 2かい つづくと やさしく
const REC_EXTRA={count:['[数|かず]の [数|かぞ]えかた','math'],group:['[言|こと][葉|ば]の [仲|なか][間|ま]わけ','kokugo']};
const recName=t=>TOPICS[t]?TOPICS[t].n:REC_EXTRA[t]?REC_EXTRA[t][0]:t;
function topicSubj(t){return TOPICS[t]?TOPICS[t].s:REC_EXTRA[t]?REC_EXTRA[t][1]:'math';}
const dayKey=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function recInit(){if(!S.rec)S.rec={days:{},types:{}};if(!S.adapt)S.adapt={math:{L:0,up:0,down:0},kokugo:{L:0,up:0,down:0}};}
/* one finished question: tries = wrong taps before the right one; help = the answer had to be shown */
function recAnswer(topic,tries,help){recInit();const k=dayKey(),D=S.rec.days[k]||(S.rec.days[k]={n:0,first:0,miss:0,help:0}),T=S.rec.types[topic]||(S.rec.types[topic]={n:0,first:0,miss:0,help:0});
  for(const o of [D,T]){o.n++;if(!tries&&!help)o.first++;o.miss+=tries||0;if(help)o.help++;}
  const keys=Object.keys(S.rec.days).sort();while(keys.length>REC_KEEP_DAYS)delete S.rec.days[keys.shift()];}
/* difficulty step for a subject: -2 (much easier) … 0 … +2 (harder) */
function adaptL(subj){recInit();return (S.adapt[subj]||{L:0}).L;}
function adaptUpdate(subj,tries,help){recInit();const A=S.adapt[subj]||(S.adapt[subj]={L:0,up:0,down:0});
  if(!tries&&!help){A.up++;A.down=0;if(A.up>=ADAPT_UP){A.up=0;if(A.L<2){A.L++;toast('[少|すこ]し [難|むずか]しく なるよ。 チャレンジ！');}}}
  else if(tries>=2||help){A.down++;A.up=0;if(A.down>=ADAPT_DOWN){A.down=0;if(A.L>-2)A.L--;}}
  else A.up=0;}
/* when the grade changes, start again from normal difficulty */
function adaptReset(){recInit();for(const k in S.adapt)S.adapt[k]={L:0,up:0,down:0};}
const LV_NAME={'-2':'やさしめ','-1':'[少|すこ]し やさしめ','0':'ふつう','1':'[少|すこ]し [難|むずか]しめ','2':'[難|むずか]しめ'};

/* ----- menu → きろく (for parents) ----- */
function openRecord(){recInit();const card=openModal(),today=S.rec.days[dayKey()]||{n:0,first:0,miss:0,help:0};
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  /* last 7 days */
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const r=S.rec.days[dayKey(d)]||{n:0,first:0};days.push({lab:i===0?'[今日|きょう]':`${d.getMonth()+1}/${d.getDate()}`,n:r.n,first:r.first});}
  const mx=Math.max(5,...days.map(d=>d.n));
  const bars=`<div style="display:flex;gap:6px;align-items:flex-end;height:120px;padding:6px 4px 0;border-bottom:3px solid var(--wood)">${days.map(d=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:2px"><small style="font-size:12px">${d.n||''}</small><div style="width:100%;max-width:34px;height:${d.n/mx*88}px;background:var(--sun);border:2px solid var(--wood);border-radius:8px 8px 3px 3px;position:relative;overflow:hidden"><div style="position:absolute;left:0;right:0;bottom:0;height:${pct(d.first,d.n)}%;background:var(--ok);opacity:.55"></div></div></div>`).join('')}</div><div style="display:flex;gap:6px;padding:2px 4px">${days.map(d=>`<small style="flex:1;text-align:center;font-size:11px;color:var(--ink-soft)">${d.lab}</small>`).join('')}</div>`;
  /* strong / weak kinds (need 3+ answers to judge) */
  const T=Object.entries(S.rec.types).map(([t,o])=>({t,n:o.n,rate:pct(o.first,o.n),miss:o.miss,help:o.help})).filter(x=>x.n>0);
  const judged=T.filter(x=>x.n>=3).sort((a,b)=>b.rate-a.rate);
  const good=judged.filter(x=>x.rate>=80).slice(0,3),weak=judged.filter(x=>x.rate<60).reverse().slice(0,3);
  const li=x=>`<li><span class="chk">${x.rate>=80?'😊':x.rate<60?'💪':'🙂'}</span><div class="mt">${recName(x.t)}<div class="md">${x.n}もん ／ 1[回|かい][目|め]で [正|せい][解|かい] ${x.rate}%${x.help?` ／ [答|こた]えを みた ${x.help}かい`:''}</div><div class="bar"><i style="width:${x.rate}%"></i></div></div></li>`;
  const list=a=>a.length?`<ul class="mlist">${a.map(li).join('')}</ul>`:'<p class="mnote">まだ わからないよ（[同|おな]じ [種|しゅ][類|るい]を 3[問|もん] [以|い][上|じょう] とくと でるよ）</p>';
  card.innerHTML=head('[記|き][録|ろく]（おうちの [人|ひと]へ）',null)+
    `<div class="statgrid"><div>[今日|きょう] [解|と]いた [問|もん][題|だい]<b>${today.n}もん</b></div><div>1[回|かい][目|め]で [正|せい][解|かい]<b>${today.first}もん</b></div><div>せいかいりつ<b>${pct(today.first,today.n)}%</b></div><div>[学|がく][年|ねん]<b>${S.grade}[年|ねん][生|せい]</b></div>${Object.keys(SUBJ).map(s=>`<div>${SUBJ[s].n}の [難|むずか]しさ<b style="font-size:16px">${LV_NAME[adaptL(s)]}</b></div>`).join('')}</div>`+
    `<h3 class="sec">さいきん 7[日|にち]</h3>${bars}<p class="mnote" style="font-size:12px">[黄|き][色|いろ]＝[解|と]いた [数|かず]、 [緑|みどり]＝1[回|かい][目|め]で せいかいした [割|わり][合|あい]</p>`+
    `<h3 class="sec m">[得|とく][意|い]な [問|もん][題|だい]</h3>${list(good)}<h3 class="sec k">[苦|にが][手|て]な [問|もん][題|だい]</h3>${list(weak)}`+
    `<h3 class="sec">[全|ぜん][部|ぶ]の [種|しゅ][類|るい]</h3>${T.length?`<ul class="mlist">${T.sort((a,b)=>b.n-a.n).map(li).join('')}</ul>`:'<p class="mnote">まだ [記|き][録|ろく]が ないよ</p>'}`+
    `<p class="mnote" style="font-size:12px">[記|き][録|ろく]は この ブラウザの [中|なか]に ほぞん されます。 すみんの お[願|ねが]いは、 [続|つづ]けて せいかいすると [少|すこ]し [難|むずか]しく、 つまずくと [少|すこ]し やさしく なります。</p>`;
  wire(card);}
