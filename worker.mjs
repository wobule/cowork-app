#!/usr/bin/env node

/**
 * Agent Worker - runs in background with Claude Code auth context.
 * Polls DB for tasks needing AI execution, calls Claude CLI, writes results back.
 */

import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
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
// Team context helper
// ---------------------------------------------------------------------------

function getTeamContext(db) {
  const agents = db.prepare(`
    SELECT a.*, t.title as current_task_title
    FROM agents a
    LEFT JOIN tasks t ON a.current_task_id = t.id
    WHERE a.enabled = 1
    ORDER BY a.created_at ASC
  `).all();

  const taskCounts = db.prepare(`
    SELECT status, COUNT(*) as c FROM tasks GROUP BY status
  `).all();

  const statusMap = {};
  for (const row of taskCounts) {
    statusMap[row.status] = row.c;
  }

  let context = '## 團隊成員\n';
  for (const a of agents) {
    const skills = (() => {
      try {
        return typeof a.skills === 'string' ? JSON.parse(a.skills) : (a.skills || []);
      } catch { return []; }
    })();
    const skillsStr = skills.length ? `技能：${skills.join('、')}` : '';
    const statusStr = a.status === 'working' && a.current_task_title
      ? `正在處理：「${a.current_task_title}」`
      : '閒置中';
    context += `- ${a.name}（${a.role}）— ${skillsStr} — ${statusStr}\n`;
  }

  context += '\n## 看板概況\n';
  const statusLabels = {
    backlog: '待處理', in_progress: '進行中', review: '待檢查', done: '已完成', recurring: '週期性',
  };
  for (const [key, label] of Object.entries(statusLabels)) {
    if (statusMap[key]) {
      context += `- ${label}：${statusMap[key]} 個任務\n`;
    }
  }

  return context;
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

function buildPrompt(agent, task, existingComments, teamContext) {
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

## 目前的團隊狀況
${teamContext || '（無法取得團隊狀態）'}

---

## 團隊協作工具
你可以在回覆中使用以下指令來與團隊互動。每個指令需要放在獨立的 \`\`\`action 區塊中。

### 建立子任務給同事
\`\`\`action
{"action": "create_subtask", "title": "子任務標題", "assignee": "Agent名字", "description": "任務描述", "priority": "medium"}
\`\`\`

### 發送訊息給同事
\`\`\`action
{"action": "send_message", "to": "Agent名字", "message": "訊息內容"}
\`\`\`

### 請求同事審核
\`\`\`action
{"action": "request_review", "reviewer": "Agent名字", "message": "請幫我看看這個..."}
\`\`\`

注意：你可以在同一份報告中使用多個指令。只有在確實需要協作時才使用這些工具。

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
// Parse and execute agent actions
// ---------------------------------------------------------------------------

function parseAndExecuteActions(db, output, agentId, agentName, agentColor, parentTaskId) {
  const actionRegex = /```action\s*\n([\s\S]*?)```/g;
  const actions = [];
  let match;

  while ((match = actionRegex.exec(output)) !== null) {
    try {
      actions.push(JSON.parse(match[1].trim()));
    } catch (e) {
      console.log(`  ⚠️ Failed to parse action JSON: ${e.message}`);
    }
  }

  if (actions.length === 0) return output;

  const now = () => new Date().toISOString();
  let subtaskCount = 0;
  const MAX_SUBTASKS = 5;

  for (const action of actions) {
    try {
      switch (action.action) {
        case 'create_subtask': {
          if (subtaskCount >= MAX_SUBTASKS) {
            console.log(`  ⚠️ Subtask limit (${MAX_SUBTASKS}) reached, skipping`);
            break;
          }

          // Check subtask depth: don't allow more than 2 levels
          const parentTask = db.prepare('SELECT parent_task_id FROM tasks WHERE id = ?').get(parentTaskId);
          if (parentTask?.parent_task_id) {
            const grandParent = db.prepare('SELECT parent_task_id FROM tasks WHERE id = ?').get(parentTask.parent_task_id);
            if (grandParent?.parent_task_id) {
              console.log(`  ⚠️ Max subtask depth (2) reached, skipping`);
              break;
            }
          }

          // Resolve assignee
          const assignee = db.prepare('SELECT id, name, color FROM agents WHERE name = ?').get(action.assignee);
          if (!assignee) {
            console.log(`  ⚠️ Unknown agent "${action.assignee}", skipping subtask`);
            break;
          }

          const taskId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO tasks (id, title, description, status, priority, assignee_id, parent_task_id, created_by_agent_id, created_at, updated_at)
            VALUES (?, ?, ?, 'backlog', ?, ?, ?, ?, ?, ?)
          `).run(
            taskId,
            action.title,
            action.description || '',
            action.priority || 'medium',
            assignee.id,
            parentTaskId,
            agentId,
            now(),
            now()
          );

          db.prepare(`INSERT INTO activities (agent_id, agent_name, agent_color, message, task_id, created_at) VALUES (?,?,?,?,?,?)`)
            .run(agentId, agentName, agentColor, `建立子任務「${action.title}」並指派給 ${assignee.name}`, parentTaskId, now());

          console.log(`  📋 Created subtask "${action.title}" → ${assignee.name}`);
          subtaskCount++;
          break;
        }

        case 'send_message': {
          const targetAgent = db.prepare('SELECT id, name, color FROM agents WHERE name = ?').get(action.to);
          if (!targetAgent) {
            console.log(`  ⚠️ Unknown agent "${action.to}", skipping message`);
            break;
          }

          // Find target agent's current task, or create a note in activities
          const targetTask = db.prepare('SELECT current_task_id FROM agents WHERE id = ?').get(targetAgent.id);
          if (targetTask?.current_task_id) {
            db.prepare(`INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?,?,?,?,?,?,?)`)
              .run(targetTask.current_task_id, agentId, agentName, agentColor, 'agent', `💬 來自 ${agentName} 的訊息：${action.message}`, now());
          }

          db.prepare(`INSERT INTO activities (agent_id, agent_name, agent_color, message, task_id, created_at) VALUES (?,?,?,?,?,?)`)
            .run(agentId, agentName, agentColor, `發送訊息給 ${targetAgent.name}：${action.message}`, parentTaskId, now());

          console.log(`  💬 Message sent to ${targetAgent.name}`);
          break;
        }

        case 'request_review': {
          const reviewer = db.prepare('SELECT id, name, color FROM agents WHERE name = ?').get(action.reviewer);
          if (!reviewer) {
            console.log(`  ⚠️ Unknown reviewer "${action.reviewer}", skipping`);
            break;
          }

          db.prepare(`INSERT INTO task_comments (task_id, agent_id, agent_name, agent_color, role, content, created_at) VALUES (?,?,?,?,?,?,?)`)
            .run(parentTaskId, agentId, agentName, agentColor, 'agent', `📝 請 ${reviewer.name} 審核：${action.message || '請幫我檢查這個任務的產出'}`, now());

          db.prepare(`INSERT INTO activities (agent_id, agent_name, agent_color, message, task_id, created_at) VALUES (?,?,?,?,?,?)`)
            .run(agentId, agentName, agentColor, `請求 ${reviewer.name} 審核任務`, parentTaskId, now());

          console.log(`  📝 Review requested from ${reviewer.name}`);
          break;
        }

        default:
          console.log(`  ⚠️ Unknown action: ${action.action}`);
      }
    } catch (e) {
      console.error(`  ❌ Action execution error:`, e.message);
    }
  }

  // Remove action blocks from the output for display
  const cleanOutput = output.replace(/```action\s*\n[\s\S]*?```/g, '').trim();
  return cleanOutput;
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
  const teamContext = getTeamContext(db);
  const prompt = buildPrompt(agent, task, comments.length > 1 ? comments : undefined, teamContext);
  const model = getModel(agent.model);

  try {
    const rawOutput = await runClaudeCLI(prompt, model);
    console.log(`  ✅ Got response (${rawOutput.length} chars)`);

    // Parse and execute any agent actions, get cleaned output
    const output = parseAndExecuteActions(db, rawOutput, agent.id, agent.name, agent.color, task.id);

    // Save cleaned output as comment
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
