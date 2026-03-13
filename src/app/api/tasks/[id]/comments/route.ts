import { NextRequest, NextResponse } from 'next/server';
import { getTaskComments, createTaskComment, getTaskActivities } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comments = (getTaskComments(id) as Record<string, unknown>[]).map((c) => ({
      id: c.id,
      taskId: c.task_id,
      agentId: c.agent_id,
      agentName: c.agent_name,
      agentColor: c.agent_color,
      role: c.role,
      content: c.content,
      createdAt: c.created_at,
      type: 'comment',
    }));

    const activities = (getTaskActivities(id) as Record<string, unknown>[]).map((a) => ({
      id: `activity-${a.id}`,
      taskId: a.task_id,
      agentId: a.agent_id,
      agentName: a.agent_name,
      agentColor: a.agent_color,
      role: 'system',
      content: a.message,
      createdAt: a.created_at,
      type: 'activity',
    }));

    // Normalize timestamps: SQLite CURRENT_TIMESTAMP uses "YYYY-MM-DD HH:MM:SS" (no T/Z)
    // while worker uses ISO format "YYYY-MM-DDTHH:MM:SS.sssZ". Normalize all to ISO for correct sorting.
    const normalizeTs = (ts: unknown): string => {
      if (typeof ts !== 'string') return '';
      // If no T separator, it's SQLite format (already UTC) — add T and Z
      if (!ts.includes('T')) return ts.replace(' ', 'T') + 'Z';
      return ts;
    };

    const timeline = [...comments, ...activities]
      .map((item) => ({ ...item, createdAt: normalizeTs(item.createdAt) }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(timeline);
  } catch (error) {
    return NextResponse.json({ error: '取得評論失敗' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.content?.trim()) {
      return NextResponse.json({ error: '內容不能為空' }, { status: 400 });
    }

    // Save the user's message
    // The worker process (worker.mjs) will detect this and trigger an AI reply
    const comment = createTaskComment({
      task_id: id,
      agent_id: body.agent_id ?? null,
      agent_name: body.agent_name ?? '你',
      agent_color: body.agent_color ?? '#34d399',
      role: body.role ?? 'user',
      content: body.content,
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: '建立評論失敗' }, { status: 500 });
  }
}
