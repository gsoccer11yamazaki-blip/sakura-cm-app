function handleVocab(type, options) {
  switch (type) {
    case 'list': return getVocabList(options);
    case 'exam': return getVocabExam(options);
    default: throw new Error('Invalid type for vocab: ' + type);
  }
}
function getVocabList(options) {
  var sheetData = getSheetData(SPREADSHEET_IDS.vocab, SHEET_NAMES.vocab.list);
  var headers = sheetData.headers;
  var langCode = getLangCode(options.lang);
  var meaningColMap = { 'en': '意味（英）', 'vi': '意味（越）' };
  var meaningCol = meaningColMap[langCode];
  var allRows = [];
  sheetData.rows.forEach(function(row) {
    var obj = rowToObject(headers, row);
    if (!obj['語彙']) return;
    if (options.week !== null) { var weekStr = '第' + options.week + '週'; if (obj['週'] !== weekStr) return; }
    if (options.day !== null) { var dayStr = options.day + '日目'; if (obj['日目'] !== dayStr) return; }
    var meaning = {};
    meaning[langCode] = nullIfEmpty(obj[meaningCol]);
    allRows.push({
      week: nullIfEmpty(obj['週']),
      day: nullIfEmpty(obj['日目']),
      word: nullIfEmpty(obj['語彙']),
      reading: nullIfEmpty(obj['読み']),
      meaning: meaning,
      example: nullIfEmpty(obj['例文'])
    });
  });
  return paginate(allRows, options.offset, options.limit);
}
function getVocabExam(options) {
  var sheetData = getSheetData(SPREADSHEET_IDS.vocab, SHEET_NAMES.vocab.exam);
  var headers = sheetData.headers;
  var allRows = [];
  sheetData.rows.forEach(function(row) {
    var obj = rowToObject(headers, row);
    if (!obj['問題文']) return;
    if (options.week !== null) { var weekStr = '第' + options.week + '週'; if (obj['週'] !== weekStr) return; }
    var choices = [nullIfEmpty(obj['選択肢1']), nullIfEmpty(obj['選択肢2']), nullIfEmpty(obj['選択肢3']), nullIfEmpty(obj['選択肢4'])].filter(function(c) { return c !== null; });
    allRows.push({ week: nullIfEmpty(obj['週']), question_no: nullIfEmpty(obj['問題番号']), question: nullIfEmpty(obj['問題文']), choices: choices, answer: toInt(obj['正解']) });
  });
  return paginate(allRows, options.offset, options.limit);
}
