import { WORDS, type Word } from '@/src/config';

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Build a sequence of words for the whole exercise with no 3
 * identical words in a row.
 *
 * Strategy: split the sequence into "sets", each a shuffled
 * permutation of all 5 words (the final set may be a partial,
 * randomly-selected subset if the total count isn't a
 * multiple of 5). Randomize the order the sets are placed in,
 * then concatenate.
 *
 * Because every set is internally a permutation (no repeats),
 * a repeated word can only ever occur exactly at the seam
 * between two sets, and a single seam can produce a run of at
 * most 2. breakRunsOfThree() is a defensive pass for the rare
 * case where a short partial set bridges two seams at once
 * and would otherwise chain into a run of 3.
 */
export function createExerciseSequence(
  durationSeconds: number,
  intervalMs: number,
): Word[] {
  const count = Math.max(1, Math.ceil((durationSeconds * 1000) / intervalMs));

  const fullSets = Math.floor(count / WORDS.length);
  const remainder = count % WORDS.length;

  const sets: Word[][] = [];

  for (let i = 0; i < fullSets; i += 1) {
    sets.push(shuffleArray([...WORDS]));
  }

  if (remainder > 0) {
    sets.push(shuffleArray([...WORDS]).slice(0, remainder));
  }

  const sequence = shuffleArray(sets).flat();

  return breakRunsOfThree(sequence);
}

function breakRunsOfThree(sequence: Word[]): Word[] {
  const result = [...sequence];

  for (let i = 2; i < result.length; i += 1) {
    if (result[i] === result[i - 1] && result[i] === result[i - 2]) {
      const swapIndex = result.findIndex(
        (word, index) =>
          index > i && word !== result[i - 1] && word !== result[i + 1],
      );

      if (swapIndex !== -1) {
        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
      }
    }
  }

  return result;
}
