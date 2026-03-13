'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, ChevronDown, Sparkles, X, Pencil, Trash2, GripVertical, Check, Send, Clock, MessageSquare, FileText, ArrowRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'recurring' | 'review' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: string;
  project: string;
  projectColor: string;
  labels: { name: string; color: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  agent: string;
  agentColor: string;
  message: string;
  timestamp: string;
}

interface TimelineEntry {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  agentColor: string;
  role: string; // 'agent' | 'user' | 'system'
  content: string;
  createdAt: string;
  type: string; // 'comment' | 'activity'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMNS: { key: Task['status']; label: string; dotColor: string }[] = [
  { key: 'backlog', label: '待處理', dotColor: '#6b7280' },
  { key: 'in_progress', label: '進行中', dotColor: '#f59e0b' },
  { key: 'recurring', label: '週期性', dotColor: '#6366f1' },
  { key: 'review', label: '待檢查', dotColor: '#4c8dff' },
  { key: 'done', label: '完成', dotColor: '#34d399' },
];

const AGENTS = [
  { name: 'Henry', color: '#6366f1' },
  { name: 'Violet', color: '#ec4899' },
  { name: 'Wendy', color: '#f59e0b' },
  { name: 'Jarvis', color: '#4c8dff' },
];

const AGENT_COLORS: Record<string, string> = {
  Henry: '#6366f1',
  Violet: '#ec4899',
  Wendy: '#f59e0b',
  Jarvis: '#4c8dff',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#4c8dff',
  low: '#6b7280',
};

const STATUS_OPTIONS: { value: Task['status']; label: string }[] = [
  { value: 'backlog', label: '待處理' },
  { value: 'in_progress', label: '進行中' },
  { value: 'recurring', label: '週期性' },
  { value: 'review', label: '待檢查' },
  { value: 'done', label: '完成' },
];

const PRIORITY_OPTIONS: { value: Task['priority']; label: string }[] = [
  { value: 'urgent', label: '緊急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '不到一分鐘前';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TasksPage() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // --- Fetch helpers ---
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : data.tasks ?? []);
      }
    } catch {
      /* silently fail */
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : data.activities ?? []);
      }
    } catch {
      /* silently fail */
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchActivities();
  }, [fetchTasks, fetchActivities]);

  // Auto-refresh activities every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // Agent polling: automatically trigger agents to pick up & work on tasks
  useEffect(() => {
    const AGENT_IDS = ['henry', 'violet', 'wendy', 'jarvis'];
    let cancelled = false;

    const pollAgents = async () => {
      if (cancelled) return;
      for (const agentId of AGENT_IDS) {
        try {
          const res = await fetch('/api/agents/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: agentId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.action_taken === 'task_started' || data.action_taken === 'task_moved_to_review') {
              // Refresh data when an agent does something
              await fetchTasks();
              await fetchActivities();
            }
          }
        } catch {
          /* silently fail */
        }
      }
    };

    // Initial poll after 2 seconds
    const initialTimeout = setTimeout(pollAgents, 2000);
    // Then poll every 15 seconds
    const interval = setInterval(pollAgents, 15000);
    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fetchTasks, fetchActivities]);

  // --- Computed stats ---
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTasks = tasks.filter((t) => new Date(t.updatedAt) >= weekAgo);
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // --- Filter tasks ---
  const filteredTasks =
    activeFilters.size > 0 ? tasks.filter((t) => activeFilters.has(t.assignee)) : tasks;

  // --- Agent filter toggle ---
  const toggleFilter = (name: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // --- CRUD handlers ---
  const createTask = async (data: Record<string, string>) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchTasks();
      await fetchActivities();
    } catch {
      /* silently fail */
    }
  };

  const updateTask = async (id: string, data: Record<string, unknown>) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchTasks();
      await fetchActivities();
    } catch {
      /* silently fail */
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      await fetchTasks();
      await fetchActivities();
    } catch {
      /* silently fail */
    }
  };

  const approveTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}/approve`, { method: 'POST' });
      await fetchTasks();
      await fetchActivities();
    } catch {
      /* silently fail */
    }
  };

  // --- Drag & Drop handlers ---
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTaskId) {
      await updateTask(draggedTaskId, { status: newStatus });
      setDraggedTaskId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0f]">
      {/* Stats Bar */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-8">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#34d399]">{weekTasks.length}</span>
            <span className="text-[11px] text-[#8b8b9e]">本週</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#f59e0b]">{inProgressCount}</span>
            <span className="text-[11px] text-[#8b8b9e]">進行中</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#e8e8ed]">{totalCount}</span>
            <span className="text-[11px] text-[#8b8b9e]">總計</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#34d399]">{completionRate}%</span>
            <span className="text-[11px] text-[#8b8b9e]">完成率</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#34d399] hover:bg-[#2cc48d] text-[#0a0a0f] px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} />
          新任務
        </button>
        <div className="flex items-center gap-2 ml-2">
          {AGENTS.map((agent) => (
            <button
              key={agent.name}
              onClick={() => toggleFilter(agent.name)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
                activeFilters.has(agent.name)
                  ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40'
                  : 'bg-[#1e1e2a] text-[#8b8b9e] border border-[#2a2a3a] hover:border-[#3a3a4a]'
              }`}
            >
              {agent.name}
            </button>
          ))}
        </div>
        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-[#8b8b9e] bg-[#1e1e2a] border border-[#2a2a3a] hover:border-[#3a3a4a] transition-colors">
          所有專案
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Main Content: Kanban + Activity */}
      <div className="flex-1 flex min-h-0">
        {/* Kanban Columns - 3 col x 2 row grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-3 gap-4 auto-rows-[minmax(0,1fr)]" style={{ minHeight: 'calc(100% - 1rem)' }}>
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.key);
              const isOver = dragOverColumn === col.key;
              return (
                <div
                  key={col.key}
                  className={`flex flex-col min-h-0 min-w-0 bg-[#111118] rounded-xl border border-[#1e1e2a] p-3 transition-colors ${
                    isOver ? 'bg-[#1a1a24]/80 ring-1 ring-[#34d399]/30' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 px-1 pb-3 flex-shrink-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.dotColor }}
                    />
                    <span className="text-[13px] font-semibold text-[#e8e8ed]">{col.label}</span>
                    {colTasks.length > 0 && (
                      <span className="text-[11px] text-[#5c5c72] bg-[#1e1e2a] px-1.5 py-0.5 rounded-full font-medium">
                        {colTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task cards */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedTask(task)}
                        className={`bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-3.5 hover:border-[#3a3a4a] transition-colors cursor-pointer group relative ${
                          draggedTaskId === task.id ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Hover actions */}
                        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                            }}
                            className="p-1 rounded hover:bg-[#2a2a3a] text-[#5c5c72] hover:text-[#e8e8ed] transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="p-1 rounded hover:bg-[#2a2a3a] text-[#5c5c72] hover:text-[#ef4444] transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Priority + title */}
                        <div className="flex items-start gap-2">
                          <span
                            className="mt-[5px] w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#6b7280' }}
                          />
                          <h4 className="text-[13px] font-bold text-[#e8e8ed] leading-snug line-clamp-2">
                            {task.title}
                          </h4>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-[11px] text-[#8b8b9e] mt-2 line-clamp-2 leading-[1.6] ml-[18px]">
                            {task.description}
                          </p>
                        )}

                        {/* Approve button for review tasks */}
                        {task.status === 'review' && (
                          <div className="ml-[18px] mt-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                approveTask(task.id);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#34d399]/15 text-[#34d399] hover:bg-[#34d399]/25 transition-colors"
                            >
                              <Check size={11} />
                              核准
                            </button>
                          </div>
                        )}

                        {/* Bottom row: avatar, project, time */}
                        <div className="flex items-center justify-between mt-3 ml-[18px]">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: AGENT_COLORS[task.assignee] || '#5c5c72', width: '18px', height: '18px' }}
                            >
                              {task.assignee?.[0] ?? '?'}
                            </div>
                            <span className="text-[11px] text-[#8b8b9e]">{task.assignee}</span>
                          </div>
                          <span className="text-[10px] text-[#5c5c72]">
                            {relativeTime(task.updatedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="flex items-center justify-center py-6 text-[12px] text-[#3a3a4a]">
                        拖放任務至此
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Panel */}
        <div className="w-[260px] flex-shrink-0 border-l border-[#2a2a3a] bg-[#111118] flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-[#2a2a3a]">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#f59e0b]" />
              <span className="text-[13px] font-semibold text-[#e8e8ed]">即時動態</span>
            </div>
            <p className="text-[11px] text-[#5c5c72] mt-0.5">過去一小時</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-2.5">
                <span
                  className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activity.agentColor }}
                />
                <div className="min-w-0">
                  <p className="text-[12px] leading-relaxed">
                    <span className="font-semibold" style={{ color: activity.agentColor }}>
                      {activity.agent}
                    </span>{' '}
                    <span className="text-[#8b8b9e]">{activity.message}</span>
                  </p>
                  <span className="text-[10px] text-[#5c5c72]">
                    {relativeTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-[12px] text-[#5c5c72] text-center py-8">尚無動態</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createTask(data);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={async (data) => {
            await updateTask(editingTask.id, data);
            setEditingTask(null);
          }}
          onDelete={async () => {
            await deleteTask(editingTask.id);
            setEditingTask(null);
          }}
        />
      )}

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            setEditingTask(selectedTask);
            setSelectedTask(null);
          }}
          onApprove={async () => {
            await approveTask(selectedTask.id);
            setSelectedTask(null);
          }}
          onStatusChange={async (status) => {
            await updateTask(selectedTask.id, { status });
            await fetchTasks();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Modal (Create / Edit)
// ---------------------------------------------------------------------------

function TaskModal({
  task,
  onClose,
  onSubmit,
  onDelete,
}: {
  task?: Task;
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<string>(task?.status ?? 'backlog');
  const [priority, setPriority] = useState<string>(task?.priority ?? 'medium');
  const [assignee, setAssignee] = useState(task?.assignee ?? 'Henry');
  const [project, setProject] = useState(task?.project ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await onSubmit({ title, description, status, priority, assignee, project });
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSubmitting(true);
    await onDelete();
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold text-[#e8e8ed]">
            {isEdit ? '編輯任務' : '建立新任務'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2a2a3a] text-[#5c5c72] hover:text-[#e8e8ed] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[12px] text-[#8b8b9e] mb-1">標題</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任務標題"
              className="w-full bg-[#111118] border border-[#2a2a3a] rounded-md px-3 py-2 text-[13px] text-[#e8e8ed] placeholder-[#5c5c72] outline-none focus:border-[#4c8dff] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] text-[#8b8b9e] mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="任務描述"
              rows={3}
              className="w-full bg-[#111118] border border-[#2a2a3a] rounded-md px-3 py-2 text-[13px] text-[#e8e8ed] placeholder-[#5c5c72] outline-none focus:border-[#4c8dff] transition-colors resize-none"
            />
          </div>

          {/* Status + Priority row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[12px] text-[#8b8b9e] mb-1">狀態</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#111118] border border-[#2a2a3a] rounded-md px-3 py-2 text-[13px] text-[#e8e8ed] outline-none focus:border-[#4c8dff] transition-colors"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[12px] text-[#8b8b9e] mb-1">優先級</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#111118] border border-[#2a2a3a] rounded-md px-3 py-2 text-[13px] text-[#e8e8ed] outline-none focus:border-[#4c8dff] transition-colors"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[12px] text-[#8b8b9e] mb-1">負責人</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-[#111118] border border-[#2a2a3a] rounded-md px-3 py-2 text-[13px] text-[#e8e8ed] outline-none focus:border-[#4c8dff] transition-colors"
            >
              {AGENTS.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-[12px] text-[#8b8b9e] mb-1">專案</label>
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="專案名稱"
              className="w-full bg-[#111118] border border-[#2a2a3a] rounded-md px-3 py-2 text-[13px] text-[#e8e8ed] placeholder-[#5c5c72] outline-none focus:border-[#4c8dff] transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {isEdit && onDelete && (
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                刪除
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-[13px] font-medium text-[#8b8b9e] hover:bg-[#2a2a3a] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim()}
              className="px-4 py-1.5 rounded-md text-[13px] font-semibold bg-[#34d399] hover:bg-[#2cc48d] text-[#0a0a0f] transition-colors disabled:opacity-50"
            >
              {isEdit ? '儲存' : '建立'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Detail Panel (Slide-over)
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  backlog: '待處理',
  in_progress: '進行中',
  recurring: '週期性',
  review: '待檢查',
  done: '完成',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: '緊急',
  high: '高',
  medium: '中',
  low: '低',
};

function TaskDetailPanel({
  task,
  onClose,
  onEdit,
  onApprove,
  onStatusChange,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => Promise<void>;
  onStatusChange: (status: string) => Promise<void>;
}) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch timeline — only update state when data actually changes
  const timelineLenRef = useRef(0);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        // Only update state if the number of entries changed (avoids unnecessary re-renders)
        if (arr.length !== timelineLenRef.current) {
          timelineLenRef.current = arr.length;
          setTimeline(arr);
        }
      }
    } catch { /* silently fail */ }
  }, [task.id]);

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 5000);
    return () => clearInterval(interval);
  }, [fetchTimeline]);

  // Auto scroll to bottom only if user is near the bottom already
  const isNearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current && isNearBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [timeline]);

  // Send user message
  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          role: 'user',
          agent_name: '你',
          agent_color: '#34d399',
        }),
      });
      setMessage('');
      isNearBottomRef.current = true;
      await fetchTimeline();
    } catch { /* silently fail */ }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div
        className="relative w-full max-w-[560px] bg-[#0e0e14] border-l border-[#2a2a3a] flex flex-col h-full animate-[slideInRight_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3a] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#6b7280' }}
            />
            <h2 className="text-[15px] font-bold text-[#e8e8ed] truncate">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md hover:bg-[#2a2a3a] text-[#8b8b9e] hover:text-[#e8e8ed] transition-colors"
              title="編輯"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-[#2a2a3a] text-[#8b8b9e] hover:text-[#e8e8ed] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Task Meta */}
        <div className="px-6 py-4 border-b border-[#2a2a3a] flex-shrink-0 space-y-3">
          {/* Status + Priority + Assignee */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#2a2a3a] text-[#8b8b9e]">
              {STATUS_LABELS[task.status] || task.status}
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: (PRIORITY_COLORS[task.priority] || '#6b7280') + '20',
                color: PRIORITY_COLORS[task.priority] || '#6b7280',
              }}
            >
              {PRIORITY_LABELS[task.priority] || task.priority}
            </span>
            {task.assignee && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#8b8b9e]">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: AGENT_COLORS[task.assignee] || '#5c5c72' }}
                >
                  {task.assignee[0]}
                </span>
                {task.assignee}
              </span>
            )}
            {task.project && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: (task.projectColor || '#5c5c72') + '20',
                  color: task.projectColor || '#5c5c72',
                }}
              >
                {task.project}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-[12px] text-[#8b8b9e] leading-[1.7]">{task.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {task.status === 'review' && (
              <button
                onClick={onApprove}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold bg-[#34d399]/15 text-[#34d399] hover:bg-[#34d399]/25 transition-colors"
              >
                <Check size={12} />
                核准通過
              </button>
            )}
            {task.status === 'backlog' && (
              <button
                onClick={() => onStatusChange('in_progress')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold bg-[#f59e0b]/15 text-[#f59e0b] hover:bg-[#f59e0b]/25 transition-colors"
              >
                <ArrowRight size={12} />
                立即開始
              </button>
            )}
          </div>
        </div>

        {/* Timeline / Conversation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1e1e2a] flex-shrink-0">
          <MessageSquare size={13} className="text-[#5c5c72]" />
          <span className="text-[12px] font-semibold text-[#8b8b9e]">處理紀錄與對話</span>
          {timeline.length > 0 && (
            <span className="text-[10px] text-[#5c5c72] bg-[#1e1e2a] px-1.5 py-0.5 rounded-full">
              {timeline.length}
            </span>
          )}
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {timeline.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={32} className="text-[#2a2a3a] mb-3" />
              <p className="text-[13px] text-[#5c5c72]">尚無紀錄</p>
              <p className="text-[11px] text-[#3a3a4a] mt-1">代理人開始工作後，進度和輸出會顯示在這裡</p>
            </div>
          )}

          {timeline.map((entry) => {
            const isUser = entry.role === 'user';
            const isSystem = entry.type === 'activity';

            if (isSystem) {
              return (
                <div key={entry.id} className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-[#1e1e2a]" />
                  <div className="flex items-center gap-1.5 px-2">
                    <Clock size={10} className="text-[#5c5c72]" />
                    <span className="text-[10px] text-[#5c5c72]">
                      <span style={{ color: entry.agentColor }}>{entry.agentName}</span>
                      {' '}{entry.content}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-[#1e1e2a]" />
                </div>
              );
            }

            return (
              <div key={entry.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: isUser ? '#34d399' : (entry.agentColor || '#5c5c72') }}
                >
                  {isUser ? '你' : (entry.agentName?.[0] ?? '?')}
                </div>

                {/* Message bubble */}
                <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
                    <span className="text-[11px] font-semibold" style={{ color: isUser ? '#34d399' : entry.agentColor }}>
                      {isUser ? '你' : entry.agentName}
                    </span>
                    <span className="text-[10px] text-[#5c5c72]">
                      {relativeTime(entry.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`text-[12px] leading-[1.8] rounded-lg p-3 whitespace-pre-wrap text-left ${
                      isUser
                        ? 'bg-[#34d399]/10 text-[#e8e8ed] border border-[#34d399]/20 ml-8'
                        : 'bg-[#1a1a24] text-[#c8c8d4] border border-[#2a2a3a] mr-8'
                    }`}
                  >
                    {entry.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t border-[#2a2a3a] flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入指令或訊息給代理人..."
              rows={2}
              className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2.5 text-[13px] text-[#e8e8ed] placeholder-[#5c5c72] outline-none focus:border-[#4c8dff] transition-colors resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="p-2.5 rounded-lg bg-[#34d399] hover:bg-[#2cc48d] text-[#0a0a0f] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-[#3a3a4a] mt-1.5">按 Enter 發送，Shift+Enter 換行</p>
        </div>
      </div>
    </div>
  );
}
