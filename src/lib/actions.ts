'use server';

import { getDb } from './db';
import type { Item, ItemWithLabels, Label, Project, SavedView, ViewFilters, ViewSort } from './types';

// ─── Items ──────────────────────────────────────────

export async function getItems(filters?: ViewFilters, sort?: ViewSort): Promise<ItemWithLabels[]> {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.status?.length) {
    conditions.push(`i.status IN (${filters.status.map(() => '?').join(',')})`);
    params.push(...filters.status);
  }
  if (filters?.priority?.length) {
    conditions.push(`i.priority IN (${filters.priority.map(() => '?').join(',')})`);
    params.push(...filters.priority);
  }
  if (filters?.project_id !== undefined && filters.project_id !== null) {
    conditions.push('i.project_id = ?');
    params.push(filters.project_id);
  }
  if (filters?.search) {
    conditions.push('(i.title LIKE ? OR i.description LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term);
  }
  if (filters?.label_ids?.length) {
    conditions.push(`i.id IN (SELECT item_id FROM item_labels WHERE label_id IN (${filters.label_ids.map(() => '?').join(',')}))`);
    params.push(...filters.label_ids);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortField = sort?.field || 'created_at';
  const sortDir = sort?.direction || 'desc';
  const orderMap: Record<string, string> = {
    priority: `CASE i.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END`,
    created_at: 'i.created_at',
    updated_at: 'i.updated_at',
    due_date: 'i.due_date',
    title: 'i.title',
  };
  const orderBy = `ORDER BY ${orderMap[sortField] || 'i.created_at'} ${sortDir}`;

  const items = db.prepare(`SELECT i.* FROM items i ${where} ${orderBy}`).all(...params) as Item[];

  const labelStmt = db.prepare(`
    SELECT l.* FROM labels l
    JOIN item_labels il ON il.label_id = l.id
    WHERE il.item_id = ?
  `);

  return items.map(item => ({
    ...item,
    labels: labelStmt.all(item.id) as Label[],
  }));
}

export async function getItem(id: number): Promise<ItemWithLabels | null> {
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item | undefined;
  if (!item) return null;
  const labels = db.prepare(`
    SELECT l.* FROM labels l JOIN item_labels il ON il.label_id = l.id WHERE il.item_id = ?
  `).all(id) as Label[];
  return { ...item, labels };
}

export async function createItem(data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id?: number | null;
  due_date?: string | null;
  label_ids?: number[];
}): Promise<Item> {
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO items (title, description, status, priority, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    data.title,
    data.description || '',
    data.status || 'todo',
    data.priority || 'none',
    data.project_id ?? null,
    data.due_date ?? null,
  );

  if (data.label_ids?.length) {
    const stmt = db.prepare('INSERT INTO item_labels (item_id, label_id) VALUES (?, ?)');
    for (const lid of data.label_ids) {
      stmt.run(result.lastInsertRowid, lid);
    }
  }

  return db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid) as Item;
}

export async function updateItem(id: number, data: {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  project_id?: number | null;
  due_date?: string | null;
  label_ids?: number[];
}): Promise<Item> {
  const db = getDb();
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
  if (data.priority !== undefined) { fields.push('priority = ?'); params.push(data.priority); }
  if (data.project_id !== undefined) { fields.push('project_id = ?'); params.push(data.project_id); }
  if (data.due_date !== undefined) { fields.push('due_date = ?'); params.push(data.due_date); }

  if (fields.length) {
    fields.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  if (data.label_ids !== undefined) {
    db.prepare('DELETE FROM item_labels WHERE item_id = ?').run(id);
    const stmt = db.prepare('INSERT INTO item_labels (item_id, label_id) VALUES (?, ?)');
    for (const lid of data.label_ids) {
      stmt.run(id, lid);
    }
  }

  return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as Item;
}

export async function deleteItem(id: number): Promise<void> {
  getDb().prepare('DELETE FROM items WHERE id = ?').run(id);
}

export async function deleteItems(ids: number[]): Promise<void> {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM items WHERE id = ?');
  for (const id of ids) stmt.run(id);
}

export async function updateItemStatus(id: number, status: string): Promise<void> {
  getDb().prepare("UPDATE items SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

// ─── Projects ───────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM items WHERE project_id = p.id) as item_count
    FROM projects p ORDER BY p.created_at DESC
  `).all() as Project[];
}

export async function getProject(id: number): Promise<Project | null> {
  const db = getDb();
  return (db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM items WHERE project_id = p.id) as item_count
    FROM projects p WHERE p.id = ?
  `).get(id) as Project) || null;
}

export async function createProject(data: { name: string; color?: string; description?: string }): Promise<Project> {
  const db = getDb();
  const result = db.prepare('INSERT INTO projects (name, color, description) VALUES (?, ?, ?)').run(
    data.name, data.color || '#6366f1', data.description || ''
  );
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid) as Project;
}

export async function updateProject(id: number, data: { name?: string; color?: string; description?: string }): Promise<Project> {
  const db = getDb();
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
  if (data.color !== undefined) { fields.push('color = ?'); params.push(data.color); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (fields.length) {
    params.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
}

export async function deleteProject(id: number): Promise<void> {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ─── Labels ─────────────────────────────────────────

export async function getLabels(): Promise<Label[]> {
  return getDb().prepare('SELECT * FROM labels ORDER BY name').all() as Label[];
}

export async function createLabel(data: { name: string; color?: string }): Promise<Label> {
  const db = getDb();
  const result = db.prepare('INSERT INTO labels (name, color) VALUES (?, ?)').run(data.name, data.color || '#6366f1');
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(result.lastInsertRowid) as Label;
}

export async function updateLabel(id: number, data: { name?: string; color?: string }): Promise<Label> {
  const db = getDb();
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
  if (data.color !== undefined) { fields.push('color = ?'); params.push(data.color); }
  if (fields.length) {
    params.push(id);
    db.prepare(`UPDATE labels SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label;
}

export async function deleteLabel(id: number): Promise<void> {
  getDb().prepare('DELETE FROM labels WHERE id = ?').run(id);
}

// ─── Saved Views ────────────────────────────────────

export async function getSavedViews(): Promise<SavedView[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM views ORDER BY name').all() as { id: number; name: string; filters: string; sort: string; project_id: number | null }[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    filters: JSON.parse(r.filters),
    sort: JSON.parse(r.sort),
    project_id: r.project_id,
  }));
}

export async function createSavedView(data: { name: string; filters: ViewFilters; sort: ViewSort; project_id?: number | null }): Promise<SavedView> {
  const db = getDb();
  const result = db.prepare('INSERT INTO views (name, filters, sort, project_id) VALUES (?, ?, ?, ?)').run(
    data.name, JSON.stringify(data.filters), JSON.stringify(data.sort), data.project_id ?? null
  );
  const row = db.prepare('SELECT * FROM views WHERE id = ?').get(result.lastInsertRowid) as { id: number; name: string; filters: string; sort: string; project_id: number | null };
  return { ...row, filters: JSON.parse(row.filters), sort: JSON.parse(row.sort) };
}

export async function deleteSavedView(id: number): Promise<void> {
  getDb().prepare('DELETE FROM views WHERE id = ?').run(id);
}

// ─── Dashboard Stats ────────────────────────────────

export async function getDashboardStats() {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as c FROM items').get() as { c: number }).c;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM items GROUP BY status').all() as { status: string; count: number }[];
  const byPriority = db.prepare('SELECT priority, COUNT(*) as count FROM items GROUP BY priority').all() as { priority: string; count: number }[];
  const recent = db.prepare('SELECT * FROM items ORDER BY created_at DESC LIMIT 5').all() as Item[];
  const upcoming = db.prepare("SELECT * FROM items WHERE due_date IS NOT NULL AND status NOT IN ('done','cancelled') ORDER BY due_date ASC LIMIT 5").all() as Item[];
  const inProgress = (db.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'in_progress'").get() as { c: number }).c;

  return { total, byStatus, byPriority, recent, upcoming, inProgress };
}
