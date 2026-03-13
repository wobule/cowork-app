'use client';

import { MessageSquare, Inbox } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">回饋</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">收集與追蹤回饋意見</p>

        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-12 flex flex-col items-center justify-center">
          <Inbox className="w-16 h-16 text-[#5c5c72] mb-4" />
          <p className="text-[#8b8b9e] text-lg">尚無回饋意見</p>
          <p className="text-[#5c5c72] text-sm mt-2">回饋意見將會顯示在這裡</p>
        </div>
      </div>
    </div>
  );
}
