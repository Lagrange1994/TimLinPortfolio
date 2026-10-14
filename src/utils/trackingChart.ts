// Lazy-loaded entry point for the "tracking" skill card's bar chart
// (SkillsSection.tsx). Static imports here (not a dynamic `import('echarts/charts')`
// destructure) are what let Rollup actually tree-shake the echarts/charts and
// echarts/components barrels down to just BarChart + GridComponent's own
// dependency graph — a dynamic import of those barrels returns the full
// namespace object and drags in every chart type's install code (map/graphic/
// geo-json parsing included) regardless of what's destructured from it.
// This whole module is still loaded on demand: SkillsSection dynamic-imports
// *this file*, not echarts directly.
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([BarChart, GridComponent, SVGRenderer]);

export default echarts;
