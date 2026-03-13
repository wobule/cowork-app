'use client';

import { Factory } from 'lucide-react';

const stages = [
  { name: '研究', count: 3, color: '#3b82f6' },
  { name: '驗證', count: 1, color: '#8b5cf6' },
  { name: '建構', count: 0, color: '#22c55e' },
  { name: '上線', count: 0, color: '#f59e0b' },
];

export default function FactoryPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Factory className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">工廠</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">
          微型 SaaS 產品的研究、驗證與建構
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stages.map((stage, i) => (
            <div
              key={stage.name}
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-5 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#8b8b9e] text-sm">階段 {i + 1}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
              </div>
              <h3 className="text-[#e8e8ed] font-semibold text-lg mb-1">{stage.name}</h3>
              <p className="text-[#5c5c72] text-xs">{stage.count} 個項目</p>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-0.5 flex-1 bg-[#2a2a3a] rounded" />
            {stages.map((stage, i) => (
              <div key={stage.name} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: stage.color + '20', color: stage.color }}
                >
                  {i + 1}
                </div>
                {i < stages.length - 1 && <div className="w-12 h-0.5 bg-[#2a2a3a]" />}
              </div>
            ))}
            <div className="h-0.5 flex-1 bg-[#2a2a3a] rounded" />
          </div>
          <p className="text-[#5c5c72] text-xs text-center">產品管線流程</p>
        </div>
      </div>
    </div>
  );
}
