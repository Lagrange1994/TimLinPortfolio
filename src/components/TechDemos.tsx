import { useEffect, useRef, type ReactNode } from 'react';
import { useLang } from '../context/LangContext';
import './TechDemos.css';

// Tech Stack card demos: each card's mock screen acts out what its copy
// says, instead of a generic typing code snippet.
//   HTML / CSS  — a design comp and its markup, matched piece by piece
//   JavaScript  — a described request, the AI's code, the interaction live
//   React / Vue — one flex layout reflowing at three widths
// Pure CSS loops (TechDemos.css). They run only while on screen: off screen
// the RWD frame's width animation would keep forcing layout for nothing.

// Plays the loop only while the demo is in view (data-play on the root).
function useOnScreen() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      el?.setAttribute('data-play', '');
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.setAttribute('data-play', '');
      else el.removeAttribute('data-play');
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

// The shared window frame: the old code preview's bar, with a caption.
function DemoWindow({ kind, caption, children }: { kind: string; caption: string; children: ReactNode }) {
  const ref = useOnScreen();
  return (
    <div ref={ref} className={`tech-code-preview td td-${kind}`} aria-hidden="true">
      <div className="tcp-bar">
        <span className="tcp-dot" /><span className="tcp-dot" /><span className="tcp-dot" />
        <span className="tcp-filename">{caption}</span>
      </div>
      <div className="td-body">{children}</div>
    </div>
  );
}

// HTML / CSS: a highlight walks the comp (nav, card, button, its colour)
// and the matching lines of markup light up with it.
export function HtmlDemo() {
  const { t } = useLang();
  return (
    <DemoWindow kind="html" caption={t.td_html_bar}>
      <div className="td-comp">
        <div className="td-label">{t.td_html_figma}</div>
        <div className="td-page">
          <div className="td-nav">
            <span className="td-logo" /><span className="td-link" /><span className="td-link" />
            <span className="td-ring td-s1" />
          </div>
          <div className="td-card">
            <div className="td-img" />
            <span className="td-line" /><span className="td-line td-line--short" />
            <span className="td-ring td-s2" />
          </div>
          <div className="td-btn-wrap">
            <div className="td-btn">{t.td_html_btn}</div>
            <span className="td-ring td-ring--pill td-s3" />
            <span className="td-ring td-ring--pill td-s4" />
          </div>
        </div>
        <div className="td-swatch td-s4"><span />Primary · #5B4FE0</div>
      </div>
      <div className="td-code">
        <div className="td-ln td-l1">{'<header'}<span className="td-attr">{' class="nav"'}</span>{'>…</header>'}</div>
        <div className="td-ln td-l2">{'<article'}<span className="td-attr">{' class="card"'}</span>{'>'}</div>
        <div className="td-ln td-l2 td-ln--in">{`<img alt="${t.td_html_img_alt}">`}</div>
        <div className="td-ln td-l2 td-ln--in">{`<h3>${t.td_html_title}</h3>`}</div>
        <div className="td-ln td-l2">{'</article>'}</div>
        <div className="td-ln td-l3">{'<button'}<span className="td-attr">{' class="btn"'}</span>{`>${t.td_html_btn}</button>`}</div>
        <div className="td-ln td-l4 td-ln--gap"><span className="td-attr">.btn {'{'} </span>background: var(--primary)<span className="td-attr"> {'}'}</span></div>
        <div className="td-ln td-l4"><span className="td-attr">:root {'{'} </span>--primary: #5B4FE0<span className="td-attr"> {'}'}</span></div>
      </div>
    </DemoWindow>
  );
}

// JavaScript: the request, the AI's answer, then the button is pressed and
// the card fades in and rises, as asked.
export function JsDemo() {
  const { t } = useLang();
  return (
    <DemoWindow kind="js" caption={t.td_js_bar}>
      <div className="td-chat">
        <div className="td-ask">{t.td_js_prompt}</div>
        <div className="td-reply">
          <div className="td-think"><span /><span /><span /></div>
          <div className="td-answer">
            <span className="td-ai">AI</span>
            <div className="td-snippet">{"btn.onclick = () =>\n  gsap.from('.card', {\n    y: 24, opacity: 0,\n    ease: 'expo.out',\n  });"}</div>
          </div>
        </div>
      </div>
      <div className="td-preview">
        <div className="td-label">{t.td_js_preview}</div>
        <div className="td-press-wrap">
          <div className="td-press">{t.td_js_btn}</div>
          <svg className="td-cursor" viewBox="0 0 24 24"><path d="M5 3l14 7-6 2-2 6z" /></svg>
        </div>
        <div className="td-rise">
          <div className="td-img td-img--warm" />
          <span className="td-line" /><span className="td-line td-line--short" />
        </div>
      </div>
    </DemoWindow>
  );
}

// React / Vue: the frame narrows from desktop to tablet to phone, centred
// in the window; the tiles are a real flex-wrap row, so they reflow
// 3 → 2 → 1 on their own.
export function RwdDemo() {
  const { t } = useLang();
  return (
    <DemoWindow kind="rwd" caption={t.td_rwd_bar}>
      <div className="td-bp">
        <span className="td-bp-1">{t.td_rwd_desktop}</span>
        <span className="td-bp-2">{t.td_rwd_tablet}</span>
        <span className="td-bp-3">{t.td_rwd_phone}</span>
      </div>
      <div className="td-frame">
        <div className="td-nav"><span className="td-logo" /><span className="td-link" /><span className="td-link" /></div>
        <div className="td-tiles">
          {['a', 'b', 'c'].map(k => (
            <div key={k} className={`td-tile td-tile--${k}`}>
              <span className="td-thumb" />
              <span className="td-tile-text"><span className="td-line" /><span className="td-line td-line--short" /></span>
            </div>
          ))}
        </div>
      </div>
      <div className="td-rule">.tiles {'{'} display: flex; flex-wrap: wrap {'}'}</div>
    </DemoWindow>
  );
}
