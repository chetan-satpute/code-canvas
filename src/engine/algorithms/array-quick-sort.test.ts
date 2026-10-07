import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/array-quick-sort.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreArray } from '../structures/array/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { arrayQuickSort } from './array-quick-sort.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function sort(values: number[]) {
  const board = new CoreBoard();
  const array = new CoreArray(values);
  array.name = 'array';
  board.add(array);

  const run = arrayQuickSort(board, array, listing.anchors, {});

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: array.toData(),
      variants: array.nodes.map((node) => node.variant),
      // Index labels are digits; everything else under the row is a cursor.
      cursors: frame.labels
        .map((label) => label.text)
        .filter((text) => !/^\d+$/.test(text) && text !== 'array'),
    };
  });

  return { trace, board, array };
}

const anchors = (values: number[]) =>
  sort(values).trace.map((step) => step.anchor);

const sorted = (values: number[]) => values.toSorted((a, b) => a - b);

describe('array quick sort', () => {
  test('stops at the expected lines', () => {
    const empty = ['enter', 'base', 'sorted', 'exit'];

    // The pivot 1 is smaller than 3, so the loop never swaps, and the pivot
    // trades places with 3.
    expect(anchors([3, 1])).toEqual([
      'enter',
      'base',
      'partition',
      'partitionEnter',
      'pivot',
      'start',
      'loop',
      'compare',
      'loop',
      'placePivot',
      'returnIndex',
      'partitionExit',
      'partition',
      'sortLeft',
      ...empty,
      'sortLeft',
      'sortRight',
      ...empty,
      'sortRight',
      'exit',
    ]);

    // 1 is no bigger than the pivot 3, so it swaps with itself and `i` moves.
    expect(anchors([1, 3]).slice(4, 12)).toEqual([
      'pivot',
      'start',
      'loop',
      'compare',
      'swap',
      'next',
      'loop',
      'placePivot',
    ]);
  });

  test('returns at once from an array too short to partition', () => {
    expect(anchors([])).toEqual(['enter', 'base', 'sorted', 'exit']);
    expect(anchors([7])).toEqual(['enter', 'base', 'sorted', 'exit']);
  });

  test.each([
    [[]],
    [[7]],
    [[1, 2, 3, 4, 5]],
    [[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
    [[4, 4, 4, 4]],
    [[3, 1, 3, 2, 1, 3]],
    [[5, 3, 8, 1, 9, 2]],
  ])('sorts %j', (values) => {
    expect(sort(values).array.toData()).toEqual(sorted(values));
  });

  test('sorts random arrays', () => {
    // Seeded, so a failure reproduces.
    let seed = 42;
    const random = (below: number) => {
      seed = (seed * 16807) % (2 ** 31 - 1);
      return seed % below;
    };

    for (let run = 0; run < 50; run++) {
      const values = Array.from({ length: random(11) }, () => random(20));

      expect(sort(values).array.toData()).toEqual(sorted(values));
    }
  });

  test('ends as a fresh array would be, with no cursor or color left', () => {
    const { trace, array } = sort([5, 3, 8, 1, 9, 2]);
    const fresh = new CoreArray(array.toData());

    expect(array.nodes.map(({ x, y }) => ({ x, y }))).toEqual(
      fresh.nodes.map(({ x, y }) => ({ x, y })),
    );
    expect(array.nodes.every((node) => node.variant === 'primary')).toBe(true);
    expect(trace.at(-1)!.state.cursors).toEqual([]);
  });

  test('marks every value success once it is in its final place', () => {
    const { trace } = sort([5, 3, 8, 1, 9, 2]);
    const last = trace.findLast((step) => step.anchor === 'sortRight')!;

    expect(last.depth).toBe(1);
    expect(last.state.variants.every((variant) => variant === 'success')).toBe(
      true,
    );
  });

  test('marks the pivot and the value compared, and places the pivot', () => {
    const { trace } = sort([3, 1, 2]);
    const compare = trace.find((step) => step.anchor === 'compare')!;
    const placed = trace.find((step) => step.anchor === 'placePivot')!;

    expect(compare.state.variants).toEqual([
      'secondary',
      'primary',
      'tertiary',
    ]);
    expect(compare.state.cursors).toEqual(['low i j', 'high']);
    expect(placed.state.values).toEqual([1, 2, 3]);
    expect(placed.state.variants).toEqual(['primary', 'success', 'primary']);
    expect(placed.state.cursors).toEqual(['low', 'high', 'i']);
  });

  test('swaps a smaller value left into `i`, with its color', () => {
    const { trace } = sort([3, 1, 2]);
    const swap = trace.find((step) => step.anchor === 'swap')!;

    expect(swap.state.values).toEqual([1, 3, 2]);
    expect(swap.state.variants).toEqual(['secondary', 'primary', 'tertiary']);
    expect(swap.memory).toEqual({
      low: '0',
      high: '2',
      pivot: '2',
      i: '0',
      j: '1',
    });
  });

  test('names only the cursors the running call can reach', () => {
    const { trace } = sort([3, 1, 2]);
    const partitioned = trace.find(
      (step) => step.anchor === 'partition' && 'p' in step.memory,
    )!;
    const inner = trace.find(
      (step) => step.depth === 2 && step.anchor === 'enter',
    )!;

    expect(partitioned.memory).toEqual({ low: '0', high: '2', p: '1' });
    expect(partitioned.state.cursors).toEqual(['low', 'high', 'p']);
    expect(inner.memory).toEqual({ low: '0', high: '0' });
    expect(inner.state.cursors).toEqual(['low high']);
  });

  test('draws no index or cursor under a cell while it is away', () => {
    const board = new CoreBoard();
    const array = new CoreArray([3, 1, 2]);
    board.add(array);

    const run = arrayQuickSort(board, array, listing.anchors, {});
    let step = run.next().value;

    while (listing.anchors.swap !== step.line) step = run.next().value;

    const middle = step.frames[Math.floor(step.frames.length / 2)];

    expect(middle.labels.map((label) => label.text)).toEqual(['2', 'high']);
    expect(step.frames.at(-1)!.labels.map((label) => label.text)).toEqual([
      '0',
      '1',
      '2',
      'low i',
      'high',
      'j',
    ]);
  });

  test('keeps each call on the call stack with its bounds', () => {
    const board = new CoreBoard();
    const array = new CoreArray([3, 1, 2]);
    board.add(array);

    const run = arrayQuickSort(board, array, listing.anchors, {});
    let step = run.next().value;

    while (listing.anchors.partitionEnter !== step.line)
      step = run.next().value;

    expect(step.callStack.map((call) => call.signature)).toEqual([
      'partition(array, low: 0, high: 2)',
      'quickSort(array, low: 0, high: 2)',
    ]);
  });
});
