// Shared "16:9 floor" for the resizable mobile preview panel (the
// draggable ds-stage used by project_02/04-11). The panel used to start
// (and refuse to shrink past) a flat 35 (vh) magic number, unrelated to the
// device's actual proportions. This computes that floor from the real
// viewport instead, so the un-dragged panel is exactly 16:9 on every phone
// — the same ratio project_01/03 get for free via `aspect-video` — just
// re-expressed in vh, since these pages' drag handle needs a JS-tracked vh
// number (not a CSS ratio) to resize from.
export default function get16by9FloorVh() {
    if (typeof window === 'undefined') return 35;
    return ((window.innerWidth * 9) / 16 / window.innerHeight) * 100;
}
