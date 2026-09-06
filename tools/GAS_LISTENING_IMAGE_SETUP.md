# 聴解図版 — GAS セットアップ

## 変更内容

`tools/gas/Listening.gs` を既存の `Listening.gs` と**丸ごと置き換え**てください。

主な追加点:

1. **`handleListening`** — `type === 'image'` で Drive 画像をプロキシ配信
2. **`getListeningImageField`** — `選択肢画像` 列の JSON 配列（4枚）を正しくパース
3. **`serveListeningImage`** — ブラウザから画像を返す

## doGet 側の確認

`handleListening` の第3引数 `e` を渡してください。

```javascript
case 'listening':
  result = handleListening(type, options, e);
  break;
```

`type=image` のときは JSON ではなく**画像バイナリ**を返すため、doGet で listening/image の場合は `handleListening` の戻り値をそのまま `return` する必要があります。

例:

```javascript
function doGet(e) {
  // ... 認証・パラメータ解析 ...
  var category = e.parameter.category;
  var type = e.parameter.type;

  if (category === 'listening' && type === 'image') {
    return handleListening('image', options, e);
  }

  // 通常の JSON API
  var result = routeCategory(category, type, options, e);
  return jsonSuccess(result);
}
```

## 再デプロイ

1. GAS エディタで保存
2. **デプロイ** → **新しいデプロイ**（または既存を更新）
3. 実行ユーザー: **自分** / アクセス: **全員**

## 動作確認

```
https://script.google.com/macros/s/【デプロイID】/exec?api_key=bb_prod_2026_xK9mN3vQ7rL8wP5j&category=listening&type=image&id=17_Y6WXtp_QWpxYLKjvhgdcWIwqhbtWI4&lang=ja+en
```

PNG/JPEG が表示されれば OK。JSON エラーなら未反映です。
