// One size system for every notched card (About / Contact's NotchCard,
// My Portfolio's wall, How I Use AI's viewer), mirrored as CSS custom
// properties on :root in portfolio.css (--card-r, --notch-gap,
// --notch-text-pad, --notch-turn); test/notch-tokens.test.ts keeps the two
// in step.

// A card's own outer corner.
export const CARD_RADIUS = 48;
// Round a button or a tag tray sitting in a notch: the bento grid's own
// gutter, so the notch reads as the gutter running into the card.
export const NOTCH_GAP = 12;
// Round heading text sitting in a notch (a section's label / title / sub).
export const NOTCH_TEXT_PAD = 16;
// Every turn of a notch's own outline (its ends at the card's edge, its
// steps): half the card's corner.
export const NOTCH_TURN = CARD_RADIUS / 2;
