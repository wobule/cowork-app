'use client';

import { FolderOpen } from 'lucide-react';
import { MOCK_PROJECTS } from '@/lib/mock-data';
import type { ProjectInfo } from '@/lib/mock-data';

const STATUS_BADGE: Record<
  ProjectInfo['status'],
  { label: string; bg: string; text: string }
> = {
  active: { label: '進行中', bg: '#34d399', text: '#0a0a0f' },
  planning: { label: '規劃中', bg: '#8b5cf6', text: '#ffffff' },
  completed: { label: '已完成', bg: '#6b7280', text: '#ffffff' },
};

const PRIORITY_BADGE: Record<
  ProjectInfo['priority'],
  { label: string; color: string; bg: string }
> = {
  high: { label: '高', color: '#ef4444', bg: '#ef444420' },
  medium: { label: '中', color: '#f59e0b', bg: '#f59e0b20' },
  low: { label: '低', color: '#6b7280', bg: '#6b728020' },
};

function progressColor(progress: number): string {
  if (progress >= 60) return '#34d399';
  if (progress >= 30) return '#f59e0b';
  return '#4c8dff';
}

function daysAgo(dateStr: string): number {
  const now = new Date('2026-03-12T12:00:00Z');
  const then = new Date(dateStr);
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86400000));
}

function ProjectCard({ project }: { project: ProjectInfo }) {
  const status = STATUS_BADGE[project.status];
  const priority = PRIORITY_BADGE[project.priority];
  const days = daysAgo(project.updatedAt);

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-5 hover:border-[#3a3a4a] transition-colors cursor-pointer group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold text-[#e8e8ed] truncate">
          {project.name}
        </h3>
        <span
          className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-[12px] text-[#8b8b9e] mt-3 line-clamp-2 leading-[1.7]">
        {project.description}
      </p>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="w-full h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.progress}%`,
              backgroundColor: progressColor(project.progress),
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span
            className="text-[12px] font-semibold"
            style={{ color: progressColor(project.progress) }}
          >
            {project.progress}%
          </span>
          <span className="text-[11px] text-[#5c5c72]">
            {project.completedTasks}/{project.totalTasks}
          </span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a3a]">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: project.assigneeColor }}
          >
            {project.assignee[0]}
          </div>
          <span className="text-[12px] text-[#8b8b9e]">
            {project.assignee}
          </span>
        </div>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ backgroundColor: priority.bg, color: priority.color }}
        >
          {priority.label}
        </span>
      </div>

      {/* Timestamp */}
      <p className="text-[10px] text-[#5c5c72] mt-3">
        {days === 0 ? '今天' : `${days} 天前`}由 {project.updatedBy} 更新
      </p>
    </div>
  );
}

export default function ProjectsPage() {
  const activeCount = MOCK_PROJECTS.filter((p) => p.status === 'active').length;
  const planningCount = MOCK_PROJECTS.filter(
    (p) => p.status === 'planning'
  ).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <FolderOpen size={20} className="text-[#34d399]" />
          <h1 className="text-[20px] font-bold text-[#e8e8ed]">專案</h1>
        </div>
        <p className="text-[12px] text-[#5c5c72] mt-1">
          {MOCK_PROJECTS.length} 總計 &middot; {activeCount} 進行中 &middot;{' '}
          {planningCount} 規劃中
        </p>
      </div>

      {/* Card grid */}
      <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MOCK_PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
