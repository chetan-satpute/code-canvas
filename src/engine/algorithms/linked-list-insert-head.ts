import { NODE_HEIGHT } from '#canvas/elements/node.ts';

import { animateMove, animateMoveBy, appear } from '../animation.ts';
import { STRUCTURE } from '../call.ts';
import { defineLinkedListAlgorithm } from '../structures/linked-list/algorithm.ts';
import {
  CoreLinkedListNode,
  LINK_SPACING,
} from '../structures/linked-list/structure.ts';

// Plays `#catalog/listings/linked-list-insert-head.md`, stopping at the lines
// its markers name.
export const linkedListInsertHead = defineLinkedListAlgorithm({
  args: ['value'],

  play: function* ({ run, board, structure: list, args }) {
    run.call('insertHead', [
      { name: 'list', value: STRUCTURE },
      { name: 'value', value: args.value },
    ]);

    yield run.step('enter');

    // A new node is part of no list yet, so it is staged a row below the slot
    // it will take. Only the `node` pointer reaches it, and that is what keeps
    // it on the canvas.
    const node = new CoreLinkedListNode(args.value);
    node.x = list.x;
    node.y = list.y + 2 * NODE_HEIGHT;
    node.variant = 'secondary';
    node.opacity = 0;
    list.setPointer('node', node);

    appear(board, node);
    yield run.step('create');

    // On an empty list `next` stays null, and there is no link to draw.
    node.setNext(list.head);

    if (node.next !== null) {
      node.next.opacity = 0;
      appear(board, node.next);
    }

    yield run.step('link');

    // The list makes room first and the node rises second. Done at once, the
    // node would rise through the old head while it is still leaving the
    // slot. The head moves to the node as it starts to rise.
    animateMoveBy(board, list.nodes(), LINK_SPACING, 0);
    list.head = node;
    animateMove(board, node, list.x, list.y);
    yield run.step('setHead');

    // `node` leaves scope with the return, and no color outlives the run that
    // set it.
    node.variant = 'primary';
    list.clearPointer('node');

    return run.step('exit');
  },
});
