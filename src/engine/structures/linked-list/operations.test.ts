import { describe, expect, test } from 'vitest';

import { seedRandom } from '../../testing/random.ts';
import { linkedListOperations } from './operations.ts';
import { CoreLinkedList } from './structure.ts';

const LIST = [8, 3, 21, 3];

function apply(
  id: string,
  args: Record<string, number> = {},
  values: number[] = LIST,
) {
  const list = new CoreLinkedList(values);
  linkedListOperations[id](list, args);

  return list;
}

describe('linked list operations', () => {
  test('randomize fills four to six distinct values', () => {
    seedRandom(42);

    for (let round = 0; round < 50; round++) {
      const values = apply('randomize').toData();

      expect(values.length).toBeGreaterThanOrEqual(4);
      expect(values.length).toBeLessThanOrEqual(6);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  test('insert-head puts the value first', () => {
    expect(apply('insert-head', { value: 42 }).toData()).toEqual([
      42, 8, 3, 21, 3,
    ]);
    expect(apply('insert-head', { value: 42 }, []).toData()).toEqual([42]);
  });

  test.each([
    { name: 'the head', target: 8, expected: [8, 42, 3, 21, 3] },
    {
      name: 'the first of two matches',
      target: 3,
      expected: [8, 3, 42, 21, 3],
    },
    { name: 'the tail', target: 21, expected: [8, 3, 21, 42, 3] },
    { name: 'a target not held', target: 5, expected: LIST },
  ])('insert-after $name', ({ target, expected }) => {
    expect(apply('insert-after', { target, value: 42 }).toData()).toEqual(
      expected,
    );
  });

  test.each([
    { name: 'the head', target: 8, expected: [3, 21, 3] },
    { name: 'the first of two matches', target: 3, expected: [8, 21, 3] },
    { name: 'the tail', target: 21, expected: [8, 3, 3] },
    { name: 'a target not held', target: 5, expected: LIST },
  ])('remove $name', ({ target, expected }) => {
    expect(apply('remove', { target }).toData()).toEqual(expected);
  });

  test('remove of the only node empties the list', () => {
    expect(apply('remove', { target: 8 }, [8]).head).toBeNull();
  });

  test.each<{ id: string; args: Record<string, number> }>([
    { id: 'insert-head', args: { value: 42 } },
    { id: 'insert-after', args: { target: 3, value: 42 } },
    { id: 'remove', args: { target: 8 } },
  ])('$id leaves the list laid out as a fresh one would be', ({ id, args }) => {
    const list = apply(id, args);
    const fresh = new CoreLinkedList(list.toData());

    expect(list.nodes().map(({ x, y }) => ({ x, y }))).toEqual(
      fresh.nodes().map(({ x, y }) => ({ x, y })),
    );
  });
});
