'use strict';
/* ===== quests: errands handed out inside buildings ===== */
const QUESTS=[
 /* buying one piece of furniture clears it; ホーせんせい praises, then "へやに かぐを 3つ おこう" starts by itself */
 {id:'home1',n:'[初|はじ]めての [模|も][様|よう]がえ',giver:null,steps:[
   {t:'buy',kind:'furn',x:'[商|しょう][店|てん][街|がい]の 「[家|か][具|ぐ]や」で [家|か][具|ぐ]を 1つ かおう',to:{room:'shopFurn',x:0,z:-2}}],rw:{yen:30,xp:30},
   praise:{who:'hoo',say:['ホッホー、 [初|はじ]めての [買|か]い[物|もの]、 よく できたのう！','どんぐりを ためて ほしい ものを かう。 それも [大|たい][切|せつ]な [勉|べん][強|きょう]じゃ。','[次|つぎ]は おうちの [部|へ][屋|や]に [家|か][具|ぐ]を 3つ おいて ごらん。 [楽|たの]しみに しておるぞ。']}},
 {id:'home2',n:'[部|へ][屋|や]に [家|か][具|ぐ]を 3つ おこう',giver:null,auto:'home1',after:'home1',steps:[
   {t:'place',n:3,x:'おうちの 「[模|も][様|よう]がえ」で [家|か][具|ぐ]を 3つ おこう',to:{room:'home',x:4.9,z:-2}}],rw:{yen:30,xp:40}},
 {id:'school1',n:'[忘|わす]れもの [探|さが]し',giver:'hoo',intro:['ホッホー、 [困|こま]ったのう。','[教|きょう][室|しつ]に [授|じゅ][業|ぎょう]の [道|どう][具|ぐ]を おとして しまったんじゃ。','えんぴつ、 ノート、 [消|け]しゴムを [探|さが]して くれんかね？'],steps:[
   {t:'collect',x:'[教|きょう][室|しつ]で [忘|わす]れものを 3つ [探|さが]そう',items:[{e:'✏️',n:'えんぴつ',room:'school',x:-6,z:4,tp:'kanji'},{e:'📓',n:'ノート',room:'school',x:6.2,z:2,tp:'hira'},{e:'🧽',n:'[消|け]しゴム',room:'school',x:3.6,z:4.6,tp:'add'}]},
   {t:'talk',who:'hoo',x:'ホー[先|せん][生|せい]に [忘|わす]れものを わたそう',say:['おお、 [全|ぜん][部|ぶ] [見|み]つけて くれたのか！ ありがとう！']}],rw:{yen:35,xp:40}},
 {id:'furn1',n:'いすの はいたつ',giver:'merry',intro:['いらっしゃいませ〜。 あら、 ちょうど よかった！','モコくんが ちゅうもんした いすを [届|とど]けて ほしいの。','モコくんは いつも [公|こう][園|えん]に いるわ。'],steps:[
   {t:'talk',who:'moko',x:'モコに いすを [届|とど]けよう',say:['わあ、 いすが [届|とど]いた！ ありがとう！','おだいを はらうから、 いっしょに [計|けい][算|さん] してね。'],quiz:{tp:['money'],r:2}},
   {t:'talk',who:'merry',x:'[家|か][具|ぐ]やの メリーに [報|ほう][告|こく] しよう',say:['[届|とど]けて くれて ありがとう！ これは お[礼|れい]よ。']}],rw:{yen:30,xp:40,furn:'chair'}},
 {id:'cloth1',n:'ボタン [集|あつ]め',giver:'kon',intro:['[大|たい][変|へん]！ [服|ふく]に つける ボタンを [町|まち]の あちこちに おとしちゃった。','5こ ひろって きて くれる？ [商|しょう][店|てん][街|がい]や [公|こう][園|えん]に あると [思|おも]う。'],steps:[
   {t:'collect',x:'[町|まち]で ボタンを 5こ ひろおう',items:[{e:'🔘',n:'ボタン',x:-18,z:21.5},{e:'🔘',n:'ボタン',x:19,z:21.5},{e:'🔘',n:'ボタン',x:-9,z:-10},{e:'🔘',n:'ボタン',x:11,z:7},{e:'🔘',n:'ボタン',x:4,z:46}]},
   {t:'talk',who:'kon',x:'[洋|よう][服|ふく][屋|や]の コンに わたそう',say:['ありがとう！ これで [新|あたら]しい [服|ふく]が [作|つく]れるよ！','お[礼|れい]に ミント[色|いろ]の [服|ふく]を あげるね。']}],rw:{yen:20,xp:40,shirt:'mint'}},
 {id:'zakka1',n:'おはなの [部|へ][屋|や]かざり',giver:'hana',intro:['お[店|みせ]に おはなを かざりたいの。','[公|こう][園|えん]の [周|まわ]りで おはなを 3つ つんで きて くれる？'],steps:[
   {t:'collect',x:'[公|こう][園|えん]の [周|まわ]りで はなを 3つ つもう',items:[{e:'🌷',n:'チューリップ',x:-12,z:-7},{e:'🌼',n:'ひなぎく',x:12,z:-8},{e:'🌹',n:'ばら',x:-6,z:12.5}]},
   {t:'talk',who:'hana',x:'[雑|ざっ][貨|か][屋|や]の ハナに [届|とど]けよう',say:['きれい！ ありがとう！','お[礼|れい]に 「[葉|は]っぱ」の かべ[紙|がみ]を どうぞ。']}],rw:{yen:15,xp:40,wall:'w3'}},
 {id:'moko1',n:'はちみつクッキー',giver:'moko',after:'furn1',intro:['ねえねえ、 はちみつクッキーを やきたいんだ！','[森|もり]の おくに ハチの すが あるから、 はちみつを とって きて くれる？'],steps:[
   {t:'collect',x:'[森|もり]で はちみつを とってこよう',items:[{e:'🍯',n:'はちみつ',x:84,z:-24,tp:'kuku'}]},
   {t:'set',x:'モコの [家|いえ]の オーブンで クッキーを やこう',to:{room:'hMoko',x:-.9,z:-2.6},label:'オーブン',tp:['story'],r:3,title:'クッキーづくり'},
   {t:'talk',who:'mii',x:'やけた クッキーを ミィに [届|とど]けよう',say:['いい におい！ モコの クッキー？ ありがとう！','モコにも 「おいしかった」って [伝|つた]えてね。']},
   {t:'talk',who:'moko',x:'モコに [報|ほう][告|こく] しよう',say:['ミィ、 よろこんでた？ やったあ！ いっしょに [作|つく]って くれて ありがとう！']}],rw:{yen:40,xp:60}},
 {id:'mii1',n:'[手|て][紙|がみ]を [届|とど]けて',giver:'mii',after:'zakka1',intro:['ペンに [手|て][紙|がみ]を かいたんだけど、 [届|とど]けて くれる？','その [前|まえ]に、 [私|わたし]の [部|へ][屋|や]の [机|つくえ]で、 いっしょに [読|よ]みなおして ほしいな。'],steps:[
   {t:'set',x:'ミィの [家|いえ]の [机|つくえ]で [手|て][紙|がみ]を [読|よ]もう',to:{room:'hMii',x:3.6,z:-2.2},label:'[机|つくえ]',tp:['dokkai'],r:2,title:'[手|て][紙|がみ]を [読|よ]もう'},
   {t:'talk',who:'pen',x:'[砂|すな]はまの ペンに [手|て][紙|がみ]を [届|とど]けよう',say:['ミィから [手|て][紙|がみ]？ うれしいな！','お[返|へん][事|じ]を かくね。 ミィに わたして くれる？']},
   {t:'talk',who:'mii',x:'ペンの お[返|へん][事|じ]を ミィに わたそう',say:['ペンから お[返|へん][事|じ]！ ありがとう、 [大|だい][好|す]き！']}],rw:{yen:35,xp:60}},
 {id:'pochi1',n:'[宝|たから]の [骨|ほね]',giver:'pochi',intro:['ワン！ [大|だい][事|じ]な [骨|ほね]を どこかに うめちゃった…','たしか [森|もり]の [大|おお]きな きの [近|ちか]くだったと [思|おも]う！'],steps:[
   {t:'collect',x:'[森|もり]で [骨|ほね]を [探|さが]そう',items:[{e:'🦴',n:'[骨|ほね]',x:66,z:-62,tp:'add'}]},
   {t:'talk',who:'pochi',x:'ポチに [骨|ほね]を [届|とど]けよう',say:['ぼくの [骨|ほね]！ ワンワン！ ありがとう！']}],rw:{yen:25,xp:40}},
 {id:'kero1',n:'[川|かわ]の おそうじ',giver:'kero',intro:['ケロ… [川|かわ]に ゴミが [落|お]ちてるんだ。','4つ ひろって きれいに して くれる？'],steps:[
   {t:'collect',x:'かわぞいで ゴミを 4つ ひろおう',items:[{e:'🥫',n:'あきかん',x:34,z:-30,tp:'imi'},{e:'🧴',n:'ボトル',x:34,z:20,tp:'kata'},{e:'🥫',n:'あきかん',x:46,z:-10,tp:'imi'},{e:'📰',n:'[新|しん][聞|ぶん]',x:46,z:30,tp:'hira'}]},
   {t:'talk',who:'kero',x:'ケロに [報|ほう][告|こく] しよう',say:['[川|かわ]が ピカピカ！ ありがとう！']}],rw:{yen:30,xp:50}},
 {id:'school2',n:'[漢|かん][字|じ] とっくん',giver:'hoo',after:'school1',lv:3,intro:['ホッホー、 [次|つぎ]は [漢|かん][字|じ]の とっくん じゃ。','こくばんの [前|まえ]で、 [漢|かん][字|じ]の [問|もん][題|だい]に ちょう[戦|せん] してごらん。'],steps:[
   {t:'set',x:'[学|がっ][校|こう]の こくばんで [漢|かん][字|じ]に ちょう[戦|せん]',to:{room:'school',x:2.2,z:-3.4},label:'とっくん',tp:['kanji'],r:5,title:'[漢|かん][字|じ] とっくん'},
   {t:'talk',who:'hoo',x:'ホー[先|せん][生|せい]に [報|ほう][告|こく] しよう',say:['すばらしい！ がんばった [印|しるし]に コックぼうを あげよう。']}],rw:{yen:35,xp:60,hat:'chef'}},
 {id:'pen1',n:'[島|しま]の カメじい',giver:'pen',lv:4,intro:['[島|しま]に カメじいって いう ものしりが いるんだ。','ぼくの かわりに あいさつに いって くれる？'],steps:[
   {t:'talk',who:'jiji',x:'[宝|たから][島|じま]の カメじいに あいにいこう',say:['ほっほ、 ペンの [友|とも]だちか。 よく きたのう。','[一|ひと]つ お[話|はなし]を [読|よ]んで あげよう。'],quiz:{tp:['dokkai'],r:2}},
   {t:'talk',who:'pen',x:'ペンに [報|ほう][告|こく] しよう',say:['カメじい、 げんきだった？ ありがとう！']}],rw:{yen:50,xp:80}},
 /* --- 2026-11-14: quests for the villagers who had none (クリ・リンリン・ピョン・ドラ) --- */
 {id:'kuri1',n:'どんぐり ひろい',giver:'kuri',intro:['あっ、 こんにちは！ [冬|ふゆ]に [備|そな]えて どんぐりを ためて いるんだ。','でも [風|かぜ]が ふいて、 [森|もり]の あちこちに ちらばっちゃった…','4つ ひろって きて くれる？'],steps:[
   {t:'collect',x:'[森|もり]で どんぐりを 4つ ひろおう',items:[{e:'🌰',n:'どんぐり',x:72,z:-13,tp:'add'},{e:'🌰',n:'どんぐり',x:88,z:-8,tp:'sub'},{e:'🌰',n:'どんぐり',x:75,z:-33,tp:'story'},{e:'🌰',n:'どんぐり',x:92,z:-30,tp:'clock'}]},
   {t:'talk',who:'kuri',x:'[森|もり]の クリに [届|とど]けよう',say:['わあ、 4つも [集|あつ]めて くれたの！ これで [冬|ふゆ]も [安|あん][心|しん]！','お[礼|れい]に ぽかぽかの マフラーを どうぞ。']}],rw:{yen:30,xp:40,acc:'scarf'}},
 {id:'rin1',n:'[言|こと][葉|ば]の カード',giver:'rin',intro:['あのね、 ホー[先|せん][生|せい]に [文|ぶん]を [作|つく]って みせたいの。','でも [言|こと][葉|ば]の カードが ばらばらで…','[学|がっ][校|こう]の [机|つくえ]で、 いっしょに [並|なら]べて くれる？'],steps:[
   {t:'set',x:'[学|がっ][校|こう]の [机|つくえ]で [言|こと][葉|ば]を [並|なら]べよう',to:{room:'school',x:-1.8,z:1.3},label:'カード',tp:['narabe'],r:3,title:'[言|こと][葉|ば]の カード'},
   {t:'talk',who:'hoo',x:'ホー[先|せん][生|せい]に [文|ぶん]を みせよう',say:['ホッホー、 [上手|じょうず]に [並|なら]んで おるのう！','リンリンにも 「よく できました」と [伝|つた]えて おくれ。']},
   {t:'talk',who:'rin',x:'リンリンに [報|ほう][告|こく] しよう',say:['[先|せん][生|せい]、 ほめて くれたの？ やったあ！','お[礼|れい]に [私|わたし]と おそろいの はなかざりを どうぞ。']}],rw:{yen:25,xp:40,hat:'flower'}},
 {id:'pyon1',n:'[迷|まい][子|ご]の チケット',giver:'pyon',lv:3,intro:['[大|たい][変|へん]！ [乗|の]り[物|もの]の チケットを [遊|ゆう][園|えん][地|ち]で おとしちゃった。','3[枚|まい] あるんだけど、 [探|さが]して くれる？'],steps:[
   {t:'collect',x:'[遊|ゆう][園|えん][地|ち]で チケットを 3[枚|まい] [探|さが]そう',items:[{e:'🎟️',n:'チケット',x:-72,z:31,tp:'money'},{e:'🎟️',n:'チケット',x:-65,z:33,tp:'clock'},{e:'🎟️',n:'チケット',x:-73,z:21,tp:'money'}]},
   {t:'talk',who:'pyon',x:'ピョンに チケットを わたそう',say:['[全|ぜん][部|ぶ] あった！ ありがとう！','お[金|かね]の [計|けい][算|さん]も [得|とく][意|い]なんだね。','お[礼|れい]に チェックの ゆかを あげる。 おうちで はってみてね！']}],rw:{yen:40,xp:60,floor:'f4'}},
 {id:'dora1',n:'[遺|い]せきの [石|せき][板|ばん]',giver:'dora',lv:5,intro:['ガオ… [遺|い]せきの [石|せき][板|ばん]が われて しまったんだ。','かけらが [遺|い]せきの [外|そと][側|がわ]に 3つ [落|お]ちて いるはず。','[漢|かん][字|じ]の [力|ちから]で ひろって きて くれる？'],steps:[
   {t:'collect',x:'[遺|い]せきの [周|まわ]りで [石|せき][板|ばん]の かけらを 3つ ひろおう',items:[{e:'🪨',n:'[石|せき][板|ばん]の かけら',x:-41,z:-91,tp:'kanji'},{e:'🪨',n:'[石|せき][板|ばん]の かけら',x:-41,z:-101,tp:'imi'},{e:'🪨',n:'[石|せき][板|ばん]の かけら',x:-19,z:-96,tp:'kata'}]},
   {t:'talk',who:'dora',x:'ドラに かけらを わたそう',say:['ガオー！ [石|せき][板|ばん]が もとどおりだ！','きみは [遺|い]せきの ゆうしゃだね。 この マントを つけて！']}],rw:{yen:50,xp:80,acc:'cape'}},
];
const QD=Object.fromEntries(QUESTS.map(q=>[q.id,q]));
QUESTS.forEach(q=>q.steps.forEach(s=>(s.items||[]).forEach(it=>{if(!it.room)KEEP.push([it.x,it.z,1.5]);})));
const WHERE={hoo:'[学|がっ][校|こう]',merry:'[家|か][具|ぐ]や',kon:'[洋|よう][服|ふく][屋|や]',hana:'[雑|ざっ][貨|か][屋|や]',moko:'[公|こう][園|えん]',mii:'[商|しょう][店|てん][街|がい]',pochi:'アスレチックの [近|ちか]く',kero:'[川|かわ]',pen:'[砂|すな]はま',kuri:'[森|もり]',rin:'[学|がっ][校|こう]の [前|まえ]',pyon:'[遊|ゆう][園|えん][地|ち]',dora:'[遺|い]せき'};
const pendingQ=[];let qArrow=null,qBeacon=null;
const qOn=id=>{const s=S.q[id];return s&&!s.done?s:null;};
const stepActive=(qid,si)=>{const s=qOn(qid);return !!s&&s.s===si;};
const itemActive=(qid,si,it)=>stepActive(qid,si)&&!S.q[qid].got.includes(it.key);
const qAvail=q=>!S.q[q.id]&&(!q.lv||S.level>=q.lv)&&(!q.after||(S.q[q.after]&&S.q[q.after].done));
function qInit(){S.q=S.q||{};
  QUESTS.forEach(q=>q.steps.forEach((st,si)=>{
    (st.items||[]).forEach((it,ii)=>{const R=it.room?ROOMS[it.room]:null;it.ax=R?R.cx+it.x:it.x;it.az=R?R.cz+it.z:it.z;it.key=q.id+'_'+si+'_'+ii;
      const g=new THREE.Group();g.position.set(it.ax,0,it.az);it.sp=emojiSprite(it.e,.9);it.sp.position.y=1.1;g.add(it.sp);const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.05,6,24),ME(0xffd45c));ring.rotation.x=Math.PI/2;ring.position.y=.06;g.add(ring);scene.add(g);it.g=g;
      INTER.push({x:it.ax,z:it.az,r:2,y:2.2,label:'ひろう',fn:()=>pickItem(q.id,si,it),cond:()=>itemActive(q.id,si,it)});});
    if(st.to){const R=st.to.room?ROOMS[st.to.room]:null;st.ax=R?R.cx+st.to.x:st.to.x;st.az=R?R.cz+st.to.z:st.to.z;
      if(st.t==='set')INTER.push({x:st.ax,z:st.az,r:2.2,y:2.6,label:st.label||'やる',fn:()=>runStation(q.id,si),cond:()=>stepActive(q.id,si)});}}));
  npcs.forEach(n=>{n.qb=bubbleSprite('!','#fff3b0');n.qb.position.y=2.6;n.qb.visible=false;n.model.add(n.qb);});
  qArrow=new THREE.Group();const a=mk(G.cone,ME(0xff6f91),.28,.6,.12,0,0,0,qArrow,false);a.rotation.x=Math.PI/2;qArrow.visible=false;scene.add(qArrow);
  qBeacon=mk(G.star,ME(0xffd45c),.5,.5,.5,0,-20,0,null,false);
  if(S.intro&&!S.q.home1)startQuest('home1',true);
  /* older saves: home1 used to have a 2nd step — finish it if already past the 1st; start follow-up quests that should be running */
  QUESTS.forEach(q=>{const s=S.q[q.id];if(s&&!s.done&&s.s>=q.steps.length)s.done=true;});
  QUESTS.forEach(q=>{if(q.auto&&S.q[q.auto]&&S.q[q.auto].done&&!S.q[q.id]){S.q[q.id]={s:0,got:[]};if(!S.track||!qOn(S.track))S.track=q.id;}});refreshQ();}
function refreshQ(){QUESTS.forEach(q=>q.steps.forEach((st,si)=>(st.items||[]).forEach(it=>{if(it.g)it.g.visible=itemActive(q.id,si,it);})));updateTracker();}
function startQuest(id,quiet){S.q[id]={s:0,got:[]};S.track=id;if(!quiet){sfx('fan');toast(`クエスト 「${QD[id].n}」を ひきうけた！`);}refreshQ();save();}
function advance(id){const st=S.q[id],q=QD[id];st.s++;st.got=[];ev('qstep');
  if(st.s>=q.steps.length){st.done=true;const r=q.rw;S.yen+=r.yen||0;addXP(r.xp||0);if(r.furn)S.own.furn[r.furn]=(S.own.furn[r.furn]||0)+1;if(r.shirt&&!S.own.shirt.includes(r.shirt))S.own.shirt.push(r.shirt);if(r.wall&&!S.own.wall.includes(r.wall))S.own.wall.push(r.wall);if(r.hat&&!S.own.hat.includes(r.hat))S.own.hat.push(r.hat);
    if(r.acc&&!S.own.acc.includes(r.acc))S.own.acc.push(r.acc);if(r.floor&&!S.own.floor.includes(r.floor))S.own.floor.push(r.floor);
    if(q.giver)S.hearts[q.giver]=Math.min(5,(S.hearts[q.giver]||0)+1);
    const auto=QUESTS.filter(x=>x.auto===id&&!S.q[x.id]);auto.forEach(x=>{S.q[x.id]={s:0,got:[]};}); /* follow-up quest starts by itself */
    const nx=auto[0]||QUESTS.find(x=>qOn(x.id));S.track=nx?nx.id:null;pendingQ.push(id);checkAch();if(modal.hidden&&!dlgAdv)later(flushQuest,300);}
  else{S.track=id;const nx=q.steps[st.s].x;later(()=>toast('[次|つぎ]は： '+nx),400);}
  refreshQ();updateHUD();save();}
function flushQuest(){if(!pendingQ.length||!modal.hidden||dlgAdv)return;const id=pendingQ.shift(),q=QD[id],r=q.rw;sfx('fan');confetti(50);const card=openModal();
  const items=[`どんぐり ${r.yen}こ`,`[経|けい][験|けん][値|ち] ${r.xp}`,r.furn&&`[家|か][具|ぐ] 「${FURN[r.furn].n}」`,r.shirt&&`ふく 「${SHIRTS[r.shirt].n}」`,r.wall&&`かべ[紙|がみ] 「${WALLS[r.wall].n}」`,r.hat&&`ぼうし 「${HATS[r.hat].n}」`,r.acc&&`こもの 「${ACCS[r.acc].n}」`,r.floor&&`ゆか 「${FLOORS[r.floor].n}」`].filter(Boolean);
  const nextQ=QUESTS.find(qAvail);
  card.innerHTML=`<div class="catch"><div class="stamp">📜</div><div class="nm">クエスト クリア！</div><p class="mnote">「${q.n}」</p><p class="gift">ごほうび： ${items.join('、 ')}</p>${nextQ?`<p class="mnote">[次|つぎ]の クエスト： ${nextQ.giver?FR(nextQ.giver).n+'が [困|こま]って いるみたい（'+(WHERE[nextQ.giver]||'')+'）':''}</p>`:''}</div><div class="btn-row"><button class="big-btn" type="button" data-a="ok">やったー！</button></div>`;
  /* some quests end with someone praising you (はじめての もようがえ → ホーせんせい), then the follow-up quest is announced */
  onAct(card,{ok:()=>{closeModal();const nextAuto=QUESTS.find(x=>x.auto===id&&qOn(x.id));
    const tell=()=>{if(nextAuto){sfx('fan');toast(`[新|あたら]しい クエスト 「${nextAuto.n}」`);updateTracker();}};
    if(q.praise)later(()=>talk(FR(q.praise.who),q.praise.say).then(tell),300);else tell();}});}
function pickItem(qid,si,it){const card=openModal(),gen=modalGen;card.innerHTML=head(`${it.n}を [見|み]つけた！`,null)+`<p class="mnote">[問|もん][題|だい]に [答|こた]えて ひろおう</p><div class="qbox"></div>`;wire(card);const qb=card.querySelector('.qbox');
  renderQ(qb,it.tp?genQ(it.tp):mixedQ(),()=>{if(gen!==modalGen)return;const st=S.q[qid];st.got.push(it.key);sfx('star');const step=QD[qid].steps[si],left=step.items.filter(x=>!st.got.includes(x.key)).length;
    qb.innerHTML=`<div class="catch"><div class="pic">${it.e}</div><div class="nm">${it.n} ゲット！</div><p class="mnote">${left?`あと ${left}こ`:'[全|ぜん][部|ぶ] [集|あつ]まった！'}</p></div><div class="btn-row"><button class="big-btn" type="button" data-a="ok">OK</button></div>`;
    onAct(qb,{ok:closeModal});if(!left)advance(qid);else{refreshQ();save();}});}
function runStation(qid,si){const st=QD[qid].steps[si];runSet({title:st.title||'チャレンジ',topics:st.tp,rounds:st.r||3,onDone:()=>{advance(qid);return '<p class="gift">クエストが [進|すす]んだ！</p>';}});}
function questEvent(type,arg){for(const q of QUESTS){const s=qOn(q.id);if(!s)continue;const st=q.steps[s.s];if(st.t!==type||(type==='enter'&&st.room!==arg)||(st.kind&&st.kind!==arg))continue;
  /* steps with n: count up (e.g. place 3 pieces of furniture) */
  if(st.n){s.cnt=(s.cnt||0)+1;if(s.cnt<st.n){updateTracker();save();toast(`${q.n}： あと ${st.n-s.cnt}つ！`);continue;}}
  advance(q.id);}}
async function questTalk(n){const id=n.f.id;
  for(const q of QUESTS){const s=qOn(q.id);if(!s)continue;const st=q.steps[s.s];if(st.t==='talk'&&st.who===id){await talk(n.f,st.say);
    if(st.quiz)runSet({title:`${n.f.n}と いっしょに`,who:n.f,topics:st.quiz.tp,rounds:st.quiz.r,onDone:()=>{advance(q.id);return '';}});else advance(q.id);return true;}}
  const av=QUESTS.find(q=>q.giver===id&&qAvail(q));
  if(av){const r=await talk(n.f,av.intro,['ひきうける！','ほかの [話|はなし]']);if(r===0){startQuest(av.id);return true;}}
  return false;}
/* targets & guidance */
function stepTarget(qid){const q=QD[qid],s=qOn(qid);if(!s)return null;const st=q.steps[s.s];
  if(st.t==='talk'){const n=npcs.find(n=>n.f.id===st.who);return {x:n.pos.x,z:n.pos.z,room:n.fixed?n.f.room:n.inRoom?curRoom&&curRoom.id:null};}
  if(st.items){const it=st.items.find(i=>!s.got.includes(i.key));return it?{x:it.ax,z:it.az,room:it.room||null}:null;}
  if(st.to)return {x:st.ax,z:st.az,room:st.to.room||null};return null;}
function guidePoint(t){if(!t)return null;const here=curRoom?curRoom.id:null;if((t.room||null)===here)return t;if(here)return {x:curRoom.cx,z:curRoom.z1-.6};const d=DOORS[t.room];return d?{x:d.x,z:d.z}:null;}
function updateQuests(){if(!qArrow)return;
  const tr=S.track&&qOn(S.track)?S.track:null;const g=tr?guidePoint(stepTarget(tr)):null;
  if(g){const dx=g.x-P.pos.x,dz=g.z-P.pos.z,d=Math.hypot(dx,dz);qArrow.visible=d>2.5&&mode==='world'&&!P.riding;qArrow.position.set(P.pos.x,P.pos.y+2.75+Math.sin(time*4)*.08,P.pos.z);qArrow.rotation.y=Math.atan2(dx,dz);
    qBeacon.position.set(g.x,3.4+Math.sin(time*3)*.2,g.z);qBeacon.rotation.y+=.03;qBeacon.visible=d>2.5;}else{qArrow.visible=false;qBeacon.visible=false;}
  for(const n of npcs){if(!n.qb)continue;const id=n.f.id;const want=QUESTS.some(q=>{const s=qOn(q.id);return s&&q.steps[s.s].t==='talk'&&q.steps[s.s].who===id;})||QUESTS.some(q=>q.giver===id&&qAvail(q));
    const d=Math.hypot(P.pos.x-n.pos.x,P.pos.z-n.pos.z);n.qb.visible=want&&d<45&&d>=3;if(n.qb.visible)n.bub.visible=false;n.qb.position.y=2.6+Math.sin(time*4)*.12;}}
function updateTracker(){const el=$('#qtrack');if(!el)return;const id=S.track&&qOn(S.track)?S.track:null;if(!id){const av=QUESTS.find(qAvail);el.innerHTML=av?`📜 <b>クエスト</b>　${av.giver?FR(av.giver).n+'が [困|こま]っているみたい（'+(WHERE[av.giver]||'')+'）':''}`:'📜 クエスト';return;}
  const q=QD[id],s=S.q[id],st=q.steps[s.s];const cnt=st.items?`（${s.got.length}/${st.items.length}）`:st.n?`（${s.cnt||0}/${st.n}）`:'';el.innerHTML=`📜 <b>${q.n}</b><br>${st.x}${cnt}`;}
function questMapMark(c,s){const tr=S.track&&qOn(S.track)?S.track:null;if(!tr||curRoom)return;let t=stepTarget(tr);if(!t)return;if(t.room){const d=DOORS[t.room];if(!d)return;t=d;}const[a,b]=m2(t.x,t.z,s);c.font=`${s>300?30:26}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('⭐',a,b);}
function openQuests(){const card=openModal();const act=QUESTS.filter(q=>qOn(q.id)),av=QUESTS.filter(qAvail),lock=QUESTS.filter(q=>!S.q[q.id]&&!qAvail(q)),done=QUESTS.filter(q=>S.q[q.id]&&S.q[q.id].done);
  card.innerHTML=head('クエスト',null)+`<p class="mnote">[町|まち]の みんなの お[手|て][伝|つだ]いを しよう！ ⭐と やじるしが [行|い]き[先|さき]を [教|おし]えて くれるよ</p>
  ${act.length?`<h3 class="sec">[進|すす]めている クエスト</h3><ul class="mlist">${act.map(q=>{const s=S.q[q.id],st=q.steps[s.s];return `<li><span class="chk">${S.track===q.id?'⭐':''}</span><div class="mt">${q.n}<div class="md">${s.s+1}/${q.steps.length}： ${st.x}</div></div>${S.track===q.id?'':`<button class="tab" type="button" data-tr="${q.id}">これを おう</button>`}</li>`;}).join('')}</ul>`:''}
  ${av.length?`<h3 class="sec">[困|こま]っている [人|ひと]</h3><ul class="mlist">${av.map(q=>`<li><span class="chk">❗</span><div class="mt">${q.giver?FR(q.giver).n:''}<div class="md">${WHERE[q.giver]||''}で [話|はな]しかけてみよう</div></div></li>`).join('')}</ul>`:''}
  ${lock.length?`<p class="mnote">ほかにも ${lock.length}この クエストが あるよ（レベルを あげたり、 ほかの クエストを クリアすると でてくる）</p>`:''}
  <p class="mnote">クリアした クエスト： ${done.length}/${QUESTS.length}</p>`;wire(card);
  card.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{S.track=b.dataset.tr;updateTracker();save();openQuests();});}
