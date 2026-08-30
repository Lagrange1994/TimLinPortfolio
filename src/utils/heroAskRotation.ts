/**
 * Picks the next suggestion for the hero ask strip's rolling pills.
 *
 * The three pills cycle through a shared pool, so the only real rule is that a
 * suggestion must not appear in two pills at once — otherwise a random draw
 * eventually shows the visitor the same question twice side by side, which
 * reads as a bug rather than as variety.
 *
 * `rand` is injectable purely so the rotation can be tested without stubbing
 * Math.random globally.
 */
export function pickReplacement<T>(
  pool: readonly T[],
  shown: readonly T[],
  rand: () => number = Math.random,
): T | null {
  const candidates = pool.filter(item => !shown.includes(item));
  if (candidates.length === 0) return null;
  // Math.random() can theoretically return values that floor to length, and a
  // stubbed rand in a test certainly can; clamp rather than return undefined.
  const i = Math.min(candidates.length - 1, Math.floor(rand() * candidates.length));
  return candidates[i];
}
