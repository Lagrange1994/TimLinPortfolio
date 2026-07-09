import { useState, useRef, useEffect, Fragment } from 'react';
import type { ReactNode } from 'react';
import { useLang } from '../context/LangContext';

interface Message {
  role: 'user' | 'bot';
  text: string;
  loading?: boolean;
}

const BULLET_RE = /^[*\-•]\s+(.*)$/;

// Renders **bold** spans within a single line of text.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m
      ? <strong key={`${keyPrefix}-${i}`}>{m[1]}</strong>
      : <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

// Bot replies come back as loose markdown (bullet lists, **bold**, blank-line
// paragraphs). Rendering them as one plain-text node crams everything onto a
// single line, so split into paragraph/list blocks for proper spacing.
function FormattedReply({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length && lines.every(l => BULLET_RE.test(l))) {
          return (
            <ul key={bi} className="chat-msg-list">
              {lines.map((line, li) => {
                const m = line.match(BULLET_RE)!;
                return <li key={li}>{renderInline(m[1], `${bi}-${li}`)}</li>;
              })}
            </ul>
          );
        }
        return (
          <p key={bi} className="chat-msg-p">
            {lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(line, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export default function ChatPanel() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [inputError, setInputError] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickQuestions = [
    { label: t.chat_q1_label, q: t.chat_q1 },
    { label: t.chat_q2_label, q: t.chat_q2 },
    { label: t.chat_q3_label, q: t.chat_q3 },
    { label: t.chat_q4_label, q: t.chat_q4 },
    { label: t.chat_q5_label, q: t.chat_q5 },
    { label: t.chat_q6_label, q: t.chat_q6 },
  ];
  const displayMessages: Message[] = [{ role: 'bot', text: t.chat_greeting }, ...messages];

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
    if (sending) return;
    if (!q) {
      setInputError(true);
      return;
    }

    setInput('');
    setInputError(false);
    setSending(true);

    const userMsg: Message = { role: 'user', text: q };
    const loadingMsg: Message = { role: 'bot', text: '…', loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, lang }),
      });
      const data = await res.json();
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.loading) {
          next[next.length - 1] = { role: 'bot', text: data.reply || data.error || t.chat_fallback_error };
        }
        return next;
      });
    } catch {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.loading) {
          next[next.length - 1] = { role: 'bot', text: t.chat_network_error };
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
            <div id="chat-header-status">{t.chat_status}</div>
          </div>
        </div>

        <div id="chat-messages" ref={messagesRef}>
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg ${msg.role}${msg.loading ? ' loading' : ''}`}
            >
              {msg.role === 'bot' && !msg.loading ? <FormattedReply text={msg.text} /> : msg.text}
            </div>
          ))}
        </div>

        <div id="chat-quick">
          {quickQuestions.map(({ label, q }) => (
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
            className={inputError ? 'error' : ''}
            type="text"
            placeholder={t.chat_placeholder}
            maxLength={200}
            autoComplete="off"
            value={input}
            aria-invalid={inputError}
            onChange={e => { setInput(e.target.value); if (inputError) setInputError(false); }}
            onKeyDown={handleKeyDown}
            ref={inputRef}
          />
          <button
            id="chat-send"
            aria-label={t.chat_send_aria}
            disabled={sending}
            onClick={() => sendQuestion(input)}
          >
            ➤
          </button>
        </div>
        {inputError && (
          <div id="chat-input-error" role="alert">{t.chat_empty_error}</div>
        )}
      </div>
    </>
  );
}
