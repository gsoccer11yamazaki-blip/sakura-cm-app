/**
 * Build Bridge GAS API — 聴解図版画像プロキシ
 *
 * 既存の Build Bridge GAS プロジェクトにこのファイルを追加し、
 * handleListening の先頭に image 分岐を入れてください。
 */

/**
 * Drive 上の聴解図版をプロキシ配信する
 * ?category=listening&type=image&id=FILE_ID&lang=ja+en
 *
 * @param {string} fileId
 * @returns {GoogleAppsScript.Content.TextOutput|GoogleAppsScript.Content.BinaryOutput}
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
      .setHeader('Cache-Control', 'public, max-age=3600');
  } catch (err) {
    return jsonError('Image not found: ' + fileId);
  }
}

/**
 * handleListening に追加する分岐（既存関数の先頭へ）
 *
 * function handleListening(type, options, e) {
 *   if (type === 'image') {
 *     var fileId = (options && options.id) || (e && e.parameter && e.parameter.id);
 *     return serveListeningImage(fileId);
 *   }
 *   switch (type) {
 *     case 'summary': ...
 *     case 'drill': ...
 *   }
 * }
 */
