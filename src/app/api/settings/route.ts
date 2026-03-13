import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, getSetting, setSetting } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getAllSettings();
    // Mask sensitive keys
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (key.includes('api_key') || key.includes('token')) {
        masked[key] = value ? `${value.slice(0, 8)}...${value.slice(-4)}` : '';
      } else {
        masked[key] = value;
      }
    }
    // Also indicate if key is set
    const anthropicKey = await getSetting('anthropic_api_key');
    masked['_has_anthropic_key'] = (anthropicKey || process.env.ANTHROPIC_API_KEY) ? 'true' : 'false';
    return NextResponse.json(masked);
  } catch (error) {
    return NextResponse.json({ error: '取得設定失敗' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.key || body.value === undefined) {
      return NextResponse.json({ error: '需要 key 和 value' }, { status: 400 });
    }

    // Only allow known settings
    const allowedKeys = ['anthropic_api_key', 'anthropic_base_url', 'openai_api_key'];
    if (!allowedKeys.includes(body.key)) {
      return NextResponse.json({ error: '不允許的設定項' }, { status: 400 });
    }

    await setSetting(body.key, body.value);
    return NextResponse.json({ success: true, key: body.key });
  } catch (error) {
    return NextResponse.json({ error: '儲存設定失敗' }, { status: 500 });
  }
}
