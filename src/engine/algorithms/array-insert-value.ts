import { NODE_HEIGHT } from '#canvas/elements/node.ts';

import { animateMove, appear } from '../animation.ts';
import type { CoreBoard } from '../board.ts';
import { STRUCTURE } from '../call.ts';
import { CoreNode } from '../elements/node.ts';
import { defineArrayAlgorithm } from '../structures/array/algorithm.ts';
import { animateCopy } from '../structures/array/copy.ts';
import { animateGrow } from '../structures/array/resize.ts';
import type { CoreArray } from '../structures/array/structure.ts';

// Plays `#catalog/listings/array-insert-value.md`, stopping at the lines its
// markers name.
export const arrayInsertValue = defineArrayAlgorithm({
  args: ['index', 'value'],

  play: function* ({ run, board, structure: array, args }) {
    const { index, value } = args;

    // Named bare rather than printed: the array changes as the run goes, and
    // the canvas already shows it as it stands.
    const call = run.call('insertAt', [
      { name: 'array', value: STRUCTURE },
      { name: 'index', value: index },
      { name: 'value', value },
    ]);

    array.setCursor('index', index);
    yield run.step('enter');
    yield run.step('guard');

    if (index < 0 || index > array.nodes.length) {
      yield run.step('outOfRange');

      array.clearCursor('index');

      return run.step('exit');
    }

    animateGrow(board, array);
    yield run.step('grow');

    // The check that ends the loop, with `i` at `index`, is a step too.
    for (let i = array.nodes.length - 1; ; i--) {
      call.set('i', i);
      array.setCursor('i', i);
      yield run.step('loop');

      if (i === index) break;

      // `array[i] = array[i - 1]` copies, so the value is in both cells until
      // the next pass overwrites the one it came from.
      const from = array.nodes[i - 1];
      from.variant = 'secondary';
      animateCopy(board, from, array, i);
      yield run.step('shift');

      from.variant = 'primary';
      array.nodes[i].variant = 'primary';
    }

    // Declared by the loop, so it is gone once the loop ends.
    array.clearCursor('i');
    call.clear('i');

    write(board, array, index, value);
    yield run.step('write');

    // No color outlives the run that set it.
    array.nodes[index].variant = 'primary';
    array.clearCursor('index');

    return run.step('exit');
  },
});

// `array[index] = value`. The value is a parameter rather than a cell, so it
// has no origin on the canvas: it fades in over the slot's index and drops
// into the slot, which takes it where it stands.
function write(
  board: CoreBoard,
  array: CoreArray,
  index: number,
  value: number,
) {
  const target = array.nodes[index];

  const travelling = new CoreNode(value);
  travelling.x = target.x;
  travelling.y = target.y - NODE_HEIGHT;
  travelling.variant = 'secondary';
  travelling.opacity = 0;
  board.float(travelling);

  appear(board, travelling);
  animateMove(board, travelling, target.x, target.y);

  board.unfloat(travelling);
  target.value = value;
  target.empty = false;
  target.variant = 'success';
  board.pushFrame();
}
