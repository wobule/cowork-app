import { NextRequest, NextResponse } from 'next/server';
import { getDb, updateTask, deleteTask, createActivity, getAgent, getSubTasks } from '@/lib/db';

function resolveAssigneeId(body: Record<string, unknown>): string | null {
  if (body.assignee_id) return body.assignee_id as string;
  if (body.assignee) {
    const db = getDb();
    const agent = db.prepare('SELECT id FROM agents WHERE name = ?').get(body.assignee as string) as { id: string } | undefined;
    return agent?.id ?? null;
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const task = db.prepare(`
      SELECT t.*, a.name as assignee_name, a.avatar as assignee_avatar, a.color as assignee_color
      FROM tasks t
      LEFT JOIN agents a ON t.assignee_id = a.id
      WHERE t.id = ?
    `).get(id);

    if (!task) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    const subtasks = getSubTasks(id);
    return NextResponse.json({ ...(task as Record<string, unknown>), subtasks });
  } catch (error) {
    return NextResponse.json({ error: '取得任務失敗' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if status is changing to create activity
    const db = getDb();
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!existingTask) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    // Resolve assignee name to id if needed
    const updateData = { ...body };
    const resolvedId = resolveAssigneeId(body);
    if (resolvedId) {
      updateData.assignee_id = resolvedId;
    }
    delete updateData.assignee;

    const task = updateTask(id, updateData);

    // Create activity if status changed
    if (body.status && body.status !== existingTask.status) {
      const statusLabels: Record<string, string> = {
        backlog: '待辦',
        in_progress: '進行中',
        recurring: '週期性',
        review: '審核中',
        done: '已完成',
        archived: '已歸檔',
      };
      const statusLabel = statusLabels[body.status] || body.status;

      // Determine who made the change
      let agentId = 'system';
      let agentName = '系統';
      let agentColor = '#6b7280';

      if (body.assignee_id) {
        const agent = getAgent(body.assignee_id) as Record<string, unknown> | undefined;
        if (agent) {
          agentId = agent.id as string;
          agentName = agent.name as string;
          agentColor = agent.color as string;
        }
      } else if (existingTask.assignee_id) {
        const agent = getAgent(existingTask.assignee_id as string) as Record<string, unknown> | undefined;
        if (agent) {
          agentId = agent.id as string;
          agentName = agent.name as string;
          agentColor = agent.color as string;
        }
      }

      createActivity({
        agent_id: agentId,
        agent_name: agentName,
        agent_color: agentColor,
        message: `任務「${existingTask.title}」狀態變更為「${statusLabel}」`,
        task_id: id,
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: '更新任務失敗' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '刪除任務失敗' }, { status: 500 });
  }
}
