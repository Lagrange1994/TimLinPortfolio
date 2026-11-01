import './MakeLogo.css';

// Make (make.com) — the official mark, drawn the way Make's own app icon is:
// white mark on a purple rounded square. Path from Simple Icons (CC0), which
// takes it from Make's press kit (https://www.make.com/en/press). Brand
// colour is the --make token in portfolio.css.
const MAKE_PATH =
  'M13.38 3.498c-.27 0-.511.19-.566.465L9.85 18.986a.578.578 0 0 0 .453.678l4.095.826a.58.58 0 0 0 .682-.455l2.963-15.021a.578.578 0 0 0-.453-.678l-4.096-.826a.589.589 0 0 0-.113-.012zm-5.876.098a.576.576 0 0 0-.516.318L.062 17.697a.575.575 0 0 0 .256.774l3.733 1.877a.578.578 0 0 0 .775-.258l6.926-13.781a.577.577 0 0 0-.256-.776L7.762 3.658a.571.571 0 0 0-.258-.062zm11.74.115a.576.576 0 0 0-.576.576v15.426c0 .318.258.578.576.578h4.178a.58.58 0 0 0 .578-.578V4.287a.578.578 0 0 0-.578-.576Z';

// Shown on its own (no "Make" text beside it), so it carries the name itself:
// role="img" + aria-label for screen readers, title for a hover tooltip.
export default function MakeLogo({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <span
      className={`make-logo${className ? ' ' + className : ''}`}
      style={{ ['--make-logo-size' as string]: `${size}px` }}
      role="img"
      aria-label="Make"
      title="Make"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
        <path d={MAKE_PATH} />
      </svg>
    </span>
  );
}
