'use strict';
/* ===== question generators ===== */
function mkChoices(ans,wrongs,label){label=label||(v=>String(v));const seen=new Set([String(ans)]);const vals=[ans];
  for(const w of wrongs){if(vals.length>=3)break;if(w==null||w==='')continue;if(typeof w==='number'&&(w<0||!isFinite(w)||w!==Math.floor(w)))continue;const k=String(w);if(seen.has(k))continue;seen.add(k);vals.push(w);}
  return shuffle(vals).map(v=>({label:label(v),value:String(v)}));}
function numC(ans,pref,unit){return mkChoices(ans,shuffle(pref).concat([ans+1,ans-1,ans+2,ans-2,ans+3,ans+5]),v=>String(v)+(unit||''));}
/* [漢字|かんじ] markup → kanji the player's grade has learned, else the reading (kanji.js). values stay raw (they are only compared) */
const Q=(prompt,speak,choices,answer,hint,extra)=>{(choices||[]).forEach(c=>{if(c.label!=null)c.label=kj(c.label);});
  return Object.assign({prompt:kj(prompt),speak:kana(speak),sayText:kj(speak),choices,answer:String(answer),hint:kj(hint)},extra||{});};
const eq=s=>`<div class="eq">${s} = <span class="qmark">?</span></div>`;
const LG=c=>Object.assign(c,{cls:'long'}),KJ=c=>Object.assign(c,{cls:'kj'});
function dots(n,cls){let s='';for(let i=0;i<n;i++){s+='●';if(i%5===4)s+=' ';}return `<span class="${cls||''}">${s}</span>`;}

function addQ(g){let a,b;const r=Math.random();
  if(g===1){if(r<.5){a=ri(1,9);b=ri(1,10-a);}else{a=ri(3,9);b=ri(11-a,9);}}
  else if(g===2){a=ri(12,78);b=ri(6,99-a);}
  else if(g>=4){a=ri(1200,6800);b=ri(350,9900-a);}
  else if(r<.5){a=ri(102,689);b=ri(30,999-a);}else{a=ri(45,95);b=ri(Math.max(10,105-a),99);}
  const ans=a+b;let hint;
  if(g===1&&ans<=10)hint=`<div class="dotrow">${dots(a)}${dots(b,'b')}</div>●を [全|ぜん][部|ぶ] [数|かぞ]えてみよう`;
  else if(g===1)hint=`10を [作|つく]ろう！ ${a}は あと ${10-a}で 10。<br>${b}を ${10-a}と ${b-(10-a)}に [分|わ]けると、 10と ${b-(10-a)}`;
  else{const u=a%10+b%10,c=u>=10;hint=`1の [位|くらい]： ${a%10} + ${b%10} = ${u}${c?'（10の [位|くらい]へ 1 くり[上|あ]がり）':''}<br>10の [位|くらい]も [同|おな]じように たそう${a>=100?'。 100の [位|くらい]も [忘|わす]れずに':''}`;}
  return Q(eq(`${a} + ${b}`),`${a} たす ${b} は？`,numC(ans,g===1?[ans+1,ans-1]:[ans+10,ans-10,ans+1,ans-1]),ans,hint);}
function subQ(g){let a,b;const r=Math.random();
  if(g===1){if(r<.55){a=ri(3,10);b=ri(1,a-1);}else{a=ri(11,18);b=ri(a-9,9);}}
  else if(g===2){a=ri(30,99);b=ri(5,a-5);}else if(g>=4){a=ri(2000,9999);b=ri(300,a-150);}else{a=ri(200,999);b=ri(50,a-20);}
  const ans=a-b;let hint;
  if(g===1&&a<=10)hint=`<div class="dotrow">${dots(ans)}<span class="x">${'○'.repeat(b)}</span></div>○を とると ●は いくつ [残|のこ]る？`;
  else if(g===1)hint=`${a}を 10と ${a-10}に [分|わ]けよう。<br>10 − ${b} = ${10-b}。 それに ${a-10}を たすと？`;
  else hint=`1の [位|くらい]から [計|けい][算|さん] しよう。<br>${a%10} から ${b%10} が ひけない ときは、 となりの [位|くらい]から 10 [借|か]りて こよう`;
  return Q(eq(`${a} − ${b}`),`${a} ひく ${b} は？`,numC(ans,g===1?[ans+1,ans-1]:[ans+10,ans-10,ans+1,ans-1]),ans,hint);}
function kukuHint(a,b){const rows=[];for(let i=Math.max(1,b-3);i<b;i++)rows.push(`${a}×${i}=${a*i}`);return `${a}の [段|だん]： ${rows.join('、 ')}${rows.length?'、 ':''}${a}×${b}=？<br>${a}ずつ [増|ふ]えて いくよ`;}
function mulQ(g){
  if(g===1){const k=ri(2,4),n=ri(2,4),[e,nm]=pick(ITEMS),ans=k*n;
    return Q(`<div class="pics">${Array(k).fill(`<span class="plate">${e.repeat(n)}</span>`).join('')}</div>${nm}が ${n}こずつ ${k}[皿|さら]。<br>[全|ぜん][部|ぶ]で なんこ？`,`${nm}が ${n}こずつ ${k}[皿|さら]。 [全|ぜん][部|ぶ]で なんこ？`,numC(ans,[ans+1,ans-1,k+n]),ans,`${n}、 ${n*2}、 ${n*3}… と ${n}ずつ [増|ふ]えて いくよ`);}
  if(g>=4&&Math.random()<.7){const a=ri(12,g>=5?98:49),b=ri(12,g>=5?59:39),ans=a*b,t=b-b%10,u=b%10;
    return Q(eq(`${a} × ${b}`),`${a} かける ${b} は？`,numC(ans,[ans+10,ans-10,a*t,a*u+a*t+a,ans+100,ans-100]),ans,`${b}を ${t}と ${u}に [分|わ]けよう。<br>${a}×${t} = ${a*t}、 ${a}×${u} = ${a*u}<br>[合|あ]わせると？`);}
  if(g===2||Math.random()<.35){const a=ri(2,9),b=ri(1,9),ans=a*b;return Q(eq(`${a} × ${b}`),`${a} かける ${b} は？`,numC(ans,[a*(b+1),a*(b-1),(a+1)*b,ans+1]),ans,kukuHint(a,b));}
  if(Math.random()<.5){const a=ri(11,39),b=ri(2,9),ans=a*b,t=a-a%10,u=a%10;return Q(eq(`${a} × ${b}`),`${a} かける ${b} は？`,numC(ans,[ans+10,ans-10,t*b+u,ans+b]),ans,`${a}を ${t}と ${u}に [分|わ]けよう。<br>${t}×${b} = ${t*b}、 ${u}×${b} = ${u*b}<br>[合|あ]わせると？`);}
  const a=ri(2,9)*10,b=ri(2,9),ans=a*b;return Q(eq(`${a} × ${b}`),`${a} かける ${b} は？`,numC(ans,[ans/10,ans+10,ans-10,ans+a]),ans,`${a/10}×${b} = ${a/10*b}。 10の まとまりが ${a/10*b}こ だから？`);}
function kukuQ(g,dan){const a=dan||pick(g===1?[2,3,5]:[2,3,4,5,6,7,8,9]);const b=ri(1,9),ans=a*b;
  if(Math.random()<.25)return Q(`<div class="eq">${a} × <span class="qmark">?</span> = ${ans}</div>`,`${a} かける なにが ${ans}？`,numC(b,[b+1,b-1,b+2]),b,`${a}の [段|だん]： ${[1,2,3,4,5,6,7,8,9].map(i=>a*i).join('、')}`);
  return Q(eq(`${a} × ${b}`),`${a} かける ${b} は？`,numC(ans,[a*(b+1),a*(b-1),ans+1,ans-1]),ans,kukuHint(a,b));}
function divQ(g){
  if(g<=2){const k=ri(2,4),n=ri(2,g===1?3:5),tot=k*n,[e,nm]=pick(ITEMS);
    return Q(`<div class="pics">${e.repeat(tot)}</div>${nm}が ${tot}こ。<br>${k}[人|にん]で [同|おな]じ [数|かず]ずつ [分|わ]けると、 1[人|にん] なんこ？`,`${nm}が ${tot}こ。 ${k}[人|にん]で [同|おな]じ [数|かず]ずつ [分|わ]けると、 [一人|ひとり] なんこ？`,numC(n,[n+1,n-1,k]),n,`1こずつ [順|じゅん][番|ばん]に [配|くば]って みよう。<br>${k} × □ = ${tot} の □を [探|さが]しても いいよ`);}
  if(g>=4&&Math.random()<.7){
    if(Math.random()<.5){const b=ri(2,9),c=ri(12,Math.floor(999/b)),a=b*c;
      return Q(eq(`${a} ÷ ${b}`),`${a} わる ${b} は？`,numC(c,[c+1,c-1,c+10,c-10]),c,`[大|おお]きい [位|くらい]から [順|じゅん]に [割|わ]って いこう。<br>${b} × □ = ${a} の □を [探|さが]そう`);}
    const b=ri(12,39),c=ri(2,9),a=b*c;
    if(Math.random()<.3){const r=ri(1,b-1),A=a+r,lab=(x,y)=>`${x} あまり ${y}`;
      return Q(eq(`${A} ÷ ${b}`),`${A} わる ${b} は？`,mkChoices(lab(c,r),[lab(c+1,r),lab(c-1>0?c-1:c+2,r),lab(c,r>1?r-1:r+1)]).map(LG),lab(c,r),`${b}を ${b-b%10}と みて、 いくつ [入|はい]るか [見|み][積|つ]もろう。<br>あまりは ${b}より [小|ちい]さく なるよ`);}
    return Q(eq(`${a} ÷ ${b}`),`${a} わる ${b} は？`,numC(c,[c+1,c-1,c+2]),c,`${b}を ${b-b%10}と みて [見|み][積|つ]もろう。<br>${b} × □ = ${a} の □は？`);}
  const b=ri(2,9),c=ri(1,9);
  if(Math.random()<.35){const r=ri(1,b-1),a=b*c+r,lab=(x,y)=>`${x} あまり ${y}`;
    return Q(eq(`${a} ÷ ${b}`),`${a} わる ${b} は？`,mkChoices(lab(c,r),[lab(c+1,r),lab(Math.max(1,c-1)===c?c+2:c-1,r),lab(c,r>1?r-1:r+1)]).map(LG),lab(c,r),`${b}の [段|だん]： ${b}×${c}=${b*c}、 ${b}×${c+1}=${b*(c+1)}<br>${a}を こえない いちばん [大|おお]きい ものを [探|さが]そう`);}
  const a=b*c;return Q(eq(`${a} ÷ ${b}`),`${a} わる ${b} は？`,numC(c,[c+1,c-1,b]),c,`${b} × □ = ${a} の □は？ ${b}の [段|だん]で [考|かんが]えよう`);}
const fun=m=>m+([1,3,4,6,8,0].includes(m%10)?'[分|ぷん]':'[分|ふん]');
const clabel=(h,m,g)=>m===0?`${h}[時|じ]`:(g===1&&m===30)?`${h}[時|じ][半|はん]`:`${h}[時|じ]${fun(m)}`;
function clockSVG(h,m){let s='<svg class="clock" viewBox="0 0 200 200" width="180" height="180" role="img" aria-label="とけい"><circle class="face" cx="100" cy="100" r="92"/>';
  for(let i=0;i<60;i++){const a=i*6*Math.PI/180,r1=i%5?82:76;s+=`<line class="${i%5?'tick':'tick5'}" x1="${100+Math.sin(a)*r1}" y1="${100-Math.cos(a)*r1}" x2="${100+Math.sin(a)*86}" y2="${100-Math.cos(a)*86}"/>`;}
  for(let i=1;i<=12;i++){const a=i*30*Math.PI/180;s+=`<text class="num" x="${100+Math.sin(a)*63}" y="${100-Math.cos(a)*63+6}" text-anchor="middle">${i}</text>`;}
  const ha=((h%12)+m/60)*30*Math.PI/180,ma=m*6*Math.PI/180;
  return s+`<line class="hh" x1="100" y1="100" x2="${100+Math.sin(ha)*40}" y2="${100-Math.cos(ha)*40}"/><line class="mh" x1="100" y1="100" x2="${100+Math.sin(ma)*66}" y2="${100-Math.cos(ma)*66}"/><circle class="pin" cx="100" cy="100" r="5"/></svg>`;}
function clockQ(g){const h=ri(1,12);
  if(g>=3&&Math.random()<.45){const m=ri(0,11)*5,add=pick([10,15,20,30,40,45]);let H=h,M=m+add;if(M>=60){M-=60;H=h%12+1;}const ans=clabel(H,M,3);
    return Q(`${clockSVG(h,m)}[今|いま]は ${clabel(h,m,3)}。<br><b>${fun(add)}</b> たつと なん[時|じ] なん[分|ぷん]？`,`[今|いま]は ${clabel(h,m,3)}。 ${fun(add)} たつと なん[時|じ] なん[分|ぷん]？`,mkChoices(ans,shuffle([clabel(h,(m+add)%60,3),clabel(H%12+1,M,3),clabel(H,(M+5)%60,3),clabel(H,(M+55)%60,3)])).map(LG),ans,`[長|なが]い はりを ${fun(add)} [分|ぶん] [進|すす]めよう。 60[分|ぷん]で 1[時|じ][間|かん] だよ`);}
  const m=g===1?pick([0,0,30]):g===2?ri(0,11)*5:ri(0,59),ans=clabel(h,m,g),nh=h%12+1,ph=h===1?12:h-1;
  const wr=g===1?[clabel(nh,m,g),clabel(ph,m,g),clabel(h,m===0?30:0,g)]:[clabel(nh,m,g),clabel(h,(m+5)%60,g),clabel(h,(m+55)%60,g),clabel(ph,m,g)];
  return Q(`${clockSVG(h,m)}<div class="legend">[短|みじか]い はり＝なん[時|じ] ／ <span class="lm">[長|なが]い はり＝なん[分|ぷん]</span></div>[今|いま] なん[時|じ]？`,'[今|いま] なん[時|じ]？',mkChoices(ans,shuffle(wr)).map(LG),ans,g===1?'[短|みじか]い はりが [指|さ]している [数|すう][字|じ]が 「なん[時|じ]」。 [長|なが]い はりが 6なら 「[半|はん]」 だよ':'[長|なが]い はりの [数|すう][字|じ] × 5 が 「なん[分|ぷん]」。 1なら 5[分|ふん]、 3なら 15[分|ふん] だよ');}
const coin=v=>`<span class="y y${v}">${v}</span>`;
function moneyQ(g){
  if(g>=2&&Math.random()<(g>=3?.45:.25)){const pay=g>=3?pick([100,500,1000]):100;const price=pay===100?ri(12,95):pay===500?ri(120,480):ri(230,980);const ans=pay-price;
    return Q(`<div class="pic">🍬</div>${price}[円|えん]の おかしを [買|か]います。<br>${pay===1000?'1000[円|えん][札|さつ]':pay+'[円|えん][玉|だま]'}で はらうと、 おつりは いくら？`,`${price}[円|えん]の おかしを ${pay}[円|えん]で [買|か]うと、 おつりは いくら？`,numC(ans,[ans+10,ans-10,ans+1,ans-1],'[円|えん]').map(LG),ans,`${pay} − ${price} を [計|けい][算|さん] しよう。 ${price}に いくつ たすと ${pay}に なるか [考|かんが]えても いいよ`);}
  const pool=g===1?[1,5,10]:g===2?[1,5,10,50,100]:[1,5,10,50,100,500];const n=ri(3,g===1?6:7);const cs=[];for(let i=0;i<n;i++)cs.push(pick(pool));cs.sort((a,b)=>b-a);
  const ans=cs.reduce((a,b)=>a+b,0);let run=0;const steps=cs.slice(0,3).map(v=>run+=v);
  return Q(`<div class="coins">${cs.map(coin).join('')}</div>[全|ぜん][部|ぶ]で なん[円|えん]？`,'[全|ぜん][部|ぶ]で なん[円|えん]？',numC(ans,[ans+1,ans-1,ans+5,ans-5,ans+10,ans-10],'[円|えん]').map(LG),ans,`[大|おお]きい お[金|かね]から [順|じゅん][番|ばん]に たそう。<br>${steps.join(' → ')} → …`);}
function storyQ(g){const [e,nm]=pick(ITEMS),who=pick(['モコ','ミィ','ピョン','ポチ','クリ']),r=Math.random();let a,b,ans,text,hint;
  if(g>=3&&r<.25){b=ri(2,6);ans=ri(2,9);a=b*ans;text=`${nm}が ${a}こ あります。<br>${b}[人|にん]で [同|おな]じ [数|かず]ずつ [分|わ]けると、 1[人|にん] なんこ？`;hint=`[分|わ]けるときは わり[算|ざん]。 [式|しき]は ${a} ÷ ${b}`;}
  else if(g>=2&&r<.5){a=ri(2,9);b=ri(2,g===2?5:9);ans=a*b;text=`1ふくろに ${nm}が ${a}こ [入|はい]っています。<br>${b}ふくろ では [全|ぜん][部|ぶ]で なんこ？`;hint=`[同|おな]じ [数|かず]が いくつ [分|ぶん] → かけ[算|ざん]。 [式|しき]は ${a} × ${b}`;}
  else if(r<.75){if(g===1){a=ri(2,9);b=ri(1,Math.min(9,18-a));}else if(g===2){a=ri(12,60);b=ri(5,35);}else{a=ri(120,560);b=ri(40,380);}ans=a+b;text=`${who}は ${nm}を ${a}こ [持|も]っています。<br>${b}こ もらいました。<br>[全|ぜん][部|ぶ]で なんこ？`;hint=`「[全|ぜん][部|ぶ]で」 → たし[算|ざん]。 [式|しき]は ${a} + ${b}`;}
  else{if(g===1){a=ri(5,15);b=ri(1,Math.min(9,a-1));}else if(g===2){a=ri(30,90);b=ri(6,a-8);}else{a=ri(200,900);b=ri(50,a-30);}ans=a-b;text=`${who}は ${nm}を ${a}こ [持|も]っています。<br>[友|とも]だちに ${b}こ あげました。<br>[残|のこ]りは なんこ？`;hint=`「[残|のこ]りは」 → ひき[算|ざん]。 [式|しき]は ${a} − ${b}`;}
  const pic=g===1&&a<=15?`<div class="pics">${e.repeat(a)}</div>`:`<div class="pic">${e}</div>`;
  return Q(pic+`<div class="story">${text}</div>`,text.replace(/<br>/g,' '),numC(ans,[ans+1,ans-1,a+b,Math.abs(a-b),ans+10],'こ'),ans,hint);}
function picWordQ(){const w=pick(PICOK.filter(x=>x.w.length>=2));const others=shuffle(PICOK.filter(x=>x!==w&&x.e!==w.e&&Math.abs(x.w.length-w.w.length)<=1)).map(x=>x.w);
  return Q(`<div class="pic">${w.e}</div>これは なに かな？`,'これは なに かな？',mkChoices(w.w,[makeTrap(w.w,SIM_H)].concat(others)).map(LG),w.w,`[最|さい][初|しょ]の [文字|もじ]は 「${w.w[0]}」。 1[文字|もじ]ずつ よく [見|み]てね`);}
function missingQ(){const w=pick(PICOK.filter(x=>x.w.length>=2));const ch=Array.from(w.w);const i=pick(ch.map((_,k)=>k).filter(k=>!'ゃゅょっ'.includes(ch[k])));const c=ch[i];
  const pool=Array.from('あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん');
  return Q(`<div class="pic">${w.e}</div><div class="word">${ch.map((x,j)=>j===i?'<span class="hole">？</span>':x).join('')}</div>？に [入|はい]る [文字|もじ]は どれ？`,'はてなに [入|はい]る [文字|もじ]は どれ？',mkChoices(c,[SIM_H[c]].concat(shuffle(pool))).map(KJ),c,`[絵|え]を [見|み]ながら ゆっくり [言|い]ってみよう。 ${ch.length}[文字|もじ]の ことばだよ`);}
function smallQ(){const w=pick(SMALLW);const big=w.w.replace(/[ゃゅょっ]/g,c=>({'ゃ':'や','ゅ':'ゆ','ょ':'よ','っ':'つ'})[c]);const drop=w.w.replace(/[ゃゅょっ]/,'');
  return Q(`<div class="pic">${w.e}</div>[正|ただ]しい [書|か]き[方|かた]は どれ？`,'[正|ただ]しい [書|か]き[方|かた]は どれ？',mkChoices(w.w,[big,drop]).map(LG),w.w,'[小|ちい]さい 「ゃ ゅ ょ っ」に [気|き]を つけて、 ゆっくり [読|よ]んで みよう');}
function hiraQ(){const r=Math.random();return r<.35?picWordQ():r<.7?missingQ():smallQ();}
function kataQ(g){
  if(g>=2&&Math.random()<.3){const k=pick(KATA),kh=toHira(k.w);return Q('カタカナで [書|か]く ことばは どれ？','カタカナで [書|か]く ことばは どれ？',mkChoices(kh,shuffle(PICOK).slice(0,2).map(x=>x.w)).map(LG),kh,'[外|がい][国|こく]から [来|き]た ことばは カタカナで [書|か]くよ');}
  /* まちがいの せんたくしは おなじ ながさの ことば から。 たりない ときは ながさが ちかい じゅんに たす（ハンバーガー など） */
  const w=pick(KATA),h=toHira(w.w);const others=[0,1,2,3,4,5].flatMap(d=>shuffle(KATA.filter(x=>x!==w&&Math.abs(x.w.length-w.w.length)===d))).map(x=>x.w);
  return Q(`<div class="pic">${w.e}</div>「${h}」を カタカナで [書|か]くと どれ？`,`${h} を カタカナで [書|か]くと どれ？`,mkChoices(w.w,[makeTrap(w.w,SIM_K),makeTrap(w.w,SIM_K)].concat(others)).map(LG),w.w,`「${h[0]}」は カタカナで 「${w.w[0]}」。 [似|に]ている [文字|もじ]に [注|ちゅう][意|い]！`);}
function kanjiQ(g){const KG=[K1,K2,K3,K4,K5,K6],n=Math.min(Math.max(g,1),KG.length),list=[].concat(...KG.slice(0,n));const pool=n>=2&&Math.random()<.6?KG[n-1]:list;const k=pick(pool);
  const others=shuffle(list.filter(o=>o.r!==k.r&&o.e!==k.e));
  if(Math.random()<.5)return Q(`<div class="kanji">${k.k}</div>この [漢|かん][字|じ]は なんと [読|よ]む？`,'この [漢|かん][字|じ]は なんと [読|よ]む？',mkChoices(k.r,others.map(o=>o.r)).map(LG),k.r,`ヒントの [絵|え]： <span class="pic-s">${k.e}</span>`);
  return Q(`<div class="pic">${k.e}</div>「${k.r}」は どの [漢|かん][字|じ]？`,`${k.r} は どの [漢|かん][字|じ]？`,mkChoices(k.k,others.map(o=>o.k)).map(KJ),k.k,'[絵|え]と [漢|かん][字|じ]の [形|かたち]を [比|くら]べて みよう');}
function imiQ(g){const r=Math.random();
  if(r<.25){const [a,b]=pick(ANT),f=Math.random()<.5,w=f?b:a,ans=f?a:b;return Q(`<div class="word">「${w}」</div>[反|はん][対|たい]の [意|い][味|み]の ことばは どれ？`,`${w} の [反|はん][対|たい]の [意|い][味|み]の ことばは どれ？`,mkChoices(ans,shuffle(ANT.flat().filter(x=>x!==w&&x!==ans))).map(LG),ans,`「${w}」の [逆|ぎゃく]を [想|そう][像|ぞう] して みよう`);}
  if(r<.45){const [w,m]=pick(ONO);return Q(`<div class="word">「${w}」</div>どんな [様|よう][子|す]を [表|あらわ]す ことば？`,`${w} は どんな [様|よう][子|す]？`,mkChoices(m,shuffle(ONO.filter(o=>o[0]!==w).map(o=>o[1]))).map(LG),m,'その ことばを [言|い]いながら、 [体|からだ]で まねして みよう');}
  if(r<.65){const cats=Object.keys(GROUPS),c=pick(cats),o=pick(cats.filter(x=>x!==c)),ins=shuffle(GROUPS[c]).slice(0,2),out=pick(GROUPS[o]);return Q('<div class="pic">🧐</div>なかまはずれは どれ？','なかまはずれは どれ？',mkChoices(out,ins).map(LG),out,`2つは 「${c}」の なかま。 ちがうのは どれかな？`);}
  if(r<.85||g===1){const [s,a]=pick(JOSHI),ex=(a==='は'||a==='が')?['は','が']:(a==='へ'||a==='に')?['へ','に']:[a];
    return Q(`<div class="story big">${s.replace('［ ］','<span class="hole">？</span>')}</div>？に [入|はい]る ことばは どれ？`,s.replace('［ ］','なになに'),mkChoices(a,shuffle(['は','を','へ','が','に','と','で'].filter(x=>!ex.includes(x)))).map(KJ),a,'[声|こえ]に [出|だ]して [読|よ]んで みよう。 しっくり くるのは どれ？');}
  const [w,e,c]=pick(COUNT);return Q(`<div class="pic">${e}</div>「${w}」を [数|かぞ]える ときは、<br>1（ ？ ）、 2（ ？ ）… なんと いう？`,`${w} を [数|かぞ]える ときは なんと いう？`,mkChoices(c,shuffle(COUNT.map(x=>x[2]).filter(x=>x!==c))).map(KJ),c,'「いっ…」「にー…」と [声|こえ]に [出|だ]して みよう');}
function narabeQ(g){const list=SENT.filter(s=>g===1?s.c.length<=3:g===2?s.c.length<=4:s.c.length>=4);const s=pick(list.length?list:SENT);
  return {type:'order',chunk:true,prompt:`<div class="pic">${s.e}</div>ことばを ならべて ぶんを つくろう！`,speak:'ことばを ならべて ぶんを つくろう',pieces:s.c,answer:s.c.join(''),alts:(s.alt||[]).map(a=>a.join('')),hint:`さいしょは 「${s.c[0]}」 だよ`};}
function lettersQ(g){const [mn,mx]=g===1?[2,3]:g===2?[3,4]:[4,6];const pool=PICOK.concat(KATA).filter(x=>{const n=Array.from(x.w).length;return n>=mn&&n<=mx&&new Set(Array.from(x.w)).size>1;});const w=pick(pool);
  return {type:'order',prompt:`<div class="pic">${w.e}</div>もじを ならべて ことばを つくろう！`,speak:'もじを ならべて ことばを つくろう',pieces:Array.from(w.w),answer:w.w,alts:[],hint:`さいしょの もじは 「${Array.from(w.w)[0]}」`,say:toHira(w.w)};}
function dokkaiQ(g){const st=pick(STORIES.filter(s=>s.g<=g));const q=pick(st.q);
  return Q(`<div class="story">${st.t}</div><div class="qline">${q[0]}</div>`,st.t+'。 '+q[0],mkChoices(q[1],q.slice(2)).map(LG),q[1],'お[話|はなし]を もう [一|いち][度|ど] [読|よ]んで、 こたえが [書|か]いてある ところを [探|さが]そう');}
const SMALL={'ゃ':'や','ゅ':'ゆ','ょ':'よ','っ':'つ'};
const lastKana=w=>{let c=w[w.length-1];if(c==='ー')c=w[w.length-2];return SMALL[c]||c;};
function shiriQ(){for(let t=0;t<80;t++){const a=pick(PICOK),c=lastKana(a.w);if(c==='ん')continue;const cands=PICOK.filter(w=>w!==a&&w.w[0]===c);if(!cands.length)continue;
  const right=pick(cands),byW=Object.fromEntries(PICOK.map(w=>[w.w,w.e]));
  return Q(`<div class="pic">${a.e}</div><div class="word">${a.w} → ？</div>「${a.w}」の [次|つぎ]に つながる ことばは どれ？`,`${a.w}。 [次|つぎ]に つながる ことばは どれ？`,mkChoices(right.w,shuffle(PICOK.filter(w=>w!==a&&w.w[0]!==c)).slice(0,6).map(w=>w.w),v=>`<span class="ce">${byW[v]||''}</span>${v}`).map(LG),right.w,`[最|さい][後|ご]の [文字|もじ]は 「${c}」。 「${c}」から [始|はじ]まる ことばを [探|さが]そう`);}
  return picWordQ();}
/* ===== 4〜6ねんせいの さんすう: がいすう／しょうすう／ぶんすう／めんせき・たいせき／わりあい・ひ／へいきん／はやさ／ばあいの かず =====
   どの もんだいも その たんげんの がくねんより したの がくねんで ひらいても、 その たんげんの いちばん やさしい もんだいが でる */
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a),lcm=(a,b)=>a/gcd(a,b)*b;
/* n / 10^p → "3.25" ("3.0" → "3") */
const dec=(n,p)=>{let s=(n/Math.pow(10,p)).toFixed(p);if(p>0)s=s.replace(/\.?0+$/,'');return s;};
/* ぶんすう: value "n/d" (d=1 → "n"), html = たての ぶんすう */
const fv=(n,d,red)=>{if(!(d>0)||n<0||n!==Math.floor(n))return null;if(red!==false){const k=gcd(n,d)||1;n/=k;d/=k;}return d===1?String(n):`${n}/${d}`;};
const frH=v=>{const m=String(v).split('/');return m.length<2?`<span class="frn">${m[0]}</span>`:`<span class="fr"><i>${m[0]}</i><i>${m[1]}</i></span>`;};
const FRC=c=>Object.assign(c,{cls:'kj'});
function gaisuQ(){const n=ri(1200,98000),u=pick(n>=10000?[100,1000]:[10,100,1000]),R=x=>Math.round(n/x)*x,ans=R(u);
  return Q(`<div class="eq">${n}</div>[四|し][捨|しゃ][五|ご][入|にゅう] して、 <b>${u}の [位|くらい]まで</b>の がい[数|すう]に すると？`,`${n}を [四|し][捨|しゃ][五|ご][入|にゅう]して ${u}の [位|くらい]までの がい[数|すう]に すると？`,
    mkChoices(ans,shuffle([Math.floor(n/u)*u===ans?Math.ceil(n/u)*u:Math.floor(n/u)*u,R(u*10),R(u/10)===ans?ans+u:R(u/10),ans+u,ans-u])).map(LG),ans,
    `${u}の [位|くらい]の 1つ [下|した]の [位|くらい]の [数|かず]を [見|み]よう。 0〜4なら [切|き]り[捨|す]て、 5〜9なら [切|き]り[上|あ]げ だよ`);}
function shosuQ(g){g=Math.max(g,4);const r=Math.random();
  if(g>=5&&r<.4){const a=ri(11,49),b=ri(11,39),ans=a*b;   /* 1.2 × 3.4 */
    return Q(eq(`${dec(a,1)} × ${dec(b,1)}`),`${dec(a,1)} かける ${dec(b,1)} は？`,mkChoices(dec(ans,2),[dec(ans,1),dec(ans,3),dec(ans+a,2),dec(ans-b,2)]),dec(ans,2),
      `${a} × ${b} = ${ans} を [計|けい][算|さん] してから、 [小|しょう][数|すう][点|てん]を [動|うご]かそう。<br>[小|しょう][数|すう][点|てん]の [下|した]の けたは [合|あ]わせて 2けた だよ`);}
  if(g>=5&&r<.65){const b=ri(2,9),c=ri(11,99),a=b*c;     /* 8.4 ÷ 4 */
    return Q(eq(`${dec(a,1)} ÷ ${b}`),`${dec(a,1)} わる ${b} は？`,mkChoices(dec(c,1),[dec(c,0),dec(c,2),dec(c+1,1),dec(c+10,1)]),dec(c,1),
      `${a} ÷ ${b} = ${c} を [計|けい][算|さん] してから、 [小|しょう][数|すう][点|てん]を もとの [位|い][置|ち]に [打|う]とう`);}
  if(r<.35){const a=ri(11,89),b=ri(2,9),ans=a*b;          /* 2.3 × 4 */
    return Q(eq(`${dec(a,1)} × ${b}`),`${dec(a,1)} かける ${b} は？`,mkChoices(dec(ans,1),[dec(ans,0),dec(ans,2),dec(ans+b,1),dec(ans+10,1)]),dec(ans,1),
      `${a} × ${b} = ${ans}。 0.1が ${ans}こ [分|ぶん] だよ`);}
  const p=g>=5&&Math.random()<.5?2:1,M=Math.pow(10,p),add=Math.random()<.5;   /* 1.25 + 0.8 など */
  let a=ri(M+1,M*9),b=ri(Math.ceil(M/10),M*5);if(!add&&b>=a)[a,b]=[b+M,a];
  const ans=add?a+b:a-b,op=add?'+':'−';
  return Q(eq(`${dec(a,p)} ${op} ${dec(b,p)}`),`${dec(a,p)} ${add?'たす':'ひく'} ${dec(b,p)} は？`,mkChoices(dec(ans,p),[dec(ans+M/10*(add?1:-1),p),dec(ans+M,p),dec(ans-1,p),dec(ans+1,p),dec(add?a+b*10:a-Math.floor(b/10),p)]),dec(ans,p),
    '[小|しょう][数|すう][点|てん]の [位|い][置|ち]を そろえて、 ふつうの たし[算|ざん]・ひき[算|ざん]と [同|おな]じように [計|けい][算|さん] しよう');}
function bunsuQ(g){g=Math.max(g,4);const r=Math.random();
  const show=(s,say,ans,wr,hint)=>Q(`<div class="eq">${s} = <span class="qmark">?</span></div>`,say,mkChoices(ans,wr.filter(Boolean),frH).map(FRC),ans,hint);
  const H=(n,d)=>frH(`${n}/${d}`),SY=(n,d)=>`${d}[分|ぶん]の ${n}`;
  if(g>=6&&r<.6){let a=ri(1,5),b=ri(2,7),c=ri(1,5),d=ri(2,7);if(a>=b)a=b-1;if(c>=d)c=d-1;
    if(Math.random()<.5)return show(`${H(a,b)} × ${H(c,d)}`,`${SY(a,b)} かける ${SY(c,d)} は？`,fv(a*c,b*d),[fv(a*c,b+d),fv(a*d,b*c),fv(a+c,b*d),fv(a*c+1,b*d)],
      '[分|ぶん][子|し]どうし、 [分|ぶん][母|ぼ]どうしを かけよう。 [約|やく][分|ぶん] できる ときは [約|やく][分|ぶん] しよう');
    return show(`${H(a,b)} ÷ ${H(c,d)}`,`${SY(a,b)} わる ${SY(c,d)} は？`,fv(a*d,b*c),[fv(a*c,b*d),fv(b*c,a*d),fv(a*d+1,b*c),fv(a,b*c)],
      `[割|わ]る [数|かず]の [分|ぶん][子|し]と [分|ぶん][母|ぼ]を ひっくりかえして かけよう。 ${SY(a,b)} × ${SY(d,c)}`);}
  if(g>=5&&r<.8){if(Math.random()<.3){const d0=ri(2,6),n0=ri(1,d0-1),k=ri(2,4),n=n0*k,d=d0*k;if(gcd(n0,d0)!==1)return bunsuQ(g);
      return Q(`<div class="eq">${H(n,d)}</div>[約|やく][分|ぶん] すると どれ？`,`${SY(n,d)}を [約|やく][分|ぶん] すると？`,mkChoices(fv(n0,d0),[fv(n0,d0+1,false),fv(n0+1,d0,false),`${n}/${d}`!==fv(n0*2,d0*2,false)?fv(n0*2,d0*2,false):null,fv(d0,n0+d0,false)],frH).map(FRC),fv(n0,d0),
        `[分|ぶん][子|し]と [分|ぶん][母|ぼ]を [同|おな]じ [数|かず]で [割|わ]ろう。 ${n}と ${d}は どちらも ${k}で [割|わ]れるよ`);}
    const b=pick([2,3,4,5,6]),d=pick([2,3,4,5,6,8].filter(x=>x!==b)),a=ri(1,b-1),c=ri(1,d-1),L=lcm(b,d),add=Math.random()<.6||a*d<=c*b;
    const N=add?a*L/b+c*L/d:a*L/b-c*L/d;
    return show(`${H(a,b)} ${add?'+':'−'} ${H(c,d)}`,`${SY(a,b)} ${add?'たす':'ひく'} ${SY(c,d)} は？`,fv(N,L),[add?fv(a+c,b+d):fv(Math.abs(a-c),Math.abs(b-d)||1),fv(N+1,L),fv(N,L*2),N>1?fv(N-1,L):null,fv(add?a+c:Math.abs(a-c),L)],
      `[分|ぶん][母|ぼ]を そろえよう（[通|つう][分|ぶん]）。 ${b}と ${d}は どちらも ${L}に できるよ。<br>${SY(a,b)} = ${SY(a*L/b,L)}、 ${SY(c,d)} = ${SY(c*L/d,L)}`);}
  /* 4ねんせい: おなじ ぶんぼの たしざん・ひきざん（やくぶん しない） */
  const d=ri(3,9),add=Math.random()<.6,a=add?ri(1,d-1):ri(2,d),c=add?ri(1,d-1):ri(1,a-1);
  const N=add?a+c:a-c,rd=g>=5?undefined:false; /* 5ねんせい いじょうは やくぶん した こたえ */
  return show(`${H(a,d)} ${add?'+':'−'} ${H(c,d)}`,`${SY(a,d)} ${add?'たす':'ひく'} ${SY(c,d)} は？`,fv(N,d,rd),[add?fv(N,d*2,rd):fv(a+c,d,rd),fv(N+1,d,rd),N>1?fv(N-1,d,rd):fv(N+2,d,rd),fv(N,d+1,rd)],
    `[分|ぶん][母|ぼ]が [同|おな]じ ときは、 [分|ぶん][子|し]だけ ${add?'たそう':'ひこう'}。 [分|ぶん][母|ぼ]は ${d}の まま だよ${g>=5?'。 [最|さい][後|ご]に [約|やく][分|ぶん] しよう':''}`);}
/* かんたんな ずけい（たてよこの ながさを かきこむ） */
function shapeSVG(kind,a,b){const W=200,Hh=120,lab=(x,y,t)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="16" font-weight="700" fill="#5a3a1a">${t}</text>`;let s=`<svg viewBox="0 0 ${W+40} ${Hh+40}" width="220" height="150" role="img" aria-label="ずけい">`;const st='fill="#ffe9a8" stroke="#9a6a44" stroke-width="3"';
  if(kind==='rect')s+=`<rect x="20" y="15" width="${W-20}" height="${Hh-20}" ${st}/>`+lab(W/2+10,Hh+18,a)+lab(W+18,Hh/2+10,b);
  else if(kind==='tri')s+=`<polygon points="20,${Hh-5} ${W},${Hh-5} 80,15" ${st}/><line x1="80" y1="15" x2="80" y2="${Hh-5}" stroke="#9a6a44" stroke-dasharray="5 4" stroke-width="2"/>`+lab(W/2+10,Hh+18,a)+lab(105,Hh/2+10,b);
  else if(kind==='para')s+=`<polygon points="20,${Hh-5} ${W-40},${Hh-5} ${W},15 60,15" ${st}/><line x1="60" y1="15" x2="60" y2="${Hh-5}" stroke="#9a6a44" stroke-dasharray="5 4" stroke-width="2"/>`+lab(W/2-10,Hh+18,a)+lab(85,Hh/2+10,b);
  else if(kind==='circle')s+=`<circle cx="${W/2+20}" cy="${Hh/2+10}" r="62" ${st}/><line x1="${W/2+20}" y1="${Hh/2+10}" x2="${W/2+82}" y2="${Hh/2+10}" stroke="#9a6a44" stroke-width="3"/><circle cx="${W/2+20}" cy="${Hh/2+10}" r="4" fill="#9a6a44"/>`+lab(W/2+51,Hh/2+2,a);
  else if(kind==='box')s+=`<polygon points="30,50 150,50 190,20 70,20" ${st}/><polygon points="150,50 190,20 190,110 150,140" ${st}/><rect x="30" y="50" width="120" height="90" ${st}/>`+lab(90,158,a)+lab(185,138,b);
  return s+'</svg>';}
function mensekiQ(g){g=Math.max(g,4);const r=Math.random(),u2=' cm²',u3=' cm³';
  if(g>=6&&r<.45){const R=ri(2,10),ans=dec(R*R*314,2);
    return Q(shapeSVG('circle',`${R}cm`)+'<br>この [円|えん]の [面|めん][積|せき]は？（[円|えん][周|しゅう][率|りつ]は 3.14）',`[半|はん][径|けい] ${R}センチの [円|えん]の [面|めん][積|せき]は？`,mkChoices(ans,[dec(R*2*314,2),dec(R*R*3,0),dec(R*R*2*314,2),dec(R*R*314*4,2)],v=>v+u2).map(LG),ans,
      `[円|えん]の [面|めん][積|せき] ＝ [半|はん][径|けい] × [半|はん][径|けい] × 3.14<br>${R} × ${R} × 3.14 を [計|けい][算|さん] しよう`);}
  if(g>=5&&r<.75){const k=pick(['tri','para','box']);
    if(k==='box'){const a=ri(2,9),b=ri(2,9),c=ri(2,9),ans=a*b*c;return Q(shapeSVG('box',`[横|よこ]${a}cm`,`[高|たか]さ${c}cm`)+`<br>おくゆき ${b}cm の [箱|はこ]の [体|たい][積|せき]は？`,`[横|よこ]${a}センチ、 おくゆき${b}センチ、 [高|たか]さ${c}センチの [箱|はこ]の [体|たい][積|せき]は？`,numC(ans,[a*b+c,2*(a*b+b*c+a*c),ans+a*b,ans-a*b],u3).map(LG),ans,`[体|たい][積|せき] ＝ [縦|たて] × [横|よこ] × [高|たか]さ<br>${a} × ${b} × ${c}`);}
    const A=ri(3,14);let B=ri(2,12);if(k==='tri'&&A*B%2)B++;const ans=k==='tri'?A*B/2:A*B;
    return Q(shapeSVG(k,`[底|てい][辺|へん]${A}cm`,`[高|たか]さ${B}cm`)+`<br>この ${k==='tri'?'[三|さん][角|かく][形|けい]':'[平|へい][行|こう][四|し][辺|へん][形|けい]'}の [面|めん][積|せき]は？`,`[底|てい][辺|へん]${A}センチ、 [高|たか]さ${B}センチの ${k==='tri'?'[三|さん][角|かく][形|けい]':'[平|へい][行|こう][四|し][辺|へん][形|けい]'}の [面|めん][積|せき]は？`,
      numC(ans,k==='tri'?[A*B,A+B,ans+A]:[A*B%2?A*B+A:A*B/2,2*(A+B),ans+B],u2).map(LG),ans,k==='tri'?`[三|さん][角|かく][形|けい]の [面|めん][積|せき] ＝ [底|てい][辺|へん] × [高|たか]さ ÷ 2<br>${A} × ${B} ÷ 2`:`[平|へい][行|こう][四|し][辺|へん][形|けい]の [面|めん][積|せき] ＝ [底|てい][辺|へん] × [高|たか]さ<br>${A} × ${B}`);}
  const a=ri(3,15),b=ri(2,12),sq=Math.random()<.25,B=sq?a:b,ans=a*B;
  return Q(shapeSVG('rect',`${a}cm`,`${B}cm`)+`<br>この ${sq?'[正|せい][方|ほう][形|けい]':'[長|ちょう][方|ほう][形|けい]'}の [面|めん][積|せき]は？`,`[横|よこ]${a}センチ、 [縦|たて]${B}センチの ${sq?'[正|せい][方|ほう][形|けい]':'[長|ちょう][方|ほう][形|けい]'}の [面|めん][積|せき]は？`,numC(ans,[2*(a+B),a+B,ans+a,ans-B],u2).map(LG),ans,
    `[面|めん][積|せき] ＝ [縦|たて] × [横|よこ]<br>1cm²の ますが ${B} × ${a} こ [並|なら]んで いるよ`);}
function wariaiQ(g){g=Math.max(g,5);const r=Math.random();
  if(g>=6&&r<.55){if(Math.random()<.5){const a=ri(1,6),b=ri(2,9),k=ri(2,8);if(gcd(a,b)!==1||a===b)return wariaiQ(g);const A=a*k,B=b*k;
      const lab=(x,y)=>`${x} : ${y}`;return Q(`<div class="eq">${A} : ${B}</div>[簡|かん][単|たん]な [比|ひ]に すると？`,`${A} たい ${B} を [簡|かん][単|たん]な [比|ひ]に すると？`,mkChoices(lab(a,b),[lab(b,a),lab(a*2,b*2)===lab(A,B)?lab(a+1,b):lab(a*2,b*2),lab(a,b+1),lab(a+1,b+1)]).map(LG),lab(a,b),`${A}と ${B}を [同|おな]じ [数|かず]で [割|わ]ろう。 どちらも ${k}で [割|わ]れるよ`);}
    const a=ri(1,7),b=ri(2,9),k=ri(2,9);if(a===b)return wariaiQ(g);
    return Q(`<div class="eq">${a} : ${b} = ${a*k} : <span class="qmark">?</span></div>`,`${a} たい ${b} は ${a*k} たい なに？`,numC(b*k,[b+a*k-a,b*k+k,b*(k+1),a*k+b]),b*k,`${a}を なん[倍|ばい] すると ${a*k}？ ${b}も [同|おな]じ ${k}[倍|ばい]に しよう`);}
  const tot=pick([20,25,40,50,80,200,400,500]),step=100/gcd(tot,100),p=ri(1,Math.floor(99/step))*step,part=tot*p/100,[e,nm]=pick([['🌰','どんぐり'],['🧒','[子|こ]ども'],['🍎','りんご'],['🎟️','チケット']]),k=Math.random();
  if(k<.4)return Q(`<div class="pic">${e}</div>${nm} ${tot}の うち ${part}は なんパーセント？`,`${tot}の うち ${part}は なんパーセント？`,numC(p,[p+5,p-5,p+10,part,100-p],'%').map(LG),p,`[割|わり][合|あい] ＝ [比|くら]べる [量|りょう] ÷ もとに する [量|りょう]<br>${part} ÷ ${tot} = ${dec(p,2)} → ×100 で パーセント`);
  if(k<.75)return Q(`<div class="pic">${e}</div>${nm} ${tot}の ${p}% は いくつ？`,`${tot}の ${p}パーセントは いくつ？`,numC(part,[part+tot/10,part*10,p,tot-part]).map(LG),part,`${p}% は ${dec(p,2)}。 ${tot} × ${dec(p,2)} を [計|けい][算|さん] しよう`);
  return Q(`<div class="pic">${e}</div>${nm} ${tot}の うち ${part}。 [割|わり][合|あい]を [小|しょう][数|すう]で [表|あらわ]すと？`,`${tot}の うち ${part}の [割|わり][合|あい]を [小|しょう][数|すう]で [表|あらわ]すと？`,mkChoices(dec(p,2),[dec(p,1),dec(p,3),String(p),dec(100-p,2)]).map(LG),dec(p,2),`${part} ÷ ${tot} を [計|けい][算|さん] しよう。 もとに する [量|りょう]が 1 だよ`);}
function heikinQ(){for(let t=0;t<40;t++){const n=ri(3,5),A=ri(4,30),k=Math.max(2,Math.floor(A/3)),v=Array.from({length:n-1},()=>ri(A-k,A+k)),last=A*n-v.reduce((a,b)=>a+b,0);if(last<1||Math.abs(last-A)>k*2)continue;v.push(last);
    const [e,nm,u]=pick([['🌰','ひろった どんぐり','こ'],['🐟','つれた [魚|さかな]','ひき'],['📖','[読|よ]んだ ページ','ページ'],['🏃','[走|はし]った [周|しゅう]','[周|しゅう]']]),sum=A*n;
    return Q(`<div class="pic">${e}</div>${nm}<div class="eq" style="font-size:30px">${v.join('、 ')}</div>1[回|かい] あたりの [平|へい][均|きん]は？`,`${nm}は ${v.join('、 ')}。 [平|へい][均|きん]は？`,numC(A,[A+1,A-1,sum,A+2,Math.round(sum/(n+1))],u).map(LG),A,
      `[平|へい][均|きん] ＝ [合|ごう][計|けい] ÷ [回|かい][数|すう]<br>[合|ごう][計|けい]は ${sum}、 [回|かい][数|すう]は ${n}[回|かい]`);}
  return heikinQ();}
/* [え, なまえ, はやさの こうほ, じそく/ふんそく, みちのりの たんい, じかんの たんい] */
const HAYASA=[['🚗','[車|くるま]',[30,40,50,60],'[時|じ][速|そく]','km','[時|じ][間|かん]'],['🚃','[電|でん][車|しゃ]',[60,70,80,90],'[時|じ][速|そく]','km','[時|じ][間|かん]'],['🚲','[自|じ][転|てん][車|しゃ]',[12,15,16,18],'[時|じ][速|そく]','km','[時|じ][間|かん]'],
  ['🐢','カメ',[2,3,4,5],'[分|ふん][速|そく]','m','[分|ふん]'],['🚶','[歩|ある]く [人|ひと]',[60,70,80],'[分|ふん][速|そく]','m','[分|ふん]']];
function hayasaQ(){const r=Math.random(),[e,nm,sps,uS,uL,uT]=pick(HAYASA),sp=pick(sps),t=ri(2,6),d=sp*t;
  if(r<.34)return Q(`<div class="pic">${e}</div>${nm}が ${d}${uL}を ${t}${uT}で [進|すす]みました。<br>${uS}は なん${uL}？`,`${nm}が ${d}${uL}を ${t}${uT}で [進|すす]みました。 ${uS}は？`,numC(sp,[sp+10,sp-10,d*t,d+t,sp*2]).map(c=>Object.assign(c,{label:`${uS} ${c.label}${uL}`})).map(LG),sp,`[速|はや]さ ＝ [道|みち]のり ÷ [時|じ][間|かん]<br>${d} ÷ ${t}`);
  if(r<.67)return Q(`<div class="pic">${e}</div>${uS} ${sp}${uL}の ${nm}が ${t}${uT} [進|すす]むと、<br>[道|みち]のりは なん${uL}？`,`${uS} ${sp}${uL}で ${t}${uT} [進|すす]むと なん${uL}？`,numC(d,[sp+t,d+sp,d-sp,sp*(t+1)],uL).map(LG),d,`[道|みち]のり ＝ [速|はや]さ × [時|じ][間|かん]<br>${sp} × ${t}`);
  return Q(`<div class="pic">${e}</div>${uS} ${sp}${uL}の ${nm}で ${d}${uL} [進|すす]むには、<br>なん${uT} かかる？`,`${uS} ${sp}${uL}で ${d}${uL} [進|すす]むには なん${uT}？`,numC(t,[t+1,t-1,t+2,sp],uT).map(LG),t,`[時|じ][間|かん] ＝ [道|みち]のり ÷ [速|はや]さ<br>${d} ÷ ${sp}`);}
function baaiQ(){const r=Math.random(),names=['クリ','ポチ','ピョン','ミィ','ケロ'],fact=n=>n<=1?1:n*fact(n-1);
  if(r<.5){const n=ri(3,4),ans=fact(n);return Q(`<div class="pic">🏃</div>${names.slice(0,n).join('・')}の ${n}[人|にん]で リレーを します。<br>[走|はし]る [順|じゅん][番|ばん]は なんとおり？`,`${n}[人|にん]で リレーの [順|じゅん][番|ばん]は なんとおり？`,numC(ans,[n*n,n*(n-1),ans/2,ans+n,n]).map(c=>Object.assign(c,{label:c.label+'とおり'})).map(LG),ans,
    `1[番|ばん][目|め]が ${n}とおり、 2[番|ばん][目|め]は [残|のこ]りの ${n-1}とおり…<br>${Array.from({length:n},(_,i)=>n-i).join(' × ')}`);}
  const n=ri(4,5),[e,nm]=pick([['🍰','ケーキ'],['🍦','アイス'],['🎈','[風|ふう][船|せん]']]),ans=n*(n-1)/2;
  return Q(`<div class="pic">${e}</div>${n}[種|しゅ][類|るい]の ${nm}から 2[種|しゅ][類|るい] [選|えら]びます。<br>[選|えら]び[方|かた]は なんとおり？`,`${n}[種|しゅ][類|るい]から 2[種|しゅ][類|るい] [選|えら]ぶと なんとおり？`,numC(ans,[n*(n-1),n*2,n,ans+1]).map(c=>Object.assign(c,{label:c.label+'とおり'})).map(LG),ans,
    `[順|じゅん][番|ばん]は [関|かん][係|けい] ないよ。 AとB、 BとAは [同|おな]じ [組|く]み[合|あ]わせ。<br>[表|ひょう]や [図|ず]に かいて [数|かぞ]えて みよう`);}

/* ===== せいかつ・りか／えいご／しゃかい／おんがく・ずこう: the problems are data in qdata/g{1,2,3}_{rika,eigo,shakai,art}.js
   (QBANK in request.js). The same entry is used in the classroom (3 choices) and in villager requests (ch4). ===== */
const bankEntries=()=>GRADES.flatMap(x=>bankAll(x));
/* entries of a topic for the player's grade and the 2 grades below (then any lower grade; falls back to every grade if there are none yet) */
function bankTopic(topic){const all=bankEntries().filter(e=>e.topic===topic),near=all.filter(e=>e.grade<=S.grade&&e.grade>=S.grade-2),mine=all.filter(e=>e.grade<=S.grade);return near.length?near:mine.length?mine:all;}
const mk3=(a,w,c)=>{const ch=mkChoices(a,w);return ch.length<3?null:ch.map(x=>Object.assign(x,{cls:c}));};
const enLab=o=>`${o.en}<small class="enk"> (${o.k})</small>`;
/* one quiz entry {q,a,w:[3 wrong],e,h,html} → question. mk = choice maker, lead = villager's words, wrap = how the text is shown */
function quizFrom(e,mk,lead,wrap){const say=(lead?lead+' ':'')+e.q,len=Math.max(...[e.a,...e.w].map(s=>Array.from(String(kj(s))).length));
  const ch=mk(e.a,shuffle(e.w.slice()),e.cls||(len<=2?'kj':'long'));if(!ch)return null;
  const pic=e.html||(e.e?`<div class="pic">${e.e}</div>`:'');
  const q=Q(pic+(wrap?wrap(say):say),say,ch,e.a,e.h||'えを よく みて、 ゆっくり かんがえて みよう');q.topic=e.topic;return q;}
/* one English entry {en,k: katakana reading,ja,e} → "picture → which English?" or "hear English → which meaning?" */
function engFrom(e,mk,lead,wrap){const all=bankEntries().filter(o=>o.type==='eng'&&o.en!==e.en&&o.ja!==e.ja);
  const others=shuffle(all.filter(o=>o.topic===e.topic&&o.grade<=S.grade)).concat(shuffle(all.filter(o=>o.topic===e.topic&&o.grade>S.grade)),shuffle(all.filter(o=>o.topic!==e.topic)));
  const by=k=>Object.fromEntries([e,...others].map(o=>[o[k],o])),L=lead?lead+' ':'';
  if(Math.random()<.5){const say=L+`「${e.ja}」は えいごで なんて いう？`,ch=mk(e.en,others.map(o=>o.en),'long');if(!ch)return null;const B=by('en');ch.forEach(c=>c.label=enLab(B[c.value]));
    const q=Q(`<div class="pic">${e.e}</div>`+(wrap?wrap(say):say),say,ch,e.en,`さいしょの おとは 「${e.k[0]}」 だよ`);q.topic=e.topic;return q;}
  const say=L+'この えいご、 どういう いみ？',ch=mk(e.ja,others.map(o=>o.ja),'long');if(!ch)return null;const B=by('ja');ch.forEach(c=>c.label=`<span class="ce">${B[c.value].e}</span>${c.value}`);
  const q=Q(`<div class="word en">${e.en}</div>`+(e.k!==e.ja?`<div class="enk">(${e.k})</div>`:'') /* lion (ライオン) → こたえが みえちゃう ので かくす */+(wrap?wrap(say):say),say,ch,e.ja,'🔊 で もういちど おとを きいて みよう');q.topic=e.topic;q.en=e.en;q.enAuto=1;return q;}
const fromEntry=(e,mk,lead,wrap)=>e.type==='eng'?engFrom(e,mk,lead,wrap):quizFrom(e,mk,lead,wrap);
function bankQ(topic){const list=bankTopic(topic);for(let t=0;t<20&&list.length;t++){const q=fromEntry(pick(list),mk3);if(q)return q;}
  return Q('もんだいを じゅんび ちゅう…','もんだいを じゅんび ちゅう',[{label:'OK',value:'ok'}],'ok','');}

const GEN={add:addQ,sub:subQ,mul:mulQ,kuku:kukuQ,div:divQ,clock:clockQ,money:moneyQ,story:storyQ,hira:hiraQ,kata:kataQ,kanji:kanjiQ,imi:imiQ,narabe:narabeQ,dokkai:dokkaiQ,letters:lettersQ,shiri:shiriQ,
  gaisu:gaisuQ,shosu:shosuQ,bunsu:bunsuQ,menseki:mensekiQ,wariai:wariaiQ,heikin:heikinQ,hayasa:hayasaQ,baai:baaiQ};
Object.keys(TOPICS).forEach(k=>{if(!GEN[k])GEN[k]=()=>bankQ(k);}); /* every other topic comes from the problem bank */
function genQ(topic,opt){const q=GEN[topic](S.grade,opt);q.topic=topic;return q;}
function allowed(subj){return Object.keys(TOPICS).filter(k=>TOPICS[k].s===subj&&TOPICS[k].g<=S.grade&&!['dokkai','narabe','letters'].includes(k));}
/* no subject given: さんすう・こくご a little more often, the other 4 subjects too */
function mixedQ(subj){return genQ(pick(allowed(subj||favPick(['math','math','kokugo','kokugo','rika','eigo','shakai','art'])))); /* favPick: study.js（すきな きょうか） */}
