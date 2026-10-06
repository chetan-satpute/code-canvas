import { animateMoveMany, appear } from '../animation.ts';
import { STRUCTURE } from '../call.ts';
import { defineMaxHeapAlgorithm } from '../structures/max-heap/algorithm.ts';
import { parentOf } from '../structures/max-heap/structure.ts';
import { animateSwap } from '../structures/max-heap/swap.ts';

// Plays `#catalog/listings/max-heap-push.md`, stopping at the lines its
// markers name.
export const maxHeapPush = defineMaxHeapAlgorithm({
  args: ['value'],

  play: function* ({ run, board, structure: heap, args }) {
    const { value } = args;

    // Named bare rather than printed: the array changes as the run goes, and
    // the canvas already shows it as it stands.
    const call = run.call('push', [
      { name: 'heap', value: STRUCTURE },
      { name: 'value', value },
    ]);

    yield run.step('enter');

    // The new last slot is a leaf, and every tree node has a column of its
    // own, so the tree opens one first: everything after the leaf in order
    // moves one column along. The cell, the node and its link fade in once
    // the slot is open.
    heap.append(value);

    const last = heap.cells.length - 1;
    const cell = heap.cells[last];
    const node = heap.nodes[last];
    const link = heap.links[last];

    heap.setVariant(last, 'secondary');
    cell.opacity = 0;
    node.opacity = 0;
    if (link !== null) link.opacity = 0;

    const layout = heap.treeLayout();
    animateMoveMany(
      board,
      heap.nodes
        .slice(0, last)
        .map((other, index) => ({ element: other, ...layout[index] })),
    );

    heap.rearrange();
    appear(board, cell, node, ...(link === null ? [] : [link]));
    yield run.step('append');

    let index = last;
    call.set('index', index);
    heap.setCursor('index', index);
    yield run.step('start');

    for (;;) {
      // At the root there is no parent left to beat, which settles the value
      // as surely as a parent at least as big does at `stop`.
      const settled = index === 0;

      if (settled) heap.setVariant(index, 'success');
      yield run.step('loop');

      if (settled) break;

      const parent = parentOf(index);
      call.set('parent', parent);
      heap.setCursor('parent', parent);
      yield run.step('parent');

      heap.setVariant(parent, 'tertiary');
      yield run.step('compare');

      // No bigger than its parent, so it is where it belongs: every slot
      // above already holds something at least as big.
      if (heap.cells[index].value <= heap.cells[parent].value) {
        heap.setVariant(index, 'success');
        heap.setVariant(parent, 'primary');
        yield run.step('stop');

        break;
      }

      // The colors go with the values, so the pushed value stays the one
      // marked as it climbs.
      animateSwap(board, heap, index, parent);
      yield run.step('swap');

      heap.setVariant(index, 'primary');
      index = parent;
      call.set('index', index);
      heap.setCursor('index', index);
      yield run.step('climb');

      // Declared in the loop body, so it is gone by the time the condition is
      // tested again.
      call.clear('parent');
      heap.clearCursor('parent');
    }

    // Both variables leave scope with the function, and no color outlives the
    // run that set it.
    heap.resetVariants();
    heap.clearCursor('index');
    heap.clearCursor('parent');
    call.clear('index');
    call.clear('parent');

    return run.step('exit');
  },
});
