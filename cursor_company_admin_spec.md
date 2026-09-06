# admin-company.html 修正指示書（Cursor用）

## 概要
`admin-company.html` の「社員一覧」タブに、**学習者（learner/user）アカウントの新規作成機能**を追加してください。

---

## 追加する機能

### 社員一覧タブに「社員を追加」ボタンを追加
- 社員一覧の右上に緑色の「＋ 社員を追加」ボタンを設置
- クリックするとモーダルが開く

---

## モーダルの内容（新規社員登録フォーム）

```
[ 社員を追加 ]（モーダルタイトル）

メールアドレス（必須）: ________________
表示名（必須）:        ________________
仮パスワード（必須）:  ________________
                      ※ 8文字以上。初回ログイン後に変更を促す

[ キャンセル ]  [ 登録する ]
```

---

## 実装方法

### ① Supabase で auth ユーザーを作成
```javascript
const { data, error } = await sb.auth.signUp({
  email: email,
  password: password,
  options: {
    data: { display_name: displayName }
  }
});
if (error) throw error;
const newUserId = data.user.id;
```

### ② bb_users に learner として登録
```javascript
const { error: insertError } = await sb.from('bb_users').insert({
  id: newUserId,
  display_name: displayName,
  role: 'user',
  company_id: currentUser.company_id,  // ← ログイン中の company_admin の会社
  language: 'ja'
});
if (insertError) throw insertError;
```

### ③ 成功後
- トースト通知（緑）：「社員を登録しました」
- モーダルを閉じる
- 社員一覧を再読み込み（loadEmployees()を再呼び出し）

---

## エラーハンドリング

| エラー内容 | 表示メッセージ |
|-----------|--------------|
| メール重複 | 「このメールアドレスはすでに登録されています」 |
| パスワード短すぎ | 「パスワードは8文字以上で入力してください」 |
| その他 | 「登録に失敗しました：〇〇」 |

---

## 注意事項

- `role` は必ず `'user'`（learner）に固定。変更不可。
- `company_id` は必ずログイン中の company_admin の会社に固定。変更不可。
- 登録後、Supabase から確認メールが送られる場合があるが、現状は無視してOK。
- 既存のデザイン・スタイル（ダークテーマ、モーダルスタイル）に合わせること。

---

## 既存ファイルの場所
- `/Users/e-works/Desktop/N３.0611/admin-company.html`

---

## Supabase接続情報（既存コードから流用）
```javascript
const SUPABASE_URL = 'https://ztedlnyeeodvdyxzqpiz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WFtrwdK97JIawHiQZyLELg_h08mZifP';
```
