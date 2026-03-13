'use client';

import { Users } from 'lucide-react';

const models = [
  { name: 'Claude', role: '主席', color: '#8b5cf6' },
  { name: 'GPT-4o', role: '顧問', color: '#22c55e' },
  { name: 'Gemini', role: '審查員', color: '#3b82f6' },
];

export default function CouncilPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">議會</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">
          多模型審議系統 — 透過多個 AI 模型進行決策
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {models.map((model) => (
            <div
              key={model.name}
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-5 text-center"
            >
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: model.color + '20', color: model.color }}
              >
                {model.name[0]}
              </div>
              <h3 className="text-[#e8e8ed] font-semibold">{model.name}</h3>
              <p className="text-[#5c5c72] text-xs mt-1">{model.role}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-6">
          <h3 className="text-[#8b8b9e] text-sm mb-4">審議記錄</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-[#2a2a3a] rounded w-full" style={{ width: `${90 - i * 15}%` }} />
            ))}
          </div>
          <p className="text-[#5c5c72] text-xs mt-4">尚未開始任何審議</p>
        </div>
      </div>
    </div>
  );
}
