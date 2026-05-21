import { readFileSync } from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const client = new Anthropic();

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

  const context = getContext();

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: [
        {
          type: 'text',
          text: `你是 Tim Lin 的作品集助理，幫助招募者快速了解 Tim 的背景、作品和能力。

用繁體中文回答，語氣專業但友善。回答要精簡，重點是讓招募者在 30 秒內得到他們想要的資訊。

如果問題的答案不在以下資料中，請誠實說「這個問題需要直接聯繫 Tim 才能回答」，不要捏造資訊。

以下是 Tim 的完整作品集資料：

${context}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: question }],
    });

    const reply = message.content[0].type === 'text' ? message.content[0].text : '';
    return Response.json({ reply });
  } catch (err) {
    console.error('Claude API error:', err);
    return Response.json(
      { error: '服務暫時無法使用，請直接透過聯絡表單聯繫 Tim。' },
      { status: 500 }
    );
  }
}
