import { describe, expect, it } from 'vitest';

// Regression coverage for the echarts modular-import switch (SkillsSection's
// tracking card bar chart went from `await import('echarts')` — the full
// package, every chart type/component/renderer registered, ~1.1MB minified
// — to this dedicated wrapper: `echarts/core` + explicit
// `use([BarChart, GridComponent, SVGRenderer])`). The failure mode this
// guards against: `use()` not actually registering what the chart's
// `setOption()` call needs (cartesian grid + category/value axes + bar
// series) — that fails at runtime ("Component series.bar not exists"), not
// at the type level, since `echarts/core`'s `init`/`setOption` are typed
// the same whether or not the chart type was registered.
describe('utils/trackingChart', () => {
  // Default 5000ms test timeout raced the dynamic import under full-suite
  // transform/module load and lost intermittently; the import itself (not a
  // fixed-delay animation) is what's being waited on, so a generous budget
  // costs nothing when the import is actually fast.
  it('registers enough of echarts/core to init, render, and dispose the tracking bar chart', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 200, configurable: true });

    return import('../src/utils/trackingChart').then(({ default: echarts }) => {
      const chart = echarts.init(el, undefined, { renderer: 'svg' });
      expect(() => {
        chart.setOption({
          grid: { top: 6, bottom: 6, left: 56, right: 48 },
          xAxis: { type: 'value', show: false },
          yAxis: { type: 'category', data: ['Backlog', 'Done', 'Review', 'Active'] },
          series: [{ type: 'bar', data: [14, 72, 38, 18] }],
          animation: false,
        });
      }).not.toThrow();
      chart.dispose();
      el.remove();
    });
  }, 20000);
});
