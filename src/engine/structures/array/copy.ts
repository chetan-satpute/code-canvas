import { NODE_HEIGHT } from '#canvas/elements/node.ts';

import { animateMove } from '../../animation.ts';
import type { CoreBoard } from '../../board.ts';
import { CoreNode } from '../../elements/node.ts';
import type { CoreArray } from './structure.ts';

// `to[index] = from`, where `from` is a cell of this array or another. An
// assignment copies a value, so no array gains or loses a cell: what travels
// is a copy belonging to neither, the cell it lands on takes the value where
// it stands, and `from` keeps its own.
export function animateCopy(
  board: CoreBoard,
  from: CoreNode,
  to: CoreArray,
  index: number,
) {
  const target = to.nodes[index];

  const travelling = new CoreNode(from.value);
  travelling.x = from.x;
  travelling.y = from.y;
  travelling.variant = 'secondary';
  board.float(travelling);

  // Into the lane under `to` first, then along it and up into the cell.
  // Straight there, it would cross the cells in between.
  animateMove(board, travelling, from.x, to.y + NODE_HEIGHT);
  animateMove(board, travelling, target.x, target.y);

  board.unfloat(travelling);
  target.value = from.value;
  target.empty = false;
  target.variant = 'success';
  board.pushFrame();
}
