import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'bot';
  text: string;
  loading?: boolean;
}

const QUICK_QUESTIONS = [
  { label: '後台系統', q: 'Tim 有沒有 B2B 後台系統的設計經驗？' },
  { label: '開放機會？', q: 'Tim 目前開放工作機會嗎？' },
  { label: '可遠端？', q: 'Tim 可以遠端工作嗎？' },
  { label: '設計流程？', q: 'Tim 的設計流程是什麼？' },
  { label: '英文能力？', q: 'Tim 的英文溝通能力如何？' },
  { label: '如何聯繫？', q: '如何聯繫 Tim？' },
];

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hi！我是 Tim 的 AI 助理。想了解 Tim 的設計背景、作品集或合作意願，直接問我吧 👋' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  async function sendQuestion(q: string) {
    q = (q || '').trim();
    if (!q || sending) return;

    setInput('');
    setSending(true);

    const userMsg: Message = { role: 'user', text: q };
    const loadingMsg: Message = { role: 'bot', text: '…', loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.loading) {
          next[next.length - 1] = { role: 'bot', text: data.reply || data.error || '無法取得回覆，請直接聯繫 Tim。' };
        }
        return next;
      });
    } catch {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.loading) {
          next[next.length - 1] = { role: 'bot', text: '連線失敗，請直接透過聯絡表單聯繫 Tim。' };
        }
        return next;
      });
    } finally {
      setSending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  }

  return (
    <>
      <button
        id="chat-fab"
        className="btn-glass btn-grad"
        aria-label="Ask Tim anything"
        onClick={() => setOpen(o => !o)}
      >
        <i className="fas fa-comment"></i>
      </button>

      <div id="chat-panel" className={open ? 'open' : ''} role="dialog" aria-label="Ask Tim AI">
        <div id="chat-header">
          <div id="chat-header-avatar">
            <img src="/img/timbot.png" alt="Tim AI" />
          </div>
          <div id="chat-header-info">
            <div id="chat-header-name">Ask Tim Anything</div>
            <div id="chat-header-status">AI 助理 · 即時回覆</div>
          </div>
        </div>

        <div id="chat-messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg ${msg.role}${msg.loading ? ' loading' : ''}`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div id="chat-quick">
          {QUICK_QUESTIONS.map(({ label, q }) => (
            <button
              key={label}
              className="chat-quick-btn"
              data-q={q}
              onClick={() => sendQuestion(q)}
            >
              {label}
            </button>
          ))}
        </div>

        <div id="chat-input-row">
          <input
            id="chat-input"
            type="text"
            placeholder="問任何關於 Tim 的問題…"
            maxLength={200}
            autoComplete="off"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
          />
          <button
            id="chat-send"
            aria-label="送出"
            disabled={sending}
            onClick={() => sendQuestion(input)}
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}
