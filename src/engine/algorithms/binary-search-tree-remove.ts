import {
  animateMove,
  animateMoveMany,
  appear,
  disappear,
} from '../animation.ts';
import type { CoreBoard } from '../board.ts';
import { STRUCTURE } from '../call.ts';
import { CoreNode } from '../elements/node.ts';
import { defineBinarySearchTreeAlgorithm } from '../structures/binary-search-tree/algorithm.ts';
import type {
  CoreBinarySearchTree,
  CoreBinarySearchTreeNode,
  Side,
} from '../structures/binary-search-tree/structure.ts';

// Plays `#catalog/listings/binary-search-tree-remove.md`, stopping at the
// lines its markers name.
export const binarySearchTreeRemove = defineBinarySearchTreeAlgorithm({
  args: ['value'],

  play: function* ({ run, board, structure: tree, args }) {
    const { value } = args;

    run.call('remove', [
      { name: 'tree', value: STRUCTURE },
      { name: 'value', value },
    ]);

    yield run.step('enter');

    // A pointer holding `null` has no node to be drawn under, so it is on the
    // canvas only while it holds one.
    let node = tree.root;
    if (node !== null) tree.setPointer('node', node);
    yield run.step('start');

    let parent: CoreBinarySearchTreeNode | null = null;
    yield run.step('noParent');

    for (;;) {
      if (node !== null) node.variant = 'secondary';
      yield run.step('search');

      if (node === null || node.value === value) break;

      parent = node;
      tree.setPointer('parent', parent);
      yield run.step('setParent');

      yield run.step('lessCheck');

      const side = value < node.value ? 'left' : 'right';

      node.variant = 'primary';
      node = node.child(side);

      if (node === null) tree.clearPointer('node');
      else tree.setPointer('node', node);

      yield run.step(side === 'left' ? 'goLeft' : 'goRight');
    }

    yield run.step('missingCheck');

    if (node === null) {
      yield run.step('missing');

      tree.clearPointer('parent');

      return run.step('exit');
    }

    // With two children this node stays in the tree and takes its
    // successor's value, and the successor's node is removed instead.
    const found = node;

    yield run.step('twoCheck');

    if (node.left !== null && node.right !== null) {
      parent = node;
      tree.setPointer('parent', parent);
      yield run.step('minParent');

      let min = node.child('right')!;
      min.variant = 'tertiary';
      tree.setPointer('min', min);
      yield run.step('minStart');

      for (;;) {
        yield run.step('minLoop');

        const left = min.child('left');
        if (left === null) break;

        parent = min;
        tree.setPointer('parent', parent);
        yield run.step('minSetParent');

        min.variant = 'primary';
        min = left;
        min.variant = 'tertiary';
        tree.setPointer('min', min);
        yield run.step('minGoLeft');
      }

      copyValue(board, min, node);
      yield run.step('copy');

      node = min;
      tree.setPointer('node', node);
      yield run.step('retarget');

      // `min` is declared in the block, so it leaves scope at its brace.
      tree.clearPointer('min');
    }

    const child = node.child('left') ?? node.child('right');

    node.variant = 'danger';
    if (child !== null) tree.setPointer('child', child);
    yield run.step('child');

    yield run.step('rootCheck');

    if (parent === null) {
      unlink(board, tree, node, null, child);
      yield run.step('setRoot');
      yield run.step('rootReturn');
    } else {
      yield run.step('sideCheck');

      const side = parent.child('left') === node ? 'left' : 'right';

      unlink(board, tree, node, { parent, side }, child);
      yield run.step(side === 'left' ? 'setLeft' : 'setRight');
    }

    // The pointers leave scope with the return, and no color outlives the run
    // that set it.
    found.variant = 'primary';
    tree.clearPointer('node');
    tree.clearPointer('parent');
    tree.clearPointer('child');

    return run.step('exit');
  },
});

// `node.value = min.value` copies the value, so what travels is a copy that
// belongs to neither node, and `min` keeps its value until its node leaves.
// `min` is the successor, so it sits in the next column: the copy rises up
// that column, which no other node takes, and slides into `node` from the
// empty cell beside it.
function copyValue(
  board: CoreBoard,
  min: CoreBinarySearchTreeNode,
  node: CoreBinarySearchTreeNode,
) {
  const travelling = new CoreNode(min.value);
  travelling.x = min.x;
  travelling.y = min.y;
  travelling.variant = min.variant;
  board.float(travelling);

  animateMove(board, travelling, min.x, node.y);
  animateMove(board, travelling, node.x, node.y);

  board.unfloat(travelling);
  node.value = min.value;
  node.variant = 'success';
  board.pushFrame();
}

// `parent[side] = child`, or `tree.root = child` without a parent. The node
// fades out with its links first, while it still stands where it was: the
// child's subtree rises into that place, and a node left standing there would
// sit on top of it or have the new link drawn through it. `node` still holds
// it, so it stays on the board, unseen, until the run ends. The new link then
// fades in, and the tree closes up around the gap.
function unlink(
  board: CoreBoard,
  tree: CoreBinarySearchTree,
  node: CoreBinarySearchTreeNode,
  from: { parent: CoreBinarySearchTreeNode; side: Side } | null,
  child: CoreBinarySearchTreeNode | null,
) {
  const incoming = from === null ? null : from.parent[from.side];
  const links = [incoming, node.left, node.right].filter(
    (link) => link !== null,
  );

  disappear(board, node, ...links);

  if (from === null) {
    tree.root = child;
  } else {
    from.parent.setChild(from.side, child);

    const link = from.parent[from.side];

    if (link !== null) {
      link.opacity = 0;
      appear(board, link);
    }
  }

  animateMoveMany(
    board,
    [...tree.layout()].map(([element, position]) => ({
      element,
      ...position,
    })),
  );
}
