import { NextRequest, NextResponse } from 'next/server';
import { getAllMemoryEntries, createMemoryEntry } from '@/lib/db';
import fs from 'fs';
import path from 'path';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

export async function GET() {
  try {
    const entries = await getAllMemoryEntries();
    // Map to frontend expected format
    const mapped = (entries as Record<string, unknown>[]).map((e) => {
      const content = (e.content as string) || '';
      return {
        id: String(e.id),
        title: e.title,
        agent: e.agent_name || '一般',
        type: e.entry_type === 'conversation' ? '對話' : e.entry_type === 'journal' ? '日誌' : '筆記',
        content,
        createdAt: e.created_at,
        fileSize: `${Math.ceil(new TextEncoder().encode(content).length / 1024 * 10) / 10} KB`,
        wordCount: content.length,
      };
    });
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: '取得記憶項目失敗' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: '標題為必填欄位' }, { status: 400 });
    }

    // Save content to file on disk
    const agentFolder = body.agent || body.agent_name || 'general';
    const timestamp = Date.now();
    const titleSlug = slugify(body.title);
    const fileName = `${timestamp}-${titleSlug}.md`;
    const memoryDir = path.join(process.cwd(), 'data', 'memory', agentFolder);

    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    const filePath = path.join(memoryDir, fileName);
    const fileContent = `# ${body.title}\n\n${body.content || ''}\n`;
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    // Map type back to DB values
    const typeMap: Record<string, string> = { '對話': 'conversation', '日誌': 'journal', '筆記': 'note' };
    const entryType = typeMap[body.type] || body.entry_type || 'conversation';

    const entry = await createMemoryEntry({
      agent_id: body.agent_id,
      agent_name: body.agent || body.agent_name || '',
      title: body.title,
      content: body.content,
      file_path: filePath,
      entry_type: entryType,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '建立記憶項目失敗' }, { status: 500 });
  }
}
