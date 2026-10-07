import { describe, expect, test } from 'vitest';

import { seedRandom } from '../../testing/random.ts';
import { arrayOperations } from './operations.ts';
import { CoreArray } from './structure.ts';

const ARRAY = [8, 3, 21];

function apply(id: string, args: Record<string, number> = {}) {
  const array = new CoreArray(ARRAY);
  arrayOperations[id](array, args);

  return array;
}

describe('array operations', () => {
  test('randomize fills five to ten values', () => {
    seedRandom(42);

    for (let round = 0; round < 50; round++) {
      const { length } = apply('randomize').toData();

      expect(length).toBeGreaterThanOrEqual(5);
      expect(length).toBeLessThanOrEqual(10);
    }
  });

  // Sorted as text, 21 would come before 3.
  test('sort orders the values by number', () => {
    expect(apply('sort').toData()).toEqual([3, 8, 21]);
  });

  test.each([
    { index: 0, expected: [42, 8, 3, 21] },
    { index: 1, expected: [8, 42, 3, 21] },
    { index: 3, expected: [8, 3, 21, 42] },
    { index: -5, expected: [42, 8, 3, 21] },
    { index: 99, expected: [8, 3, 21, 42] },
  ])('insert at $index, clamped into range', ({ index, expected }) => {
    expect(apply('insert', { index, value: 42 }).toData()).toEqual(expected);
  });

  test.each([
    { index: 0, expected: [3, 21] },
    { index: 2, expected: [8, 3] },
    { index: -5, expected: [3, 21] },
    { index: 99, expected: [8, 3] },
  ])('remove at $index, clamped into range', ({ index, expected }) => {
    expect(apply('remove', { index }).toData()).toEqual(expected);
  });

  test('remove from an empty array does nothing', () => {
    const array = new CoreArray();
    arrayOperations.remove(array, { index: 0 });

    expect(array.toData()).toEqual([]);
  });

  test.each<{ id: string; args: Record<string, number> }>([
    { id: 'sort', args: {} },
    { id: 'insert', args: { index: 1, value: 42 } },
    { id: 'remove', args: { index: 1 } },
  ])(
    '$id leaves the cells laid out as a fresh array would be',
    ({ id, args }) => {
      const array = apply(id, args);
      const fresh = new CoreArray(array.toData());

      expect(array.nodes.map(({ x, y }) => ({ x, y }))).toEqual(
        fresh.nodes.map(({ x, y }) => ({ x, y })),
      );
    },
  );
});
