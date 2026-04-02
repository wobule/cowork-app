# PDF 編輯器 — 桌面版打包指南

## 快速打包

### 前置需求
- Node.js 18+
- npm

### 步驟

```bash
# 1. 安裝依賴
npm install

# 2. 打包桌面應用
npm run desktop:build
```

打包完成後，安裝檔會在 `dist-electron/` 資料夾中：
- **Windows**: `dist-electron/PDF 編輯器 Setup 1.0.0.exe`
- **Mac**: `dist-electron/PDF 編輯器-1.0.0.dmg`
- **Linux**: `dist-electron/PDF 編輯器-1.0.0.AppImage`

### 部署到多台電腦

只需將產出的安裝檔（`.exe` / `.dmg` / `.AppImage`）複製到目標電腦：

| 系統 | 操作 |
|------|------|
| Windows | 雙擊 `.exe` 安裝，桌面會出現捷徑 |
| Mac | 雙擊 `.dmg`，拖到 Applications 資料夾 |
| Linux | 給 `.AppImage` 執行權限後雙擊即可 |

### 開發模式測試

```bash
# 先建置 Next.js，再用 Electron 開啟
npm run electron:dev
```

## 常見問題

**Q: 打包出來的檔案很大？**
A: 首次打包含完整 Node.js runtime + 所有依賴，約 200-300MB。這是 Electron 應用的正常大小。

**Q: 可以只打包 Windows 版嗎？**
A: 可以，執行 `npx electron-builder --win` 只打包 Windows 版。

**Q: 可以指定打包 Mac 或 Linux 嗎？**
A: `npx electron-builder --mac` 或 `npx electron-builder --linux`。
