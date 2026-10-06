import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/binary-search-tree-insert.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreBinarySearchTree } from '../structures/binary-search-tree/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { binarySearchTreeInsert } from './binary-search-tree-insert.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function insert(values: number[], value: number) {
  const board = new CoreBoard();
  const tree = new CoreBinarySearchTree(values);
  tree.name = 'tree';
  board.add(tree);

  const run = binarySearchTreeInsert(board, tree, listing.anchors, { value });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: tree.toData(),
      drawn: frame.nodes.map((node) => node.value),
      edges: frame.edges.length,
      labels: frame.labels.map((label) => label.text),
    };
  });

  return { trace, tree };
}

// 50 at the root, 30 and 70 under it.
const TREE = [50, 30, 70];

const cases = [
  {
    name: 'an empty tree',
    values: [],
    value: 42,
    anchors: ['enter', 'emptyCheck', 'setRoot', 'rootReturn'],
    result: [42],
  },
  {
    name: 'a left leaf',
    values: TREE,
    value: 20,
    anchors: [
      'enter',
      'emptyCheck',
      'start',
      'equalCheck',
      'lessCheck',
      'leftCheck',
      'goLeft',
      'equalCheck',
      'lessCheck',
      'leftCheck',
      'setLeft',
      'leftReturn',
    ],
    result: [50, 30, 20, 70],
  },
  {
    name: 'a right leaf',
    values: TREE,
    value: 80,
    anchors: [
      'enter',
      'emptyCheck',
      'start',
      'equalCheck',
      'lessCheck',
      'rightCheck',
      'goRight',
      'equalCheck',
      'lessCheck',
      'rightCheck',
      'setRight',
      'rightReturn',
    ],
    result: [50, 30, 70, 80],
  },
  {
    name: 'a leaf between two nodes',
    values: TREE,
    value: 40,
    anchors: [
      'enter',
      'emptyCheck',
      'start',
      'equalCheck',
      'lessCheck',
      'leftCheck',
      'goLeft',
      'equalCheck',
      'lessCheck',
      'rightCheck',
      'setRight',
      'rightReturn',
    ],
    result: [50, 30, 40, 70],
  },
];

describe('binary search tree insert', () => {
  describe.each(cases)('into $name', ({ values, value, anchors, result }) => {
    test('stops at the expected lines', () => {
      const { trace } = insert(values, value);

      expect(trace.map((step) => step.anchor)).toEqual([...anchors, 'exit']);
    });

    test('links the new node in on the line that assigns it', () => {
      const { trace } = insert(values, value);
      const link = trace.findIndex((step) =>
        ['setRoot', 'setLeft', 'setRight'].includes(step.anchor),
      );
      const before = trace[link - 1].state;
      const after = trace[link].state;

      expect(before.values).toEqual(values);
      expect(before.drawn).not.toContain(value);
      expect(after.values).toEqual(result);
      expect(after.drawn).toContain(value);

      const links = values.length === 0 ? 0 : 1;

      expect(after.edges - before.edges).toBe(links);
    });

    test('ends with the value in the tree', () => {
      const { trace, tree } = insert(values, value);
      const exit = trace.at(-1)!;

      expect(tree.toData()).toEqual(result);
      expect(exit.state.labels).not.toContain('node');
      expect(tree.preorder().every((node) => node.variant === 'primary')).toBe(
        true,
      );
    });

    test('leaves the tree laid out as a fresh one would be', () => {
      const { tree } = insert(values, value);
      const fresh = new CoreBinarySearchTree(tree.toData());

      expect(tree.preorder().map(({ x, y }) => ({ x, y }))).toEqual(
        fresh.preorder().map(({ x, y }) => ({ x, y })),
      );
    });

    test('keeps only the value in memory', () => {
      const { trace } = insert(values, value);

      for (const step of trace) {
        expect(step.memory).toEqual({ value: value.toString() });
        expect(step.depth).toBe(1);
      }
    });
  });

  test('stops at a value the tree already holds', () => {
    const { trace, tree } = insert(TREE, 30);
    const duplicate = trace.at(-2)!;

    expect(trace.map((step) => step.anchor)).toEqual([
      'enter',
      'emptyCheck',
      'start',
      'equalCheck',
      'lessCheck',
      'leftCheck',
      'goLeft',
      'equalCheck',
      'duplicate',
      'exit',
    ]);
    expect(duplicate.state.labels).toContain('node');
    expect(tree.toData()).toEqual(TREE);
    expect(tree.preorder().every((node) => node.variant === 'primary')).toBe(
      true,
    );
  });

  test('names the tree bare in the signature', () => {
    const board = new CoreBoard();
    const tree = new CoreBinarySearchTree(TREE);
    board.add(tree);

    const run = binarySearchTreeInsert(board, tree, listing.anchors, {
      value: 42,
    });

    expect(run.next().value.callStack[0].signature).toBe(
      'insert(tree, value: 42)',
    );
  });
});
