import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask, getAgentByName, getSubTaskCount } from '@/lib/db';

async function resolveAssigneeId(body: Record<string, unknown>): Promise<string | null> {
  if (body.assignee_id) return body.assignee_id as string;
  if (body.assignee) {
    const agent = await getAgentByName(body.assignee as string);
    return (agent?.id as string) ?? null;
  }
  return null;
}

export async function GET() {
  try {
    const tasks = await getAllTasks();
    const mapped = await Promise.all((tasks as Record<string, unknown>[]).map(async (t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee_name || '',
      assignee_id: t.assignee_id,
      project: t.project,
      projectColor: t.project_color || t.assignee_color || '#6366f1',
      labels: [],
      parentTaskId: t.parent_task_id || null,
      createdByAgentId: t.created_by_agent_id || null,
      subtaskCount: t.id ? await getSubTaskCount(t.id as string) : 0,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: '取得任務失敗' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: '任務標題為必填欄位' }, { status: 400 });
    }

    const assigneeId = await resolveAssigneeId(body);

    const task = await createTask({
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      assignee_id: assigneeId,
      project: body.project,
      project_color: body.project_color,
      parent_task_id: body.parent_task_id || null,
      created_by_agent_id: body.created_by_agent_id || null,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '建立任務失敗' }, { status: 500 });
  }
}
