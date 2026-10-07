import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/max-heap-pop.md?highlight';

import { CoreBoard } from '../board.ts';
import {
  maxHeapOperations,
  randomMaxHeapValues,
} from '../structures/max-heap/operations.ts';
import { CoreMaxHeap, parentOf } from '../structures/max-heap/structure.ts';
import { seedRandom } from '../testing/random.ts';
import { traceRun } from '../testing/trace.ts';
import { maxHeapPop } from './max-heap-pop.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function pop(values: number[]) {
  const board = new CoreBoard();
  const heap = new CoreMaxHeap(values);
  heap.name = 'heap';
  board.add(heap);

  const run = maxHeapPop(board, heap, listing.anchors, {});

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: heap.toData(),
      tree: heap.nodes.map((node) => node.value),
      variants: heap.cells.map((cell) => cell.variant),
      edges: frame.edges.length,
      labels: frame.labels.map((label) => label.text),
      floating: frame.floating.length,
    };
  });

  return { trace, heap };
}

// What the structure card's Pop leaves, which the run has to agree with.
function poppedByOperation(values: number[]): number[] {
  const heap = new CoreMaxHeap(values);
  maxHeapOperations.pop(heap, {});

  return heap.toData();
}

function isMaxHeap(values: number[]) {
  return values.every(
    (value, index) => index === 0 || value <= values[parentOf(index)],
  );
}

const START = ['enter', 'emptyCheck', 'max', 'last', 'restCheck'];
const SIFT = ['replace', 'start'];
const LEAF = ['child', 'leafCheck', 'leaf'];

const cases = [
  {
    name: 'a single value',
    values: [42],
    anchors: [...START],
    result: [],
  },
  {
    name: 'two values',
    values: [50, 30],
    anchors: [...START, ...SIFT, ...LEAF],
    result: [30],
  },
  {
    // 30 is a descendant of the left child, so it can settle at the root
    // only by equalling it.
    name: 'a heap whose last value settles at the root',
    values: [50, 30, 20, 30],
    anchors: [
      ...START,
      ...SIFT,
      'child',
      'leafCheck',
      'pick',
      'compare',
      'stop',
    ],
    result: [30, 30, 20],
  },
  {
    // 25 sinks past 40, then holds against 20 and 10.
    name: 'a heap whose last value stops partway down',
    values: [50, 40, 30, 20, 10, 25],
    anchors: [
      ...START,
      ...SIFT,
      'child',
      'leafCheck',
      'pick',
      'compare',
      'swap',
      'descend',
      'child',
      'leafCheck',
      'pick',
      'compare',
      'stop',
    ],
    result: [40, 25, 30, 20, 10],
  },
  {
    // 10 sinks past 40, then past 35, to a leaf.
    name: 'a heap whose last value sinks to a leaf',
    values: [50, 40, 30, 35, 20, 25, 10],
    anchors: [
      ...START,
      ...SIFT,
      'child',
      'leafCheck',
      'pick',
      'compare',
      'swap',
      'descend',
      'child',
      'leafCheck',
      'pick',
      'compare',
      'swap',
      'descend',
      ...LEAF,
    ],
    result: [40, 35, 30, 10, 20, 25],
  },
  {
    // 10 sinks past 40, the right child.
    name: 'a heap whose right child is the larger',
    values: [50, 30, 40, 10],
    anchors: [
      ...START,
      ...SIFT,
      'child',
      'leafCheck',
      'pick',
      'right',
      'compare',
      'swap',
      'descend',
      ...LEAF,
    ],
    result: [40, 30, 10],
  },
  {
    // 10 sinks past the left of two equal children.
    name: 'a heap with equal children',
    values: [50, 30, 30, 10],
    anchors: [
      ...START,
      ...SIFT,
      'child',
      'leafCheck',
      'pick',
      'compare',
      'swap',
      'descend',
      ...LEAF,
    ],
    result: [30, 10, 30],
  },
  {
    // 30 sinks past its lone left child, 40.
    name: 'a heap with a lone left child',
    values: [50, 45, 20, 40, 30],
    anchors: [
      ...START,
      ...SIFT,
      'child',
      'leafCheck',
      'pick',
      'compare',
      'swap',
      'descend',
      'child',
      'leafCheck',
      'pick',
      'compare',
      'swap',
      'descend',
      ...LEAF,
    ],
    result: [45, 40, 20, 30],
  },
];

describe('max heap pop', () => {
  describe.each(cases)('from $name', ({ values, anchors, result }) => {
    test('stops at the expected lines', () => {
      const { trace } = pop(values);

      expect(trace.map((step) => step.anchor)).toEqual([
        ...anchors,
        'return',
        'exit',
      ]);
    });

    test('takes the last slot out on the line that pops it', () => {
      const { trace } = pop(values);
      const last = trace.findIndex((step) => step.anchor === 'last');
      const before = trace[last - 1].state;
      const after = trace[last].state;

      expect(before.values).toEqual(values);
      expect(after.values).toEqual(values.slice(0, -1));
      expect(after.tree).toEqual(after.values);
      expect(before.edges - after.edges).toBe(values.length === 1 ? 0 : 1);
      expect(trace[last].memory.last).toBe(values.at(-1)!.toString());
    });

    test('keeps both views in step at every swap', () => {
      const { trace } = pop(values);

      for (const step of trace.filter((step) => step.anchor === 'swap'))
        expect(step.state.tree).toEqual(step.state.values);
    });

    test('returns the old maximum', () => {
      const { trace } = pop(values);
      const ret = trace.at(-2)!;

      expect(ret.memory).toEqual({
        max: values[0].toString(),
        last: values.at(-1)!.toString(),
      });
      expect(ret.state.labels).not.toContain('index');
      expect(ret.state.labels).not.toContain('child');
    });

    test('ends with the heap in order and nothing marked', () => {
      const { trace, heap } = pop(values);
      const exit = trace.at(-1)!;

      expect(heap.toData()).toEqual(result);
      expect(heap.toData()).toEqual(poppedByOperation(values));
      expect(exit.memory).toEqual({});
      expect(
        [...heap.cells, ...heap.nodes].every(
          (node) => node.variant === 'primary',
        ),
      ).toBe(true);
    });

    test('leaves the heap laid out as a fresh one would be', () => {
      const { heap } = pop(values);
      const fresh = new CoreMaxHeap(heap.toData());
      const positions = (from: CoreMaxHeap) =>
        [...from.cells, ...from.nodes].map(({ x, y }) => ({ x, y }));

      expect(positions(heap)).toEqual(positions(fresh));
    });

    test('shows no value in flight on any step', () => {
      const { trace } = pop(values);

      expect(trace.every((step) => step.state.floating === 0)).toBe(true);
    });
  });

  test('returns early from an empty heap', () => {
    const { trace, heap } = pop([]);

    expect(trace.map((step) => step.anchor)).toEqual([
      'enter',
      'emptyCheck',
      'empty',
      'exit',
    ]);
    expect(heap.toData()).toEqual([]);
    expect(trace.every((step) => Object.keys(step.memory).length === 0)).toBe(
      true,
    );
  });

  test('copies the last value into the root, leaving the variable', () => {
    const { trace } = pop([50, 40, 30, 35]);
    const replace = trace.find((step) => step.anchor === 'replace')!;

    expect(replace.state.values).toEqual([35, 40, 30]);
    expect(replace.state.tree).toEqual([35, 40, 30]);
    expect(replace.state.variants[0]).toBe('secondary');
    expect(replace.memory).toEqual({ max: '50', last: '35' });
  });

  test('marks the maximum when it is read', () => {
    const { trace } = pop([50, 40, 30, 35]);
    const max = trace.find((step) => step.anchor === 'max')!;

    expect(max.memory).toEqual({ max: '50' });
    expect(max.state.variants[0]).toBe('tertiary');
  });

  test('marks both children compared only when there are two', () => {
    const pick = (values: number[]) =>
      pop(values).trace.find((step) => step.anchor === 'pick')!.state.variants;

    expect(pick([50, 40, 30, 35])).toEqual([
      'secondary',
      'tertiary',
      'tertiary',
    ]);
    expect(pick([50, 40, 30])).toEqual(['secondary', 'primary']);
  });

  test('drops the smaller child from the comparison', () => {
    const { trace } = pop([50, 40, 30, 35]);
    const compare = trace.find((step) => step.anchor === 'compare')!;

    expect(compare.state.variants).toEqual([
      'secondary',
      'tertiary',
      'primary',
    ]);
  });

  test('moves `child` to the right child when it is larger', () => {
    const { trace } = pop([50, 30, 40, 10]);
    const right = trace.findIndex((step) => step.anchor === 'right');

    expect(trace[right - 1].memory.child).toBe('1');
    expect(trace[right].memory.child).toBe('2');
    expect(trace[right].state.variants).toEqual([
      'secondary',
      'primary',
      'tertiary',
    ]);
    expect(trace[right + 1].state.variants).toEqual([
      'secondary',
      'primary',
      'tertiary',
    ]);
  });

  test('descends to the child and lets it go out of scope', () => {
    const { trace } = pop([50, 30, 40, 10]);
    const descend = trace.findIndex((step) => step.anchor === 'descend');

    expect(trace[descend].memory).toEqual({
      max: '50',
      last: '10',
      index: '2',
      child: '2',
    });
    expect(trace[descend].state.labels).toContain('index child');
    expect(trace[descend + 1].memory).toEqual({
      max: '50',
      last: '10',
      index: '2',
      child: '5',
    });
  });

  test('marks the value settled where it stops sinking', () => {
    const settled = (values: number[]) => {
      const { trace } = pop(values);

      return trace.find((step) => ['stop', 'leaf'].includes(step.anchor))!.state
        .variants;
    };

    // Held up by children no bigger than it, at slot 1.
    expect(settled([50, 40, 30, 20, 10, 25])[1]).toBe('success');
    // At a leaf, at slot 2.
    expect(settled([50, 30, 40, 10])[2]).toBe('success');
  });

  test('names the heap bare in the signature', () => {
    const board = new CoreBoard();
    const heap = new CoreMaxHeap([50, 30]);
    board.add(heap);

    const run = maxHeapPop(board, heap, listing.anchors, {});

    expect(run.next().value.callStack[0].signature).toBe('pop(heap)');
  });

  test('takes the maximum off random heaps and keeps them in order', () => {
    seedRandom(42);

    for (let round = 0; round < 50; round++) {
      const values = randomMaxHeapValues();
      const { trace, heap } = pop(values);

      expect(trace.at(-2)!.memory.max).toBe(Math.max(...values).toString());
      expect(heap.toData()).toHaveLength(values.length - 1);
      expect(isMaxHeap(heap.toData())).toBe(true);
      expect(heap.toData().sort()).toEqual(
        values.toSpliced(values.indexOf(Math.max(...values)), 1).sort(),
      );
    }
  });
});
