/**
 * Build Bridge GAS API
 * Code.gs - メインエントリ・ルーティング
 */

var SPREADSHEET_IDS = {
  kanji:     '15oThRQqHNwIV_AGdeKMtJ8--Gszsqu-8M0wiBmm26Is',
  vocab:     '1YKtlLyY6LquS2yB61a2jMxQDK67xBw6GbWfBeo-YVP4',
  grammar:   '1gyk3TwvWuSzzHpWYphDZ7TzO5Sr8vvVlBJE62i0EqhE',
  reading: '1hN5Pk7DmrDDEQOPeEZde-AvK28BxGxCOdqYf9WCU7XM',
  listening: '1N54S4CVlfdHMS9HAhKfPDyWj61lfSBjTRasfbmHmtTs'
};

var SHEET_NAMES = {
  kanji: {
    list:          '漢字',
    drill_meaning: '練習問題：意味',
    drill_reading: '練習問題：読み方',
    drill_kanji:   '練習問題：漢字',
    exam:          '実戦問題'
  },
  vocab: {
    list: '語彙リスト',
    exam: '実戦問題'
  },
  grammar: {
    list:  '①文法項目一覧',
    drill: '②練習問題',
    exam:  '③実戦問題'
  },
  reading: {
    drill: '読解問題',
    exam:  '実戦問題'
  },
  listening: {
    summary: 'まとめ問題',
    drill:   '練習問題'
  }
};

function doGet(e) {
  var params = e.parameter;
  var respond = function(data) {
    var output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  };
  try {
    // ── action 早期ルーティング ──
    if (params.action === 'exam' || params.action === 'save_mistakes') return handleExam(params);
    if (params.action === 'vocab_list') {
      var vocabApiKey = params.apiKey || params.api_key || '';
      var vocabAuth = checkApiKey(vocabApiKey);
      if (!vocabAuth.ok) return respond({ status: 'error', code: 401, message: 'Invalid API key' });
      var options = {
        apiKey: vocabApiKey,
        lang: params.lang || 'ja+en',
        week: params.week ? parseInt(params.week, 10) : null,
        day: params.day ? parseInt(params.day, 10) : null,
        section: params.section ? parseInt(params.section, 10) : null,
        offset: params.offset ? parseInt(params.offset, 10) : 0,
        limit: params.limit ? parseInt(params.limit, 10) : 99999
      };
      var data = handleVocab('list', options);
      return respond({
        status: 'success',
        count: data.total,
        words: data.rows
      });
    }
    var authResult = checkApiKey(params.api_key);
    if (!authResult.ok) return respond({ status: 'error', code: 401, message: 'Invalid API key' });
    var category = params.category;
    var type = params.type;
    var lang = params.lang;
    if (!category || !type || !lang) return respond({ status: 'error', code: 400, message: 'Missing required parameters: category, type, lang' });
    var validLangs = ['ja+en', 'ja+vi'];
    if (validLangs.indexOf(lang) === -1) return respond({ status: 'error', code: 400, message: 'Invalid lang. Use: ja+en or ja+vi' });
    if (!SHEET_NAMES[category]) return respond({ status: 'error', code: 400, message: 'Invalid category: ' + category });
    if (!SHEET_NAMES[category][type]) return respond({ status: 'error', code: 400, message: 'Invalid type "' + type + '" for category "' + category + '"' });
    var options = {
      lang: lang,
      week: params.week ? parseInt(params.week) : null,
      day: params.day ? parseInt(params.day) : null,
      section: params.section ? parseInt(params.section) : null,
      limit: params.limit ? parseInt(params.limit) : 100,
      offset: params.offset ? parseInt(params.offset) : 0
    };
    var data;
    switch (category) {
      case 'vocab':     data = handleVocab(type, options);     break;
      case 'kanji':     data = handleKanji(type, options);     break;
      case 'grammar':   data = handleGrammar(type, options);   break;
      case 'reading':   data = handleReading(type, options);   break;
      case 'listening': data = handleListening(type, options); break;
      default: return respond({ status: 'error', code: 400, message: 'Unknown category' });
    }
    return respond({ status: 'success', category: category, type: type, lang: lang, level: 'n3', total: data.total, offset: options.offset, limit: options.limit, data: data.rows });
  } catch (err) {
    return respond({ status: 'error', code: 500, message: err.message });
  }
}
function doPost(e) {
  var respond = function(data) {
    var output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  };
  try {
    var body = JSON.parse(e.postData.contents);
    var apiKey = body.apiKey || '';
    if (apiKey !== 'bb_prod_2026_xK9mN3vQ7rL8wP5j') {
      return respond({ status: 'error', message: 'Invalid API key' });
    }
    if (body.action === 'save_mistakes') {
      return respond(saveMistakes(body));
    }
    return respond({ status: 'error', message: 'Unknown action' });
  } catch(err) {
    return respond({ status: 'error', message: err.toString() });
  }
}
