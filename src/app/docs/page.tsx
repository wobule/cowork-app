'use client';

import { useState, useMemo } from 'react';

interface DocItem {
  id: number;
  filename: string;
  category: string;
  categoryColor: string;
  extension: string;
  size: string;
  wordCount: number;
  content: string;
}

const mockDocs: DocItem[] = [
  {
    id: 1,
    filename: '2026-02-26.md',
    category: '日誌',
    categoryColor: '#4c8dff',
    extension: '.md',
    size: '3.2 KB',
    wordCount: 583,
    content: `# 2026-02-26 每日日誌

## 今日摘要
今天完成了 Mission Control 儀表板的核心架構設計，包含了任務排程系統和代理人協調模組的初步實作。

## 進度更新
- ✅ 完成排程引擎的 cron 解析器
- ✅ 實作代理人狀態同步機制
- 🔄 進行中：虛擬辦公室即時更新功能
- 📋 待辦：整合趨勢雷達資料流

## 筆記
Scout 回報了三個新的市場趨勢信號，已轉交 Echo 進行深度分析。Quill 完成了本週電子報初稿，待審核。

## 明日計畫
1. 完成虛擬辦公室 WebSocket 連線
2. 審核 Quill 的電子報草稿
3. 啟動 Violet 的新 UI 設計任務`,
  },
  {
    id: 2,
    filename: '2026-02-26.md',
    category: '其他',
    categoryColor: '#8b8b9e',
    extension: '.md',
    size: '1.1 KB',
    wordCount: 201,
    content: `# 雜項筆記 2026-02-26

快速備忘：
- 伺服器更新排定於週五
- API 金鑰已更新至新版本
- 備份排程確認無誤`,
  },
  {
    id: 3,
    filename: '2026-02-25.md',
    category: '日誌',
    categoryColor: '#4c8dff',
    extension: '.md',
    size: '2.8 KB',
    wordCount: 492,
    content: `# 2026-02-25 每日日誌

## 今日摘要
專注於代理人角色定義與溝通協議的設計。Henry 提出了新的委派策略。

## 重點事項
- 定義了九個代理人的核心職責
- 建立了跨機器通訊框架
- 完成品質管控流程文件`,
  },
  {
    id: 4,
    filename: '2026-02-25-vibe-coding-mainstream.md',
    category: '其他',
    categoryColor: '#8b8b9e',
    extension: '.md',
    size: '4.5 KB',
    wordCount: 812,
    content: `# Vibe Coding 進入主流

## 觀察
近期觀察到「氛圍編程」（Vibe Coding）的概念正在快速進入主流開發者社群。這種以直覺驅動、AI 輔助的開發方式正在改變傳統軟體開發的工作流程。

## 趨勢分析
- GitHub Copilot 活躍用戶突破新高
- 新一代開發者更傾向於描述需求而非手動編碼
- 企業採用率持續攀升`,
  },
  {
    id: 5,
    filename: 'arena-prd.md',
    category: '文件',
    categoryColor: '#34d399',
    extension: '.md',
    size: '8.7 KB',
    wordCount: 1523,
    content: `# Arena 產品需求文件 (PRD)

## 產品概述
Arena 是一個 AI 代理人協作平台，旨在建立一個自主運作的虛擬工作團隊。

## 核心功能
1. 代理人管理與調度
2. 任務分配與追蹤
3. 跨代理人溝通
4. 品質管控流程
5. 即時狀態監控`,
  },
  {
    id: 6,
    filename: '.DS_Store',
    category: '其他',
    categoryColor: '#8b8b9e',
    extension: '未知',
    size: '6.1 KB',
    wordCount: 0,
    content: '（二進制檔案，無法預覽）',
  },
  {
    id: 7,
    filename: 'newsletter-draft.md',
    category: '電子報',
    categoryColor: '#f59e0b',
    extension: '.md',
    size: '5.4 KB',
    wordCount: 967,
    content: `# 📮 本週電子報草稿

## 主題：AI 代理人時代來臨

親愛的讀者，

本週我們見證了 AI 代理人技術的重大突破。從自動化工作流程到創意內容生成，AI 代理人正在重新定義「工作」的意義。

### 本週焦點
1. **自主代理人框架**：新一代框架讓 AI 代理人能夠獨立完成複雜任務鏈
2. **多代理人協作**：研究顯示多個 AI 代理人協作可提升 40% 的產出品質
3. **安全與對齊**：如何確保代理人行為符合人類意圖

### Scout 的趨勢觀察
本週最值得關注的三大技術趨勢：
- 大型語言模型的推理能力持續突破
- 開源代理人工具鏈日趨成熟
- 企業級 AI 部署加速

### Quill 的編輯推薦
推薦閱讀本週最具洞察力的五篇文章...

---
*此電子報由 Cowork AI 團隊每週發送*`,
  },
  {
    id: 8,
    filename: 'youtube-script-01.md',
    category: 'YouTube 腳本',
    categoryColor: '#ef4444',
    extension: '.md',
    size: '6.8 KB',
    wordCount: 1205,
    content: `# YouTube 影片腳本 #01

## 標題：我如何建立一個 AI 代理人團隊

## 開場 (0:00-0:30)
「如果你能擁有一個全天候為你工作的 AI 團隊，你會怎麼做？今天我要分享我如何從零開始建立一個由九個 AI 代理人組成的虛擬團隊。」

## 第一段：為什麼需要 AI 團隊 (0:30-3:00)
- 單一 AI 助手的局限性
- 專業化分工的優勢
- 真實案例展示

## 第二段：團隊架構 (3:00-7:00)
- 介紹每個代理人的角色
- 如何設計有效的協作流程
- 品質管控的重要性`,
  },
];

const categories = ['日誌', 'Nova ⭐', '其他', '文件', '內容', '電子報', '筆記', 'YouTube 腳本'];
const categoryColors: Record<string, string> = {
  '日誌': '#4c8dff',
  'Nova ⭐': '#eab308',
  '其他': '#8b8b9e',
  '文件': '#34d399',
  '內容': '#a78bfa',
  '電子報': '#f59e0b',
  '筆記': '#22d3ee',
  'YouTube 腳本': '#ef4444',
};

const extensions = ['.md', '.html', '.pdf', '未知', '.webm', '.json', '.mobi', '.epub'];

function DocIcon({ color }: { color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 1h6l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z"
          stroke={color}
          strokeWidth="1.2"
          fill="none"
        />
        <path d="M10 1v4h4" stroke={color} strokeWidth="1.2" fill="none" />
        <line x1="5" y1="8" x2="11" y2="8" stroke={color} strokeWidth="1" opacity="0.5" />
        <line x1="5" y1="10" x2="9" y2="10" stroke={color} strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
  );
}

export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedExtensions, setSelectedExtensions] = useState<Set<string>>(new Set());
  const [selectedDocId, setSelectedDocId] = useState<number>(7);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleExtension = (ext: string) => {
    setSelectedExtensions((prev) => {
      const next = new Set(prev);
      if (next.has(ext)) next.delete(ext);
      else next.add(ext);
      return next;
    });
  };

  const filteredDocs = useMemo(() => {
    return mockDocs.filter((doc) => {
      if (search && !doc.filename.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(doc.category)) return false;
      if (selectedExtensions.size > 0 && !selectedExtensions.has(doc.extension)) return false;
      return true;
    });
  }, [search, selectedCategories, selectedExtensions]);

  const selectedDoc = mockDocs.find((d) => d.id === selectedDocId) || mockDocs[0];

  return (
    <div className="flex h-full bg-[#0a0a0f]">
      {/* Left Panel */}
      <div className="w-[360px] flex-shrink-0 border-r border-[#2a2a3a] flex flex-col">
        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5c72]"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              type="text"
              placeholder="搜尋文件..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e8e8ed] placeholder:text-[#5c5c72] focus:outline-none focus:border-[#4c8dff] transition-colors"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedCategories.has(cat)
                    ? (categoryColors[cat] || '#8b8b9e') + '33'
                    : '#1a1a24',
                  color: selectedCategories.has(cat)
                    ? categoryColors[cat] || '#8b8b9e'
                    : '#8b8b9e',
                  border: `1px solid ${
                    selectedCategories.has(cat)
                      ? (categoryColors[cat] || '#8b8b9e') + '66'
                      : '#2a2a3a'
                  }`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {extensions.map((ext) => (
              <button
                key={ext}
                onClick={() => toggleExtension(ext)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedExtensions.has(ext) ? '#4c8dff22' : '#1a1a24',
                  color: selectedExtensions.has(ext) ? '#4c8dff' : '#5c5c72',
                  border: `1px solid ${selectedExtensions.has(ext) ? '#4c8dff44' : '#2a2a3a'}`,
                }}
              >
                {ext}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a3a]" />

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className="w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors"
              style={{
                backgroundColor: selectedDocId === doc.id ? '#1e1e2a' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (selectedDocId !== doc.id)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#111118';
              }}
              onMouseLeave={(e) => {
                if (selectedDocId !== doc.id)
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <DocIcon color={doc.categoryColor} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-[#e8e8ed] truncate">{doc.filename}</div>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: doc.categoryColor + '22',
                    color: doc.categoryColor,
                    border: `1px solid ${doc.categoryColor}44`,
                  }}
                >
                  {doc.category}
                </span>
              </div>
            </button>
          ))}
          {filteredDocs.length === 0 && (
            <div className="px-3 py-8 text-center text-[#5c5c72] text-sm">
              找不到符合條件的文件
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a3a] flex items-center gap-3">
          <DocIcon color={selectedDoc.categoryColor} />
          <div>
            <div className="text-[#e8e8ed] font-medium">{selectedDoc.filename}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: selectedDoc.categoryColor + '22',
                  color: selectedDoc.categoryColor,
                  border: `1px solid ${selectedDoc.categoryColor}44`,
                }}
              >
                {selectedDoc.category}
              </span>
              <span className="text-xs text-[#5c5c72]">
                {selectedDoc.size} · {selectedDoc.wordCount} 字
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl">
            {selectedDoc.content.split('\n').map((line, i) => {
              if (line.startsWith('# '))
                return (
                  <h1 key={i} className="text-2xl font-bold text-[#e8e8ed] mb-4 mt-2">
                    {line.replace('# ', '')}
                  </h1>
                );
              if (line.startsWith('## '))
                return (
                  <h2 key={i} className="text-lg font-semibold text-[#e8e8ed] mb-3 mt-6">
                    {line.replace('## ', '')}
                  </h2>
                );
              if (line.startsWith('### '))
                return (
                  <h3 key={i} className="text-base font-semibold text-[#e8e8ed] mb-2 mt-4">
                    {line.replace('### ', '')}
                  </h3>
                );
              if (line.startsWith('- '))
                return (
                  <div key={i} className="flex gap-2 text-sm text-[#8b8b9e] mb-1 ml-2">
                    <span className="text-[#5c5c72]">•</span>
                    <span>{line.replace('- ', '')}</span>
                  </div>
                );
              if (line.startsWith('---'))
                return <hr key={i} className="border-[#2a2a3a] my-4" />;
              if (line.startsWith('*'))
                return (
                  <p key={i} className="text-xs text-[#5c5c72] italic mb-2">
                    {line.replace(/\*/g, '')}
                  </p>
                );
              if (line.match(/^\d+\./))
                return (
                  <div key={i} className="text-sm text-[#8b8b9e] mb-1 ml-2">
                    {line}
                  </div>
                );
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return (
                <p key={i} className="text-sm text-[#8b8b9e] mb-2 leading-relaxed">
                  {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
