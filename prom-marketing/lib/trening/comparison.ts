export type Comparison = {
  percent: number;
  ocenka: 0 | 1 | 2;
  words: Array<{ text: string; matched: boolean }>;
};

const WORD = /[\p{L}\p{N}\p{M}]+/gu;

function tokens(value: string) {
  return Array.from(value.matchAll(WORD), (match) => ({
    text: match[0],
    normalized: match[0].normalize("NFC").toLocaleLowerCase("bg-BG"),
    index: match.index,
  }));
}

/** Ordered word matching: repeated words count once and extra words reduce the score. */
export function compareAnswer(original: string, spoken: string): Comparison {
  const expected = tokens(original);
  const actual = tokens(spoken);
  // Keep only two score rows; the compact direction matrix lets us highlight
  // the original wording without losing any punctuation or whitespace.
  const directions = new Uint8Array(expected.length * actual.length);
  let previous = new Uint32Array(actual.length + 1);
  let current = new Uint32Array(actual.length + 1);

  for (let i = 1; i <= expected.length; i++) {
    for (let j = 1; j <= actual.length; j++) {
      const at = (i - 1) * actual.length + j - 1;
      if (expected[i - 1].normalized === actual[j - 1].normalized) {
        current[j] = previous[j - 1] + 1;
        directions[at] = 1;
      } else if (previous[j] >= current[j - 1]) {
        current[j] = previous[j];
        directions[at] = 2;
      } else {
        current[j] = current[j - 1];
        directions[at] = 3;
      }
    }
    [previous, current] = [current, previous];
    current.fill(0);
  }

  const matched = new Set<number>();
  let i = expected.length;
  let j = actual.length;
  while (i > 0 && j > 0) {
    const direction = directions[(i - 1) * actual.length + j - 1];
    if (direction === 1) {
      matched.add(i - 1);
      i--;
      j--;
    } else if (direction === 2) {
      i--;
    } else {
      j--;
    }
  }

  const denominator = Math.max(expected.length, actual.length);
  const percent = denominator === 0 ? 0 : Math.floor((matched.size * 100) / denominator);
  const words: Comparison["words"] = [];
  let cursor = 0;
  expected.forEach((word, index) => {
    if (word.index > cursor) words.push({ text: original.slice(cursor, word.index), matched: true });
    words.push({ text: word.text, matched: matched.has(index) });
    cursor = word.index + word.text.length;
  });
  if (cursor < original.length) words.push({ text: original.slice(cursor), matched: true });

  return { percent, ocenka: percent >= 90 ? 2 : percent >= 60 ? 1 : 0, words };
}
