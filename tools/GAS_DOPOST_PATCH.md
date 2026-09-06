# 間違いノート保存 — GAS デプロイ手順

`exam.html` は CORS 回避のため **GET** で `action=save_mistakes` を送ります（POST は不要）。

## Code.gs — doGet にルート追加（必須）

`Exam.gs` の `handleExam` に `save_mistakes` 分岐を入れたうえで、**doGet が `action=save_mistakes` を handleExam に渡す**必要があります。

既存で `action=exam` のとき `handleExam(e.parameter)` を呼んでいるなら、条件を広げます。

```javascript
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action;

    // 模擬試験 API + 間違いノート保存（GET）
    if (action === 'exam' || action === 'save_mistakes') {
      return jsonResponse(handleExam(params));
    }

    // ... 以下、既存の listening / reading など ...
  } catch (err) {
    return jsonError(err.message);
  }
}
```

`jsonResponse` / `jsonError` は既存 doGet と同じ関数を使ってください。

## doPost（任意・旧方式）

POST で送る旧 `exam.html` 用。GET 方式に切り替え済みなら **doPost は不要**です。

既存の `doGet` と同じファイル（Code.gs）に追記する場合の例です。
`jsonResponse` は既存の doGet で使っている関数をそのまま利用します。

```javascript
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var apiKey = body.apiKey || '';
    if (apiKey !== 'bb_prod_2026_xK9mN3vQ7rL8wP5j') {
      return jsonResponse({ status: 'error', message: 'Invalid API key' });
    }
    if (body.action === 'save_mistakes') {
      return jsonResponse(saveMistakes(body));
    }
    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch(err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}
```

## デプロイ

1. `Exam.gs` に `saveMistakes` と `MISTAKES_SS_ID` が入っていることを確認
2. Code.gs に上記 `doPost` を追加
3. **新しいデプロイ**（ウェブアプリ）を作成または更新
   - 実行ユーザー: 自分
   - アクセス: 全員
4. GAS エディタで `saveMistakes` を一度手動実行し、スプレッドシートへのアクセス権限を付与

## 間違いノート用スプレッドシート

- ID: `1AOyD6KXDRT_oIab8-CeuCKn9EqtW_42LLr89J1s7WGs`
- シート名例: `山嵜_第1回_間違い`