import { NODE_WIDTH } from '#canvas/elements/node.ts';

import { animateMoveBy, appear } from '../animation.ts';
import { STRUCTURE } from '../call.ts';
import { defineBinarySearchTreeAlgorithm } from '../structures/binary-search-tree/algorithm.ts';
import {
  CoreBinarySearchTreeNode,
  type Side,
} from '../structures/binary-search-tree/structure.ts';

// The listing mirrors its left branch on the right, line for line.
const ANCHORS: Record<
  Side,
  { check: string; link: string; linkReturn: string; descend: string }
> = {
  left: {
    check: 'leftCheck',
    link: 'setLeft',
    linkReturn: 'leftReturn',
    descend: 'goLeft',
  },
  right: {
    check: 'rightCheck',
    link: 'setRight',
    linkReturn: 'rightReturn',
    descend: 'goRight',
  },
};

// Plays `#catalog/listings/binary-search-tree-insert.md`, stopping at the
// lines its markers name. `while (true)` is not one of them: it tests
// nothing, so the descent steps from one node straight to the next check.
export const binarySearchTreeInsert = defineBinarySearchTreeAlgorithm({
  args: ['value'],

  play: function* ({ run, board, structure: tree, args }) {
    const { value } = args;

    run.call('insert', [
      { name: 'tree', value: STRUCTURE },
      { name: 'value', value },
    ]);

    yield run.step('enter');
    yield run.step('emptyCheck');

    if (tree.root === null) {
      const root = new CoreBinarySearchTreeNode(value);
      root.variant = 'success';
      root.opacity = 0;

      tree.root = root;
      tree.rearrange();
      appear(board, root);
      yield run.step('setRoot');
      yield run.step('rootReturn');

      root.variant = 'primary';

      return run.step('exit');
    }

    let node = tree.root;
    tree.setPointer('node', node);
    yield run.step('start');

    for (;;) {
      node.variant = 'secondary';
      yield run.step('equalCheck');

      // A binary search tree holds no duplicates, so the descent ends here
      // having changed nothing.
      if (value === node.value) {
        node.variant = 'danger';
        yield run.step('duplicate');

        break;
      }

      yield run.step('lessCheck');

      const side = value < node.value ? 'left' : 'right';
      const anchors = ANCHORS[side];
      yield run.step(anchors.check);

      const child = node.child(side);

      if (child === null) {
        // Every node has a column of its own, so the tree opens one first:
        // everything after the value in order moves one column along. That
        // includes `node` itself when the new node goes on its left. The new
        // node and its link fade in once the slot is open.
        const after = tree.inorder().filter((other) => other.value > value);
        animateMoveBy(board, after, NODE_WIDTH, 0);

        const inserted = new CoreBinarySearchTreeNode(value);
        inserted.variant = 'success';
        inserted.opacity = 0;

        node.setChild(side, inserted);
        const link = node[side]!;
        link.opacity = 0;

        tree.rearrange();
        appear(board, inserted, link);
        yield run.step(anchors.link);
        yield run.step(anchors.linkReturn);

        inserted.variant = 'primary';

        break;
      }

      node.variant = 'primary';
      node = child;
      tree.setPointer('node', node);
      yield run.step(anchors.descend);
    }

    // `node` leaves scope with the return, and no color outlives the run that
    // set it.
    node.variant = 'primary';
    tree.clearPointer('node');

    return run.step('exit');
  },
});
