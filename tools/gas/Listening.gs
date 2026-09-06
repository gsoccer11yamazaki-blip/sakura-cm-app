/**
 * Build Bridge GAS API
 * Listening.gs - 聴解データ取得・画像プロキシ
 */

/**
 * 聴解カテゴリのルーター
 *
 * @param {string} type - 'summary' | 'drill' | 'image'
 * @param {Object} options
 * @param {Object} e - doGet のイベント（image 用 id 取得）
 */
function handleListening(type, options, e) {
  if (type === 'image') {
    var fileId = (options && options.id) || (e && e.parameter && e.parameter.id);
    return serveListeningImage(fileId);
  }

  switch (type) {
    case 'summary': return getListeningSummary(options);
    case 'drill': return getListeningDrill(options);
    default: throw new Error('Invalid type for listening: ' + type);
  }
}

/**
 * Drive 上の聴解図版をプロキシ配信する
 * ?category=listening&type=image&id=FILE_ID&lang=ja+en
 *
 * @param {string} fileId
 */
function serveListeningImage(fileId) {
  if (!fileId) {
    return jsonError('Missing image id');
  }

  try {
    var file = DriveApp.getFileById(String(fileId).trim());
    var blob = file.getBlob();
    return ContentService
      .create(blob)
      .setMimeType(blob.getContentType())
      .setHeader('Cache-Control', 'public, max-age=3600')
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (err) {
    return jsonError('Image not found: ' + fileId);
  }
}

/**
 * 選択肢画像列の値を正規化（JSON配列 / URL / ファイルID）
 *
 * @param {string} raw
 * @returns {string[]}
 */
function parseChoiceImages(raw) {
  if (!raw) return [];

  var str = String(raw).trim();
  if (!str) return [];

  if (str.charAt(0) === '[') {
    try {
      var parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map(function(item) { return String(item).trim(); }).filter(Boolean);
      }
    } catch (err) { /* fall through */ }
  }

  return [str];
}

/**
 * 聴解行から image_file_id を組み立てる
 * 選択肢画像列が JSON 配列の場合は配列で返す
 *
 * @param {Object} obj
 * @returns {string|string[]|null}
 */
function getListeningImageField(obj) {
  var raw = nullIfEmpty(obj['選択肢画像']) || nullIfEmpty(obj['画像ファイルID']) || nullIfEmpty(obj['image_file_id']);
  if (!raw) return null;

  var images = parseChoiceImages(raw);
  if (images.length === 1) return images[0];
  if (images.length > 1) return images;
  return null;
}

function getListeningSummary(options) {
  var sheetData = getSheetData(SPREADSHEET_IDS.listening, SHEET_NAMES.listening.summary);
  var headers = sheetData.headers;
  var allRows = [];
  var currentMajor = '';
  var currentMid = '';
  var currentChapter = null;

  sheetData.rows.forEach(function(row) {
    var obj = rowToObject(headers, row);
    if (!obj['問題文・指示'] && !obj['問題タイプ']) return;

    var chapter = toInt(obj['章番号']);
    if (chapter !== null) currentChapter = chapter;

    var major = nullIfEmpty(obj['大問']);
    if (major) currentMajor = major;

    var mid = nullIfEmpty(obj['中問']);
    if (mid) currentMid = mid;

    var choices = [
      nullIfEmpty(obj['選択肢1']),
      nullIfEmpty(obj['選択肢2']),
      nullIfEmpty(obj['選択肢3']),
      nullIfEmpty(obj['選択肢4'])
    ].filter(function(c) { return c !== null; });

    allRows.push({
      chapter: currentChapter,
      question_major: nullIfEmpty(currentMajor),
      question_mid: nullIfEmpty(currentMid),
      question_minor: nullIfEmpty(obj['小問']),
      question_type: nullIfEmpty(obj['問題タイプ']),
      instruction: nullIfEmpty(obj['問題文・指示']),
      choices: choices,
      answer: toInt(obj['正解番号']),
      script: parseJson(obj['スクリプト']),
      audio_url: nullIfEmpty(obj['audio_url']) || null,
      image_file_id: getListeningImageField(obj)
    });
  });

  return paginate(allRows, options.offset, options.limit);
}

function getListeningDrill(options) {
  var sheetData = getSheetData(SPREADSHEET_IDS.listening, SHEET_NAMES.listening.drill);
  var headers = sheetData.headers;
  var allRows = [];

  sheetData.rows.forEach(function(row) {
    var obj = rowToObject(headers, row);
    if (!obj['問題文・指示'] && !obj['問題文']) return;

    var choices = [
      nullIfEmpty(obj['選択肢1']),
      nullIfEmpty(obj['選択肢2']),
      nullIfEmpty(obj['選択肢3']),
      nullIfEmpty(obj['選択肢4'])
    ].filter(function(c) { return c !== null; });

    allRows.push({
      chapter: toInt(obj['章番号']),
      section: toInt(obj['節番号']),
      section_title: nullIfEmpty(obj['節タイトル']),
      question_no: nullIfEmpty(obj['問題番号']),
      question_minor: nullIfEmpty(obj['小問番号']),
      question_type: nullIfEmpty(obj['問題タイプ']),
      instruction: nullIfEmpty(obj['問題文・指示'] || obj['問題文']),
      choices: choices,
      answer: toInt(obj['正解番号']),
      script: parseJson(obj['スクリプト']),
      audio_url: nullIfEmpty(obj['audio_url']) || null,
      image_file_id: getListeningImageField(obj)
    });
  });

  return paginate(allRows, options.offset, options.limit);
}
