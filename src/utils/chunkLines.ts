// Words joined into whole lines of `perLine` words each (a caption that
// must break between list items, never inside one).
export function chunkLines(words: string[], perLine: number, separator: string): string[] {
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += perLine) lines.push(words.slice(i, i + perLine).join(separator));
  return lines;
}
