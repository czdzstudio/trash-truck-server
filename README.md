# trash-truck-server

垃圾車即時查詢 App 的靜態資料整理 repo。

不架設動態 server：GitHub Actions 排程腳本定期抓取各縣市政府開放資料、整理成統一 JSON schema，push 到本 repo，App 直接 fetch `raw.githubusercontent.com` 的靜態 JSON。

規劃文件（分級策略、schema 設計、開放資料查證結果）放在另一個私有 repo：[trash-truck-docs](https://github.com/czdzstudio/trash-truck-docs)。

## 目錄結構

```
src/
├── cities/          # 每個縣市各一支獨立腳本（fetch + 正規化該縣市資料）
│   ├── ntpc.js       # 新北市（Tier 1，即時 GPS）
│   ├── taichung.js   # 台中市（Tier 1，即時 GPS，API 網址為 workaround，見檔案內註解）
│   ├── kcg.js         # 高雄市（Tier 1，即時 GPS）
│   └── taipei.js     # 台北市（Tier 2，固定班表）
├── lib/             # 共用工具（HTTP 抓取、CSV 解析、時間格式轉換、status.json 讀寫）
└── sync.js          # 排程主程式：依 CLI 參數呼叫對應縣市模組，並更新 data/status.json

data/
├── realtime/{ntpc,taichung,kcg}.json
├── schedule/taipei.json
└── status.json      # 每縣市的同步狀態（成功/失敗時間、資料筆數、目前資料時間）

docs/
└── index.html       # 資料健康度頁面（GitHub Pages 靜態頁，讀 data/status.json）

.github/workflows/
└── sync-{city}.yml  # 每個縣市各自獨立排程，頻率對齊該縣市 API 本身的更新頻率
```

新增一個縣市的做法：在 `src/cities/` 新增一支模組（export `cityCode`、`meta`、`async sync()`），在 `src/sync.js` 的 `CITIES` 裡註冊，再加一份對應的 workflow yml。

## 本機執行

不需要安裝任何相依套件（純用 Node.js 內建 `fetch`）。

```bash
node src/sync.js          # 同步所有縣市
node src/sync.js ntpc     # 只同步指定縣市
```

## 資料健康度頁面

`docs/index.html` 透過 GitHub Pages 發布，顯示每個縣市的分級、最後同步時間、目前資料時間、失敗紀錄。需要在 repo Settings → Pages 設定 Source 為 `main`/`master` 分支的 `/docs` 資料夾。
