'use strict';
/* ===== がくねんべつ かんじ: show a kanji only when the player's grade (or a lower one) has learned it =====
   In problem text a kanji word is written  [漢字|かんじ] :
     every kanji inside is learned by S.grade → shown as 漢字, otherwise → the reading かんじ.
   Split a compound per kanji to get textbook-style mixing, e.g. [昆|こん][虫|ちゅう] → こん虫 (昆 is not taught) ;
   write words whose kanji are never taught in elementary school just in hiragana.
   Q() (quiz.js) converts prompt / choice labels / hint; the read-aloud text (speak) always uses the readings.
   Lists: 学年別漢字配当表 (2020). */
const KANJI_GRADE=[,
 '一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六',
 '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話',
 '悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配倍箱畑発反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和',
 '愛案以衣位茨印英栄媛塩岡億加果貨課芽賀改械害街各覚潟完官管関観願岐希季旗器機議求泣給挙漁共協鏡競極熊訓軍郡群径景芸欠結建健験固功好香候康佐差菜最埼材崎昨札刷察参産散残氏司試児治滋辞鹿失借種周祝順初松笑唱焼照城縄臣信井成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲沖兆低底的典伝徒努灯働特徳栃奈梨熱念敗梅博阪飯飛必票標不夫付府阜富副兵別辺変便包法望牧末満未民無約勇要養浴利陸良料量輪類令冷例連老労録',
 '圧囲移因永営衛易益液演応往桜可仮価河過快解格確額刊幹慣眼紀基寄規喜技義逆久旧救居許境均禁句型経潔件険検限現減故個護効厚耕航鉱構興講告混査再災妻採際在財罪殺雑酸賛士支史志枝師資飼示似識質舎謝授修述術準序招証象賞条状常情織職制性政勢精製税責績接設絶祖素総造像増則測属率損貸態団断築貯張停提程適統堂銅導得毒独任燃能破犯判版比肥非費備評貧布婦武復複仏粉編弁保墓報豊防貿暴脈務夢迷綿輸余容略留領歴',
 '胃異遺域宇映延沿恩我灰拡革閣割株干巻看簡危机揮貴疑吸供胸郷勤筋系敬警劇激穴券絹権憲源厳己呼誤后孝皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦縮熟純処署諸除承将傷障蒸針仁垂推寸盛聖誠舌宣専泉洗染銭善奏窓創装層操蔵臓存尊退宅担探誕段暖値宙忠著庁頂腸潮賃痛敵展討党糖届難乳認納脳派拝背肺俳班晩否批秘俵腹奮並陛閉片補暮宝訪亡忘棒枚幕密盟模訳郵優預幼欲翌乱卵覧裏律臨朗論'];
const KJ_SETS={};
function kjSet(g){g=Math.max(0,Math.min(6,g|0));return KJ_SETS[g]||(KJ_SETS[g]=new Set(KANJI_GRADE.slice(1,g+1).join('')));}
const KJ_RE=/\[([^\[\]|]+)\|([^\[\]|]*)\]/g,KJ_HAN=/[㐀-鿿]/;
/* text for the player's grade (g = override) */
/* KJ_VIEW: show kanji for this grade even while S.grade is set to something else (textbook check questions are made at the unit's grade) */
let KJ_VIEW=0;
function kj(s,g){if(s==null)return s;s=String(s);if(s.indexOf('|')<0)return s;const set=kjSet(g==null?(KJ_VIEW||(typeof S!=='undefined'?S.grade:1)):g);
  return s.replace(KJ_RE,(_,k,r)=>Array.from(k).every(c=>c==='々'||!KJ_HAN.test(c)||set.has(c))?k:r);}
/* readings only (read-aloud, length checks) */
function kana(s){return s==null?s:String(s).replace(KJ_RE,'$2');}

/* ===== whole screen: every text node (menus, title, cards, toasts…) that contains [漢字|かんじ] is shown for the player's grade.
   The raw text is kept on the node, so kjRefresh() can redo it when the grade changes.
   Typed-out dialogue (talk / typeSay / request say) converts its lines itself before typing (ui.js, request.js).
   3D signs / labels are canvas textures: world.js textCanvasTex registers a redraw in KJ_TEX. */
const KJ_TEX=[],KJ_ATTR=['title','aria-label','placeholder','alt'];
function kjNode(n){const raw=n.data;if(raw.indexOf('|')<0||!/\[[^\[\]|]+\|[^\[\]|]*\]/.test(raw))return;n.__kjRaw=raw;const v=kj(raw);n.__kjOut=v;if(v!==raw)n.data=v;}
function kjEl(el){for(const a of KJ_ATTR){const v=el.getAttribute&&el.getAttribute(a);if(v&&v.indexOf('|')>=0)el.setAttribute(a,kj(v));}}
function kjScan(root){if(root.nodeType===3){kjNode(root);return;}if(root.nodeType!==1)return;kjEl(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;while((n=w.nextNode()))n.nodeType===3?kjNode(n):kjEl(n);}
function kjStart(){if(kjStart.on)return;kjStart.on=1;kjScan(document.body);
  new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData'){const n=m.target;if(n.__kjOut!==undefined&&n.data===n.__kjOut)continue;delete n.__kjRaw;delete n.__kjOut;kjNode(n);}else m.addedNodes.forEach(kjScan);}})
    .observe(document.body,{childList:true,subtree:true,characterData:true});}
/* the grade changed (or the save was loaded): redo every converted text and sign */
function kjRefresh(){if(!document.body)return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode()))if(n.__kjRaw){const v=kj(n.__kjRaw);n.__kjOut=v;if(n.data!==v)n.data=v;}KJ_TEX.forEach(f=>f());}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',kjStart);else kjStart();
