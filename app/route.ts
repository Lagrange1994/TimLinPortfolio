import { readFileSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Force dynamic rendering so Vercel does not attempt to statically generate
// this route at build time (the file read would fail in that context).
export const dynamic = 'force-dynamic';

export async function GET() {
  const html = readFileSync(
    path.join(process.cwd(), 'public', 'index.html'),
    'utf8'
  );
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
