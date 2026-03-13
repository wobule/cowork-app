import { createClient, type Client } from '@libsql/client';
import crypto from 'crypto';

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:data/mission-control.db';
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

let _initPromise: Promise<void> | null = null;

async function db(): Promise<Client> {
  if (!_initPromise) {
    _initPromise = migrate(getClient());
  }
  await _initPromise;
  return getClient();
}

// Re-export for routes that need raw queries
export { db as getDb };

async function migrate(c: Client) {
  await c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT DEFAULT '',
      description TEXT DEFAULT '',
      model TEXT DEFAULT 'claude-opus-4-0-20250514',
      color TEXT DEFAULT '#6366f1',
      avatar TEXT DEFAULT '🤖',
      skills TEXT DEFAULT '[]',
      status TEXT DEFAULT 'idle',
      current_task_id TEXT DEFAULT NULL,
      poll_interval INTEGER DEFAULT 30,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'backlog',
      priority TEXT DEFAULT 'medium',
      assignee_id TEXT DEFAULT NULL,
      project TEXT DEFAULT '',
      project_color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      agent_color TEXT DEFAULT '#6366f1',
      message TEXT NOT NULL,
      task_id TEXT DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      agent_id TEXT DEFAULT NULL,
      agent_name TEXT DEFAULT '',
      agent_color TEXT DEFAULT '#6366f1',
      role TEXT DEFAULT 'agent',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memory_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT DEFAULT NULL,
      agent_name TEXT DEFAULT '',
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      file_path TEXT DEFAULT NULL,
      entry_type TEXT DEFAULT 'conversation',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add subtask columns to tasks
  for (const [table, column, definition] of [
    ['tasks', 'parent_task_id', 'TEXT DEFAULT NULL'],
    ['tasks', 'created_by_agent_id', 'TEXT DEFAULT NULL'],
  ]) {
    try {
      await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch {
      // Column already exists — ignore
    }
  }

  // Seed agents if empty
  const result = await c.execute('SELECT COUNT(*) as c FROM agents');
  if (Number(result.rows[0].c) === 0) {
    await seed(c);
  }
}

async function seed(c: Client) {
  const agents = [
    ['henry', 'Henry', '參謀長', '🎖️', '#6366f1', 'claude-opus-4-0-20250514', JSON.stringify(['策略規劃', '任務協調', '決策分析'])],
    ['violet', 'Violet', '設計師', '🎨', '#ec4899', 'claude-opus-4-0-20250514', JSON.stringify(['UI設計', '品牌設計', '原型製作'])],
    ['wendy', 'Wendy', '研究員', '🔬', '#f59e0b', 'claude-sonnet-4-20250514', JSON.stringify(['市場研究', '數據分析', '趨勢追蹤'])],
    ['jarvis', 'Jarvis', '工程師', '⚙️', '#4c8dff', 'claude-opus-4-0-20250514', JSON.stringify(['全端開發', '系統架構', 'API設計'])],
  ];

  for (const a of agents) {
    await c.execute({
      sql: 'INSERT INTO agents (id, name, role, avatar, color, model, skills) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: a,
    });
  }
}

// ─── Helper Functions ────────────────────────────────────────────────

export async function getAllTasks() {
  const c = await db();
  const result = await c.execute(`
    SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
    FROM tasks t
    LEFT JOIN agents a ON t.assignee_id = a.id
    ORDER BY t.created_at DESC
  `);
  return result.rows;
}

export async function getTasksByStatus(status: string) {
  const c = await db();
  const result = await c.execute({
    sql: `
      SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
      FROM tasks t
      LEFT JOIN agents a ON t.assignee_id = a.id
      WHERE t.status = ?
      ORDER BY t.created_at DESC
    `,
    args: [status],
  });
  return result.rows;
}

export async function createTask(data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  project?: string;
  project_color?: string;
  parent_task_id?: string | null;
  created_by_agent_id?: string | null;
}) {
  const c = await db();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.execute({
    sql: `
      INSERT INTO tasks (id, title, description, status, priority, assignee_id, project, project_color, parent_task_id, created_by_agent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      data.title,
      data.description ?? '',
      data.status ?? 'backlog',
      data.priority ?? 'medium',
      data.assignee_id ?? null,
      data.project ?? '',
      data.project_color ?? '#6366f1',
      data.parent_task_id ?? null,
      data.created_by_agent_id ?? null,
      now,
      now,
    ],
  });

  const result = await c.execute({
    sql: `
      SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
      FROM tasks t
      LEFT JOIN agents a ON t.assignee_id = a.id
      WHERE t.id = ?
    `,
    args: [id],
  });
  return result.rows[0];
}

export async function updateTask(id: string, data: Record<string, unknown>) {
  const c = await db();
  const allowed = ['title', 'description', 'status', 'priority', 'assignee_id', 'project', 'project_color', 'parent_task_id'];
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key] as string | number | null);
    }
  }

  if (fields.length === 0) {
    const result = await c.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [id] });
    return result.rows[0];
  }

  fields.push(`updated_at = ?`);
  values.push(new Date().toISOString());
  values.push(id);

  await c.execute({
    sql: `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
    args: values as (string | number | null)[],
  });

  const result = await c.execute({
    sql: `
      SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
      FROM tasks t
      LEFT JOIN agents a ON t.assignee_id = a.id
      WHERE t.id = ?
    `,
    args: [id],
  });
  return result.rows[0];
}

export async function deleteTask(id: string) {
  const c = await db();
  await c.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [id] });
}

export async function getAllAgents() {
  const c = await db();
  const result = await c.execute('SELECT * FROM agents ORDER BY created_at ASC');
  return result.rows;
}

export async function getAgent(id: string) {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT * FROM agents WHERE id = ?', args: [id] });
  return result.rows[0] ?? null;
}

export async function getAgentByName(name: string) {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT * FROM agents WHERE name = ?', args: [name] });
  return result.rows[0] ?? null;
}

export async function updateAgent(id: string, data: Record<string, unknown>) {
  const c = await db();
  const allowed = ['role', 'description', 'model', 'skills', 'poll_interval', 'enabled', 'status', 'current_task_id'];
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      const val = key === 'skills' && Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key];
      values.push(val as string | number | null);
    }
  }

  if (fields.length === 0) {
    const result = await c.execute({ sql: 'SELECT * FROM agents WHERE id = ?', args: [id] });
    return result.rows[0];
  }

  fields.push(`updated_at = ?`);
  values.push(new Date().toISOString());
  values.push(id);

  await c.execute({
    sql: `UPDATE agents SET ${fields.join(', ')} WHERE id = ?`,
    args: values as (string | number | null)[],
  });

  const result = await c.execute({ sql: 'SELECT * FROM agents WHERE id = ?', args: [id] });
  return result.rows[0];
}

export async function getActivities(limit = 50) {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT * FROM activities ORDER BY created_at DESC LIMIT ?', args: [limit] });
  return result.rows;
}

export async function createActivity(data: {
  agent_id: string;
  agent_name: string;
  agent_color?: string;
  message: string;
  task_id?: string | null;
}) {
  const c = await db();
  const result = await c.execute({
    sql: 'INSERT INTO activities (agent_id, agent_name, agent_color, message, task_id) VALUES (?, ?, ?, ?, ?)',
    args: [
      data.agent_id,
      data.agent_name,
      data.agent_color ?? '#6366f1',
      data.message,
      data.task_id ?? null,
    ],
  });

  const row = await c.execute({ sql: 'SELECT * FROM activities WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return row.rows[0];
}

// ─── Settings ───────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
  return (result.rows[0]?.value as string) ?? null;
}

export async function setSetting(key: string, value: string) {
  const c = await db();
  await c.execute({
    sql: `
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    args: [key, value, new Date().toISOString()],
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const c = await db();
  const result = await c.execute('SELECT key, value FROM settings');
  const out: Record<string, string> = {};
  for (const r of result.rows) out[r.key as string] = r.value as string;
  return out;
}

// ─── Task Comments ──────────────────────────────────────────────────

export async function getTaskComments(taskId: string) {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC', args: [taskId] });
  return result.rows;
}

export async function createTaskComment(data: {
  task_id: string;
  agent_id?: string | null;
  agent_name?: string;
  agent_color?: string;
  role?: string;
  content: string;
}) {
  const c = await db();
  const result = await c.execute({
    sql: 'INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      data.task_id,
      data.agent_id ?? null,
      data.agent_name ?? '',
      data.agent_color ?? '#6366f1',
      data.role ?? 'agent',
      data.content,
      new Date().toISOString(),
    ],
  });

  const row = await c.execute({ sql: 'SELECT * FROM task_comments WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return row.rows[0];
}

export async function getTaskActivities(taskId: string) {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT * FROM activities WHERE task_id = ? ORDER BY created_at ASC', args: [taskId] });
  return result.rows;
}

export async function getAllMemoryEntries() {
  const c = await db();
  const result = await c.execute('SELECT * FROM memory_entries ORDER BY created_at DESC');
  return result.rows;
}

export async function createMemoryEntry(data: {
  agent_id?: string | null;
  agent_name?: string;
  title: string;
  content?: string;
  file_path?: string | null;
  entry_type?: string;
}) {
  const c = await db();
  const now = new Date().toISOString();

  const result = await c.execute({
    sql: 'INSERT INTO memory_entries (agent_id, agent_name, title, content, file_path, entry_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      data.agent_id ?? null,
      data.agent_name ?? '',
      data.title,
      data.content ?? '',
      data.file_path ?? null,
      data.entry_type ?? 'conversation',
      now,
      now,
    ],
  });

  const row = await c.execute({ sql: 'SELECT * FROM memory_entries WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return row.rows[0];
}

export async function getMemoryEntry(id: number) {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT * FROM memory_entries WHERE id = ?', args: [id] });
  return result.rows[0] ?? null;
}

export async function deleteMemoryEntry(id: number) {
  const c = await db();
  await c.execute({ sql: 'DELETE FROM memory_entries WHERE id = ?', args: [id] });
}

// ─── Subtasks ────────────────────────────────────────────────────────

export async function getSubTasks(parentId: string) {
  const c = await db();
  const result = await c.execute({
    sql: `
      SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
      FROM tasks t
      LEFT JOIN agents a ON t.assignee_id = a.id
      WHERE t.parent_task_id = ?
      ORDER BY t.created_at ASC
    `,
    args: [parentId],
  });
  return result.rows;
}

export async function getSubTaskCount(parentId: string): Promise<number> {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT COUNT(*) as c FROM tasks WHERE parent_task_id = ?', args: [parentId] });
  return Number(result.rows[0].c);
}

// ─── Raw query helpers for routes ────────────────────────────────────

export async function getTaskById(id: string) {
  const c = await db();
  const result = await c.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [id] });
  return result.rows[0] ?? null;
}

export async function getTaskWithAssignee(id: string) {
  const c = await db();
  const result = await c.execute({
    sql: `
      SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
      FROM tasks t
      LEFT JOIN agents a ON t.assignee_id = a.id
      WHERE t.id = ?
    `,
    args: [id],
  });
  return result.rows[0] ?? null;
}

// ─── Team Context ────────────────────────────────────────────────────

export async function getTeamContext(): Promise<string> {
  const c = await db();

  const agentsResult = await c.execute(`
    SELECT a.*, t.title as current_task_title
    FROM agents a
    LEFT JOIN tasks t ON a.current_task_id = t.id
    WHERE a.enabled = 1
    ORDER BY a.created_at ASC
  `);

  const taskCountsResult = await c.execute('SELECT status, COUNT(*) as c FROM tasks GROUP BY status');

  const statusMap: Record<string, number> = {};
  for (const row of taskCountsResult.rows) {
    statusMap[row.status as string] = Number(row.c);
  }

  let context = '## 團隊成員\n';
  for (const a of agentsResult.rows) {
    const skills = (() => {
      try {
        return typeof a.skills === 'string' ? JSON.parse(a.skills as string) : (a.skills || []);
      } catch { return []; }
    })();
    const skillsStr = (skills as string[]).length ? `技能：${(skills as string[]).join('、')}` : '';
    const statusStr = a.status === 'working' && a.current_task_title
      ? `正在處理：「${a.current_task_title}」`
      : '閒置中';
    context += `- ${a.name}（${a.role}）— ${skillsStr} — ${statusStr}\n`;
  }

  context += '\n## 看板概況\n';
  const statusLabels: Record<string, string> = {
    backlog: '待處理', in_progress: '進行中', review: '待檢查', done: '已完成', recurring: '週期性',
  };
  for (const [key, label] of Object.entries(statusLabels)) {
    if (statusMap[key]) {
      context += `- ${label}：${statusMap[key]} 個任務\n`;
    }
  }

  return context;
}
