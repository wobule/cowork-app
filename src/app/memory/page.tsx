'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Pencil,
  Brain,
  X,
  MessageSquare,
  BookOpen,
  StickyNote,
} from 'lucide-react';

// --- Types ---

interface MemoryEntry {
  id: string;
  title: string;
  agent: string;
  type: '對話' | '日誌' | '筆記';
  content: string;
  createdAt: string;
  fileSize: string;
  wordCount: number;
}

// --- Constants ---

const AGENTS = [
  { name: 'Henry', color: '#4c8dff', emoji: 'H' },
  { name: 'Violet', color: '#a855f7', emoji: 'V' },
  { name: 'Wendy', color: '#f472b6', emoji: 'W' },
  { name: 'Jarvis', color: '#34d399', emoji: 'J' },
  { name: '一般', color: '#8b8b9e', emoji: '一' },
] as const;

const ENTRY_TYPES: Array<{ label: '對話' | '日誌' | '筆記'; icon: typeof MessageSquare }> = [
  { label: '對話', icon: MessageSquare },
  { label: '日誌', icon: BookOpen },
  { label: '筆記', icon: StickyNote },
];

const FILTER_TABS = ['全部', 'Henry', 'Violet', 'Wendy', 'Jarvis'] as const;

// --- Helpers ---

function getAgentInfo(name: string) {
  return AGENTS.find((a) => a.name === name) ?? AGENTS[4];
}

function getTypeIcon(type: string) {
  const match = ENTRY_TYPES.find((t) => t.label === type);
  return match?.icon ?? FileText;
}

function relativeDateLabel(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays <= 7) return '本週';
  return '更早';
}

function daysAgoText(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '1天前';
  return `${diffDays}天前`;
}

function groupEntriesByDate(entries: MemoryEntry[]) {
  const groups: { label: string; entries: MemoryEntry[] }[] = [];
  const groupMap = new Map<string, MemoryEntry[]>();
  const order = ['今天', '昨天', '本週', '更早'];

  for (const entry of entries) {
    const label = relativeDateLabel(entry.createdAt);
    if (!groupMap.has(label)) groupMap.set(label, []);
    groupMap.get(label)!.push(entry);
  }

  for (const label of order) {
    const items = groupMap.get(label);
    if (items && items.length > 0) {
      groups.push({ label, entries: items });
    }
  }
  return groups;
}

function formatContent(content: string) {
  // Simple rendering: split by newlines, detect headings (#), lists (- or *), etc.
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={i} className="text-sm font-semibold text-[#e8e8ed] mt-4 mb-1">
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={i} className="text-base font-semibold text-[#e8e8ed] mt-5 mb-1">
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={i} className="text-lg font-semibold text-[#e8e8ed] mt-5 mb-2">
          {trimmed.slice(2)}
        </h2>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={i} className="ml-4 list-disc text-[#8b8b9e] text-sm leading-relaxed">
          {trimmed.slice(2)}
        </li>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li key={i} className="ml-4 list-decimal text-[#8b8b9e] text-sm leading-relaxed">
          {trimmed.replace(/^\d+\.\s/, '')}
        </li>
      );
    }
    if (trimmed === '') {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-[#8b8b9e] text-sm leading-relaxed">
        {trimmed}
      </p>
    );
  });
}

// --- Component ---

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('全部');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createAgent, setCreateAgent] = useState('Henry');
  const [createType, setCreateType] = useState<'對話' | '日誌' | '筆記'>('對話');
  const [createContent, setCreateContent] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch all entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : data.entries ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Fetch full entry on select
  useEffect(() => {
    if (!selectedId) {
      setSelectedEntry(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/memory/${selectedId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSelectedEntry(data);
        }
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Filter entries
  const filtered = entries.filter((e) => {
    if (agentFilter !== '全部' && e.agent !== agentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.agent.toLowerCase().includes(q) ||
        e.type.includes(q)
      );
    }
    return true;
  });

  const groups = groupEntriesByDate(filtered);

  // Create handler
  const handleCreate = async () => {
    if (!createTitle.trim() || !createContent.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          agent: createAgent,
          type: createType,
          content: createContent,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateTitle('');
        setCreateAgent('Henry');
        setCreateType('對話');
        setCreateContent('');
        await fetchEntries();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedId === id) {
          setSelectedId(null);
          setSelectedEntry(null);
        }
        setDeleteConfirmId(null);
        await fetchEntries();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="h-full flex bg-[#0a0a0f] text-[#e8e8ed]">
      {/* ===== Left Panel ===== */}
      <div className="w-80 shrink-0 border-r border-[#2a2a3a] flex flex-col h-full">
        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5c72]" size={14} />
            <input
              type="text"
              placeholder="搜尋記憶..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e8e8ed] placeholder-[#5c5c72] focus:outline-none focus:border-[#4c8dff] transition-colors"
            />
          </div>
        </div>

        {/* New Memory Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            <Plus size={15} />
            新增記憶
          </button>
        </div>

        {/* Agent Filter Tabs */}
        <div className="px-3 pb-3 flex gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setAgentFilter(tab)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                agentFilter === tab
                  ? 'bg-[#4c8dff] text-white'
                  : 'bg-[#111118] text-[#8b8b9e] hover:bg-[#1a1a24] hover:text-[#e8e8ed]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#5c5c72] text-sm">
              載入中...
            </div>
          ) : groups.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[#5c5c72] text-sm">
              沒有記憶條目
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-[#5c5c72] uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                {group.entries.map((entry) => {
                  const agent = getAgentInfo(entry.agent);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedId(entry.id)}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors ${
                        selectedId === entry.id
                          ? 'bg-[#1e1e2a] border-l-2 border-[#4c8dff]'
                          : 'hover:bg-[#111118] border-l-2 border-transparent'
                      }`}
                    >
                      {/* Agent Avatar */}
                      <div
                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-[#e8e8ed] truncate">{entry.title}</div>
                        <div className="text-[11px] text-[#5c5c72] mt-0.5">
                          {new Date(entry.createdAt).toLocaleDateString('zh-TW')} · {entry.wordCount} 字
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== Right Panel ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {selectedEntry ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2a2a3a] shrink-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-[#8b8b9e] shrink-0" size={16} />
                    <h2 className="text-base font-semibold text-[#e8e8ed] truncate">
                      {selectedEntry.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Agent badge */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: getAgentInfo(selectedEntry.agent).color }}
                    >
                      {selectedEntry.agent}
                    </span>
                    {/* Type badge */}
                    {(() => {
                      const TypeIcon = getTypeIcon(selectedEntry.type);
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#1a1a24] text-[#8b8b9e] border border-[#2a2a3a]">
                          <TypeIcon size={11} />
                          {selectedEntry.type}
                        </span>
                      );
                    })()}
                    {/* Date info */}
                    <span className="text-xs text-[#5c5c72]">
                      {new Date(selectedEntry.createdAt).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-[#5c5c72]">·</span>
                    <span className="text-xs text-[#5c5c72]">{selectedEntry.fileSize}</span>
                    <span className="text-xs text-[#5c5c72]">·</span>
                    <span className="text-xs text-[#5c5c72]">
                      {daysAgoText(selectedEntry.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <button
                    className="p-2 rounded-lg text-[#8b8b9e] hover:text-[#e8e8ed] hover:bg-[#1a1a24] transition-colors"
                    title="編輯"
                  >
                    <Pencil size={15} />
                  </button>
                  {deleteConfirmId === selectedEntry.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(selectedEntry.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        確認刪除
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1.5 rounded-lg text-[#8b8b9e] hover:text-[#e8e8ed] hover:bg-[#1a1a24] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(selectedEntry.id)}
                      className="p-2 rounded-lg text-[#8b8b9e] hover:text-red-400 hover:bg-[#1a1a24] transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl font-mono text-sm leading-relaxed">
                {formatContent(selectedEntry.content)}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#5c5c72] gap-3">
            <Brain size={40} strokeWidth={1.2} />
            <p className="text-sm">選擇一個記憶條目以查看內容</p>
          </div>
        )}
      </div>

      {/* ===== Create Modal ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a3a]">
              <h3 className="text-base font-semibold text-[#e8e8ed]">新增記憶</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-[#5c5c72] hover:text-[#e8e8ed] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[#8b8b9e] mb-1.5">標題</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="輸入記憶標題..."
                  className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#e8e8ed] placeholder-[#5c5c72] focus:outline-none focus:border-[#4c8dff] transition-colors"
                />
              </div>

              {/* Agent + Type Row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#8b8b9e] mb-1.5">代理人</label>
                  <select
                    value={createAgent}
                    onChange={(e) => setCreateAgent(e.target.value)}
                    className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#e8e8ed] focus:outline-none focus:border-[#4c8dff] transition-colors"
                  >
                    {AGENTS.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#8b8b9e] mb-1.5">類型</label>
                  <div className="flex gap-1.5">
                    {ENTRY_TYPES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.label}
                          onClick={() => setCreateType(t.label)}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors border ${
                            createType === t.label
                              ? 'bg-[#4c8dff]/20 border-[#4c8dff] text-[#4c8dff]'
                              : 'bg-[#111118] border-[#2a2a3a] text-[#8b8b9e] hover:text-[#e8e8ed]'
                          }`}
                        >
                          <Icon size={12} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-[#8b8b9e] mb-1.5">內容</label>
                <textarea
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder="輸入記憶內容..."
                  className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-3 text-sm text-[#e8e8ed] placeholder-[#5c5c72] focus:outline-none focus:border-[#4c8dff] transition-colors resize-none font-mono"
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2a2a3a]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#8b8b9e] hover:text-[#e8e8ed] hover:bg-[#111118] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createTitle.trim() || !createContent.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22c55e] hover:bg-[#16a34a] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
