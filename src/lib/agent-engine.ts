import { spawn } from 'child_process';
import path from 'path';
import { getTeamContext } from './db';

// ---------------------------------------------------------------------------
// Claude Code CLI path
// ---------------------------------------------------------------------------

const CLI_PATH = path.join(process.cwd(), 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');

// ---------------------------------------------------------------------------
// Model mapping for Claude CLI --model flag
// ---------------------------------------------------------------------------

const MODEL_MAP: Record<string, string> = {
  'claude-opus-4-0-20250514': 'claude-opus-4-0-20250514',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
  'gpt-4o': 'claude-sonnet-4-20250514',
  'gemini-2.5-pro': 'claude-sonnet-4-20250514',
};

function getModel(dbModel: string): string {
  return MODEL_MAP[dbModel] || 'claude-sonnet-4-20250514';
}

// ---------------------------------------------------------------------------
// Build prompts
// ---------------------------------------------------------------------------

function buildSystemPrompt(agent: {
  name: string;
  role: string;
  description?: string;
  skills?: string[];
}): string {
  const skillsList = agent.skills?.length
    ? `\n你的專長技能：${agent.skills.join('、')}`
    : '';

  const teamContext = getTeamContext();

  return `你是 ${agent.name}，在 Mission Control 團隊中擔任「${agent.role}」。
${agent.description || ''}
${skillsList}

你的工作方式：
- 用繁體中文回覆
- 產出結構化的工作報告，使用 Markdown 格式
- 包含具體的分析、建議、或產出內容
- 報告要專業、有深度、實用
- 直接開始工作，不需要確認或詢問

---

## 目前的團隊狀況
${teamContext}

你可以在工作報告中建議將某些工作交給更適合的同事處理。`;
}

// ---------------------------------------------------------------------------
// Run Claude Code CLI
// ---------------------------------------------------------------------------

function runClaudeCLI(prompt: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      CLI_PATH,
      '-p', prompt,
      '--model', model,
      '--output-format', 'text',
      '--max-turns', '1',
      '--allowedTools', '',
    ];

    // Remove CLAUDECODE env var to allow nested sessions
    const env = { ...process.env };
    delete env.CLAUDECODE;

    const child = spawn('node', args, {
      cwd: process.cwd(),
      timeout: 120000, // 2 min timeout
      env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code: number | null) => {
      console.log('[agent-engine] CLI exited. code:', code, 'stdout length:', stdout.length, 'stderr length:', stderr.length);
      if (stderr) {
        console.log('[agent-engine] stderr:', stderr.substring(0, 500));
      }
      if (code === 0 && stdout.trim()) {
        resolve(stdout.trim());
      } else if (stdout.trim()) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr.substring(0, 300) || 'no output'}`));
      }
    });

    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// Execute a task with real AI via Claude Code CLI
// ---------------------------------------------------------------------------

export async function executeTask(params: {
  agent: {
    id: string;
    name: string;
    role: string;
    description?: string;
    model: string;
    skills?: string[];
  };
  task: {
    id: string;
    title: string;
    description: string;
  };
  previousComments?: string[];
}): Promise<string> {
  const systemContext = buildSystemPrompt(params.agent);

  let userMessage = `${systemContext}\n\n---\n\n## 任務\n**${params.task.title}**\n\n`;
  if (params.task.description) {
    userMessage += `### 任務描述\n${params.task.description}\n\n`;
  }

  if (params.previousComments?.length) {
    userMessage += `### 先前的對話紀錄\n`;
    for (const comment of params.previousComments) {
      userMessage += `${comment}\n\n`;
    }
    userMessage += `---\n請根據以上任務和對話紀錄，繼續或完成這個任務。\n`;
  } else {
    userMessage += `請開始處理這個任務，並產出完整的工作報告。`;
  }

  try {
    const model = getModel(params.agent.model);
    const result = await runClaudeCLI(userMessage, model);
    return result;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[agent-engine] CLI execution failed:', errMsg);
    return `⚠️ AI 執行失敗：${errMsg}`;
  }
}

// ---------------------------------------------------------------------------
// Respond to a user message on a task (for conversation)
// ---------------------------------------------------------------------------

export async function respondToMessage(params: {
  agent: {
    id: string;
    name: string;
    role: string;
    description?: string;
    model: string;
    skills?: string[];
  };
  task: {
    id: string;
    title: string;
    description: string;
  };
  conversationHistory: { role: 'user' | 'agent'; name: string; content: string }[];
}): Promise<string> {
  const systemContext = buildSystemPrompt(params.agent);

  // Build a single prompt with conversation history
  let prompt = `${systemContext}\n\n---\n\n`;
  prompt += `## 目前任務\n**${params.task.title}**\n${params.task.description || ''}\n\n`;
  prompt += `## 對話紀錄\n`;

  for (const msg of params.conversationHistory) {
    const label = msg.role === 'user' ? '使用者' : msg.name;
    prompt += `**${label}**：${msg.content}\n\n`;
  }

  prompt += `---\n請根據以上對話，回覆最新的使用者訊息。`;

  try {
    const model = getModel(params.agent.model);
    const result = await runClaudeCLI(prompt, model);
    return result;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[agent-engine] Reply failed:', errMsg);
    return `⚠️ 回覆失敗：${errMsg}`;
  }
}
