# trash-truck-server

垃圾車即時查詢 App 的靜態資料整理 repo。

不架設動態 server：GitHub Actions 排程腳本定期抓取各縣市政府開放資料、整理成統一 JSON schema，push 到本 repo，App 直接 fetch `raw.githubusercontent.com` 的靜態 JSON。

詳見主專案規劃文件：`docs/PROJECT_PLAN.md`、`docs/GOV_DATA_SOURCES.md`（目前存放於本機工作目錄的 `trash-truck/docs/`，尚未加入任一 repo）。
