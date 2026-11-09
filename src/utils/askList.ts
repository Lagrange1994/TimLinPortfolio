// "label|question;label|question…" → the buttons of an "ask my AI" row:
// the short button label and the full question the chat is sent.
export interface AskItem {
  label: string;
  q: string;
}

export function parseAskList(s: string): AskItem[] {
  return s.split(';').map(item => {
    const [label, q] = item.split('|').map(p => p.trim());
    return { label, q: q || label };
  }).filter(item => item.label);
}
