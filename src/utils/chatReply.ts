// What the chat shows for one /api/chat response. Our own messages (a scope
// refusal, a rate or daily limit) pass through; anything else that failed
// (402 credits used up, 5xx, a platform error page) becomes one calm line,
// so a visitor never sees a raw upstream error.
export function chatReplyText(
  status: number,
  data: { reply?: string; error?: string },
  t: Record<string, string>,
): string {
  if (status >= 200 && status < 300) return data.reply || t.chat_fallback_error;
  if ((status === 400 || status === 429) && data.error) return data.error;
  return t.chat_unavailable;
}
