// 16:9 floor (in vh) for the resizable mobile preview panel (ds-stage,
// project_02/04-11), computed from the real viewport so the un-dragged panel
// is exactly 16:9 on every phone. The drag handle needs a JS vh number.
export default function get16by9FloorVh() {
    if (typeof window === 'undefined') return 35;
    return ((window.innerWidth * 9) / 16 / window.innerHeight) * 100;
}

// Height (vh) of that panel on a phone. The drag handle exists only on the
// tabs listed in each page's RESIZABLE_TABS (solution/highlights and
// gallery, where the stage shows a screenshot picked from the list). On every
// other tab — background, process — the stage holds a fixed 16:9 image, so
// the panel ignores whatever height was dragged earlier and sits at the 16:9
// floor: no handle, and no way to stretch that image. The dragged height
// itself is kept, so it comes back together with the handle.
export function mobileStageHeightVh(canResize, draggedVh) {
    return canResize ? draggedVh : get16by9FloorVh();
}
