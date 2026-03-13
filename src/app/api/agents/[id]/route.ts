import { NextRequest, NextResponse } from 'next/server';
import { getAgent, updateAgent } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = getAgent(id);

    if (!agent) {
      return NextResponse.json({ error: '找不到代理人' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: '取得代理人失敗' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = getAgent(id);
    if (!existing) {
      return NextResponse.json({ error: '找不到代理人' }, { status: 404 });
    }

    // Map frontend fields to DB fields
    const dbData: Record<string, unknown> = {};
    if (body.role !== undefined) dbData.role = body.role;
    if (body.description !== undefined) dbData.description = body.description;
    if (body.model !== undefined) dbData.model = body.model;
    if (body.skills !== undefined) dbData.skills = body.skills;
    if (body.poll_interval !== undefined) dbData.poll_interval = body.poll_interval;
    if (body.enabled !== undefined) dbData.enabled = body.enabled ? 1 : 0;
    if (body.status !== undefined) dbData.status = body.status;
    if (body.current_task_id !== undefined) dbData.current_task_id = body.current_task_id;

    const agent = updateAgent(id, dbData);
    // Return mapped format
    const a = agent as Record<string, unknown>;
    return NextResponse.json({
      id: a.id,
      name: a.name,
      emoji: a.avatar || '🤖',
      role: a.role,
      color: a.color,
      enabled: a.enabled === 1,
      description: a.description,
      skills: typeof a.skills === 'string' ? JSON.parse(a.skills as string) : (a.skills || []),
      model: a.model,
      poll_interval: a.poll_interval,
      status: a.status || 'idle',
      current_task: a.current_task_id || null,
    });
  } catch (error) {
    return NextResponse.json({ error: '更新代理人失敗' }, { status: 500 });
  }
}
