import { NODE_HEIGHT } from '#canvas/elements/node.ts';

import { animateMoveMany } from '../../animation.ts';
import type { CoreBoard } from '../../board.ts';
import type { CoreNode } from '../../elements/node.ts';
import type { Position } from './structure.ts';

// A row of cells, one per slot: the max heap's array row, or the array. Each
// leaves a slot's index and cursors out while its cell is away from the slot.
export interface SwapRow {
  cells: CoreNode[];
  slot(index: number): Position;
  swap(a: number, b: number): void;
  rearrange(): void;
}

// `[row[a], row[b]] = [row[b], row[a]]`, animated, for two different slots.
// The two cells trade slots, leaving the row to do it, since along it each
// would pass through every cell between. They pass under the row, one lane
// each: the row above holds every slot's index, and a label is drawn over a
// node. The near lane is the cursors' row, which is clear only of the cursors
// on `a` and `b`, left out while their cells are away, so a caller keeps any
// other cursor out from between them. `a` takes the near lane. Anything else
// the row draws, such as the heap's tree, changes only once they land, in
// `row.swap`.
export function animateSwap(
  board: CoreBoard,
  row: SwapRow,
  a: number,
  b: number,
) {
  const first = row.cells[a];
  const second = row.cells[b];
  const from = row.slot(a);
  const to = row.slot(b);

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
  // swapped row, with its labels back and anything else it draws updated,
  // needs a frame of its own.
  row.swap(a, b);
  row.rearrange();
  board.pushFrame();
}
