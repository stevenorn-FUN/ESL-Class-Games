import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const counts: Record<string, number> = {};

  for (const level of levels) {
    const dir = path.join(process.cwd(), 'public', 'categories', level);
    try {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
      counts[level] = files.length;
    } catch {
      counts[level] = 0;
    }
  }

  return NextResponse.json(counts);
}
