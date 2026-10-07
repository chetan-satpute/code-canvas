import { NODE_HEIGHT } from '#canvas/elements/node.ts';

import { animateMove, animateMoveBy, appear, disappear } from '../animation.ts';
import { STRUCTURE } from '../call.ts';
import { defineLinkedListAlgorithm } from '../structures/linked-list/algorithm.ts';
import {
  CoreLinkedListNode,
  LINK_SPACING,
} from '../structures/linked-list/structure.ts';

// Plays `#catalog/listings/linked-list-insert-after.md`, stopping at the
// lines its markers name.
export const linkedListInsertAfter = defineLinkedListAlgorithm({
  args: ['target', 'value'],

  play: function* ({ run, board, structure: list, args }) {
    const { target, value } = args;

    run.call('insertAfter', [
      { name: 'list', value: STRUCTURE },
      { name: 'target', value: target },
      { name: 'value', value },
    ]);

    yield run.step('enter');

    // A pointer holding `null` has no node to be drawn under, so it is on the
    // canvas only while it holds one.
    let node = list.head;
    if (node !== null) list.setPointer('node', node);
    yield run.step('start');

    for (;;) {
      if (node !== null) node.variant = 'secondary';
      yield run.step('search');

      if (node === null || node.value === target) break;

      node.variant = 'primary';
      node = node.successor;

      if (node === null) list.clearPointer('node');
      else list.setPointer('node', node);

      yield run.step('advance');
    }

    yield run.step('missingCheck');

    if (node === null) {
      yield run.step('missing');

      return run.step('exit');
    }

    // Staged a row below the slot it will take, which the successor holds for
    // now. Only `newNode` reaches it, and that is what keeps it on the canvas.
    const newNode = new CoreLinkedListNode(value);
    newNode.x = node.x + LINK_SPACING;
    newNode.y = list.y + 2 * NODE_HEIGHT;
    newNode.variant = 'success';
    newNode.opacity = 0;
    list.setPointer('newNode', newNode);

    appear(board, newNode);
    yield run.step('create');

    // After the tail `next` stays null, and there is no link to draw.
    const successor = node.successor;
    newNode.setNext(successor);

    if (newNode.next !== null) {
      newNode.next.opacity = 0;
      appear(board, newNode.next);
    }

    yield run.step('link');

    // `node.next` is overwritten, so the old link fades before the new one
    // fades in, and the old one is never drawn through the new node. The node
    // joins the row only once it is linked, and the list opens the gap first:
    // rising at once, it would pass into the successor still in its slot.
    if (node.next !== null) disappear(board, node.next);

    node.setNext(newNode);

    const link = node.next!;
    link.opacity = 0;
    appear(board, link);

    const later: CoreLinkedListNode[] = [];
    for (let after = successor; after !== null; after = after.successor)
      later.push(after);

    animateMoveBy(board, later, LINK_SPACING, 0);
    animateMove(board, newNode, newNode.x, list.y);
    yield run.step('splice');

    // The pointers leave scope with the return, and no color outlives the run
    // that set it.
    node.variant = 'primary';
    newNode.variant = 'primary';
    list.clearPointer('node');
    list.clearPointer('newNode');

    return run.step('exit');
  },
});
