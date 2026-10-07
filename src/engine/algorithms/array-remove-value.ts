import { STRUCTURE } from '../call.ts';
import { defineArrayAlgorithm } from '../structures/array/algorithm.ts';
import { animateCopy } from '../structures/array/copy.ts';
import { animateShrink } from '../structures/array/resize.ts';

// Plays `#catalog/listings/array-remove-value.md`, stopping at the lines its
// markers name.
export const arrayRemoveValue = defineArrayAlgorithm({
  args: ['index'],

  play: function* ({ run, board, structure: array, args }) {
    const { index } = args;

    // Named bare rather than printed: the array changes as the run goes, and
    // the canvas already shows it as it stands.
    const call = run.call('removeAt', [
      { name: 'array', value: STRUCTURE },
      { name: 'index', value: index },
    ]);

    array.setCursor('index', index);
    yield run.step('enter');
    yield run.step('guard');

    if (index < 0 || index >= array.nodes.length) {
      yield run.step('outOfRange');

      array.clearCursor('index');

      return run.step('exit');
    }

    // The check that ends the loop, with `i` on the last cell, is a step too.
    for (let i = index; ; i++) {
      call.set('i', i);
      array.setCursor('i', i);
      yield run.step('loop');

      if (i === array.nodes.length - 1) break;

      // `array[i] = array[i + 1]` copies, so the value is in both cells until
      // the next pass overwrites the one it came from, or the last slot is
      // dropped.
      const from = array.nodes[i + 1];
      from.variant = 'secondary';
      animateCopy(board, from, array, i);
      yield run.step('shift');

      from.variant = 'primary';
      array.nodes[i].variant = 'primary';
    }

    // Declared by the loop, so it is gone once the loop ends.
    array.clearCursor('i');
    call.clear('i');

    animateShrink(board, array);
    yield run.step('shrink');

    array.clearCursor('index');

    return run.step('exit');
  },
});
