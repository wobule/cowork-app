'use client';

import { GitBranch } from 'lucide-react';

const pipelines = [
  { name: '內容發佈流程', steps: 5, completed: 3, status: '進行中' },
  { name: '客戶回饋分析', steps: 4, completed: 4, status: '已完成' },
  { name: '每日數據彙整', steps: 6, completed: 0, status: '待啟動' },
];

export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <GitBranch className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">管線</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">工作流程與自動化管線管理</p>

        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.name}
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#e8e8ed] font-medium">{pipeline.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    pipeline.status === '已完成'
                      ? 'text-green-400 bg-green-400/10'
                      : pipeline.status === '進行中'
                      ? 'text-blue-400 bg-blue-400/10'
                      : 'text-[#5c5c72] bg-[#5c5c72]/10'
                  }`}
                >
                  {pipeline.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: pipeline.steps }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i < pipeline.completed ? 'bg-[#8b5cf6]' : 'bg-[#2a2a3a]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[#5c5c72] text-xs">
                {pipeline.completed} / {pipeline.steps} 步驟完成
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
