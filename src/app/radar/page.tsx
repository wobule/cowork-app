'use client';

import { Radar } from 'lucide-react';

const signals = [
  { title: 'AI 代理人市場快速成長', strength: '強', category: '趨勢', time: '2 小時前' },
  { title: '語音介面採用率上升', strength: '中', category: '技術', time: '5 小時前' },
  { title: '遠端協作工具需求增加', strength: '強', category: '市場', time: '1 天前' },
  { title: '隱私法規更新', strength: '弱', category: '法規', time: '2 天前' },
];

const strengthColor: Record<string, string> = {
  '強': 'text-green-400 bg-green-400/10',
  '中': 'text-yellow-400 bg-yellow-400/10',
  '弱': 'text-[#5c5c72] bg-[#5c5c72]/10',
};

export default function RadarPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Radar className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">雷達</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">趨勢偵測與市場訊號追蹤</p>

        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-5 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="text-[#e8e8ed] font-medium mb-1">{signal.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[#5c5c72] text-xs">{signal.category}</span>
                  <span className="text-[#5c5c72] text-xs">{signal.time}</span>
                </div>
              </div>
              <span className={`${strengthColor[signal.strength]} rounded-full px-3 py-1 text-xs`}>
                {signal.strength}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
