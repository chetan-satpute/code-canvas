import { describe, expect, test } from 'vitest';

import { NODE_WIDTH } from '#canvas/elements/node.ts';

import { seedRandom } from '../../testing/random.ts';
import { maxHeapOperations, randomMaxHeapValues } from './operations.ts';
import {
  CoreMaxHeap,
  LEVEL_SPACING,
  parentOf,
  TREE_OFFSET,
} from './structure.ts';

// 50 at the root; 30 with 20 and 10 under it; 40 with 35 under it.
const HEAP = [50, 30, 40, 20, 10, 35];

function apply(id: string, args: Record<string, number> = {}) {
  const heap = new CoreMaxHeap(HEAP);
  maxHeapOperations[id](heap, args);

  return heap;
}

function isMaxHeap(values: number[]) {
  return values.every(
    (value, index) => index === 0 || value <= values[parentOf(index)],
  );
}

describe('max heap', () => {
  test('round-trips through its plain form', () => {
    expect(new CoreMaxHeap(HEAP).toData()).toEqual(HEAP);
  });

  test('lays the array out in a row, each slot labelled by its index', () => {
    const heap = new CoreMaxHeap(HEAP);
    const frame = heap.toCanvasFrame();

    expect(heap.cells.map((cell) => (cell.x - heap.x) / NODE_WIDTH)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(heap.cells.every((cell) => cell.y === heap.y)).toBe(true);
    expect(
      frame.labels
        .filter((label) => label.y < heap.y)
        .map((label) => label.text),
    ).toEqual(['0', '1', '2', '3', '4', '5']);
  });

  test('gives each tree node its own column and each level its own row', () => {
    const heap = new CoreMaxHeap(HEAP);

    expect(
      heap.nodes.map((node) => ({
        value: node.value,
        column: (node.x - heap.x) / NODE_WIDTH,
        depth: (node.y - heap.y - TREE_OFFSET) / LEVEL_SPACING,
      })),
    ).toEqual([
      { value: 50, column: 3, depth: 0 },
      { value: 30, column: 1, depth: 1 },
      { value: 40, column: 5, depth: 1 },
      { value: 20, column: 0, depth: 2 },
      { value: 10, column: 2, depth: 2 },
      { value: 35, column: 4, depth: 2 },
    ]);
  });

  test('links each tree node to its parent', () => {
    const heap = new CoreMaxHeap(HEAP);

    expect(
      heap.links.map((link) =>
        link === null ? null : [link.start.value, link.end.value],
      ),
    ).toEqual([null, [50, 30], [50, 40], [30, 20], [30, 10], [40, 35]]);
  });

  test('swaps cells between slots and values between tree nodes', () => {
    const heap = new CoreMaxHeap(HEAP);
    const [root, child] = [heap.nodes[0], heap.nodes[2]];

    heap.swap(0, 2);
    heap.rearrange();

    expect(heap.toData()).toEqual([40, 30, 50, 20, 10, 35]);
    expect([heap.nodes[0], heap.nodes[2]]).toEqual([root, child]);
    expect([root.value, child.value]).toEqual([40, 50]);
  });

  test('leaves out the index and cursors of a slot whose cell is away', () => {
    const heap = new CoreMaxHeap(HEAP);
    heap.setCursor('index', 2);
    heap.cells[2].y += 30;

    const texts = heap.toCanvasFrame().labels.map((label) => label.text);

    expect(texts).not.toContain('2');
    expect(texts).not.toContain('index');
  });

  test('randomizes into heap order', () => {
    seedRandom(42);

    for (let run = 0; run < 50; run++)
      expect(isMaxHeap(randomMaxHeapValues())).toBe(true);
  });

  describe('operations', () => {
    test('push sifts the value up past every smaller parent', () => {
      expect(apply('push', { value: 45 }).toData()).toEqual([
        50, 30, 45, 20, 10, 35, 40,
      ]);
      expect(apply('push', { value: 60 }).toData()).toEqual([
        60, 30, 50, 20, 10, 35, 40,
      ]);
    });

    test('push of a value no bigger than its parent leaves it last', () => {
      expect(apply('push', { value: 40 }).toData()).toEqual([...HEAP, 40]);
    });

    test('pop sinks the last value from the root', () => {
      expect(apply('pop').toData()).toEqual([40, 30, 35, 20, 10]);
    });

    test('pop of the last value empties the heap', () => {
      const heap = new CoreMaxHeap([50]);
      maxHeapOperations.pop(heap, {});

      expect(heap.toData()).toEqual([]);
    });

    test('pop of an empty heap does nothing', () => {
      const heap = new CoreMaxHeap();
      maxHeapOperations.pop(heap, {});

      expect(heap.toData()).toEqual([]);
    });
  });
});
