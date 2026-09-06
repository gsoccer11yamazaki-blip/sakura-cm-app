#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SPREADSHEET_ID = "1N54S4CVlfdHMS9HAhKfPDyWj61lfSBjTRasfbmHmtTs"
TOKEN = Path(r"C:\Users\R5shi\Downloads\n3_listening_clip\token.json")

creds = Credentials.from_authorized_user_file(
    str(TOKEN), ["https://www.googleapis.com/auth/spreadsheets.readonly"]
)
if creds.expired and creds.refresh_token:
    creds.refresh(Request())

svc = build("sheets", "v4", credentials=creds)

for sheet in ("まとめ問題", "練習問題"):
    rows = (
        svc.spreadsheets()
        .values()
        .get(spreadsheetId=SPREADSHEET_ID, range=f"'{sheet}'!A1:N200")
        .execute()
        .get("values", [])
    )
    hdr = rows[0]
    img_idx = hdr.index("選択肢画像")
    print(f"=== {sheet} ===")
    n = 0
    for row in rows[1:]:
        if len(row) > img_idx and row[img_idx].strip():
            print(row[img_idx][:200])
            n += 1
            if n >= 4:
                break
