'use client';

import { useState } from 'react';

interface ScheduledTask {
  name: string;
  time: string;
  color: string;
  schedule: 'daily' | 'monday' | 'tuesday';
}

const scheduledTasks: ScheduledTask[] = [
  { name: '趨勢雷達', time: '12:00 PM', color: '#ef4444', schedule: 'daily' },
  { name: '晨間啟動', time: '6:55 AM', color: '#4c8dff', schedule: 'daily' },
  { name: 'YouTube OpenClaw 研究', time: '7:00 AM', color: '#34d399', schedule: 'daily' },
  { name: 'Scout 晨間研究', time: '8:00 AM', color: '#f59e0b', schedule: 'daily' },
  { name: '晨間簡報', time: '8:00 AM', color: '#8b5cf6', schedule: 'daily' },
  { name: '趨勢雷達每日摘要', time: '8:00 AM', color: '#22d3ee', schedule: 'daily' },
  { name: 'Quill 腳本撰寫', time: '8:30 AM', color: '#14b8a6', schedule: 'daily' },
  { name: '每日摘要', time: '9:00 AM', color: '#eab308', schedule: 'daily' },
  { name: '晚間總結', time: '9:00 PM', color: '#6366f1', schedule: 'daily' },
  { name: '股票稀缺性研究', time: '7:30 AM', color: '#ec4899', schedule: 'monday' },
  { name: '週報', time: '10:00 PM', color: '#a78bfa', schedule: 'tuesday' },
];

const alwaysRunning = [
  { name: '反應監測器', freq: '每5分鐘', highlighted: false },
  { name: '趨勢雷達', freq: '每日5次', highlighted: true },
  { name: '機會掃描器', freq: '每日6次', highlighted: false },
];

const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

function getTasksForDay(dayIndex: number): ScheduledTask[] {
  const tasks: ScheduledTask[] = [];
  for (const task of scheduledTasks) {
    if (task.schedule === 'daily') {
      tasks.push(task);
    } else if (task.schedule === 'monday' && dayIndex === 1) {
      tasks.push(task);
    } else if (task.schedule === 'tuesday' && dayIndex === 2) {
      tasks.push(task);
    }
  }
  return tasks.sort((a, b) => {
    const toMin = (t: string) => {
      const [time, period] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    return toMin(a.time) - toMin(b.time);
  });
}

// Current day is Tuesday (二)
const currentDayIndex = 2;

// Generate week dates (Sun-Sat around current Tuesday March 10, 2026)
const weekDates = [8, 9, 10, 11, 12, 13, 14];

export default function CalendarPage() {
  const [activeView] = useState<'week' | 'today'>('week');

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] text-[#e8e8ed]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a3a]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">排程任務</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">Henry 的自動化例程</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeView === 'week'
                ? 'bg-[#1e1e2a] text-[#e8e8ed] border border-[#2a2a3a]'
                : 'text-[#8b8b9e] hover:text-[#e8e8ed]'
            }`}
          >
            週
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeView === 'today'
                ? 'bg-[#1e1e2a] text-[#e8e8ed] border border-[#2a2a3a]'
                : 'text-[#8b8b9e] hover:text-[#e8e8ed]'
            }`}
          >
            今天
          </button>
          <button className="p-1.5 rounded-md text-[#8b8b9e] hover:text-[#e8e8ed] hover:bg-[#1e1e2a] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
              <path d="M14 2v3h-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Always Running */}
      <div className="px-6 py-3 border-b border-[#2a2a3a] flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-[#8b8b9e] shrink-0">
          <span className="text-[#f59e0b]">✦</span>
          <span>持續運行中</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {alwaysRunning.map((item) => (
            <span
              key={item.name}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.highlighted
                  ? 'border border-[#ef4444]/50 text-[#ef4444] bg-[#ef4444]/10'
                  : 'bg-[#1a1a24] text-[#8b8b9e] border border-[#2a2a3a]'
              }`}
            >
              {item.name} · {item.freq}
            </span>
          ))}
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="grid grid-cols-7 h-full">
          {dayLabels.map((day, index) => {
            const isCurrentDay = index === currentDayIndex;
            const dayTasks = getTasksForDay(index);

            return (
              <div
                key={day}
                className={`flex flex-col border-r border-[#2a2a3a] last:border-r-0 ${
                  isCurrentDay ? 'bg-[#111118]' : ''
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-3 py-2.5 text-center border-b shrink-0 ${
                    isCurrentDay
                      ? 'border-[#4c8dff] bg-[#4c8dff]/10'
                      : 'border-[#2a2a3a]'
                  }`}
                >
                  <div
                    className={`text-xs font-medium ${
                      isCurrentDay ? 'text-[#4c8dff]' : 'text-[#5c5c72]'
                    }`}
                  >
                    {day}
                  </div>
                  <div
                    className={`text-lg font-semibold mt-0.5 ${
                      isCurrentDay ? 'text-[#4c8dff]' : 'text-[#8b8b9e]'
                    }`}
                  >
                    {weekDates[index]}
                  </div>
                </div>

                {/* Events */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {dayTasks.map((task, taskIndex) => (
                    <div
                      key={`${task.name}-${taskIndex}`}
                      className="rounded-md bg-[#1a1a24] border border-[#2a2a3a] overflow-hidden group hover:border-[#3a3a4a] transition-colors"
                    >
                      <div className="flex">
                        <div
                          className="w-1 shrink-0 rounded-l-md"
                          style={{ backgroundColor: task.color }}
                        />
                        <div className="px-2 py-1.5 min-w-0 flex-1">
                          <div className="text-xs font-medium text-[#e8e8ed] truncate">
                            {task.name}
                          </div>
                          <div className="text-[10px] text-[#5c5c72] mt-0.5">
                            {task.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
