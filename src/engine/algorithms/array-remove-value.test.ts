import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/array-remove-value.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreArray } from '../structures/array/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { arrayRemoveValue } from './array-remove-value.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function remove(values: number[], index: number) {
  const board = new CoreBoard();
  const array = new CoreArray(values);
  board.add(array);

  const run = arrayRemoveValue(board, array, listing.anchors, { index });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: frame.nodes.map((node) => node.value),
      variants: array.nodes.map((node) => node.variant),
      labels: frame.labels.map((label) => label.text),
      floating: frame.floating.length,
    };
  });

  return { trace, array };
}

const anchors = (values: number[], index: number) =>
  remove(values, index).trace.map((step) => step.anchor);

describe('array remove value', () => {
  describe('stops at the expected lines', () => {
    test('at the front, copying every later element back', () => {
      expect(anchors([8, 3, 21], 0)).toEqual([
        'enter',
        'guard',
        'loop',
        'shift',
        'loop',
        'shift',
        'loop',
        'shrink',
        'exit',
      ]);
    });

    test('in the middle, copying only the later elements', () => {
      expect(anchors([8, 3, 21], 1)).toEqual([
        'enter',
        'guard',
        'loop',
        'shift',
        'loop',
        'shrink',
        'exit',
      ]);
    });

    test('at the last cell, copying nothing', () => {
      expect(anchors([8, 3, 21], 2)).toEqual([
        'enter',
        'guard',
        'loop',
        'shrink',
        'exit',
      ]);
    });

    test('from a single element', () => {
      expect(anchors([8], 0)).toEqual([
        'enter',
        'guard',
        'loop',
        'shrink',
        'exit',
      ]);
    });

    test.each([
      { values: [8, 3, 21], index: -1 },
      { values: [8, 3, 21], index: 3 },
      { values: [8, 3, 21], index: 99 },
      { values: [], index: 0 },
    ])('at $index of $values, out of range', ({ values, index }) => {
      expect(anchors(values, index)).toEqual([
        'enter',
        'guard',
        'outOfRange',
        'exit',
      ]);
    });
  });

  test.each([
    { values: [8, 3, 21], index: 0, expected: [3, 21] },
    { values: [8, 3, 21], index: 1, expected: [8, 21] },
    { values: [8, 3, 21], index: 2, expected: [8, 3] },
    { values: [8], index: 0, expected: [] },
    { values: [4, 4, 7], index: 0, expected: [4, 7] },
    { values: [8, 3, 21], index: -1, expected: [8, 3, 21] },
    { values: [8, 3, 21], index: 3, expected: [8, 3, 21] },
    { values: [], index: 0, expected: [] },
  ])('removes $index from $values', ({ values, index, expected }) => {
    const { array } = remove(values, index);

    expect(array.toData()).toEqual(expected);
  });

  test('copies each value back, leaving it in the cell it came from', () => {
    const { trace } = remove([8, 3, 21, 5], 1);
    const shifts = trace.filter((step) => step.anchor === 'shift');

    expect(shifts.map((step) => step.state.values)).toEqual([
      [8, 21, 21, 5],
      [8, 21, 5, 5],
    ]);
    expect(shifts.map((step) => step.state.variants)).toEqual([
      ['primary', 'success', 'secondary', 'primary'],
      ['primary', 'primary', 'success', 'secondary'],
    ]);
  });

  test('drops the last slot, with the copy left in it', () => {
    const { trace } = remove([8, 3, 21, 5], 1);
    const loop = trace.findLast((step) => step.anchor === 'loop')!;
    const shrink = trace.find((step) => step.anchor === 'shrink')!;

    expect(loop.state.values).toEqual([8, 21, 5, 5]);
    expect(shrink.state.values).toEqual([8, 21, 5]);
    expect(shrink.state.variants).toEqual(['primary', 'primary', 'primary']);
  });

  test('walks `i` up from the index to the last cell', () => {
    const { trace } = remove([8, 3, 21, 5], 1);
    const loops = trace.filter((step) => step.anchor === 'loop');

    expect(loops.map((step) => step.memory.i)).toEqual(['1', '2', '3']);
    expect(loops[0].state.labels).toContain('index i');
  });

  test('keeps `i` only while the loop runs', () => {
    const { trace } = remove([8, 3, 21], 1);
    const shrink = trace.find((step) => step.anchor === 'shrink')!;

    expect(shrink.memory).toEqual({ index: '1' });
    expect(shrink.state.labels).toContain('index');
    expect(shrink.state.labels).not.toContain('i');
  });

  test('leaves `index` past the end when the last cell is removed', () => {
    const { trace } = remove([8, 3, 21], 2);
    const shrink = trace.find((step) => step.anchor === 'shrink')!;

    expect(shrink.state.labels).toEqual(['0', '1', 'index']);
  });

  test('draws `index` one slot beyond either end at most', () => {
    const enter = (index: number) =>
      remove([8, 3, 21], index).trace[0].state.labels;

    expect(enter(3)).toContain('index');
    expect(enter(-1)).toContain('index');
    expect(enter(4)).not.toContain('index');
    expect(enter(-2)).not.toContain('index');
  });

  test.each([
    { values: [8, 3, 21], index: 0 },
    { values: [8, 3, 21], index: 2 },
    { values: [8], index: 0 },
    { values: [8, 3, 21], index: 5 },
  ])(
    'ends at $index of $values as a fresh array would be',
    ({ values, index }) => {
      const { trace, array } = remove(values, index);
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

  test('lands every copy before the step is shown', () => {
    for (const step of remove([8, 3, 21], 0).trace)
      expect(step.state.floating).toBe(0);
  });

  test('stays one call deep', () => {
    for (const step of remove([8, 3, 21], 0).trace) expect(step.depth).toBe(1);
  });
});
