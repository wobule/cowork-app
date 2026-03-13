import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAgent } from '@/lib/db';

// ---------------------------------------------------------------------------
// Poll endpoint — returns current agent/task state
// The actual AI execution is handled by the worker process (worker.mjs)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agent_id) {
      return NextResponse.json({ error: '需要提供 agent_id' }, { status: 400 });
    }

    const agent = getAgent(body.agent_id) as Record<string, unknown> | undefined;
    if (!agent) {
      return NextResponse.json({ error: '找不到代理人' }, { status: 404 });
    }

    const db = getDb();

    // Get agent's current task if working
    let currentTask = null;
    if (agent.current_task_id) {
      currentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(agent.current_task_id as string);
    }

    return NextResponse.json({
      agent,
      task: currentTask,
      action_taken: agent.status === 'working' ? 'agent_working' : 'idle',
    });
  } catch (error) {
    console.error('[poll] Error:', error);
    return NextResponse.json({ error: '輪詢失敗' }, { status: 500 });
  }
}
