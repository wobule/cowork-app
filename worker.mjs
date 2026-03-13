#!/usr/bin/env node

/**
 * Agent Worker - runs in background with Claude Code auth context.
 * Polls DB for tasks needing AI execution, calls Claude CLI, writes results back.
 */

import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'mission-control.db');
const CLI_PATH = path.join(__dirname, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

// ---------------------------------------------------------------------------
// Claude CLI runner
// ---------------------------------------------------------------------------

function runClaudeCLI(prompt, model = 'claude-sonnet-4-20250514') {
  const env = { ...process.env, CLAUDECODE: '' };

  const args = [
    CLI_PATH,
    '-p', prompt,
    '--model', model,
    '--output-format', 'text',
    '--max-turns', '10',
    '--allowedTools', 'Read Glob Grep',
  ];

  try {
    const result = execFileSync('node', args, {
      cwd: __dirname,
      timeout: 180000, // 3 min
      env,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return result.trim();
  } catch (err) {
    if (err.stdout?.trim()) return err.stdout.trim();
    throw new Error(`CLI failed: ${err.stderr?.substring(0, 300) || err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Model mapping
// ---------------------------------------------------------------------------

const MODEL_MAP = {
  'claude-opus-4-0-20250514': 'claude-opus-4-20250514',
  'claude-opus-4-20250514': 'claude-opus-4-20250514',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
  'gpt-4o': 'claude-sonnet-4-20250514',
  'gemini-2.5-pro': 'claude-sonnet-4-20250514',
};

function getModel(dbModel) {
  return MODEL_MAP[dbModel] || 'claude-sonnet-4-20250514';
}

// ---------------------------------------------------------------------------
// Build agent prompt
// ---------------------------------------------------------------------------

function buildPrompt(agent, task, existingComments) {
  const skills = (() => {
    try {
      return typeof agent.skills === 'string' ? JSON.parse(agent.skills) : (agent.skills || []);
    } catch { return []; }
  })();

  const skillsList = skills.length ? `\n你的專長技能：${skills.join('、')}` : '';

  let prompt = `你是 ${agent.name}，在 Mission Control 團隊中擔任「${agent.role}」。
${agent.description || ''}
${skillsList}

你的工作方式：
- 用繁體中文回覆
- 產出結構化的工作報告，使用 Markdown 格式
- 包含具體的分析、建議、或產出內容
- 報告要專業、有深度、實用
- 直接開始工作，不需要確認或詢問
- 你可以讀取專案檔案來進行分析（使用 Read、Glob、Grep 工具）
- 完成後請用文字輸出你的工作報告

---

## 任務
**${task.title}**

`;

  if (task.description) {
    prompt += `### 任務描述\n${task.description}\n\n`;
  }

  if (existingComments?.length) {
    prompt += `### 先前的對話紀錄\n`;
    for (const c of existingComments) {
      prompt += `${c}\n\n`;
    }
    prompt += `---\n請根據以上任務和對話紀錄，繼續或完成這個任務。\n`;
  } else {
    prompt += `請開始處理這個任務，並產出完整的工作報告。`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Process a task
// ---------------------------------------------------------------------------

async function processTask(db, agent, task) {
  const now = () => new Date().toISOString();

  // Mark as in progress
  db.prepare(`UPDATE tasks SET status = 'in_progress', updated_at = ? WHERE id = ?`).run(now(), task.id);
  db.prepare(`UPDATE agents SET status = 'working', current_task_id = ? WHERE id = ?`).run(task.id, agent.id);

  // Activity: started
  db.prepare(`INSERT INTO activities (agent_id, agent_name, agent_color, message, task_id, created_at) VALUES (?,?,?,?,?,?)`)
    .run(agent.id, agent.name, agent.color, `開始處理任務「${task.title}」`, task.id, now());

  // Comment: started
  db.prepare(`INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?,?,?,?,?,?,?)`)
    .run(task.id, agent.id, agent.name, agent.color, 'agent', `收到任務！我是 ${agent.name}（${agent.role}），正在使用 ${agent.model} 模型處理中...`, now());

  console.log(`  ⏳ Calling Claude CLI (model: ${getModel(agent.model)})...`);

  // Get existing comments for context
  const comments = db.prepare(`SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC`).all(task.id)
    .map(c => `[${c.role === 'user' ? '使用者' : c.agent_name}]: ${c.content}`);

  // Build prompt and call AI
  const prompt = buildPrompt(agent, task, comments.length > 1 ? comments : undefined);
  const model = getModel(agent.model);

  try {
    const output = await runClaudeCLI(prompt, model);
    console.log(`  ✅ Got response (${output.length} chars)`);

    // Save output as comment
    db.prepare(`INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run(task.id, agent.id, agent.name, agent.color, 'agent', output, now());

    // Move to review
    db.prepare(`UPDATE tasks SET status = 'review', updated_at = ? WHERE id = ?`).run(now(), task.id);
    db.prepare(`UPDATE agents SET status = 'idle', current_task_id = NULL WHERE id = ?`).run(agent.id);

    db.prepare(`INSERT INTO activities (agent_id, agent_name, agent_color, message, task_id, created_at) VALUES (?,?,?,?,?,?)`)
      .run(agent.id, agent.name, agent.color, `已完成任務「${task.title}」，等待審核`, task.id, now());

    return true;
  } catch (err) {
    console.error(`  ❌ Error:`, err.message);

    db.prepare(`INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run(task.id, agent.id, agent.name, agent.color, 'agent', `⚠️ 執行失敗：${err.message}`, now());

    // Reset agent to idle
    db.prepare(`UPDATE agents SET status = 'idle', current_task_id = NULL WHERE id = ?`).run(agent.id);

    return false;
  }
}

// ---------------------------------------------------------------------------
// Process user messages that need agent replies
// ---------------------------------------------------------------------------

async function processUserMessages(db) {
  // Find tasks with user messages that don't have a recent agent reply
  const tasksWithPendingReplies = db.prepare(`
    SELECT tc.task_id, tc.content as user_msg, tc.created_at as msg_time,
           t.title, t.description, t.assignee_id,
           a.id as agent_id, a.name as agent_name, a.role as agent_role,
           a.description as agent_desc, a.model as agent_model, a.skills as agent_skills,
           a.color as agent_color
    FROM task_comments tc
    JOIN tasks t ON tc.task_id = t.id
    JOIN agents a ON t.assignee_id = a.id
    WHERE tc.role = 'user'
    AND tc.id = (SELECT MAX(id) FROM task_comments WHERE task_id = tc.task_id)
    AND NOT EXISTS (
      SELECT 1 FROM task_comments tc2
      WHERE tc2.task_id = tc.task_id
      AND tc2.role = 'agent'
      AND tc2.content NOT LIKE '💭%'
      AND tc2.id > tc.id
    )
  `).all();

  for (const row of tasksWithPendingReplies) {
    console.log(`💬 Replying to user message on "${row.title}"...`);

    // Get full conversation history
    const allComments = db.prepare(`SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC`).all(row.task_id);

    const skills = (() => {
      try { return typeof row.agent_skills === 'string' ? JSON.parse(row.agent_skills) : []; }
      catch { return []; }
    })();

    const skillsList = skills.length ? `\n你的專長技能：${skills.join('、')}` : '';

    let prompt = `你是 ${row.agent_name}，在 Mission Control 團隊中擔任「${row.agent_role}」。
${row.agent_desc || ''}
${skillsList}

用繁體中文回覆。不要使用任何工具，直接回覆文字。目前正在處理的任務：「${row.title}」
${row.description || ''}

## 對話紀錄
`;

    for (const c of allComments) {
      if (c.content.startsWith('💭')) continue;
      const label = c.role === 'user' ? '使用者' : c.agent_name;
      prompt += `**${label}**：${c.content}\n\n`;
    }

    prompt += `---\n請回覆最新的使用者訊息。`;

    try {
      const reply = await runClaudeCLI(prompt, getModel(row.agent_model));
      console.log(`  ✅ Reply generated (${reply.length} chars)`);

      const now = new Date().toISOString();
      db.prepare(`INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?,?,?,?,?,?,?)`)
        .run(row.task_id, row.agent_id, row.agent_name, row.agent_color, 'agent', reply, now);
    } catch (err) {
      console.error(`  ❌ Reply failed:`, err.message);
      const now = new Date().toISOString();
      db.prepare(`INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?,?,?,?,?,?,?)`)
        .run(row.task_id, row.agent_id, row.agent_name, row.agent_color, 'agent', `⚠️ 回覆失敗：${err.message}`, now);
    }
  }
}

// ---------------------------------------------------------------------------
// Main polling loop
// ---------------------------------------------------------------------------

async function poll() {
  const db = getDb();

  // 1. Find backlog tasks assigned to enabled agents
  const backlogTasks = db.prepare(`
    SELECT t.*, a.id as agent_id, a.name as agent_name, a.role as agent_role,
           a.description as agent_desc, a.model as agent_model, a.skills as agent_skills,
           a.color as agent_color, a.status as agent_status
    FROM tasks t
    JOIN agents a ON t.assignee_id = a.id
    WHERE t.status = 'backlog'
    AND a.enabled = 1
    AND a.status = 'idle'
    ORDER BY t.created_at ASC
  `).all();

  if (backlogTasks.length > 0) {
    const task = backlogTasks[0];
    console.log(`\n📋 Found backlog task: "${task.title}" → ${task.agent_name}`);

    await processTask(db, {
      id: task.agent_id,
      name: task.agent_name,
      role: task.agent_role,
      description: task.agent_desc,
      model: task.agent_model,
      skills: task.agent_skills,
      color: task.agent_color,
    }, task);
  }

  // 2. Check for pending user messages that need replies
  await processUserMessages(db);

  db.close();
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 10000; // 10 seconds

console.log('🚀 Agent Worker started');
console.log(`   DB: ${DB_PATH}`);
console.log(`   CLI: ${CLI_PATH}`);
console.log(`   Poll interval: ${POLL_INTERVAL / 1000}s`);
console.log('');

// Initial poll
poll().catch(e => console.error('Poll error:', e));

// Recurring polls
setInterval(() => {
  poll().catch(e => console.error('Poll error:', e));
}, POLL_INTERVAL);
