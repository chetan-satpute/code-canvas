import { NODE_HEIGHT } from '#canvas/elements/node.ts';

import { animateMoveMany } from '../../animation.ts';
import type { CoreBoard } from '../../board.ts';
import type { CoreMaxHeap } from './structure.ts';

// `[heap[a], heap[b]] = [heap[b], heap[a]]`, animated. In the array row the
// two cells trade slots, leaving the row to do it, since along it each would
// pass through every cell between. They pass under the row, one lane each:
// the row above holds every slot's index, and a label is drawn over a node.
// The near lane is the cursors' row, which is clear only of the cursors on
// `a` and `b`, left out while their cells are away. `a` takes the near lane.
// The tree changes only once they land, in `heap.swap`.
export function animateSwap(
  board: CoreBoard,
  heap: CoreMaxHeap,
  a: number,
  b: number,
) {
  const first = heap.cells[a];
  const second = heap.cells[b];
  const from = heap.slot(a);
  const to = heap.slot(b);

  const near = from.y + NODE_HEIGHT;
  const far = from.y + 2 * NODE_HEIGHT;

  animateMoveMany(board, [
    { element: first, x: from.x, y: near },
    { element: second, x: to.x, y: far },
  ]);

  animateMoveMany(board, [
    { element: first, x: to.x, y: near },
    { element: second, x: from.x, y: far },
  ]);

  animateMoveMany(board, [
    { element: first, ...to },
    { element: second, ...from },
  ]);

  // The last tick left both cells home but in each other's slot, so the
  // swapped heap, with its labels back and the tree's values traded, needs a
  // frame of its own.
  heap.swap(a, b);
  heap.rearrange();
  board.pushFrame();
}
