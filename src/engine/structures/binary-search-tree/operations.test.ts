import { describe, expect, test } from 'vitest';

import { NODE_WIDTH } from '#canvas/elements/node.ts';

import { binarySearchTreeOperations } from './operations.ts';
import { CoreBinarySearchTree, LEVEL_SPACING } from './structure.ts';

// 50 at the root; 30 on its left, with 20 and 40 under it; 70 on its right,
// with 60 on its left.
const TREE = [50, 30, 20, 40, 70, 60];

function apply(id: string, args: Record<string, number> = {}) {
  const tree = new CoreBinarySearchTree(TREE);
  binarySearchTreeOperations[id](tree, args);

  return tree;
}

describe('binary search tree', () => {
  test('round-trips its shape through its plain form', () => {
    const tree = new CoreBinarySearchTree(TREE);

    expect(tree.toData()).toEqual(TREE);
  });

  test('gives each node its own column and each level its own row', () => {
    const tree = new CoreBinarySearchTree(TREE);

    expect(
      tree.inorder().map((node) => ({
        value: node.value,
        column: (node.x - tree.x) / NODE_WIDTH,
        depth: (node.y - tree.y) / LEVEL_SPACING,
      })),
    ).toEqual([
      { value: 20, column: 0, depth: 2 },
      { value: 30, column: 1, depth: 1 },
      { value: 40, column: 2, depth: 2 },
      { value: 50, column: 3, depth: 0 },
      { value: 60, column: 4, depth: 2 },
      { value: 70, column: 5, depth: 1 },
    ]);
  });

  test('draws every node a pointer holds exactly once', () => {
    const tree = new CoreBinarySearchTree(TREE);
    const drawn = () =>
      tree
        .toCanvasFrame()
        .nodes.map((node) => node.value)
        .sort((a, b) => a - b);
    const all = [...TREE].sort((a, b) => a - b);

    tree.setPointer('node', tree.root!.child('left')!);
    expect(drawn()).toEqual(all);

    // 70 and the 60 under it, unlinked but still held.
    const right = tree.root!.child('right')!;
    tree.root!.setChild('right', null);
    tree.setPointer('node', right);
    expect(drawn()).toEqual(all);
  });

  test('skips a repeated value', () => {
    const tree = new CoreBinarySearchTree([50, 30, 50]);

    expect(tree.toData()).toEqual([50, 30]);
  });

  describe('operations', () => {
    test('insert hangs the value off the first empty slot', () => {
      expect(apply('insert', { value: 45 }).toData()).toEqual([
        50, 30, 20, 40, 45, 70, 60,
      ]);
    });

    test('insert of a value already held changes nothing', () => {
      expect(apply('insert', { value: 40 }).toData()).toEqual(TREE);
    });

    test('remove unlinks a leaf', () => {
      expect(apply('remove', { value: 60 }).toData()).toEqual([
        50, 30, 20, 40, 70,
      ]);
    });

    test('remove lifts a lone child into place', () => {
      expect(apply('remove', { value: 70 }).toData()).toEqual([
        50, 30, 20, 40, 60,
      ]);
    });

    test('remove replaces a node with two children by its successor', () => {
      expect(apply('remove', { value: 30 }).toData()).toEqual([
        50, 40, 20, 70, 60,
      ]);
      expect(apply('remove', { value: 50 }).toData()).toEqual([
        60, 30, 20, 40, 70,
      ]);
    });

    test('remove of a value not held changes nothing', () => {
      expect(apply('remove', { value: 99 }).toData()).toEqual(TREE);
    });

    test('remove of the last node empties the tree', () => {
      const tree = new CoreBinarySearchTree([50]);
      binarySearchTreeOperations.remove(tree, { value: 50 });

      expect(tree.root).toBeNull();
    });
  });
});
