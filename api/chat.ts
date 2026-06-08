// Vercel Serverless Function. Vercel auto-detects files in the root /api
// directory as functions even when `framework` is null in vercel.json.
import { generateReply } from './_chat-core';

interface ReqLike { method?: string; body?: unknown; }
interface ResLike {
  status: (code: number) => ResLike;
  json: (data: unknown) => void;
  setHeader: (k: string, v: string) => void;
  end: (chunk?: string) => void;
}

export default async function handler(req: ReqLike, res: ResLike) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let question: unknown = '';
  const body = req.body;
  if (typeof body === 'string') {
    try { question = JSON.parse(body).question; } catch { question = ''; }
  } else if (body && typeof body === 'object') {
    question = (body as Record<string, unknown>).question;
  }

  const result = await generateReply(question);
  res.status(result.status).json(result.body);
}
