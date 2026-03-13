import { NextRequest, NextResponse } from 'next/server';
import { updateTask, createActivity, getTaskById } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingTask = await getTaskById(id) as Record<string, unknown> | null;

    if (!existingTask) {
      return NextResponse.json({ error: '找不到任務' }, { status: 404 });
    }

    if (existingTask.status !== 'review') {
      return NextResponse.json({ error: '只有審核中的任務可以核准' }, { status: 400 });
    }

    const task = await updateTask(id, { status: 'done' });

    await createActivity({
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
