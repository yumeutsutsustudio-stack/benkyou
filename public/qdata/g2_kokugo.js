'use strict';
/* ===== 2ねんせい こくご（すみんの おねがい） =====
  かきかたは g1_kokugo.js の いちばん うえの せつめいを みてね。
*/
qbank(2,'kokugo',[
  /* ひらがな（ちいさい 「ゃ ゅ ょ っ」・のばす おと） */
  {type:'kana',w:'じてんしゃ',e:'🚲'},{type:'kana',w:'ぎゅうにゅう',e:'🥛'},{type:'kana',w:'きょうしつ',e:'🏫'},{type:'kana',w:'がっこう',e:'🏫'},
  {type:'kana',w:'ちょうちょ',e:'🦋'},{type:'kana',w:'きゅうり',e:'🥒'},{type:'kana',w:'らっぱ',e:'🎺'},{type:'kana',w:'しゃしん',e:'🖼️'},
  /* カタカナ（のばす ぼう・ちいさい もじ） */
  {type:'kana',w:'ペンギン',e:'🐧'},{type:'kana',w:'ライオン',e:'🦁'},{type:'kana',w:'コアラ',e:'🐨'},{type:'kana',w:'ロケット',e:'🚀'},
  {type:'kana',w:'カメラ',e:'📷'},{type:'kana',w:'ドーナツ',e:'🍩'},{type:'kana',w:'ギター',e:'🎸'},{type:'kana',w:'クッキー',e:'🍪'},
  {type:'kana',w:'シャツ',e:'👕'},{type:'kana',w:'スプーン',e:'🥄'},{type:'kana',w:'ロボット',e:'🤖'},{type:'kana',w:'トラック',e:'🚚'},
  /* かんじ（むらの かんばん） */
  {type:'kanji',k:'公園',r:'こうえん',e:'🌳'},{type:'kanji',k:'池',r:'いけ',e:'🪷'},{type:'kanji',k:'海',r:'うみ',e:'🌊'},{type:'kanji',k:'魚',r:'さかな',e:'🐟'},
  {type:'kanji',k:'鳥',r:'とり',e:'🐦'},{type:'kanji',k:'星',r:'ほし',e:'⭐'},{type:'kanji',k:'店',r:'みせ',e:'🏪'},{type:'kanji',k:'道',r:'みち',e:'🛤️'},
  {type:'kanji',k:'家',r:'いえ',e:'🏠'},{type:'kanji',k:'船',r:'ふね',e:'⛵'},{type:'kanji',k:'門',r:'もん',e:'🚪'},{type:'kanji',k:'雪',r:'ゆき',e:'❄️'},
  {type:'kanji',k:'春',r:'はる',e:'🌷'},{type:'kanji',k:'夏',r:'なつ',e:'🌻'},{type:'kanji',k:'秋',r:'あき',e:'🍁'},{type:'kanji',k:'冬',r:'ふゆ',e:'⛄'},
  {type:'kanji',k:'東',r:'ひがし',e:'🌅'},{type:'kanji',k:'西',r:'にし',e:'🌇'},{type:'kanji',k:'北',r:'きた',e:'🧭'},{type:'kanji',k:'南',r:'みなみ',e:'🧭'},
  /* ことばの なかまわけ */
  {type:'group',name:'[野|や][菜|さい]',words:['にんじん','たまねぎ','きゅうり','なす','キャベツ']},
  {type:'group',name:'[楽|がっ][器|き]',words:['ピアノ','たいこ','ギター','[笛|ふえ]','カスタネット']},
  {type:'group',name:'[文|ぶん]ぼう[具|ぐ]',words:['えんぴつ','[消|け]しゴム','のり','はさみ','じょうぎ']},
  {type:'group',name:'[天|てん][気|き]',words:['[晴|は]れ','くもり','[雨|あめ]','[雪|ゆき]','かみなり']},
  {type:'group',name:'[季|き][節|せつ]',words:['[春|はる]','[夏|なつ]','[秋|あき]','[冬|ふゆ]']},
  {type:'group',name:'[体|からだ]',words:['[頭|あたま]','かた','ひざ','おなか','[背|せ][中|なか]']}
]);
