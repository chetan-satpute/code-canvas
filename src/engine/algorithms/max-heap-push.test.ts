import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/max-heap-push.md?highlight';
import { randomNumber } from '#utils/random.ts';

import { CoreBoard } from '../board.ts';
import {
  maxHeapOperations,
  randomMaxHeapValues,
} from '../structures/max-heap/operations.ts';
import { CoreMaxHeap, parentOf } from '../structures/max-heap/structure.ts';
import { seedRandom } from '../testing/random.ts';
import { traceRun } from '../testing/trace.ts';
import { maxHeapPush } from './max-heap-push.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function push(values: number[], value: number) {
  const board = new CoreBoard();
  const heap = new CoreMaxHeap(values);
  heap.name = 'heap';
  board.add(heap);

  const run = maxHeapPush(board, heap, listing.anchors, { value });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: heap.toData(),
      tree: heap.nodes.map((node) => node.value),
      variants: heap.cells.map((cell) => cell.variant),
      edges: frame.edges.length,
      labels: frame.labels.map((label) => label.text),
    };
  });

  return { trace, heap };
}

// What the structure card's Push leaves, which the run has to agree with.
function pushedByOperation(values: number[], value: number): number[] {
  const heap = new CoreMaxHeap(values);
  maxHeapOperations.push(heap, { value });

  return heap.toData();
}

function isMaxHeap(values: number[]) {
  return values.every(
    (value, index) => index === 0 || value <= values[parentOf(index)],
  );
}

// 50 at the root, 30 and 40 under it, 20 under 30.
const HEAP = [50, 30, 40, 20];

const ONE_SWAP = ['loop', 'parent', 'compare', 'swap', 'climb'];

const cases = [
  {
    name: 'an empty heap',
    values: [],
    value: 42,
    anchors: ['loop'],
    result: [42],
  },
  {
    name: 'a heap whose last parent is bigger',
    values: HEAP,
    value: 10,
    anchors: ['loop', 'parent', 'compare', 'stop'],
    result: [50, 30, 40, 20, 10],
  },
  {
    // `<=`, so a parent no smaller than the value stops it, equal included.
    name: 'a heap whose last parent equals the value',
    values: HEAP,
    value: 30,
    anchors: ['loop', 'parent', 'compare', 'stop'],
    result: [50, 30, 40, 20, 30],
  },
  {
    // Slot 5 is the right child of slot 2.
    name: 'a heap it climbs from a right child',
    values: [50, 30, 40, 20, 10],
    value: 45,
    anchors: [...ONE_SWAP, 'loop', 'parent', 'compare', 'stop'],
    result: [50, 30, 45, 20, 10, 40],
  },
  {
    name: 'a heap it climbs partway up',
    values: HEAP,
    value: 35,
    anchors: [...ONE_SWAP, 'loop', 'parent', 'compare', 'stop'],
    result: [50, 35, 40, 20, 30],
  },
  {
    name: 'a heap it climbs to the root of',
    values: HEAP,
    value: 60,
    anchors: [...ONE_SWAP, ...ONE_SWAP, 'loop'],
    result: [60, 50, 40, 20, 30],
  },
];

describe('max heap push', () => {
  describe.each(cases)('onto $name', ({ values, value, anchors, result }) => {
    test('stops at the expected lines', () => {
      const { trace } = push(values, value);

      expect(trace.map((step) => step.anchor)).toEqual([
        'enter',
        'append',
        'start',
        ...anchors,
        'exit',
      ]);
    });

    test('appends the value on the line that pushes it', () => {
      const { trace } = push(values, value);
      const append = trace.findIndex((step) => step.anchor === 'append');
      const before = trace[append - 1].state;
      const after = trace[append].state;

      expect(before.values).toEqual(values);
      expect(after.values).toEqual([...values, value]);
      expect(after.tree).toEqual(after.values);
      expect(after.edges - before.edges).toBe(values.length === 0 ? 0 : 1);
    });

    test('keeps both views in step at every swap', () => {
      const { trace } = push(values, value);

      for (const step of trace.filter((step) => step.anchor === 'swap'))
        expect(step.state.tree).toEqual(step.state.values);
    });

    test('ends with the heap in order and nothing marked', () => {
      const { trace, heap } = push(values, value);
      const exit = trace.at(-1)!;

      expect(heap.toData()).toEqual(result);
      expect(exit.state.labels).not.toContain('index');
      expect(exit.state.labels).not.toContain('parent');
      expect(exit.memory).toEqual({ value: value.toString() });
      expect(
        [...heap.cells, ...heap.nodes].every(
          (node) => node.variant === 'primary',
        ),
      ).toBe(true);
    });

    test('leaves the heap laid out as a fresh one would be', () => {
      const { heap } = push(values, value);
      const fresh = new CoreMaxHeap(heap.toData());
      const positions = (from: CoreMaxHeap) =>
        [...from.cells, ...from.nodes].map(({ x, y }) => ({ x, y }));

      expect(positions(heap)).toEqual(positions(fresh));
    });
  });

  test('marks the parent the value is compared with', () => {
    const { trace } = push(HEAP, 35);
    const compare = trace.find((step) => step.anchor === 'compare')!;

    expect(compare.state.variants).toEqual([
      'primary',
      'tertiary',
      'primary',
      'primary',
      'secondary',
    ]);
  });

  test('swaps the value with its parent', () => {
    const { trace } = push(HEAP, 35);
    const swap = trace.find((step) => step.anchor === 'swap')!;

    expect(swap.memory).toEqual({ value: '35', index: '4', parent: '1' });
    expect(swap.state.values).toEqual([50, 35, 40, 20, 30]);
  });

  test('climbs to the parent and lets it go out of scope', () => {
    const { trace } = push(HEAP, 35);
    const climb = trace.findIndex((step) => step.anchor === 'climb');

    expect(trace[climb].memory).toEqual({
      value: '35',
      index: '1',
      parent: '1',
    });
    expect(trace[climb].state.labels).toContain('index parent');
    expect(trace[climb + 1].memory).toEqual({ value: '35', index: '1' });
    expect(trace[climb + 1].state.labels).not.toContain('parent');
  });

  test('marks the value settled where it stops climbing', () => {
    const settled = (values: number[], value: number) => {
      const { trace } = push(values, value);

      return trace.at(-2)!.state.variants;
    };

    // Stopped by a bigger parent, at slot 1.
    expect(settled(HEAP, 35)[1]).toBe('success');
    // Stopped by the root, at slot 0.
    expect(settled(HEAP, 60)[0]).toBe('success');
  });

  test('pushes onto random heaps as the structure card does', () => {
    seedRandom(42);

    for (let round = 0; round < 50; round++) {
      const values = randomMaxHeapValues();
      const value = randomNumber(1, 99);
      const { heap } = push(values, value);

      expect(heap.toData()).toEqual(pushedByOperation(values, value));
      expect(isMaxHeap(heap.toData())).toBe(true);
    }
  });

  test('names the heap bare in the signature', () => {
    const board = new CoreBoard();
    const heap = new CoreMaxHeap(HEAP);
    board.add(heap);

    const run = maxHeapPush(board, heap, listing.anchors, { value: 42 });

    expect(run.next().value.callStack[0].signature).toBe(
      'push(heap, value: 42)',
    );
  });
});
