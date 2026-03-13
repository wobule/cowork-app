'use client';

import { FileText } from 'lucide-react';

const contentItems = [
  { title: '每週市場分析報告', status: '草稿', statusColor: 'text-yellow-500 bg-yellow-500/10', date: '2026-03-10' },
  { title: '產品更新公告 v2.4', status: '已排程', statusColor: 'text-blue-400 bg-blue-400/10', date: '2026-03-14' },
  { title: '用戶訪談摘要', status: '已發佈', statusColor: 'text-green-500 bg-green-500/10', date: '2026-03-08' },
];

export default function ContentPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">內容</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">管理所有內容產出與發佈排程</p>

        <div className="space-y-3">
          {contentItems.map((item) => (
            <div
              key={item.title}
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="text-[#e8e8ed] font-medium mb-1">{item.title}</h3>
                <p className="text-[#5c5c72] text-xs">{item.date}</p>
              </div>
              <span className={`${item.statusColor} rounded-full px-3 py-1 text-xs`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
