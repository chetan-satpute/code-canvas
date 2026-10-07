import { animateMoveBy, appear, disappear } from '../animation.ts';
import type { CoreBoard } from '../board.ts';
import { STRUCTURE } from '../call.ts';
import { defineLinkedListAlgorithm } from '../structures/linked-list/algorithm.ts';
import {
  type CoreLinkedList,
  type CoreLinkedListNode,
  LINK_SPACING,
} from '../structures/linked-list/structure.ts';

// Plays `#catalog/listings/linked-list-remove.md`, stopping at the lines its
// markers name.
export const linkedListRemove = defineLinkedListAlgorithm({
  args: ['target'],

  play: function* ({ run, board, structure: list, args }) {
    const { target } = args;

    run.call('remove', [
      { name: 'list', value: STRUCTURE },
      { name: 'target', value: target },
    ]);

    yield run.step('enter');

    // A pointer holding `null` has no node to be drawn under, so it is on the
    // canvas only while it holds one.
    let node = list.head;
    if (node !== null) list.setPointer('node', node);
    yield run.step('start');

    let previous: CoreLinkedListNode | null = null;
    yield run.step('noPrevious');

    for (;;) {
      if (node !== null) node.variant = 'secondary';
      yield run.step('search');

      if (node === null || node.value === target) break;

      previous = node;
      list.setPointer('previous', previous);
      yield run.step('setPrevious');

      node.variant = 'primary';
      node = node.successor;

      if (node === null) list.clearPointer('node');
      else list.setPointer('node', node);

      yield run.step('advance');
    }

    yield run.step('missingCheck');

    if (node === null) {
      yield run.step('missing');

      list.clearPointer('previous');

      return run.step('exit');
    }

    node.variant = 'danger';
    yield run.step('headCheck');

    unlink(board, list, node, previous);
    yield run.step(previous === null ? 'setHead' : 'setNext');

    // The pointers leave scope with the return, and no color outlives the run
    // that set it. The removed node goes with `node`, the last thing holding
    // it.
    node.variant = 'primary';
    list.clearPointer('node');
    list.clearPointer('previous');

    return run.step('exit');
  },
});

// `previous.next = node.next`, or `list.head = node.next` without a previous
// node. The node fades out with its links first, while it still stands where
// it was: the new link from `previous` spans the node's slot, so it would be
// drawn through a node left standing there. `node` still holds it, so it
// stays on the board, unseen, until the run ends. The new link then fades in,
// and the rest of the list slides back a place to close the gap.
function unlink(
  board: CoreBoard,
  list: CoreLinkedList,
  node: CoreLinkedListNode,
  previous: CoreLinkedListNode | null,
) {
  const successor = node.successor;
  const links = [previous?.next ?? null, node.next].filter(
    (link) => link !== null,
  );

  // Fading the head also fades `head`, which is drawn at the head node's
  // opacity, and it reappears over the successor once the head moves.
  disappear(board, node, ...links);

  if (previous === null) {
    list.head = successor;
  } else {
    previous.setNext(successor);

    if (previous.next !== null) {
      previous.next.opacity = 0;
      appear(board, previous.next);
    }
  }

  const later: CoreLinkedListNode[] = [];
  for (let after = successor; after !== null; after = after.successor)
    later.push(after);

  animateMoveBy(board, later, -LINK_SPACING, 0);
}
