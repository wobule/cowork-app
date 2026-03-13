'use server';

import { getDb } from './db';
import type { Item, ItemWithLabels, Label, Project, SavedView, ViewFilters, ViewSort } from './types';

// ─── Items ──────────────────────────────────────────

export async function getItems(filters?: ViewFilters, sort?: ViewSort): Promise<ItemWithLabels[]> {
  const db = await getDb();
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

  const itemsResult = await db.execute({ sql: `SELECT i.* FROM items i ${where} ${orderBy}`, args: params as (string | number | null)[] });
  const items = itemsResult.rows as unknown as Item[];

  const result: ItemWithLabels[] = [];
  for (const item of items) {
    const labelsResult = await db.execute({
      sql: 'SELECT l.* FROM labels l JOIN item_labels il ON il.label_id = l.id WHERE il.item_id = ?',
      args: [item.id],
    });
    result.push({ ...item, labels: labelsResult.rows as unknown as Label[] });
  }
  return result;
}

export async function getItem(id: number): Promise<ItemWithLabels | null> {
  const db = await getDb();
  const itemResult = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] });
  const item = itemResult.rows[0] as unknown as Item | undefined;
  if (!item) return null;
  const labelsResult = await db.execute({
    sql: 'SELECT l.* FROM labels l JOIN item_labels il ON il.label_id = l.id WHERE il.item_id = ?',
    args: [id],
  });
  return { ...item, labels: labelsResult.rows as unknown as Label[] };
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
  const db = await getDb();
  const result = await db.execute({
    sql: 'INSERT INTO items (title, description, status, priority, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?)',
    args: [
      data.title,
      data.description || '',
      data.status || 'todo',
      data.priority || 'none',
      data.project_id ?? null,
      data.due_date ?? null,
    ],
  });

  const insertedId = Number(result.lastInsertRowid);

  if (data.label_ids?.length) {
    for (const lid of data.label_ids) {
      await db.execute({ sql: 'INSERT INTO item_labels (item_id, label_id) VALUES (?, ?)', args: [insertedId, lid] });
    }
  }

  const row = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [insertedId] });
  return row.rows[0] as unknown as Item;
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
  const db = await getDb();
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
    await db.execute({ sql: `UPDATE items SET ${fields.join(', ')} WHERE id = ?`, args: params as (string | number | null)[] });
  }

  if (data.label_ids !== undefined) {
    await db.execute({ sql: 'DELETE FROM item_labels WHERE item_id = ?', args: [id] });
    for (const lid of data.label_ids) {
      await db.execute({ sql: 'INSERT INTO item_labels (item_id, label_id) VALUES (?, ?)', args: [id, lid] });
    }
  }

  const row = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] });
  return row.rows[0] as unknown as Item;
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM items WHERE id = ?', args: [id] });
}

export async function deleteItems(ids: number[]): Promise<void> {
  const db = await getDb();
  for (const id of ids) {
    await db.execute({ sql: 'DELETE FROM items WHERE id = ?', args: [id] });
  }
}

export async function updateItemStatus(id: number, status: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "UPDATE items SET status = ?, updated_at = datetime('now') WHERE id = ?", args: [status, id] });
}

// ─── Projects ───────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const db = await getDb();
  const result = await db.execute(`
    SELECT p.*, (SELECT COUNT(*) FROM items WHERE project_id = p.id) as item_count
    FROM projects p ORDER BY p.created_at DESC
  `);
  return result.rows as unknown as Project[];
}

export async function getProject(id: number): Promise<Project | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT p.*, (SELECT COUNT(*) FROM items WHERE project_id = p.id) as item_count FROM projects p WHERE p.id = ?`,
    args: [id],
  });
  return (result.rows[0] as unknown as Project) || null;
}

export async function createProject(data: { name: string; color?: string; description?: string }): Promise<Project> {
  const db = await getDb();
  const result = await db.execute({
    sql: 'INSERT INTO projects (name, color, description) VALUES (?, ?, ?)',
    args: [data.name, data.color || '#6366f1', data.description || ''],
  });
  const row = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return row.rows[0] as unknown as Project;
}

export async function updateProject(id: number, data: { name?: string; color?: string; description?: string }): Promise<Project> {
  const db = await getDb();
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
  if (data.color !== undefined) { fields.push('color = ?'); params.push(data.color); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (fields.length) {
    params.push(id);
    await db.execute({ sql: `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, args: params as (string | number | null)[] });
  }
  const row = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [id] });
  return row.rows[0] as unknown as Project;
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] });
}

// ─── Labels ─────────────────────────────────────────

export async function getLabels(): Promise<Label[]> {
  const db = await getDb();
  const result = await db.execute('SELECT * FROM labels ORDER BY name');
  return result.rows as unknown as Label[];
}

export async function createLabel(data: { name: string; color?: string }): Promise<Label> {
  const db = await getDb();
  const result = await db.execute({ sql: 'INSERT INTO labels (name, color) VALUES (?, ?)', args: [data.name, data.color || '#6366f1'] });
  const row = await db.execute({ sql: 'SELECT * FROM labels WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return row.rows[0] as unknown as Label;
}

export async function updateLabel(id: number, data: { name?: string; color?: string }): Promise<Label> {
  const db = await getDb();
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
  if (data.color !== undefined) { fields.push('color = ?'); params.push(data.color); }
  if (fields.length) {
    params.push(id);
    await db.execute({ sql: `UPDATE labels SET ${fields.join(', ')} WHERE id = ?`, args: params as (string | number | null)[] });
  }
  const row = await db.execute({ sql: 'SELECT * FROM labels WHERE id = ?', args: [id] });
  return row.rows[0] as unknown as Label;
}

export async function deleteLabel(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM labels WHERE id = ?', args: [id] });
}

// ─── Saved Views ────────────────────────────────────

export async function getSavedViews(): Promise<SavedView[]> {
  const db = await getDb();
  const result = await db.execute('SELECT * FROM views ORDER BY name');
  return result.rows.map(r => ({
    id: r.id as number,
    name: r.name as string,
    filters: JSON.parse(r.filters as string),
    sort: JSON.parse(r.sort as string),
    project_id: r.project_id as number | null,
  }));
}

export async function createSavedView(data: { name: string; filters: ViewFilters; sort: ViewSort; project_id?: number | null }): Promise<SavedView> {
  const db = await getDb();
  const result = await db.execute({
    sql: 'INSERT INTO views (name, filters, sort, project_id) VALUES (?, ?, ?, ?)',
    args: [data.name, JSON.stringify(data.filters), JSON.stringify(data.sort), data.project_id ?? null],
  });
  const row = await db.execute({ sql: 'SELECT * FROM views WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  const r = row.rows[0];
  return { id: r.id as number, name: r.name as string, filters: JSON.parse(r.filters as string), sort: JSON.parse(r.sort as string), project_id: r.project_id as number | null };
}

export async function deleteSavedView(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM views WHERE id = ?', args: [id] });
}

// ─── Dashboard Stats ────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  const totalResult = await db.execute('SELECT COUNT(*) as c FROM items');
  const total = Number(totalResult.rows[0].c);
  const byStatusResult = await db.execute('SELECT status, COUNT(*) as count FROM items GROUP BY status');
  const byStatus = byStatusResult.rows as unknown as { status: string; count: number }[];
  const byPriorityResult = await db.execute('SELECT priority, COUNT(*) as count FROM items GROUP BY priority');
  const byPriority = byPriorityResult.rows as unknown as { priority: string; count: number }[];
  const recentResult = await db.execute('SELECT * FROM items ORDER BY created_at DESC LIMIT 5');
  const recent = recentResult.rows as unknown as Item[];
  const upcomingResult = await db.execute("SELECT * FROM items WHERE due_date IS NOT NULL AND status NOT IN ('done','cancelled') ORDER BY due_date ASC LIMIT 5");
  const upcoming = upcomingResult.rows as unknown as Item[];
  const inProgressResult = await db.execute("SELECT COUNT(*) as c FROM items WHERE status = 'in_progress'");
  const inProgress = Number(inProgressResult.rows[0].c);

  return { total, byStatus, byPriority, recent, upcoming, inProgress };
}
