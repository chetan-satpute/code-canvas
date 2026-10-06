import { randomNumber, uniqueRandomNumberArray } from '#utils/random.ts';

import { operationFor, type OperationRunner } from '../../operation.ts';
import { CoreBinarySearchTree, CoreBinarySearchTreeNode } from './structure.ts';

const defineBinarySearchTreeOperation = operationFor(
  'binary-search-tree',
  CoreBinarySearchTree,
);

// In random order, so the tree takes whatever shape that insertion order gives
// it rather than a balanced one. Every node has a column of its own, so seven
// draw 480px wide.
export function randomBinarySearchTreeValues(): number[] {
  return uniqueRandomNumberArray(randomNumber(5, 7));
}

const randomize = defineBinarySearchTreeOperation({
  apply: (tree) => {
    tree.restore(randomBinarySearchTreeValues());
  },
});

const insert = defineBinarySearchTreeOperation({
  args: ['value'],
  apply: (tree, args) => {
    tree.insert(args.value);
    tree.rearrange();
  },
});

// A value the tree does not hold changes nothing.
const remove = defineBinarySearchTreeOperation({
  args: ['value'],
  apply: (tree, args) => {
    let parent: CoreBinarySearchTreeNode | null = null;
    let node = tree.root;

    while (node !== null && node.value !== args.value) {
      parent = node;
      node = node.child(args.value < node.value ? 'left' : 'right');
    }

    if (node === null) return;

    // With two children, only the in-order successor, the smallest value on
    // the right, can take the node's place without breaking the order. Its
    // value moves up and its own node is removed instead, which has no left
    // child, since that is what made it the smallest.
    let successor = node.child('right');

    if (node.left !== null && successor !== null) {
      parent = node;

      while (successor.left !== null) {
        parent = successor;
        successor = successor.child('left')!;
      }

      node.value = successor.value;
      node = successor;
    }

    const child = node.child('left') ?? node.child('right');

    if (parent === null) tree.root = child;
    else
      parent.setChild(parent.child('left') === node ? 'left' : 'right', child);

    tree.rearrange();
  },
});

// Keyed by the operation ids in `#catalog/structures.ts`.
export const binarySearchTreeOperations: Record<string, OperationRunner> = {
  randomize,
  insert,
  remove,
};
