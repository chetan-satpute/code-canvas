import { defineArrayAlgorithm } from '../structures/array/algorithm.ts';

// How faint a cell the search has ruled out is drawn. Still readable, so the
// reader can see what was discarded, but plainly out of play.
const DISCARDED_OPACITY = 0.3;

// Plays `#catalog/listings/array-binary-search.md`, stopping at the lines its
// markers name. The array is searched as it is: the listing requires it
// sorted, and on an array that is not, the run shows what the code does to it,
// which can miss a target that is there.
export const arrayBinarySearch = defineArrayAlgorithm({
  args: ['target'],

  play: function* ({ run, structure: array, args }) {
    const call = run.call('binarySearch', [
      { name: 'array', value: array.toData() },
      { name: 'target', value: args.target },
    ]);

    yield run.step('enter');

    let low = 0;
    call.set('low', low);
    array.setCursor('low', low);
    yield run.step('low');

    let high = array.nodes.length - 1;
    call.set('high', high);
    array.setCursor('high', high);
    yield run.step('high');

    // The check that ends the loop, with the range empty, is a step too.
    for (;;) {
      yield run.step('loop');

      if (low > high) break;

      const mid = Math.floor((low + high) / 2);
      call.set('mid', mid);
      array.setCursor('mid', mid);
      yield run.step('mid');

      const node = array.nodes[mid];

      node.variant = 'secondary';
      yield run.step('compare');

      if (node.value === args.target) {
        node.variant = 'success';
        yield run.step('found');

        // `low`, `high` and `mid` leave scope with the return, and no color
        // or dimming outlives the run that set it.
        for (const cell of array.nodes) cell.opacity = 1;
        node.variant = 'primary';
        array.clearCursor('low');
        array.clearCursor('high');
        array.clearCursor('mid');
        call.clear('low');
        call.clear('high');
        call.clear('mid');

        return run.step('exit');
      }

      yield run.step('less');

      // `mid` is ruled out along with the half beside it, and the cursor of
      // the bound that moved follows. `mid` itself is still in scope here.
      node.variant = 'primary';

      if (node.value < args.target) {
        low = mid + 1;
        for (let i = 0; i < low; i++)
          array.nodes[i].opacity = DISCARDED_OPACITY;
        call.set('low', low);
        array.setCursor('low', low);
        yield run.step('right');
      } else {
        high = mid - 1;
        for (let i = high + 1; i < array.nodes.length; i++)
          array.nodes[i].opacity = DISCARDED_OPACITY;
        call.set('high', high);
        array.setCursor('high', high);
        yield run.step('left');
      }

      // `mid` is declared inside the loop body, so it is gone before the
      // condition is checked again.
      array.clearCursor('mid');
      call.clear('mid');
    }

    // Everything was ruled out, which says the whole array held no target:
    // the cells are drawn in full again to be marked, as in linear search.
    for (const cell of array.nodes) {
      cell.opacity = 1;
      cell.variant = 'danger';
    }
    yield run.step('missing');

    for (const cell of array.nodes) cell.variant = 'primary';
    array.clearCursor('low');
    array.clearCursor('high');
    call.clear('low');
    call.clear('high');

    return run.step('exit');
  },
});
