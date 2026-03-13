import { NextRequest, NextResponse } from 'next/server';
import { getActivities, createActivity } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const activities = getActivities(limit);
    // Map to frontend expected format
    const mapped = (activities as Record<string, unknown>[]).map((a) => ({
      id: a.id,
      agent: a.agent_name,
      agentColor: a.agent_color,
      message: a.message,
      timestamp: a.created_at,
      // Also keep raw fields for agents page
      agent_id: a.agent_id,
      agent_name: a.agent_name,
      agent_color: a.agent_color,
      created_at: a.created_at,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: '取得活動記錄失敗' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agent_id || !body.agent_name || !body.message) {
      return NextResponse.json({ error: '缺少必填欄位 (agent_id, agent_name, message)' }, { status: 400 });
    }

    const activity = createActivity({
      agent_id: body.agent_id,
      agent_name: body.agent_name,
      agent_color: body.agent_color,
      message: body.message,
      task_id: body.task_id,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '建立活動記錄失敗' }, { status: 500 });
  }
}
