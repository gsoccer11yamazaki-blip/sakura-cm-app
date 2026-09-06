# 読解モジュール — GAS セットアップ手順

## 1. Excel → Google Sheets

```powershell
cd "C:\Users\R5shi\Desktop\試作\N３.0611\tools"
pip install openpyxl google-auth google-auth-oauthlib google-api-python-client
python import_reading_to_sheets.py --dry-run
python import_reading_to_sheets.py --create
```

`reading_config.json` に `spreadsheet_id` が保存されます。

## 2. GAS プロジェクトへ追加

既存の Build Bridge GAS プロジェクトに `Reading.gs` を追加し、以下を既存ファイルに追記します。

### Config（SPREADSHEET_IDS / SHEET_NAMES）

```javascript
SPREADSHEET_IDS.reading = '1hN5Pk7DmrDDEQOPeEZde-AvK28BxGxCOdqYf9WCU7XM';

SHEET_NAMES.reading = {
  practice: '読解問題',
  exam: '実戦問題'
};
```

### doGet ルーター

```javascript
case 'reading':
  result = handleReading(type, options);
  break;
```

## 3. API エンドポイント

| 用途 | type | 例 |
|------|------|-----|
| 読解練習 | `list` | `category=reading&type=list&lang=ja+en&limit=500` |
| 実戦問題 | `exam` | `category=reading&type=exam&lang=ja+en&limit=200` |

## 4. デプロイ

GAS を再デプロイ後、`reading.html` をブラウザで開き、Network タブで API レスポンスを確認してください。

## 5. ファイル一覧

| ファイル | 役割 |
|----------|------|
| `reading.html` | 読解アプリ本体 |
| `tools/import_reading_to_sheets.py` | Excel インポート |
| `Downloads/Reading.gs` | GAS バックエンド |
