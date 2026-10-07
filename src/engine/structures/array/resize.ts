import { appear, disappear } from '../../animation.ts';
import type { CoreBoard } from '../../board.ts';
import { CoreNode } from '../../elements/node.ts';
import type { CoreArray } from './structure.ts';

// `array.length += 1`: a new last slot, holding nothing until it is written,
// fades in at the end of the row with its index.
export function animateGrow(board: CoreBoard, array: CoreArray) {
  const slot = new CoreNode(0);
  slot.empty = true;
  slot.opacity = 0;

  array.nodes.push(slot);
  array.rearrange();
  appear(board, slot);
}

// `array.length -= 1`: the last slot fades out with its index, whatever it
// holds, and leaves the array.
export function animateShrink(board: CoreBoard, array: CoreArray) {
  const last = array.nodes.at(-1);
  if (last === undefined) return;

  disappear(board, last);
  array.nodes.pop();
  array.rearrange();
}
