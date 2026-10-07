import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/array-insert-value.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreArray } from '../structures/array/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { arrayInsertValue } from './array-insert-value.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function insert(values: number[], index: number, value: number) {
  const board = new CoreBoard();
  const array = new CoreArray(values);
  board.add(array);

  const run = arrayInsertValue(board, array, listing.anchors, {
    index,
    value,
  });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: frame.nodes.map((node) => (node.empty ? null : node.value)),
      variants: array.nodes.map((node) => node.variant),
      labels: frame.labels.map((label) => label.text),
      floating: frame.floating.length,
    };
  });

  return { trace, array };
}

const anchors = (values: number[], index: number) =>
  insert(values, index, 42).trace.map((step) => step.anchor);

describe('array insert value', () => {
  describe('stops at the expected lines', () => {
    test('at the front, copying every element along', () => {
      expect(anchors([8, 3, 21], 0)).toEqual([
        'enter',
        'guard',
        'grow',
        'loop',
        'shift',
        'loop',
        'shift',
        'loop',
        'shift',
        'loop',
        'write',
        'exit',
      ]);
    });

    test('in the middle, copying only the later elements', () => {
      expect(anchors([8, 3, 21], 2)).toEqual([
        'enter',
        'guard',
        'grow',
        'loop',
        'shift',
        'loop',
        'write',
        'exit',
      ]);
    });

    test('at the end, copying nothing', () => {
      expect(anchors([8, 3, 21], 3)).toEqual([
        'enter',
        'guard',
        'grow',
        'loop',
        'write',
        'exit',
      ]);
    });

    test('into an empty array', () => {
      expect(anchors([], 0)).toEqual([
        'enter',
        'guard',
        'grow',
        'loop',
        'write',
        'exit',
      ]);
    });

    test.each([[-1], [4], [99]])('at index %i, out of range', (index) => {
      expect(anchors([8, 3, 21], index)).toEqual([
        'enter',
        'guard',
        'outOfRange',
        'exit',
      ]);
    });
  });

  test.each([
    { values: [8, 3, 21], index: 0, expected: [42, 8, 3, 21] },
    { values: [8, 3, 21], index: 1, expected: [8, 42, 3, 21] },
    { values: [8, 3, 21], index: 3, expected: [8, 3, 21, 42] },
    { values: [], index: 0, expected: [42] },
    { values: [8, 3, 21], index: -1, expected: [8, 3, 21] },
    { values: [8, 3, 21], index: 4, expected: [8, 3, 21] },
  ])('inserts at $index into $values', ({ values, index, expected }) => {
    const { array } = insert(values, index, 42);

    expect(array.toData()).toEqual(expected);
  });

  test('grows the array by an empty slot before anything is copied', () => {
    const { trace } = insert([8, 3, 21], 1, 42);
    const grow = trace.find((step) => step.anchor === 'grow')!;

    expect(grow.state.values).toEqual([8, 3, 21, null]);
  });

  test('copies each value along, leaving it in the cell it came from', () => {
    const { trace } = insert([8, 3, 21], 1, 42);
    const shifts = trace.filter((step) => step.anchor === 'shift');

    expect(shifts.map((step) => step.state.values)).toEqual([
      [8, 3, 21, 21],
      [8, 3, 3, 21],
    ]);
    expect(shifts.map((step) => step.state.variants)).toEqual([
      ['primary', 'primary', 'secondary', 'success'],
      ['primary', 'secondary', 'success', 'primary'],
    ]);
  });

  test('writes the value over the copy left at the index', () => {
    const { trace } = insert([8, 3, 21], 1, 42);
    const write = trace.find((step) => step.anchor === 'write')!;

    expect(write.state.values).toEqual([8, 42, 3, 21]);
    expect(write.state.variants).toEqual([
      'primary',
      'success',
      'primary',
      'primary',
    ]);
  });

  test('walks `i` down from the new slot to the index', () => {
    const { trace } = insert([8, 3, 21], 1, 42);
    const loops = trace.filter((step) => step.anchor === 'loop');

    expect(loops.map((step) => step.memory.i)).toEqual(['3', '2', '1']);
    expect(loops.at(-1)!.state.labels).toContain('index i');
  });

  test('keeps `i` only while the loop runs', () => {
    const { trace } = insert([8, 3, 21], 1, 42);
    const write = trace.find((step) => step.anchor === 'write')!;

    expect(write.memory).toEqual({ index: '1', value: '42' });
    expect(write.state.labels).toContain('index');
    expect(write.state.labels).not.toContain('i');
  });

  test('draws `index` one slot beyond either end at most', () => {
    const enter = (index: number) =>
      insert([8, 3, 21], index, 42).trace[0].state.labels;

    expect(enter(3)).toContain('index');
    expect(enter(-1)).toContain('index');
    expect(enter(4)).not.toContain('index');
    expect(enter(-2)).not.toContain('index');
  });

  test.each([
    { values: [8, 3, 21], index: 0 },
    { values: [8, 3, 21], index: 3 },
    { values: [], index: 0 },
    { values: [8, 3, 21], index: 5 },
  ])(
    'ends at $index of $values as a fresh array would be',
    ({ values, index }) => {
      const { trace, array } = insert(values, index, 42);
      const fresh = new CoreArray(array.toData());
      const exit = trace.at(-1)!;

      expect(array.nodes.map(({ x, y }) => ({ x, y }))).toEqual(
        fresh.nodes.map(({ x, y }) => ({ x, y })),
      );
      expect(exit.state.variants.every((v) => v === 'primary')).toBe(true);
      expect(exit.state.labels).toEqual(
        fresh.nodes.map((_, slot) => slot.toString()),
      );
    },
  );

  test('lands every value before the step is shown', () => {
    for (const step of insert([8, 3, 21], 0, 42).trace)
      expect(step.state.floating).toBe(0);
  });

  test('stays one call deep', () => {
    for (const step of insert([8, 3, 21], 0, 42).trace)
      expect(step.depth).toBe(1);
  });
});
