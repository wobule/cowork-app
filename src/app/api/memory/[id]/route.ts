import { NextRequest, NextResponse } from 'next/server';
import { getMemoryEntry, deleteMemoryEntry } from '@/lib/db';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await getMemoryEntry(Number(id)) as Record<string, unknown> | null;

    if (!entry) {
      return NextResponse.json({ error: '找不到記憶項目' }, { status: 404 });
    }

    // If file_path exists, read content from disk
    let content = (entry.content as string) || '';
    if (entry.file_path && typeof entry.file_path === 'string') {
      try {
        if (fs.existsSync(entry.file_path)) {
          content = fs.readFileSync(entry.file_path, 'utf-8');
        }
      } catch {
        // File read failed, use DB content
      }
    }

    const typeMap: Record<string, string> = { conversation: '對話', journal: '日誌', note: '筆記' };
    const mapped = {
      id: String(entry.id),
      title: entry.title,
      agent: entry.agent_name || '一般',
      type: typeMap[(entry.entry_type as string)] || '對話',
      content,
      createdAt: entry.created_at,
      fileSize: `${Math.ceil(new TextEncoder().encode(content).length / 1024 * 10) / 10} KB`,
      wordCount: content.length,
    };

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: '取得記憶項目失敗' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await getMemoryEntry(Number(id)) as Record<string, unknown> | null;

    if (!entry) {
      return NextResponse.json({ error: '找不到記憶項目' }, { status: 404 });
    }

    // Delete file on disk if it exists
    if (entry.file_path && typeof entry.file_path === 'string') {
      try {
        if (fs.existsSync(entry.file_path)) {
          fs.unlinkSync(entry.file_path);
        }
      } catch {
        // File deletion failed, continue with DB deletion
      }
    }

    await deleteMemoryEntry(Number(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '刪除記憶項目失敗' }, { status: 500 });
  }
}
