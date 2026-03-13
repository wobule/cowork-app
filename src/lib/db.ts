import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'mission-control.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
  }
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
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

  // Seed agents if empty
  const count = database.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number };
  if (count.c === 0) {
    seed(database);
  }
}

function seed(database: Database.Database) {
  const insertAgent = database.prepare(
    `INSERT INTO agents (id, name, role, avatar, color, model, skills) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  insertAgent.run('henry', 'Henry', '參謀長', '🎖️', '#6366f1', 'claude-opus-4-0-20250514', JSON.stringify(['策略規劃', '任務協調', '決策分析']));
  insertAgent.run('violet', 'Violet', '設計師', '🎨', '#ec4899', 'claude-opus-4-0-20250514', JSON.stringify(['UI設計', '品牌設計', '原型製作']));
  insertAgent.run('wendy', 'Wendy', '研究員', '🔬', '#f59e0b', 'claude-sonnet-4-20250514', JSON.stringify(['市場研究', '數據分析', '趨勢追蹤']));
  insertAgent.run('jarvis', 'Jarvis', '工程師', '⚙️', '#4c8dff', 'claude-opus-4-0-20250514', JSON.stringify(['全端開發', '系統架構', 'API設計']));
}

// ─── Helper Functions ────────────────────────────────────────────────

export function getAllTasks() {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
    FROM tasks t
    LEFT JOIN agents a ON t.assignee_id = a.id
    ORDER BY t.created_at DESC
  `).all();
}

export function getTasksByStatus(status: string) {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
    FROM tasks t
    LEFT JOIN agents a ON t.assignee_id = a.id
    WHERE t.status = ?
    ORDER BY t.created_at DESC
  `).all(status);
}

export function createTask(data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  project?: string;
  project_color?: string;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, assignee_id, project, project_color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title,
    data.description ?? '',
    data.status ?? 'backlog',
    data.priority ?? 'medium',
    data.assignee_id ?? null,
    data.project ?? '',
    data.project_color ?? '#6366f1',
    now,
    now
  );

  return db.prepare(`
    SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
    FROM tasks t
    LEFT JOIN agents a ON t.assignee_id = a.id
    WHERE t.id = ?
  `).get(id);
}

export function updateTask(id: string, data: Record<string, unknown>) {
  const db = getDb();
  const allowed = ['title', 'description', 'status', 'priority', 'assignee_id', 'project', 'project_color'];
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  fields.push(`updated_at = ?`);
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return db.prepare(`
    SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
    FROM tasks t
    LEFT JOIN agents a ON t.assignee_id = a.id
    WHERE t.id = ?
  `).get(id);
}

export function deleteTask(id: string) {
  const db = getDb();
  return db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function getAllAgents() {
  const db = getDb();
  return db.prepare('SELECT * FROM agents ORDER BY created_at ASC').all();
}

export function getAgent(id: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
}

export function updateAgent(id: string, data: Record<string, unknown>) {
  const db = getDb();
  const allowed = ['role', 'description', 'model', 'skills', 'poll_interval', 'enabled', 'status', 'current_task_id'];
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(key === 'skills' && Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key]);
    }
  }

  if (fields.length === 0) return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);

  fields.push(`updated_at = ?`);
  values.push(new Date().toISOString());
  values.push(id);

  db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
}

export function getActivities(limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM activities ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function createActivity(data: {
  agent_id: string;
  agent_name: string;
  agent_color?: string;
  message: string;
  task_id?: string | null;
}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO activities (agent_id, agent_name, agent_color, message, task_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    data.agent_id,
    data.agent_name,
    data.agent_color ?? '#6366f1',
    data.message,
    data.task_id ?? null
  );

  return db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
}

// ─── Settings ───────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, new Date().toISOString());
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return result;
}

// ─── Task Comments ──────────────────────────────────────────────────

export function getTaskComments(taskId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC').all(taskId);
}

export function createTaskComment(data: {
  task_id: string;
  agent_id?: string | null;
  agent_name?: string;
  agent_color?: string;
  role?: string;
  content: string;
}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.task_id,
    data.agent_id ?? null,
    data.agent_name ?? '',
    data.agent_color ?? '#6366f1',
    data.role ?? 'agent',
    data.content,
    new Date().toISOString()
  );

  return db.prepare('SELECT * FROM task_comments WHERE id = ?').get(result.lastInsertRowid);
}

export function getTaskActivities(taskId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM activities WHERE task_id = ? ORDER BY created_at ASC').all(taskId);
}

export function getAllMemoryEntries() {
  const db = getDb();
  return db.prepare('SELECT * FROM memory_entries ORDER BY created_at DESC').all();
}

export function createMemoryEntry(data: {
  agent_id?: string | null;
  agent_name?: string;
  title: string;
  content?: string;
  file_path?: string | null;
  entry_type?: string;
}) {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO memory_entries (agent_id, agent_name, title, content, file_path, entry_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.agent_id ?? null,
    data.agent_name ?? '',
    data.title,
    data.content ?? '',
    data.file_path ?? null,
    data.entry_type ?? 'conversation',
    now,
    now
  );

  return db.prepare('SELECT * FROM memory_entries WHERE id = ?').get(result.lastInsertRowid);
}

export function getMemoryEntry(id: number) {
  const db = getDb();
  return db.prepare('SELECT * FROM memory_entries WHERE id = ?').get(id);
}
