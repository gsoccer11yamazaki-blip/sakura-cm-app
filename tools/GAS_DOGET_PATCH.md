# doGet 修正ガイド（聴解画像プロキシ）

`Listening.gs` だけでなく、**doGet（またはルーター）側にも2点の修正**が必要です。

---

## なぜ doGet の修正が必要か

| リクエスト | 返すべきもの |
|-----------|-------------|
| `type=summary` / `drill` | JSON（`jsonSuccess` でラップ） |
| `type=image` | **画像バイナリ**（PNG/JPEG をそのまま返す） |

`type=image` を通常ルートに流すと、

1. 「image は無効な type」エラーになる、または
2. 画像を JSON に包んでしまい、ブラウザで表示できない

そのため **doGet の早い段階で分岐**します。

---

## 修正① doGet の先頭付近に追加

既存の `doGet(e)` の中で、**APIキー検証の後・通常ルートの前**に次を入れます。

```javascript
function doGet(e) {
  try {
    var params = e.parameter || {};

    // 既存: APIキー検証
    validateApiKey(params.api_key);

    var category = params.category;
    var type = params.type;

    var options = buildOptions(params);  // 既存の options 組み立て
    options.id = params.id;              // ★ 画像用 fileId を追加

    // ★★★ ここを追加 ★★★
    if (category === 'listening' && type === 'image') {
      return handleListening('image', options, e);
    }

    // 既存: 通常の JSON API
    var result = routeCategory(category, type, options, e);
    return jsonSuccess(result, category, type, options);

  } catch (err) {
    return jsonError(err.message);
  }
}
```

`buildOptions` という関数名でなくても構いません。  
`options` を作っている箇所に `options.id = params.id;` を足してください。

---

## 修正② listening ルートで `e` を渡す

`routeCategory` や `switch (category)` の中にある listening 分岐を、次のようにします。

```javascript
// 変更前
case 'listening':
  result = handleListening(type, options);
  break;

// 変更後
case 'listening':
  result = handleListening(type, options, e);
  break;
```

第3引数 `e` がないと、`handleListening` 内で `e.parameter.id` が取れません。

---

## 修正③ type のホワイトリスト（ある場合）

もし次のような **許可 type リスト** がある場合:

```javascript
var ALLOWED_TYPES = {
  listening: ['summary', 'drill'],  // ← image がない
  reading: ['list', 'exam'],
  // ...
};
```

`listening` に `'image'` を追加します。

```javascript
listening: ['summary', 'drill', 'image'],
```

ただし **修正①の早期 return を入れていれば**、ホワイトリストを通る前に image リクエストが処理されるので、①があれば③は必須ではありません。  
現状 `Invalid type "image" for category "listening"` が出ている場合は、①か③のどちらか（または両方）が必要です。

---

## 完成イメージ（最小構成）

```javascript
function doGet(e) {
  try {
    var params = e.parameter || {};
    validateApiKey(params.api_key);

    var category = params.category;
    var type = params.type;
    var options = {
      lang: params.lang || 'ja+en',
      limit: parseInt(params.limit, 10) || 100,
      offset: parseInt(params.offset, 10) || 0,
      id: params.id || null
    };

    // 聴解画像は JSON ではなくバイナリを直接返す
    if (category === 'listening' && type === 'image') {
      return handleListening('image', options, e);
    }

    var data;
    switch (category) {
      case 'listening':
        data = handleListening(type, options, e);
        break;
      case 'reading':
        data = handleReading(type, options);
        break;
      case 'vocab':
        data = handleVocab(type, options);
        break;
      case 'grammar':
        data = handleGrammar(type, options);
        break;
      case 'kanji':
        data = handleKanji(type, options);
        break;
      default:
        throw new Error('Invalid category: ' + category);
    }

    return jsonSuccess({
      category: category,
      type: type,
      lang: options.lang,
      total: data.total,
      offset: data.offset,
      limit: data.limit,
      data: data.rows
    });

  } catch (err) {
    return jsonError(err.message);
  }
}
```

実際の `jsonSuccess` の引数や戻り値の形は、既存コードに合わせてください。

---

## 動作確認

### NG（今の状態）

```
?category=listening&type=image&id=17_Y6WXtp_QWpxYLKjvhgdcWIwqhbtWI4&api_key=...
→ {"status":"error","message":"Invalid type \"image\" for category \"listening\""}
```

### OK（修正後）

同じ URL で **画像（PNG/JPEG）がブラウザに表示される**

### 通常 API も確認

```
?category=listening&type=summary&lang=ja+en&limit=1&api_key=...
→ JSON が返る（今までどおり）
```

---

## チェックリスト

- [ ] `Listening.gs` を `tools/gas/Listening.gs` で置き換え
- [ ] `doGet` に `listening + image` の早期 return を追加
- [ ] `handleListening(type, options, e)` の第3引数 `e` を渡す
- [ ] `options.id = params.id` を設定
- [ ] GAS を再デプロイ（アクセス: 全員）
- [ ] 画像 URL で PNG が表示されることを確認
