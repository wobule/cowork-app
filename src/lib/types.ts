export type Status = 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled';
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface Item {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  project_id: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemWithLabels extends Item {
  labels: Label[];
}

export interface Project {
  id: number;
  name: string;
  color: string;
  description: string;
  created_at: string;
  item_count?: number;
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface SavedView {
  id: number;
  name: string;
  filters: ViewFilters;
  sort: ViewSort;
  project_id: number | null;
}

export interface ViewFilters {
  status?: Status[];
  priority?: Priority[];
  label_ids?: number[];
  search?: string;
  project_id?: number | null;
}

export interface ViewSort {
  field: 'priority' | 'created_at' | 'updated_at' | 'due_date' | 'title';
  direction: 'asc' | 'desc';
}

export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: '#6b7280' },
  todo: { label: 'Todo', color: '#a78bfa' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  done: { label: 'Done', color: '#22c55e' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; order: number }> = {
  urgent: { label: 'Urgent', color: '#ef4444', order: 0 },
  high: { label: 'High', color: '#f97316', order: 1 },
  medium: { label: 'Medium', color: '#f59e0b', order: 2 },
  low: { label: 'Low', color: '#6b7280', order: 3 },
  none: { label: 'No priority', color: '#374151', order: 4 },
};

export const STATUSES: Status[] = ['backlog', 'todo', 'in_progress', 'done', 'cancelled'];
export const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low', 'none'];
