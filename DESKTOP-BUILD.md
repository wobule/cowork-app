# PDF 編輯器 — 桌面版打包指南

## 快速打包

### 前置需求
- Node.js 18+
- npm

### 步驟

```bash
# 1. 安裝依賴
npm install

# 2. 打包桌面應用（Windows 會同時產出安裝版 + 免安裝版）
npm run desktop:build
```

## Windows 產出（不需要管理員權限）

打包後 `dist-electron/` 資料夾會有兩個版本：

| 版本 | 檔案 | 說明 |
|------|------|------|
| **安裝版** | `PDF 編輯器 Setup 1.0.0.exe` | 雙擊安裝到使用者目錄（`AppData`），自動建桌面捷徑 |
| **免安裝版** | `PDF編輯器-免安裝版-1.0.0.exe` | 雙擊直接執行，不需安裝，適合放 USB 或網路磁碟 |

### 權限說明

- **不需要管理員權限** — 安裝版安裝到 `C:\Users\{使用者}\AppData\Local\Programs\`，這是使用者自己的目錄
- **不需要 IT 協助** — 員工可以自行安裝或執行
- **免安裝版零權限** — 直接雙擊 `.exe` 就能開，什麼都不用裝

### 推薦部署方式（公司內多台電腦）

**最簡單：用免安裝版**
1. 把 `PDF編輯器-免安裝版-1.0.0.exe` 放到公司共用資料夾（網路磁碟）
2. 告訴員工：「到 `\\server\共用\` 裡面雙擊 PDF編輯器 就能用」
3. 或者各自複製到桌面，雙擊就能打開

**正式一點：用安裝版**
1. 把 `PDF 編輯器 Setup 1.0.0.exe` 發給員工
2. 員工雙擊安裝 → 桌面出現捷徑 → 以後雙擊捷徑就能開
3. 安裝過程不會跳出「需要管理員權限」的提示

## 其他系統

| 系統 | 產出檔案 | 使用方式 |
|------|---------|---------|
| Mac | `PDF 編輯器-1.0.0.dmg` | 雙擊 → 拖到 Applications |
| Linux | `PDF 編輯器-1.0.0.AppImage` | 給執行權限 → 雙擊 |

## 開發模式測試

```bash
# 先建置 Next.js，再用 Electron 開啟
npm run electron:dev
```

## 常見問題

**Q: 打包出來的檔案很大？**
A: 包含完整 Node.js runtime + 所有依賴，約 200-300MB。這是 Electron 應用的正常大小（VS Code、Slack 也用同樣技術）。

**Q: 可以只打包 Windows 版嗎？**
A: `npx electron-builder --win`

**Q: 可以指定打包 Mac 或 Linux 嗎？**
A: `npx electron-builder --mac` 或 `npx electron-builder --linux`

**Q: 員工的電腦會被防毒軟體擋嗎？**
A: 如果公司有嚴格的防毒政策，可能需要 IT 將此應用加入白名單。使用程式碼簽章（code signing）可以避免這個問題。

**Q: 怎麼更新版本？**
A: 重新打包，把新的 `.exe` 發給員工覆蓋舊的即可。
