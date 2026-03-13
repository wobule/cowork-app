import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask, getDb } from '@/lib/db';

function resolveAssigneeId(body: Record<string, unknown>): string | null {
  if (body.assignee_id) return body.assignee_id as string;
  if (body.assignee) {
    const db = getDb();
    const agent = db.prepare('SELECT id FROM agents WHERE name = ?').get(body.assignee as string) as { id: string } | undefined;
    return agent?.id ?? null;
  }
  return null;
}

export async function GET() {
  try {
    const tasks = getAllTasks();
    const mapped = (tasks as Record<string, unknown>[]).map((t) => ({
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
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
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

    const assigneeId = resolveAssigneeId(body);

    const task = createTask({
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      assignee_id: assigneeId,
      project: body.project,
      project_color: body.project_color,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '建立任務失敗' }, { status: 500 });
  }
}
