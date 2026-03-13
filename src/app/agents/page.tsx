'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot,
  Save,
  Play,
  Clock,
  Activity,
  ChevronDown,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  color: string;
  enabled: boolean;
  description: string;
  skills: string[];
  model: string;
  poll_interval: number;
  status: 'idle' | 'working' | 'paused';
  current_task: string | null;
}

interface ActivityEntry {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_color: string;
  message: string;
  created_at: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'henry',
    name: 'Henry',
    emoji: '\uD83E\uDDD1\u200D\uD83D\uDCBB',
    role: '\u5C08\u6848\u7D71\u7C4C\u8005',
    color: '#3b82f6',
    enabled: true,
    description: '\u8CA0\u8CAC\u7D71\u7C4C\u5C08\u6848\u9032\u5EA6\u3001\u5206\u914D\u4EFB\u52D9\u4E26\u78BA\u4FDD\u5718\u968A\u5354\u4F5C\u9806\u66A2\u3002',
    skills: ['\u5C08\u6848\u7BA1\u7406', '\u4EFB\u52D9\u5206\u914D', '\u9032\u5EA6\u8FFD\u8E64', '\u5718\u968A\u5354\u8ABF'],
    model: 'claude-opus-4-0-20250514',
    poll_interval: 30,
    status: 'idle',
    current_task: null,
  },
  {
    id: 'violet',
    name: 'Violet',
    emoji: '\uD83E\uDDDA',
    role: '\u5275\u610F\u8A2D\u8A08\u5E2B',
    color: '#8b5cf6',
    enabled: true,
    description: '\u8CA0\u8CAC UI/UX \u8A2D\u8A08\u3001\u54C1\u724C\u8996\u89BA\u8207\u5275\u610F\u5167\u5BB9\u7522\u51FA\u3002',
    skills: ['UI \u8A2D\u8A08', 'UX \u7814\u7A76', '\u54C1\u724C\u8A2D\u8A08', '\u5275\u610F\u767C\u60F3'],
    model: 'claude-sonnet-4-20250514',
    poll_interval: 45,
    status: 'idle',
    current_task: null,
  },
  {
    id: 'wendy',
    name: 'Wendy',
    emoji: '\uD83D\uDC69\u200D\uD83D\uDD2C',
    role: '\u8CC7\u6599\u5206\u6790\u5E2B',
    color: '#10b981',
    enabled: false,
    description: '\u8CA0\u8CAC\u8CC7\u6599\u63A1\u96C6\u3001\u5206\u6790\u8207\u5831\u8868\u7522\u751F\uFF0C\u63D0\u4F9B\u6C7A\u7B56\u652F\u63F4\u3002',
    skills: ['\u8CC7\u6599\u5206\u6790', '\u5831\u8868\u7522\u751F', '\u8CC7\u6599\u8996\u89BA\u5316', '\u8DA8\u52E2\u9810\u6E2C'],
    model: 'gpt-4o',
    poll_interval: 60,
    status: 'paused',
    current_task: null,
  },
  {
    id: 'jarvis',
    name: 'Jarvis',
    emoji: '\uD83E\uDD16',
    role: '\u7CFB\u7D71\u5DE5\u7A0B\u5E2B',
    color: '#f59e0b',
    enabled: true,
    description: '\u8CA0\u8CAC\u7CFB\u7D71\u67B6\u69CB\u3001\u81EA\u52D5\u5316\u90E8\u7F72\u8207\u57FA\u790E\u8A2D\u65BD\u7DAD\u904B\u3002',
    skills: ['\u7CFB\u7D71\u67B6\u69CB', 'CI/CD', '\u96F2\u7AEF\u90E8\u7F72', '\u6548\u80FD\u512A\u5316'],
    model: 'claude-opus-4-0-20250514',
    poll_interval: 20,
    status: 'working',
    current_task: '\u90E8\u7F72\u524D\u7AEF\u61C9\u7528\u7A0B\u5F0F\u81F3\u6B63\u5F0F\u74B0\u5883',
  },
];

const MODEL_OPTIONS = [
  { value: 'claude-opus-4-0-20250514', label: 'Claude Opus 4' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  idle: { label: '\u9592\u7F6E\u4E2D', color: '#8b8b9e' },
  working: { label: '\u5DE5\u4F5C\u4E2D', color: '#10b981' },
  paused: { label: '\u5DF2\u66AB\u505C', color: '#f59e0b' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return '\u525B\u525B';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} \u5206\u9418\u524D`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} \u5C0F\u6642\u524D`;
  return `${Math.floor(diffSec / 86400)} \u5929\u524D`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [triggeringIds, setTriggeringIds] = useState<Set<string>>(new Set());
  const toastIdRef = useRef(0);

  // ── Toast ────────────────────────────────────────────────────────────────

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ── Fetch agents ─────────────────────────────────────────────────────────

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data);
        } else {
          setAgents(DEFAULT_AGENTS);
        }
      } else {
        setAgents(DEFAULT_AGENTS);
      }
    } catch {
      setAgents(DEFAULT_AGENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch activities ─────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activities?limit=20');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivities(data);
        }
      }
    } catch {
      // silent
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAgents();
    fetchActivities();
  }, [fetchAgents, fetchActivities]);

  useEffect(() => {
    const interval = setInterval(fetchActivities, 15000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // ── Local state updates ──────────────────────────────────────────────────

  const updateAgent = (id: string, patch: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const saveAgent = async (agent: Agent) => {
    setSavingIds((prev) => new Set(prev).add(agent.id));
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
      if (res.ok) {
        addToast('success', `${agent.name} \u8A2D\u5B9A\u5DF2\u5132\u5B58`);
      } else {
        addToast('error', `\u5132\u5B58 ${agent.name} \u8A2D\u5B9A\u5931\u6557`);
      }
    } catch {
      addToast('error', `\u5132\u5B58 ${agent.name} \u8A2D\u5B9A\u5931\u6557`);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(agent.id);
        return next;
      });
    }
  };

  // ── Manual trigger ───────────────────────────────────────────────────────

  const triggerAgent = async (agent: Agent) => {
    setTriggeringIds((prev) => new Set(prev).add(agent.id));
    try {
      const res = await fetch('/api/agents/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id }),
      });
      if (res.ok) {
        addToast('success', `\u5DF2\u89F8\u767C ${agent.name}`);
        await fetchAgents();
        await fetchActivities();
      } else {
        addToast('error', `\u89F8\u767C ${agent.name} \u5931\u6557`);
      }
    } catch {
      addToast('error', `\u89F8\u767C ${agent.name} \u5931\u6557`);
    } finally {
      setTriggeringIds((prev) => {
        const next = new Set(prev);
        next.delete(agent.id);
        return next;
      });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 md:p-8">
      {/* ── Toasts ──────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
              t.type === 'success'
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Bot className="w-8 h-8 text-[#8b5cf6]" />
            <h1 className="text-2xl font-bold text-[#e8e8ed]">{'\u4EE3\u7406\u4EBA'}</h1>
          </div>
          <p className="text-[#8b8b9e] ml-11">
            {'\u7BA1\u7406\u8207\u8A2D\u5B9A\u60A8\u7684 AI \u4EE3\u7406\u4EBA\u5718\u968A'}
          </p>
        </div>

        {/* ── Agent Cards (2x2) ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {agents.map((agent) => {
            const isSaving = savingIds.has(agent.id);
            const isTriggering = triggeringIds.has(agent.id);
            const statusInfo = STATUS_MAP[agent.status] ?? STATUS_MAP.idle;

            return (
              <div
                key={agent.id}
                className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl overflow-hidden"
              >
                {/* ── Top Section ──────────────────────────────────── */}
                <div className="p-5 pb-4 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: agent.color + '33' }}
                    >
                      {agent.emoji}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#e8e8ed]">{agent.name}</h2>
                      <p className="text-sm text-[#8b8b9e]">{agent.role}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: agent.enabled ? '#10b981' : '#5c5c72',
                          }}
                        />
                        <span
                          className="text-xs"
                          style={{
                            color: agent.enabled ? '#10b981' : '#5c5c72',
                          }}
                        >
                          {agent.enabled ? '\u4E0A\u7DDA\u4E2D' : '\u5DF2\u505C\u7528'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={agent.enabled}
                    onClick={() => updateAgent(agent.id, { enabled: !agent.enabled })}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      agent.enabled ? 'bg-[#10b981]' : 'bg-[#2a2a3a]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        agent.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* ── Body ─────────────────────────────────────────── */}
                <div className="px-5 pb-5 space-y-5">
                  {/* Description */}
                  <div>
                    <label className="block text-xs text-[#5c5c72] mb-1.5 font-medium uppercase tracking-wide">
                      {'\u8077\u8CAC\u63CF\u8FF0'}
                    </label>
                    <textarea
                      rows={2}
                      value={agent.description}
                      onChange={(e) =>
                        updateAgent(agent.id, { description: e.target.value })
                      }
                      placeholder={'\u63CF\u8FF0\u6B64\u4EE3\u7406\u4EBA\u7684\u8077\u8CAC...'}
                      className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#e8e8ed] placeholder-[#5c5c72] resize-none focus:outline-none focus:border-[#8b5cf6]/50 transition-colors"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-xs text-[#5c5c72] mb-1.5 font-medium uppercase tracking-wide">
                      {'\u6280\u80FD'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {agent.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: agent.color + '33',
                            color: agent.color,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block text-xs text-[#5c5c72] mb-1.5 font-medium uppercase tracking-wide">
                      {'\u6A21\u578B'}
                    </label>
                    <div className="relative">
                      <select
                        value={agent.model}
                        onChange={(e) =>
                          updateAgent(agent.id, { model: e.target.value })
                        }
                        className="w-full appearance-none bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-[#e8e8ed] focus:outline-none focus:border-[#8b5cf6]/50 transition-colors pr-8"
                      >
                        {MODEL_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5c72] pointer-events-none" />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="bg-[#111118] rounded-lg p-4 space-y-4">
                    {/* Poll interval */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b8b9e] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {'\u8F2A\u8A62\u9593\u9694\uFF08\u79D2\uFF09'}
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={3600}
                        value={agent.poll_interval}
                        onChange={(e) =>
                          updateAgent(agent.id, {
                            poll_interval: Math.max(5, parseInt(e.target.value) || 5),
                          })
                        }
                        className="w-20 bg-[#0a0a0f] border border-[#2a2a3a] rounded px-2 py-1 text-sm text-[#e8e8ed] text-right focus:outline-none focus:border-[#8b5cf6]/50"
                      />
                    </div>

                    {/* Current status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8b8b9e]">{'\u76EE\u524D\u72C0\u614B'}</span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: statusInfo.color + '20',
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Current task */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-[#8b8b9e] flex-shrink-0">
                        {'\u76EE\u524D\u4EFB\u52D9'}
                      </span>
                      <span className="text-xs text-[#e8e8ed] truncate text-right">
                        {agent.current_task || '\u7121'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => saveAgent(agent)}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#0d9668] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {'\u5132\u5B58\u8A2D\u5B9A'}
                    </button>
                    <button
                      onClick={() => triggerAgent(agent)}
                      disabled={isTriggering}
                      className="flex-1 flex items-center justify-center gap-2 border border-[#2a2a3a] hover:border-[#8b5cf6]/50 hover:bg-[#8b5cf6]/10 disabled:opacity-50 disabled:cursor-not-allowed text-[#e8e8ed] text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {isTriggering ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {'\u624B\u52D5\u89F8\u767C'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Activity Log ────────────────────────────────────────────── */}
        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#8b5cf6]" />
            <h2 className="text-lg font-bold text-[#e8e8ed]">
              {'\u4EE3\u7406\u4EBA\u6D3B\u52D5\u7D00\u9304'}
            </h2>
          </div>

          {activities.length === 0 ? (
            <p className="text-[#5c5c72] text-sm py-8 text-center">
              {'\u5C1A\u7121\u6D3B\u52D5\u7D00\u9304'}
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 py-2 border-b border-[#2a2a3a]/50 last:border-0"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: entry.agent_color || '#8b5cf6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium mr-2"
                      style={{ color: entry.agent_color || '#8b5cf6' }}
                    >
                      {entry.agent_name}
                    </span>
                    <span className="text-sm text-[#e8e8ed]">{entry.message}</span>
                  </div>
                  <span className="text-xs text-[#5c5c72] flex-shrink-0 whitespace-nowrap">
                    {relativeTime(entry.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Fade-in animation ─────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
