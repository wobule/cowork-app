'use client';

import { useState, useEffect } from 'react';
import { Monitor, Key, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function SystemPage() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Fetch current settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setHasKey(data._has_anthropic_key === 'true');
        setMaskedKey(data.anthropic_api_key || '');
        setBaseUrl(data.anthropic_base_url || '');
      })
      .catch(() => {});
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'anthropic_api_key', value: apiKey.trim() }),
      });
      if (res.ok) {
        setHasKey(true);
        setMaskedKey(`${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
        setApiKey('');
        setToast({ type: 'success', msg: 'API Key 已儲存！代理人現在可以真正工作了。' });
      } else {
        setToast({ type: 'error', msg: '儲存失敗' });
      }
    } catch {
      setToast({ type: 'error', msg: '儲存失敗' });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
  };

  const saveBaseUrl = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'anthropic_base_url', value: baseUrl.trim() }),
      });
      setToast({ type: 'success', msg: 'Base URL 已更新' });
    } catch {
      setToast({ type: 'error', msg: '儲存失敗' });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Monitor className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">系統設定</h1>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">設定 API 金鑰讓代理人能真正執行任務</p>

        {/* Toast */}
        {toast && (
          <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] ${
            toast.type === 'success'
              ? 'bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20'
              : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* API Key Section */}
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-[#f59e0b]" />
            <h2 className="text-[15px] font-bold text-[#e8e8ed]">Anthropic API Key</h2>
            {hasKey && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34d399]/15 text-[#34d399] font-medium">
                已設定
              </span>
            )}
          </div>

          <p className="text-[12px] text-[#8b8b9e] mb-4 leading-[1.7]">
            代理人需要 Anthropic API Key 才能使用 Claude 模型真正處理任務。
            你可以在{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[#4c8dff] hover:underline">
              Anthropic Console
            </a>
            {' '}取得 API Key。
          </p>

          {hasKey && maskedKey && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#111118] rounded-lg border border-[#2a2a3a]">
              <span className="text-[12px] text-[#5c5c72]">目前金鑰：</span>
              <code className="text-[12px] text-[#8b8b9e] font-mono">{maskedKey}</code>
              <CheckCircle size={14} className="text-[#34d399] ml-auto" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? '輸入新的 API Key 以覆蓋...' : '輸入你的 Anthropic API Key (sk-ant-...)'}
                className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2.5 text-[13px] text-[#e8e8ed] placeholder-[#5c5c72] outline-none focus:border-[#4c8dff] transition-colors pr-10 font-mono"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#5c5c72] hover:text-[#8b8b9e] transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={saveApiKey}
              disabled={saving || !apiKey.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-[#34d399] hover:bg-[#2cc48d] text-[#0a0a0f] transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <Save size={14} />
              儲存
            </button>
          </div>
        </div>

        {/* Base URL Section (optional) */}
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 mb-6">
          <h2 className="text-[15px] font-bold text-[#e8e8ed] mb-2">API Base URL（選填）</h2>
          <p className="text-[12px] text-[#8b8b9e] mb-4 leading-[1.7]">
            如果你使用自訂的 API 端點（如代理伺服器），可以在這裡設定。留空則使用預設 Anthropic API。
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.anthropic.com"
              className="flex-1 bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2.5 text-[13px] text-[#e8e8ed] placeholder-[#5c5c72] outline-none focus:border-[#4c8dff] transition-colors font-mono"
            />
            <button
              onClick={saveBaseUrl}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-medium bg-[#1e1e2a] text-[#8b8b9e] border border-[#2a2a3a] hover:border-[#3a3a4a] transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <Save size={14} />
              更新
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6">
          <h2 className="text-[15px] font-bold text-[#e8e8ed] mb-4">代理人運作方式</h2>
          <div className="space-y-3 text-[12px] text-[#8b8b9e] leading-[1.7]">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">1</span>
              <p>你建立任務並分配給某位代理人（Henry、Violet、Wendy 或 Jarvis）</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">2</span>
              <p>代理人自動偵測到新任務，使用指定的 AI 模型開始處理</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#4c8dff]/20 text-[#4c8dff] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">3</span>
              <p>代理人根據自己的角色和技能，呼叫 Claude API 產出工作報告</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#34d399]/20 text-[#34d399] flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">4</span>
              <p>你可以在任務詳情中查看完整輸出，追加指令，代理人會即時用 AI 回覆</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
