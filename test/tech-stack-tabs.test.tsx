import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Tech Stack: ProcessCarousel `single` pages one card at a time under its
// tabs even on desktop (matchMedia false = no phone query match).
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { ProcessCarousel } from '../src/components/SkillsSection';

const tabs = [
  { label: 'HTML / CSS', color: '#60a5fa', color2: '#3b82f6' },
  { label: 'JavaScript', color: '#fb923c', color2: '#f97316' },
  { label: 'React / Vue', color: '#8b7bff', color2: '#6C63FF' },
];
const cards = tabs.map(t => <div key={t.label} className="card">{t.label}</div>);

afterEach(cleanup);

describe('ProcessCarousel single', () => {
  it('desktop + single: tabs, no dots or ‹ ›, first tab open', () => {
    const { container, getAllByRole } = render(<ProcessCarousel single variant="tech" tabs={tabs} cards={cards} />);
    expect(container.querySelector('.process-scroll-wrap--tabs')).not.toBeNull();
    expect(getAllByRole('tab').map(b => b.textContent)).toEqual(tabs.map(t => t.label));
    expect(getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('.process-swipe-dots')).toBeNull();
    expect(container.querySelector('.process-swipe-nav')).toBeNull();
  });

  it('clicking a tab opens that card', () => {
    const { getAllByRole } = render(<ProcessCarousel single variant="tech" tabs={tabs} cards={cards} />);
    fireEvent.click(getAllByRole('tab')[2]);
    expect(getAllByRole('tab').map(b => b.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
  });

  it('aside: the open card\'s text under the tabs, following the tab', () => {
    const aside = tabs.map(t => <p key={t.label}>{`${t.label} text`}</p>);
    const { container, getAllByRole } = render(<ProcessCarousel single variant="tech" tabs={tabs} aside={aside} cards={cards} />);
    const text = () => container.querySelector('.process-tab-aside')!.textContent;
    expect(text()).toBe('HTML / CSS text');
    // sits between the tabs and the track (grid places it under the tabs)
    expect(container.querySelector('.process-tabs-block > .process-tabs + .process-tab-aside')).not.toBeNull();
    fireEvent.click(getAllByRole('tab')[1]);
    expect(text()).toBe('JavaScript text');
  });

  it('a tab with an icon shows it, hidden from screen readers; one without has none', () => {
    const withIcon = [{ ...tabs[0], icon: 'fab fa-html5' }, tabs[1], tabs[2]];
    const { getAllByRole } = render(<ProcessCarousel single variant="tech" tabs={withIcon} cards={cards} />);
    const [first, second] = getAllByRole('tab');
    const icon = first.querySelector('.process-tab-label i.process-tab-icon.fa-html5')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(first.textContent).toBe('HTML / CSS');
    expect(second.querySelector('.process-tab-icon')).toBeNull();
  });

  it('no aside without one passed', () => {
    const { container } = render(<ProcessCarousel single variant="tech" tabs={tabs} cards={cards} />);
    expect(container.querySelector('.process-tab-aside')).toBeNull();
  });

  it('without single, desktop shows three a page and no tabs', () => {
    const { container } = render(<ProcessCarousel variant="tech" tabs={tabs} cards={cards} />);
    expect(container.querySelector('[role=tab]')).toBeNull();
    expect(container.querySelector('.process-scroll-wrap--tabs')).toBeNull();
  });
});
