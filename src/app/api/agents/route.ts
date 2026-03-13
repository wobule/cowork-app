import { NextResponse } from 'next/server';
import { getAllAgents } from '@/lib/db';

export async function GET() {
  try {
    const agents = await getAllAgents();
    // Map DB fields to frontend expected format
    const mapped = (agents as Record<string, unknown>[]).map((a) => ({
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
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: '取得代理人失敗' }, { status: 500 });
  }
}
