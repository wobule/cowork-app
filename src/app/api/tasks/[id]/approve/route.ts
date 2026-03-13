import { NextRequest, NextResponse } from 'next/server';
import { getDb, updateTask, createActivity } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!existingTask) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    if (existingTask.status !== 'review') {
      return NextResponse.json({ error: '只有審核中的任務可以核准' }, { status: 400 });
    }

    const task = updateTask(id, { status: 'done' });

    createActivity({
      agent_id: 'user',
      agent_name: '你',
      agent_color: '#22c55e',
      message: `已核准任務: ${existingTask.title}`,
      task_id: id,
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: '核准任務失敗' }, { status: 500 });
  }
}
