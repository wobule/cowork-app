'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PanelLeft,
  LayoutGrid,
  ListChecks,
  Bot,
  FileText,
  ShieldCheck,
  Users,
  CalendarDays,
  FolderKanban,
  Brain,
  FileStack,
  UserCircle,
  Building2,
  UsersRound,
  Monitor,
  Radar,
  Factory,
  GitBranch,
  MessageSquare,
  Search,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/tasks', icon: ListChecks, label: '任務' },
  { href: '/agents', icon: Bot, label: '代理人' },
  { href: '/content', icon: FileText, label: '內容' },
  { href: '/approvals', icon: ShieldCheck, label: '審批' },
  { href: '/council', icon: Users, label: '議會' },
  { href: '/calendar', icon: CalendarDays, label: '行事曆' },
  { href: '/projects', icon: FolderKanban, label: '專案' },
  { href: '/memory', icon: Brain, label: '記憶' },
  { href: '/docs', icon: FileStack, label: '文件' },
  { href: '/people', icon: UserCircle, label: '人員' },
  { href: '/office', icon: Building2, label: '辦公室' },
  { href: '/team', icon: UsersRound, label: '團隊' },
  { href: '/system', icon: Monitor, label: '系統' },
  { href: '/radar', icon: Radar, label: '雷達' },
  { href: '/factory', icon: Factory, label: '工廠' },
  { href: '/pipeline', icon: GitBranch, label: '管線' },
  { href: '/feedback', icon: MessageSquare, label: '回饋' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-screen flex flex-col border-r border-border bg-bg-secondary flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <button className="p-1 rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
          <PanelLeft size={16} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} strokeWidth={1.5} className="text-accent" />
          <span className="font-semibold text-text-primary text-[13px]">Mission Control</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="搜尋記憶..."
            className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-md bg-bg-tertiary border border-border-light placeholder:text-text-tertiary focus:border-accent"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="flex flex-col gap-[6px]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-[9px] rounded-md text-[14px] transition-colors ${
                  isActive
                    ? 'bg-bg-active text-text-primary'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <item.icon size={18} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-bg-tertiary flex items-center justify-center text-text-tertiary text-[11px] font-bold">
            N
          </div>
          <span className="text-[11px] text-text-tertiary">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
