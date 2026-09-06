// ============================================================
// exam.gs — Build Bridge 試験モード（完全版）
// ============================================================

function examRespond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleExam(params) {
  if (params.action === 'save_mistakes') {
    try {
      var body = JSON.parse(decodeURIComponent(params.payload || '{}'));
      return examRespond(saveMistakes(body));
    } catch(err) {
      return examRespond({ status: 'error', message: err.toString() });
    }
  }

  var apiKey = params.apiKey || params.api_key || '';
  if (apiKey !== 'bb_prod_2026_xK9mN3vQ7rL8wP5j') {
    return examRespond({ status: 'error', message: 'Invalid API key' });
  }
  var category = params.category || '';
  var limit    = parseInt(params.limit || '10', 10);
  var lang     = params.lang || 'ja';
  var round    = parseInt(params.round || '1', 10);
  if (round < 1 || round > 5) round = 1;

  switch (category) {
    case 'kanji':
    case 'kanji_imi':   return examRespond(examGetKanji('練習問題：意味',  limit, round));
    case 'kanji_yomi':  return examRespond(examGetKanji('練習問題：読み方', limit, round));
    case 'kanji_kanji': return examRespond(examGetKanji('練習問題：漢字',  limit, round));
    case 'vocab':       return examRespond(examGetVocab(limit, round));
    case 'grammar':     return examRespond(examGetGrammar(limit, round));
    case 'reading':     return examRespond(examGetReading(limit, round));
    case 'listening':   return examRespond(examGetListening(limit, round));
    default:
      return examRespond({ status: 'error', message: 'Unknown category: ' + category });
  }
}

// ── 共通ユーティリティ ─────────────────────────────────────

function examGetSheet(ssId, sheetName) {
  var ss    = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[String(headers[j]).trim()] = values[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function examNormalizeAnswer(val) {
  if (val === null || val === undefined || val === '') return 0;
  var s = String(val).trim().toLowerCase();
  if (s === 'a') return 1; if (s === 'b') return 2;
  if (s === 'c') return 3; if (s === 'd') return 4;
  var n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

function examBuildChoices(row, keys) {
  var choices = [];
  for (var i = 0; i < keys.length; i++) {
    var v = '';
    if (row[keys[i]] !== undefined) v = String(row[keys[i]] || '').trim();
    if (!v) { var k2 = keys[i].replace(/ /g,''); if (row[k2] !== undefined) v = String(row[k2]||'').trim(); }
    if (!v) { var k3 = keys[i].replace(/([^\s])(\d)/, ' '); if (row[k3] !== undefined) v = String(row[k3]||'').trim(); }
    if (v !== '') choices.push(v);
  }
  return choices;
}

function examSlicePage(pool, round) {
  var total = pool.length;
  if (total === 0) return [];
  var pageSize = Math.ceil(total / 5);
  var start = (round - 1) * pageSize;
  var end   = Math.min(start + pageSize, total);
  return pool.slice(start, end);
}

// ── 漢字 ──────────────────────────────────────────────────

function examGetKanji(sheetName, limit, round) {
  var rows = examGetSheet('15oThRQqHNwIV_AGdeKMtJ8--Gszsqu-8M0wiBmm26Is', sheetName);
  var pool = [];
  rows.forEach(function(row, idx) {
    var q    = String(row['問題文'] || '').trim();
    var word = String(row['単語'] || '').trim();
    if (!q && word) q = word;
    if (q === '（ ）' && word) q = word + '　' + q;
    var ans = examNormalizeAnswer(row['解答']);
    var ch  = examBuildChoices(row, ['選択肢 1','選択肢 2','選択肢 3','選択肢 4']);
    if (!q || ans === 0 || ch.length < 2) return;
    pool.push({
      id: 'kanji_' + sheetName.replace(/[：:]/g,'_') + '_' + (idx+1),
      type: '4choice', section: 'kanji', question: q, word: word, choices: ch, answer: ans
    });
  });
  var picked = examSlicePage(pool, round).slice(0, limit);
  return { status: 'success', category: 'kanji', total: picked.length, questions: picked };
}

// ── 語彙 ──────────────────────────────────────────────────

function examGetVocab(limit, round) {
  var rows = examGetSheet('1YKtlLyY6LquS2yB61a2jMxQDK67xBw6GbWfBeo-YVP4', '実戦問題');
  var pool = [];
  rows.forEach(function(row, idx) {
    var q   = String(row['問題文'] || '').trim();
    var ans = examNormalizeAnswer(row['正解']);
    var ch  = examBuildChoices(row, ['選択肢1','選択肢2','選択肢3','選択肢4']);
    if (!q || ans === 0 || ch.length < 2) return;
    pool.push({ id: 'vocab_'+(idx+1), type: '4choice', section: 'vocab', question: q, choices: ch, answer: ans });
  });
  var picked = examSlicePage(pool, round).slice(0, limit);
  return { status: 'success', category: 'vocab', total: picked.length, questions: picked };
}

// ── 文法 ──────────────────────────────────────────────────

function examGetGrammar(limit, round) {
  var rows = examGetSheet('1gyk3TwvWuSzzHpWYphDZ7TzO5Sr8vvVlBJE62i0EqhE', '②練習問題');
  var pool = [];
  rows.forEach(function(row, idx) {
    var daimo  = String(row['大問'] || '').trim();
    var q      = String(row['問題文'] || '').trim();
    var ansRaw = String(row['解答'] || '').trim();
    var ch     = examBuildChoices(row, ['選択肢1','選択肢2','選択肢3','選択肢4']);
    if (!q) return;

    // 大問II：並べ替え → sort_choice
    if (daimo.startsWith('II') || daimo.startsWith('Ⅱ') || daimo === '2') {
      var correctOrder = ansRaw.replace(/→/g,'-').replace(/＞/g,'-').trim();
      if (!correctOrder || ch.length < 2) return;
      var nums = []; for (var ni=1; ni<=ch.length; ni++) nums.push(ni);
      var wrong = examGenerateWrongOrders(nums, correctOrder, 3);
      if (wrong.length < 3) return;
      var allC = examShuffleArr(wrong.concat([correctOrder]));
      pool.push({
        id: 'grammar_sort_'+(idx+1), type: 'sort_choice', section: 'grammar',
        question: q, words: ch, choices: allC, answer: allC.indexOf(correctOrder)+1
      });
      return;
    }

    // 大問I：通常
    var ans = examNormalizeAnswer(ansRaw);
    if (ans === 0 || ch.length < 2) return;
    pool.push({
      id: 'grammar_'+(idx+1), type: ch.length===2?'2choice':'4choice',
      section: 'grammar', question: q, choices: ch, answer: ans
    });
  });
  var picked = examSlicePage(pool, round).slice(0, limit);
  return { status: 'success', category: 'grammar', total: picked.length, questions: picked };
}

function examGenerateWrongOrders(nums, correctOrder, n) {
  var results=[]; var attempts=0;
  while (results.length<n && attempts<200) {
    attempts++;
    var s=nums.slice();
    for (var i=s.length-1;i>0;i--) { var j=Math.floor(Math.random()*(i+1)); var t=s[i];s[i]=s[j];s[j]=t; }
    var o=s.join('-');
    if (o!==correctOrder && results.indexOf(o)===-1) results.push(o);
  }
  return results;
}

function examShuffleArr(arr) {
  var a=arr.slice();
  for (var i=a.length-1;i>0;i--) { var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; }
  return a;
}

// ── 読解 ──────────────────────────────────────────────────

function examGetReading(limit, round) {
  var SS_ID = '1hN5Pk7DmrDDEQOPeEZde-AvK28BxGxCOdqYf9WCU7XM';
  var pool  = [];

  var rows1 = examGetSheet(SS_ID, '読解問題');
  var passageMap = {};
  rows1.forEach(function(row, idx) {
    if (String(row['問題種別']||'').trim() !== 'もんだい') return;
    var q   = String(row['設問文']||'').trim();
    var ans = examNormalizeAnswer(row['解答']);
    var ch  = examBuildChoices(row, ['選択肢1','選択肢2','選択肢3','選択肢4']);
    if (!q || ans===0 || ch.length<2) return;
    var key = String(row['週']||'')+'_'+String(row['日目']||'')+'_'+String(row['テーマ']||'');
    if (!passageMap[key]) passageMap[key]={ passage: String(row['本文']||'').trim(), items:[] };
    passageMap[key].items.push({ id:'reading_p_'+(idx+1), type:'4choice', section:'reading', question:q, choices:ch, answer:ans });
  });
  Object.keys(passageMap).forEach(function(key) {
    passageMap[key].items.forEach(function(q){ q.passage=passageMap[key].passage; pool.push(q); });
  });

  var rows2 = examGetSheet(SS_ID, '実戦問題');
  rows2.forEach(function(row, idx) {
    var q   = String(row['設問文']||'').trim();
    var ans = examNormalizeAnswer(row['解答']);
    var ch  = examBuildChoices(row, ['選択肢1','選択肢2','選択肢3','選択肢4']);
    if (!q || ans===0 || ch.length<2) return;
    pool.push({ id:'reading_j_'+(idx+1), type:'4choice', section:'reading', passage:String(row['本文']||'').trim(), question:q, choices:ch, answer:ans });
  });

  var picked = examSlicePage(pool, round).slice(0, limit);
  return { status:'success', category:'reading', total:picked.length, questions:picked };
}

// ── 聴解 ──────────────────────────────────────────────────

function examGetListening(limit, round) {
  var SS_ID = '1N54S4CVlfdHMS9HAhKfPDyWj61lfSBjTRasfbmHmtTs';
  var pool  = [];

  function processRows(rows, prefix) {
    rows.forEach(function(row, idx) {
      var q      = String(row['問題文・指示']||row['問題文']||'').trim();
      var ans    = examNormalizeAnswer(row['正解番号']);
      var ch     = examBuildChoices(row, ['選択肢1','選択肢2','選択肢3','選択肢4']);
      var script = examParseScript(row['スクリプト']);
      var imgId  = String(row['選択肢画像']||'').trim();
      if (!script||script.length===0||ans===0) return;
      pool.push({
        id: prefix+(idx+1), section:'listening',
        type: imgId?'image_choice':(ch.length>=2?'4choice':'no_choice'),
        question:q, choices:ch, answer:ans, script:script,
        image_choice: imgId?('https://drive.google.com/thumbnail?id='+imgId+'&sz=w400'):null
      });
    });
  }
  processRows(examGetSheet(SS_ID,'まとめ問題'), 'listening_m_');
  processRows(examGetSheet(SS_ID,'練習問題'),   'listening_p_');

  var picked = examSlicePage(pool, round).slice(0, limit);
  return { status:'success', category:'listening', total:picked.length, questions:picked };
}

function examParseScript(val) {
  if (!val) return null;
  var s = String(val).trim();
  if (!s) return null;
  try { var p=JSON.parse(s); if (Array.isArray(p)) return p; } catch(e) {}
  return [{ speaker:'ナレーター', text:s }];
}

// ── 間違いノート書き出し ───────────────────────────────────
var MISTAKES_SS_ID = '1AOyD6KXDRT_oIab8-CeuCKn9EqtW_42LLr89J1s7WGs';

function saveMistakes(body) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return { status: 'error', message: 'Lock timeout: ' + e.toString() };
  }
  try {
    var userName = String(body.userName||'\u4e0d\u660e').trim();
    var round    = parseInt(body.round||'1', 10);
    var mistakes = body.mistakes||[];
    if (mistakes.length===0) {
      return { status:'success', message:'\u9593\u9055\u3044\u306a\u3057', sheetName:'', count:0 };
    }

    var ss = SpreadsheetApp.openById(MISTAKES_SS_ID);
    var sheetName = userName+'_\u7b2c'+round+'\u56de_\u9593\u9055\u3044';
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      sheet.clear();
    } else {
      sheet = ss.insertSheet(sheetName);
    }

    var headers = ['\u5206\u91ce','\u554f\u984c\u756a\u53f7','\u554f\u984c\u6587','\u9078\u629e\u80a21','\u9078\u629e\u80a22','\u9078\u629e\u80a23','\u9078\u629e\u80a24','\u6b63\u89e3','\u81ea\u5206\u306e\u56de\u7b54','\u53d7\u9a13\u65e5\u6642'];
    var colorMap = { kanji:'#FEF3C7', vocab:'#DCFCE7', grammar:'#EDE9FE', reading:'#FEE2E2', listening:'#DBEAFE' };
    var labelMap = { kanji:'\u6f22\u5b57', vocab:'\u8a9e\u5f59', grammar:'\u6587\u6cd5', reading:'\u8aad\u89e3', listening:'\u8074\u89e3' };
    var now = Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy/MM/dd HH:mm');
    var headerColor = '#1e3a5f';

    var rows = [headers];
    var bgColors = [Array(headers.length).fill(headerColor)];
    mistakes.forEach(function(m) {
      var choices = m.choices||[];
      var correct = choices[m.correctIndex]||'';
      var yours   = (m.userIndex!==null&&m.userIndex!==undefined)?(choices[m.userIndex]||'\uff08\u672a\u56de\u7b54\uff09'):'\uff08\u672a\u56de\u7b54\uff09';
      var color = colorMap[m.section]||'#ffffff';
      rows.push([
        labelMap[m.section]||m.section||'',
        '\u7b2c'+m.questionNum+'\u554f',
        m.question||'',
        choices[0]||'', choices[1]||'', choices[2]||'', choices[3]||'',
        correct, yours, now
      ]);
      bgColors.push(Array(headers.length).fill(color));
    });

    var numRows = rows.length;
    var numCols = headers.length;
    var range = sheet.getRange(1, 1, numRows, numCols);
    range.setValues(rows);
    range.setBackgrounds(bgColors);
    sheet.getRange(1, 1, 1, numCols).setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, numCols);

    return { status:'success', sheetName:sheetName, count:mistakes.length };
  } finally {
    lock.releaseLock();
  }
}

function testGrammarSort() {
  var result = examGetGrammar(10, 1);
  result.questions.forEach(function(q, i) {
    Logger.log((i+1) + ': type=' + q.type + ' q=' + (q.question||'').substring(0,30));
  });
  Logger.log('total=' + result.total);
}
