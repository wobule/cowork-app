'use client';

import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ApprovalsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">審批</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">待審核的任務與決策</p>

        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-12 flex flex-col items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-[#5c5c72] mb-4" />
          <p className="text-[#8b8b9e] text-lg">目前沒有待審批的項目</p>
          <p className="text-[#5c5c72] text-sm mt-2">所有項目皆已處理完畢</p>
        </div>
      </div>
    </div>
  );
}
