import { describe, expect, test } from 'vitest';

import { NODE_HEIGHT } from '#canvas/elements/node.ts';
import listing from '#catalog/listings/binary-search-tree-remove.md?highlight';

import { CoreBoard } from '../board.ts';
import { binarySearchTreeOperations } from '../structures/binary-search-tree/operations.ts';
import { CoreBinarySearchTree } from '../structures/binary-search-tree/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { binarySearchTreeRemove } from './binary-search-tree-remove.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function remove(values: number[], value: number) {
  const board = new CoreBoard();
  const tree = new CoreBinarySearchTree(values);
  tree.name = 'tree';
  board.add(tree);

  const run = binarySearchTreeRemove(board, tree, listing.anchors, { value });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: tree.toData(),
      // A node faded out is still serialized while a pointer holds it.
      drawn: frame.nodes
        .filter((node) => node.opacity > 0)
        .map((node) => node.value),
      // `root` and the pointers, without the structure's own name.
      labels: frame.labels.filter(
        (label) => label.opacity > 0 && label.text !== 'tree',
      ),
    };
  });

  return { trace, tree };
}

// What the structure card's Remove leaves, which the run has to agree with.
function removedByOperation(values: number[], value: number): number[] {
  const tree = new CoreBinarySearchTree(values);
  binarySearchTreeOperations.remove(tree, { value });

  return tree.toData();
}

const SEARCH_LEFT = ['search', 'setParent', 'lessCheck', 'goLeft'];
const SEARCH_RIGHT = ['search', 'setParent', 'lessCheck', 'goRight'];
const FOUND = ['search', 'missingCheck', 'twoCheck'];
const START = ['enter', 'start', 'noParent'];

const cases = [
  {
    name: 'a left leaf',
    values: [50, 30, 70, 20],
    value: 20,
    anchors: [
      ...START,
      ...SEARCH_LEFT,
      ...SEARCH_LEFT,
      ...FOUND,
      'child',
      'rootCheck',
      'sideCheck',
      'setLeft',
    ],
  },
  {
    name: 'a right leaf',
    values: [50, 30, 70],
    value: 70,
    anchors: [
      ...START,
      ...SEARCH_RIGHT,
      ...FOUND,
      'child',
      'rootCheck',
      'sideCheck',
      'setRight',
    ],
  },
  {
    name: 'a left child with a left child only',
    values: [50, 30, 20, 70],
    value: 30,
    anchors: [
      ...START,
      ...SEARCH_LEFT,
      ...FOUND,
      'child',
      'rootCheck',
      'sideCheck',
      'setLeft',
    ],
  },
  {
    name: 'a left child with a right child only',
    values: [50, 30, 40, 70],
    value: 30,
    anchors: [
      ...START,
      ...SEARCH_LEFT,
      ...FOUND,
      'child',
      'rootCheck',
      'sideCheck',
      'setLeft',
    ],
  },
  {
    name: 'a right child with a left child only',
    values: [50, 30, 70, 60],
    value: 70,
    anchors: [
      ...START,
      ...SEARCH_RIGHT,
      ...FOUND,
      'child',
      'rootCheck',
      'sideCheck',
      'setRight',
    ],
  },
  {
    name: 'a right child with a right child only',
    values: [50, 30, 70, 80],
    value: 70,
    anchors: [
      ...START,
      ...SEARCH_RIGHT,
      ...FOUND,
      'child',
      'rootCheck',
      'sideCheck',
      'setRight',
    ],
  },
  {
    name: 'a root with a left child only',
    values: [50, 30, 20, 40],
    value: 50,
    anchors: [
      ...START,
      ...FOUND,
      'child',
      'rootCheck',
      'setRoot',
      'rootReturn',
    ],
  },
  {
    name: 'a root with a right child only',
    values: [50, 70, 60, 80],
    value: 50,
    anchors: [
      ...START,
      ...FOUND,
      'child',
      'rootCheck',
      'setRoot',
      'rootReturn',
    ],
  },
  {
    name: 'the only node',
    values: [50],
    value: 50,
    anchors: [
      ...START,
      ...FOUND,
      'child',
      'rootCheck',
      'setRoot',
      'rootReturn',
    ],
  },
  {
    name: 'a node whose successor is its right child, a leaf',
    values: [50, 30, 20, 40, 70],
    value: 30,
    anchors: [
      ...START,
      ...SEARCH_LEFT,
      ...FOUND,
      'minParent',
      'minStart',
      'minLoop',
      'copy',
      'retarget',
      'child',
      'rootCheck',
      'sideCheck',
      'setRight',
    ],
  },
  {
    name: 'a node whose successor is its right child, with a right child',
    values: [50, 30, 20, 40, 45, 70],
    value: 30,
    anchors: [
      ...START,
      ...SEARCH_LEFT,
      ...FOUND,
      'minParent',
      'minStart',
      'minLoop',
      'copy',
      'retarget',
      'child',
      'rootCheck',
      'sideCheck',
      'setRight',
    ],
  },
  {
    name: 'a root whose successor is its right child',
    values: [50, 30, 70, 80],
    value: 50,
    anchors: [
      ...START,
      ...FOUND,
      'minParent',
      'minStart',
      'minLoop',
      'copy',
      'retarget',
      'child',
      'rootCheck',
      'sideCheck',
      'setRight',
    ],
  },
  {
    name: 'a root whose successor is deeper, with a right child',
    values: [50, 30, 80, 60, 70, 90],
    value: 50,
    anchors: [
      ...START,
      ...FOUND,
      'minParent',
      'minStart',
      'minLoop',
      'minSetParent',
      'minGoLeft',
      'minLoop',
      'copy',
      'retarget',
      'child',
      'rootCheck',
      'sideCheck',
      'setLeft',
    ],
  },
  {
    name: 'a root whose successor is two levels down, a leaf',
    values: [50, 30, 80, 60, 55, 90],
    value: 50,
    anchors: [
      ...START,
      ...FOUND,
      'minParent',
      'minStart',
      'minLoop',
      'minSetParent',
      'minGoLeft',
      'minLoop',
      'minSetParent',
      'minGoLeft',
      'minLoop',
      'copy',
      'retarget',
      'child',
      'rootCheck',
      'sideCheck',
      'setLeft',
    ],
  },
];

describe('binary search tree remove', () => {
  describe.each(cases)('$name', ({ values, value, anchors }) => {
    test('stops at the expected lines', () => {
      const { trace } = remove(values, value);

      expect(trace.map((step) => step.anchor)).toEqual([...anchors, 'exit']);
    });

    test('unlinks a node on the line that assigns its replacement', () => {
      const { trace } = remove(values, value);
      const unlink = trace.findIndex((step) =>
        ['setRoot', 'setLeft', 'setRight'].includes(step.anchor),
      );
      const before = trace[unlink - 1].state;
      const after = trace[unlink].state;
      const result = removedByOperation(values, value);

      expect(before.drawn).toHaveLength(values.length);
      expect(after.values).toEqual(result);
      expect(after.drawn).toHaveLength(result.length);
    });

    test('ends as the structure card would leave it', () => {
      const { trace, tree } = remove(values, value);
      const exit = trace.at(-1)!;

      expect(tree.toData()).toEqual(removedByOperation(values, value));
      expect(exit.state.labels.map((label) => label.text)).toEqual(
        tree.root === null ? [] : ['root'],
      );
      expect(tree.preorder().every((node) => node.variant === 'primary')).toBe(
        true,
      );
    });

    test('leaves the tree laid out as a fresh one would be', () => {
      const { tree } = remove(values, value);
      const fresh = new CoreBinarySearchTree(tree.toData());

      expect(tree.preorder().map(({ x, y }) => ({ x, y }))).toEqual(
        fresh.preorder().map(({ x, y }) => ({ x, y })),
      );
    });

    test('keeps only the value in memory', () => {
      const { trace } = remove(values, value);

      for (const step of trace) {
        expect(step.memory).toEqual({ value: value.toString() });
        expect(step.depth).toBe(1);
      }
    });
  });

  test('copies the successor up before removing its node', () => {
    const { trace } = remove([50, 30, 80, 60, 70, 90], 50);
    const copy = trace.find((step) => step.anchor === 'copy')!;

    expect(copy.state.values).toEqual([60, 30, 80, 60, 70, 90]);
    expect(copy.state.drawn.filter((drawn) => drawn === 60)).toHaveLength(2);
  });

  test('stacks pointers that share a node', () => {
    const { trace } = remove([50, 30, 70], 30);
    const setParent = trace.find((step) => step.anchor === 'setParent')!;
    const labels = setParent.state.labels.filter((label) =>
      ['node', 'parent'].includes(label.text),
    );

    // `node` where it was, and `parent`, which arrived second, a line under it.
    expect(labels).toMatchObject([
      { text: 'node' },
      { text: 'parent', x: labels[0].x, y: labels[0].y + NODE_HEIGHT / 2 },
    ]);
  });

  test.each([
    { name: 'an empty tree', values: [], value: 45, anchors: [] },
    {
      name: 'a value past a left leaf',
      values: [50, 30, 70],
      value: 10,
      anchors: [...SEARCH_LEFT, ...SEARCH_LEFT],
    },
    {
      name: 'a value past a right leaf',
      values: [50, 30, 70],
      value: 45,
      anchors: [...SEARCH_LEFT, ...SEARCH_RIGHT],
    },
  ])('changes nothing for $name', ({ values, value, anchors }) => {
    const { trace, tree } = remove(values, value);
    const exit = trace.at(-1)!;

    expect(trace.map((step) => step.anchor)).toEqual([
      ...START,
      ...anchors,
      'search',
      'missingCheck',
      'missing',
      'exit',
    ]);
    expect(tree.toData()).toEqual(values);
    expect(exit.state.labels.map((label) => label.text)).toEqual(
      values.length === 0 ? [] : ['root'],
    );
    expect(tree.preorder().every((node) => node.variant === 'primary')).toBe(
      true,
    );
  });

  test('names the tree bare in the signature', () => {
    const board = new CoreBoard();
    const tree = new CoreBinarySearchTree([50, 30, 70]);
    board.add(tree);

    const run = binarySearchTreeRemove(board, tree, listing.anchors, {
      value: 30,
    });

    expect(run.next().value.callStack[0].signature).toBe(
      'remove(tree, value: 30)',
    );
  });
});
