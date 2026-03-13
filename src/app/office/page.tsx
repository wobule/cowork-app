'use client';

import { useState } from 'react';

interface AgentPosition {
  name: string;
  emoji: string;
  color: string;
  row: number;
  col: number;
  tooltip?: string;
}

const agentPositions: AgentPosition[] = [
  { name: 'Alex', emoji: '👑', color: '#eab308', row: 2, col: 8, tooltip: 'Build Council — S...' },
  { name: 'Henry', emoji: '🦉', color: '#4c8dff', row: 3, col: 10 },
  { name: 'Scout', emoji: '🔍', color: '#8b8b9e', row: 5, col: 3 },
  { name: 'Quill', emoji: '✍️', color: '#34d399', row: 5, col: 7 },
  { name: 'Pixel', emoji: '🎮', color: '#ec4899', row: 7, col: 12 },
  { name: 'Echo', emoji: '📊', color: '#eab308', row: 7, col: 5 },
  { name: 'Violet', emoji: '🎨', color: '#a78bfa', row: 9, col: 3 },
  { name: 'Codex', emoji: '💻', color: '#22d3ee', row: 9, col: 9 },
  { name: 'Charlie', emoji: '🔧', color: '#f59e0b', row: 4, col: 14 },
  { name: 'Ralph', emoji: '🔨', color: '#ef4444', row: 6, col: 14 },
];

interface Furniture {
  type: 'desk' | 'plant' | 'chair';
  row: number;
  col: number;
  width?: number;
  height?: number;
}

const furniture: Furniture[] = [
  // Conference table (U-shape at top)
  { type: 'desk', row: 1, col: 6, width: 3, height: 1 },
  { type: 'desk', row: 2, col: 5, width: 1, height: 2 },
  { type: 'desk', row: 2, col: 9, width: 1, height: 2 },
  // Workstation desks
  { type: 'desk', row: 5, col: 2, width: 2, height: 1 },
  { type: 'desk', row: 5, col: 6, width: 2, height: 1 },
  { type: 'desk', row: 7, col: 4, width: 2, height: 1 },
  { type: 'desk', row: 7, col: 11, width: 2, height: 1 },
  { type: 'desk', row: 9, col: 2, width: 2, height: 1 },
  { type: 'desk', row: 9, col: 8, width: 2, height: 1 },
  { type: 'desk', row: 4, col: 13, width: 2, height: 1 },
  { type: 'desk', row: 6, col: 13, width: 2, height: 1 },
  // Plants
  { type: 'plant', row: 0, col: 0 },
  { type: 'plant', row: 0, col: 15 },
  { type: 'plant', row: 10, col: 0 },
  { type: 'plant', row: 10, col: 15 },
  { type: 'plant', row: 5, col: 11 },
  { type: 'plant', row: 3, col: 1 },
];

const GRID_ROWS = 11;
const GRID_COLS = 16;

const controlButtons = [
  { label: '✅ 全員工作', borderColor: '#34d399' },
  { label: '👋 集合', borderColor: '#4c8dff' },
  { label: '💻 開會', borderColor: '#a78bfa' },
  { label: '🌊 茶水間', borderColor: '#22d3ee' },
];

export default function OfficePage() {
  const [activeControl, setActiveControl] = useState('✅ 全員工作');

  const getCellContent = (row: number, col: number) => {
    // Check agents
    const agent = agentPositions.find((a) => a.row === row && a.col === col);
    if (agent) {
      return (
        <div className="relative flex flex-col items-center z-10">
          {agent.tooltip && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e1e2a] border border-[#2a2a3a] rounded px-2 py-0.5 text-[9px] text-[#8b8b9e] whitespace-nowrap z-20">
              {agent.tooltip}
            </div>
          )}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg"
            style={{
              backgroundColor: agent.color + '33',
              border: `2px solid ${agent.color}`,
              boxShadow: `0 0 8px ${agent.color}44`,
            }}
          >
            {agent.emoji}
          </div>
          <span className="text-[8px] text-[#8b8b9e] mt-0.5 font-medium">{agent.name}</span>
        </div>
      );
    }

    // Check furniture
    const desk = furniture.find(
      (f) =>
        f.type === 'desk' &&
        row >= f.row &&
        row < f.row + (f.height || 1) &&
        col >= f.col &&
        col < f.col + (f.width || 1)
    );
    if (desk) {
      return (
        <div className="w-full h-full rounded-sm bg-[#2a2a3a] border border-[#3a3a4a] opacity-60" />
      );
    }

    const plant = furniture.find((f) => f.type === 'plant' && f.row === row && f.col === col);
    if (plant) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#34d399] opacity-30 border border-[#34d399] mx-auto" />
      );
    }

    return null;
  };

  return (
    <div className="flex h-full bg-[#0a0a0f]">
      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Control Bar */}
        <div className="px-4 py-3 border-b border-[#2a2a3a] flex items-center justify-between">
          <span className="text-sm text-[#e8e8ed] font-medium">🔥 演示控制</span>
          <div className="flex items-center gap-2">
            {controlButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => setActiveControl(btn.label)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor:
                    activeControl === btn.label ? btn.borderColor + '22' : '#1a1a24',
                  color: activeControl === btn.label ? btn.borderColor : '#8b8b9e',
                  border: `1px solid ${
                    activeControl === btn.label ? btn.borderColor + '66' : '#2a2a3a'
                  }`,
                }}
              >
                {btn.label}
              </button>
            ))}
            <button className="w-8 h-8 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center text-[#5c5c72] hover:text-[#8b8b9e] transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 8A6 6 0 114.8 3.8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 1l-1 3 3-1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Office Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="relative">
            {/* Start Chat Button */}
            <button className="absolute top-2 left-2 z-20 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-1.5 text-xs text-[#8b8b9e] hover:text-[#e8e8ed] hover:border-[#3a3a4a] transition-all">
              + 開始聊天
            </button>

            {/* Grid */}
            <div
              className="inline-grid gap-0 rounded-lg overflow-hidden border border-[#2a2a3a]"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, 44px)`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 44px)`,
              }}
            >
              {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, idx) => {
                const row = Math.floor(idx / GRID_COLS);
                const col = idx % GRID_COLS;
                const isDark = (row + col) % 2 === 0;

                return (
                  <div
                    key={idx}
                    className="relative flex items-center justify-center"
                    style={{
                      backgroundColor: isDark ? '#111118' : '#0e0e16',
                    }}
                  >
                    {getCellContent(row, col)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Agent Tabs */}
        <div className="border-t border-[#2a2a3a] px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {agentPositions.map((agent) => (
            <button
              key={agent.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-[#1a1a24] flex-shrink-0"
              style={{ color: agent.color }}
            >
              <span>{agent.emoji}</span>
              <span>{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Live Activity */}
      <div className="w-[240px] flex-shrink-0 border-l border-[#2a2a3a] flex flex-col">
        <div className="p-4 border-b border-[#2a2a3a]">
          <h2 className="text-sm font-semibold text-[#e8e8ed]">即時動態</h2>
          <p className="text-xs text-[#5c5c72] mt-0.5">過去一小時</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 rounded-full bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center mb-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#5c5c72" strokeWidth="1.2" />
              <path d="M8 5v3l2 2" stroke="#5c5c72" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm text-[#5c5c72] text-center">暫無最新動態</p>
          <p className="text-xs text-[#3a3a4a] text-center mt-1">事件將會顯示在這裡</p>
        </div>
      </div>
    </div>
  );
}
