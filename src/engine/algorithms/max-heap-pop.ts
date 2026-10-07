import { NODE_HEIGHT } from '#canvas/elements/node.ts';

import {
  animateMove,
  animateMoveMany,
  appear,
  disappear,
} from '../animation.ts';
import type { CoreBoard } from '../board.ts';
import { STRUCTURE } from '../call.ts';
import { CoreNode } from '../elements/node.ts';
import { defineMaxHeapAlgorithm } from '../structures/max-heap/algorithm.ts';
import type { CoreMaxHeap } from '../structures/max-heap/structure.ts';
import { animateSwap } from '../structures/max-heap/swap.ts';

// Plays `#catalog/listings/max-heap-pop.md`, stopping at the lines its
// markers name.
export const maxHeapPop = defineMaxHeapAlgorithm({
  play: function* ({ run, board, structure: heap }) {
    // Named bare rather than printed: the array changes as the run goes, and
    // the canvas already shows it as it stands.
    const call = run.call('pop', [{ name: 'heap', value: STRUCTURE }]);

    yield run.step('enter');
    yield run.step('emptyCheck');

    if (heap.cells.length === 0) {
      yield run.step('empty');

      return run.step('exit');
    }

    const max = heap.cells[0].value;
    call.set('max', max);
    heap.setVariant(0, 'tertiary');
    yield run.step('max');

    const last = heap.cells.at(-1)!.value;
    removeLast(board, heap);
    call.set('last', last);
    yield run.step('last');

    yield run.step('restCheck');

    if (heap.cells.length > 0) {
      replaceRoot(board, heap, last);
      yield run.step('replace');

      let index = 0;
      call.set('index', index);
      heap.setCursor('index', index);
      yield run.step('start');

      for (;;) {
        let child = 2 * index + 1;
        call.set('child', child);
        heap.setCursor('child', child);
        yield run.step('child');

        yield run.step('leafCheck');

        // No child to sink past, which settles the value as surely as
        // children no bigger than it do at `stop`.
        if (child >= heap.cells.length) {
          heap.setVariant(index, 'success');
          yield run.step('leaf');

          break;
        }

        // `heap[child + 1]` is read only when it exists, so a lone left child
        // is not marked as compared.
        const hasRight = child + 1 < heap.cells.length;

        if (hasRight) {
          heap.setVariant(child, 'tertiary');
          heap.setVariant(child + 1, 'tertiary');
        }
        yield run.step('pick');

        const takeRight =
          hasRight && heap.cells[child + 1].value > heap.cells[child].value;

        // The larger child is the one the value is held against; the other is
        // out of the running.
        if (takeRight) {
          heap.setVariant(child, 'primary');
          child++;
          call.set('child', child);
          heap.setCursor('child', child);
          yield run.step('right');
        } else if (hasRight) {
          heap.setVariant(child + 1, 'primary');
        }

        heap.setVariant(child, 'tertiary');
        yield run.step('compare');

        // At least as big as its larger child, so it is where it belongs:
        // every slot below already holds something no bigger.
        if (heap.cells[index].value >= heap.cells[child].value) {
          heap.setVariant(index, 'success');
          heap.setVariant(child, 'primary');
          yield run.step('stop');

          break;
        }

        // The colors go with the values, so the sinking value stays the one
        // marked as it descends.
        animateSwap(board, heap, index, child);
        yield run.step('swap');

        heap.setVariant(index, 'primary');
        index = child;
        call.set('index', index);
        heap.setCursor('index', index);
        yield run.step('descend');

        // Declared in the loop body, so it is gone before the next pass
        // declares it again.
        call.clear('child');
        heap.clearCursor('child');
      }

      // `index` is declared in the block and `child` in the loop body, so
      // both are out of scope at `return`.
      heap.clearCursor('index');
      heap.clearCursor('child');
      call.clear('index');
      call.clear('child');
    }

    yield run.step('return');

    // Both locals leave scope with the function, and no color outlives the
    // run that set it.
    heap.resetVariants();
    call.clear('max');
    call.clear('last');

    return run.step('exit');
  },
});

// `heap.pop()`. The last slot is a leaf, and every tree node has a column of
// its own, so the cell, the node and its link fade out first, while they
// still stand where they were, and then the tree closes the column: every
// node after the leaf in order moves one column back.
function removeLast(board: CoreBoard, heap: CoreMaxHeap) {
  const last = heap.cells.length - 1;
  const link = heap.links[last];

  disappear(
    board,
    heap.cells[last],
    heap.nodes[last],
    ...(link === null ? [] : [link]),
  );

  heap.removeLast();

  const layout = heap.treeLayout();
  animateMoveMany(
    board,
    heap.nodes.map((node, index) => ({ element: node, ...layout[index] })),
  );

  heap.rearrange();
}

// `heap[0] = last` copies a value from a variable into a slot that already
// exists, so what travels is a copy belonging to no structure, and the root
// takes the value where it stands. The variable has no place on the canvas,
// so the copy fades in at the slot `last` was popped from, just past the end
// of the row. It goes under the row, in the lane a swap's near cell takes,
// and up into the root: along the row it would cross every cell. The tree's
// root takes the value as the cell does, once the copy lands, as in a swap.
function replaceRoot(board: CoreBoard, heap: CoreMaxHeap, last: number) {
  const from = heap.slot(heap.cells.length);
  const to = heap.slot(0);

  const travelling = new CoreNode(last);
  travelling.x = from.x;
  travelling.y = from.y;
  travelling.variant = 'secondary';
  travelling.opacity = 0;
  board.float(travelling);

  appear(board, travelling);
  animateMove(board, travelling, from.x, from.y + NODE_HEIGHT);
  animateMove(board, travelling, to.x, to.y + NODE_HEIGHT);
  animateMove(board, travelling, to.x, to.y);

  board.unfloat(travelling);
  heap.setValue(0, last);
  heap.setVariant(0, 'secondary');
  board.pushFrame();
}
