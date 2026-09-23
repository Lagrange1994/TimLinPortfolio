// Ultra-wide/4K scale lock, JS half. The CSS half (`html { zoom }` at >=1921px,
// see the "4K / large-screen scale lock" block in the stylesheets) makes the
// whole page render as if the viewport were 1920px wide. CSS `zoom` on the
// root, though, leaves the coordinate APIs half-zoomed: getBoundingClientRect,
// pointer coordinates, scroll offsets and innerWidth/innerHeight report
// VISUAL pixels, while layout (`style.left`, offsetTop, GSAP x/y, canvas CSS
// sizes) is in the zoomed-out CSS px. Any code that reads one and writes the
// other lands off by the zoom factor. This module makes every read API report
// the same 1920-based "virtual" pixels the layout uses, and converts the few
// write APIs (scrollTo/scrollBy/elementFromPoint) back, so app code — and
// libraries like GSAP ScrollTrigger and the Spline runtime — behave exactly as
// on a real 1920px screen. devicePixelRatio is multiplied by the zoom, like a
// real browser zoom, so canvases keep rendering at full physical resolution.
// Import this FIRST in every entry point; it is a no-op at <=1920px.

const BASE_WIDTH = 1920;

const supported =
  typeof window !== 'undefined' &&
  typeof CSS !== 'undefined' &&
  CSS.supports('zoom', 'calc(100vw / 1920px)');

const rawInnerWidth = supported
  ? Object.getOwnPropertyDescriptor(Window.prototype, 'innerWidth')?.get ??
    Object.getOwnPropertyDescriptor(window, 'innerWidth')?.get
  : undefined;

// Mirrors the stylesheets' `zoom: calc(100vw / 1920px)`: same input (viewport
// width incl. scrollbar), so the JS factor can never drift from the CSS one.
function zoomFactor(): number {
  if (!rawInnerWidth) return 1;
  const w = rawInnerWidth.call(window) as number;
  return w > BASE_WIDTH ? w / BASE_WIDTH : 1;
}

type Getter = (this: unknown) => unknown;

function wrapGetter(proto: object | undefined, key: string, convert: (value: number, self: unknown) => number) {
  if (!proto) return;
  const desc = Object.getOwnPropertyDescriptor(proto, key);
  if (!desc?.get) return;
  const get = desc.get as Getter;
  Object.defineProperty(proto, key, {
    ...desc,
    get() {
      const value = get.call(this);
      if (typeof value !== 'number') return value;
      return convert(value, this);
    },
  });
}

function wrapAccessor(
  proto: object | undefined,
  key: string,
  read: (value: number, self: unknown) => number,
  write: (value: number, self: unknown) => number,
) {
  if (!proto) return;
  const desc = Object.getOwnPropertyDescriptor(proto, key);
  if (!desc?.get || !desc.set) return;
  const get = desc.get as Getter;
  const set = desc.set as (this: unknown, v: number) => void;
  Object.defineProperty(proto, key, {
    ...desc,
    get() {
      const value = get.call(this);
      return typeof value === 'number' ? read(value, this) : value;
    },
    set(v: number) {
      set.call(this, write(v, this));
    },
  });
}

const div = (v: number) => {
  const z = zoomFactor();
  return z === 1 ? v : v / z;
};
const mul = (v: number) => {
  const z = zoomFactor();
  return z === 1 ? v : v * z;
};

const isRootScroller = (el: unknown) =>
  el === document.documentElement || el === document.body || el === document.scrollingElement;

function scaleRect(r: DOMRectReadOnly): DOMRect {
  const z = zoomFactor();
  return z === 1 ? (r as DOMRect) : new DOMRect(r.x / z, r.y / z, r.width / z, r.height / z);
}

function install() {
  // Geometry reads.
  const origRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    return scaleRect(origRect.call(this));
  };
  const origRects = Element.prototype.getClientRects;
  Element.prototype.getClientRects = function (this: Element) {
    const list = origRects.call(this);
    if (zoomFactor() === 1) return list;
    return Array.from(list, scaleRect) as unknown as DOMRectList;
  };
  const origRangeRect = Range.prototype.getBoundingClientRect;
  Range.prototype.getBoundingClientRect = function (this: Range) {
    return scaleRect(origRangeRect.call(this));
  };

  // Viewport size and scroll position (visual -> virtual).
  for (const key of ['innerWidth', 'innerHeight', 'scrollX', 'scrollY', 'pageXOffset', 'pageYOffset']) {
    const desc =
      Object.getOwnPropertyDescriptor(Window.prototype, key) ?? Object.getOwnPropertyDescriptor(window, key);
    if (!desc?.get) continue;
    const get = desc.get;
    Object.defineProperty(window, key, {
      configurable: true,
      enumerable: true,
      get() {
        return div(get.call(window) as number);
      },
    });
  }
  const dprDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'devicePixelRatio') ?? Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
  if (dprDesc?.get) {
    const get = dprDesc.get;
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      enumerable: true,
      get() {
        return mul(get.call(window) as number);
      },
    });
  }
  for (const key of ['width', 'height', 'offsetLeft', 'offsetTop', 'pageLeft', 'pageTop']) {
    wrapGetter(window.VisualViewport?.prototype, key, div);
  }

  // Root scroller metrics (element-local scrollers are untouched).
  for (const key of ['clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight']) {
    wrapGetter(Element.prototype, key, (v, self) => (isRootScroller(self) ? div(v) : v));
  }
  for (const key of ['scrollTop', 'scrollLeft']) {
    wrapAccessor(
      Element.prototype,
      key,
      (v, self) => (isRootScroller(self) ? div(v) : v),
      (v, self) => (isRootScroller(self) ? mul(v) : v),
    );
  }

  // Scroll writes (virtual -> visual).
  type ScrollFn = (this: unknown, ...args: unknown[]) => void;
  const scaleScrollArgs = (args: unknown[]): unknown[] => {
    if (args.length === 1 && args[0] && typeof args[0] === 'object') {
      const o = { ...(args[0] as ScrollToOptions) };
      if (typeof o.left === 'number') o.left = mul(o.left);
      if (typeof o.top === 'number') o.top = mul(o.top);
      return [o];
    }
    return args.map((a) => (typeof a === 'number' ? mul(a) : a));
  };
  for (const key of ['scrollTo', 'scroll', 'scrollBy'] as const) {
    const winOrig = window[key] as unknown as ScrollFn;
    (window as unknown as Record<string, ScrollFn>)[key] = function (this: unknown, ...args: unknown[]) {
      return winOrig.apply(window, scaleScrollArgs(args));
    };
    const elOrig = Element.prototype[key] as unknown as ScrollFn;
    (Element.prototype as unknown as Record<string, ScrollFn>)[key] = function (this: unknown, ...args: unknown[]) {
      return elOrig.apply(this, isRootScroller(this) ? scaleScrollArgs(args) : args);
    };
  }

  // Hit testing (virtual -> visual).
  const origFromPoint = Document.prototype.elementFromPoint;
  Document.prototype.elementFromPoint = function (this: Document, x: number, y: number) {
    return origFromPoint.call(this, mul(x), mul(y));
  };
  const origFromPoints = Document.prototype.elementsFromPoint;
  Document.prototype.elementsFromPoint = function (this: Document, x: number, y: number) {
    return origFromPoints.call(this, mul(x), mul(y));
  };

  // Pointer / wheel / touch coordinates (visual -> virtual).
  for (const key of ['clientX', 'clientY', 'pageX', 'pageY', 'x', 'y']) {
    wrapGetter(MouseEvent.prototype, key, div);
  }
  if (typeof Touch !== 'undefined') {
    for (const key of ['clientX', 'clientY', 'pageX', 'pageY']) wrapGetter(Touch.prototype, key, div);
  }
  for (const key of ['deltaX', 'deltaY', 'deltaZ']) {
    wrapGetter(WheelEvent.prototype, key, (v, self) => ((self as WheelEvent).deltaMode === 0 ? div(v) : v));
  }

  // IntersectionObserver geometry.
  for (const key of ['boundingClientRect', 'intersectionRect', 'rootBounds']) {
    const desc = Object.getOwnPropertyDescriptor(IntersectionObserverEntry.prototype, key);
    if (!desc?.get) continue;
    const get = desc.get;
    Object.defineProperty(IntersectionObserverEntry.prototype, key, {
      ...desc,
      get() {
        const r = get.call(this) as DOMRectReadOnly | null;
        return r ? scaleRect(r) : r;
      },
    });
  }
}

if (supported && rawInnerWidth) install();
