'use client';

import {
  Search,
  CalendarDays,
  Settings,
  RefreshCw,
} from 'lucide-react';

export default function TopBar() {
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-bg-secondary/80 backdrop-blur-sm flex-shrink-0">
      {/* Left spacer */}
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
          <Search size={14} strokeWidth={1.5} />
          <span>搜尋</span>
          <kbd className="ml-1 px-1.5 py-0.5 rounded bg-bg-tertiary border border-border text-[10px] text-text-tertiary font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Pause */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
          <CalendarDays size={14} strokeWidth={1.5} />
          <span>暫停</span>
        </button>

        {/* User name */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] text-text-secondary">
          <div className="w-5 h-5 rounded-full bg-accent-purple flex items-center justify-center text-[10px] text-white font-medium">
            H
          </div>
          <span>Ping Henry</span>
        </div>

        {/* Settings */}
        <button className="p-2 rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
          <Settings size={15} strokeWidth={1.5} />
        </button>

        {/* Refresh */}
        <button className="p-2 rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
          <RefreshCw size={15} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
