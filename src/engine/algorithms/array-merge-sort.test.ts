import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/array-merge-sort.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreArray } from '../structures/array/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { arrayMergeSort } from './array-merge-sort.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function sort(values: number[]) {
  const board = new CoreBoard();
  const array = new CoreArray(values);
  array.name = 'array';
  board.add(array);

  const run = arrayMergeSort(board, array, listing.anchors, {});

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      arrays: board.structures.map((structure) => ({
        name: structure.name,
        values: structure.toData(),
      })),
      labels: frame.labels.map((label) => label.text),
      floating: frame.floating.length,
    };
  });

  return { trace, board, array };
}

const anchors = (values: number[]) =>
  sort(values).trace.map((step) => step.anchor);

describe('array merge sort', () => {
  test('stops at the expected lines', () => {
    const single = ['enter', 'base', 'sorted', 'exit'];

    expect(anchors([2, 1])).toEqual([
      'enter',
      'base',
      'mid',
      'left',
      'right',
      'sortLeft',
      ...single,
      'sortLeft',
      'sortRight',
      ...single,
      'sortRight',
      'merge',
      'mergeEnter',
      'startLeft',
      'startRight',
      'startArray',
      'loop',
      'compare',
      'takeRight',
      'nextRight',
      'nextSlot',
      'loop',
      'drainLeft',
      'drainLeftTake',
      'drainLeftNext',
      'drainLeftSlot',
      'drainLeft',
      'drainRight',
      'mergeExit',
      'merge',
      'exit',
    ]);
  });

  test('returns at once from an array too short to split', () => {
    expect(anchors([])).toEqual(['enter', 'base', 'sorted', 'exit']);
    expect(anchors([7])).toEqual(['enter', 'base', 'sorted', 'exit']);
  });

  test.each([
    [[5, 3, 8, 1, 9, 2]],
    [[4, 4, 1, 4]],
    [[1, 2, 3, 4, 5]],
    [[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
  ])('sorts %j', (values) => {
    const { array } = sort(values);

    expect(array.toData()).toEqual([...values].sort((a, b) => a - b));
  });

  test('ends with only the array on the board, as a fresh one would be', () => {
    const { trace, board, array } = sort([5, 3, 8, 1, 9, 2]);
    const fresh = new CoreArray(array.toData());

    expect(board.structures).toEqual([array]);
    expect(array.name).toBe('array');
    expect(array.nodes.map(({ x, y }) => ({ x, y }))).toEqual(
      fresh.nodes.map(({ x, y }) => ({ x, y })),
    );
    expect(array.nodes.every((node) => node.variant === 'primary')).toBe(true);
    expect(trace.at(-1)!.state.labels).not.toContain('mid');
  });

  test('copies into the array and leaves both halves as they were', () => {
    const { trace } = sort([3, 1]);
    const exit = trace.find((step) => step.anchor === 'mergeExit')!;

    expect(exit.state.arrays).toEqual([
      { name: 'array', values: [1, 3] },
      { name: 'left', values: [3] },
      { name: 'right', values: [1] },
    ]);
  });

  test('names only the arrays the running call can reach', () => {
    const { trace } = sort([3, 1]);
    const inner = trace.findIndex((step) => step.depth === 2);

    expect(trace[inner].state.arrays.map((array) => array.name)).toEqual([
      undefined,
      'array',
      undefined,
    ]);
    expect(trace[inner].state.labels).not.toContain('mid');
  });

  test('lands every copy before the step is shown', () => {
    for (const step of sort([5, 3, 8, 1]).trace)
      expect(step.state.floating).toBe(0);
  });

  test('keeps each call in memory and on the call stack', () => {
    const { trace } = sort([3, 1]);
    const compare = trace.find((step) => step.anchor === 'compare')!;
    const mid = trace.find((step) => step.anchor === 'mid')!;

    expect(mid.memory).toEqual({ mid: '1' });
    expect(compare.depth).toBe(2);
    expect(compare.memory).toEqual({ i: '0', j: '0', k: '0' });
  });

  test('keeps the signatures true as the array is written', () => {
    const board = new CoreBoard();
    const array = new CoreArray([3, 1]);
    board.add(array);

    const run = arrayMergeSort(board, array, listing.anchors, {});
    let step = run.next().value;

    while (listing.anchors.mergeExit !== step.line) step = run.next().value;

    expect(step.callStack.map((call) => call.signature)).toEqual([
      'merge(array: [1, 3], left: [3], right: [1])',
      'mergeSort(array: [1, 3])',
    ]);
  });
});
