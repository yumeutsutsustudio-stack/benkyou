'use strict';
/* ===== 1ねんせい えいご（ミィ・ペンの おねがい ／ きょうしつ） =====
  もんだいの たしかた： [ ] の なかに { … } を 1つ たすだけ。
  { type:'eng', topic:'eword'|'ecolor'|'ehello', en:'えいご', k:'カタカナの よみ', ja:'にほんごの いみ', e:'え（えもじ）' }
  ※ もんだいは じどうで 2しゅるい：「えを みて えいごを えらぶ」 ／ 「えいごを きいて いみを えらぶ」（🔊で えいごの おとが でる）
  ※ まちがいの えらびしは おなじ topic の ほかの ことばから えらぶ。 en と ja は ほかと かぶらない ように
  ※ ja の かんじは [漢字|かんじ] と かく（g1_rika.js の せつめいを みてね）
*/
qbank(1,'eigo',[
  /* たんご（どうぶつ・たべもの） */
  {type:'eng',topic:'eword',en:'dog',k:'ドッグ',ja:'[犬|いぬ]',e:'🐶'},{type:'eng',topic:'eword',en:'cat',k:'キャット',ja:'ねこ',e:'🐱'},
  {type:'eng',topic:'eword',en:'bear',k:'ベア',ja:'[熊|くま]',e:'🐻'},{type:'eng',topic:'eword',en:'rabbit',k:'ラビット',ja:'うさぎ',e:'🐰'},
  {type:'eng',topic:'eword',en:'fish',k:'フィッシュ',ja:'[魚|さかな]',e:'🐟'},{type:'eng',topic:'eword',en:'bird',k:'バード',ja:'[鳥|とり]',e:'🐦'},
  {type:'eng',topic:'eword',en:'apple',k:'アップル',ja:'りんご',e:'🍎'},{type:'eng',topic:'eword',en:'banana',k:'バナナ',ja:'バナナ',e:'🍌'},
  {type:'eng',topic:'eword',en:'milk',k:'ミルク',ja:'[牛|ぎゅう][乳|にゅう]',e:'🥛'},{type:'eng',topic:'eword',en:'egg',k:'エッグ',ja:'[卵|たまご]',e:'🥚'},
  /* いろ・かず */
  {type:'eng',topic:'ecolor',en:'red',k:'レッド',ja:'[赤|あか]',e:'🔴'},{type:'eng',topic:'ecolor',en:'blue',k:'ブルー',ja:'[青|あお]',e:'🔵'},
  {type:'eng',topic:'ecolor',en:'yellow',k:'イエロー',ja:'[黄|き][色|いろ]',e:'🟡'},{type:'eng',topic:'ecolor',en:'green',k:'グリーン',ja:'[緑|みどり]',e:'🟢'},
  {type:'eng',topic:'ecolor',en:'one',k:'ワン',ja:'[一|いち]',e:'1️⃣'},{type:'eng',topic:'ecolor',en:'two',k:'トゥー',ja:'[二|に]',e:'2️⃣'},
  {type:'eng',topic:'ecolor',en:'three',k:'スリー',ja:'[三|さん]',e:'3️⃣'},{type:'eng',topic:'ecolor',en:'four',k:'フォー',ja:'[四|よん]',e:'4️⃣'},
  {type:'eng',topic:'ecolor',en:'five',k:'ファイブ',ja:'[五|ご]',e:'5️⃣'},
  /* あいさつ */
  {type:'eng',topic:'ehello',en:'Hello!',k:'ハロー',ja:'こんにちは',e:'👋'},{type:'eng',topic:'ehello',en:'Good morning!',k:'グッドモーニング',ja:'おはよう',e:'🌅'},
  {type:'eng',topic:'ehello',en:'Thank you!',k:'サンキュー',ja:'ありがとう',e:'💝'},{type:'eng',topic:'ehello',en:'Goodbye!',k:'グッバイ',ja:'さようなら',e:'🙋'},
  {type:'eng',topic:'ehello',en:'Good night!',k:'グッドナイト',ja:'おやすみ',e:'🌙'}
]);
