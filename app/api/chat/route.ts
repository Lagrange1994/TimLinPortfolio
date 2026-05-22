import { readFileSync } from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

// ── Daily request limit (in-memory, resets on function cold start) ──────────
const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT ?? 50);
let dailyCount = 0;
let dailyDate = new Date().toDateString();

function checkDailyLimit(): boolean {
  const today = new Date().toDateString();
  if (today !== dailyDate) { dailyDate = today; dailyCount = 0; } // new day → reset
  if (dailyCount >= DAILY_LIMIT) return false;
  dailyCount++;
  return true;
}
// ────────────────────────────────────────────────────────────────────────────

function getApiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  // Fallback: read .env.local directly (workaround for Next.js 16 + Node 24)
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (key === 'GEMINI_API_KEY') return value;
    }
  } catch { /* file not found in production, rely on env */ }
  return '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n## $1\n')
    .replace(/<\/?(p|div|section|article|li|br)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

let cachedContext: string | null = null;

function getContext(): string {
  if (cachedContext) return cachedContext;
  const html = readFileSync(path.join(process.cwd(), 'public', 'index.html'), 'utf8');
  const faq = readFileSync(path.join(process.cwd(), 'data', 'tim-faq.md'), 'utf8');
  cachedContext = `# Tim Lin 的作品集內容\n\n${stripHtml(html)}\n\n---\n\n# 常見問題 (FAQ)\n\n${faq}`;
  return cachedContext;
}

const SYSTEM_PROMPT = `你是 Tim Lin 的作品集助理，幫助招募者快速了解 Tim 的背景、作品和能力。

用繁體中文回答，語氣專業但友善。回答要精簡，重點是讓招募者在 30 秒內得到他們想要的資訊。

如果問題的答案不在以下資料中，請誠實說「這個問題需要直接聯繫 Tim 才能回答」，不要捏造資訊。`;

export async function POST(req: Request) {
  let question: string;
  try {
    const body = await req.json();
    question = String(body.question ?? '').trim().slice(0, 500);
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!question) {
    return Response.json({ error: 'Question is required' }, { status: 400 });
  }

  if (!checkDailyLimit()) {
    return Response.json(
      { error: '今日詢問次數已達上限，請明天再試或直接聯繫 Tim。' },
      { status: 429 }
    );
  }


  const apiKey = getApiKey();
  const context = getContext();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\n以下是 Tim 的完整作品集資料：\n\n${context}`,
        maxOutputTokens: 400,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });


    const reply = result.text ?? '';
    return Response.json({ reply });
  } catch (err) {
    console.error('Gemini API error:', err);
    return Response.json(
      { error: '服務暫時無法使用，請直接透過聯絡表單聯繫 Tim。' },
      { status: 500 }
    );
  }
}
