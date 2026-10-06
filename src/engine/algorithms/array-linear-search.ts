import { defineArrayAlgorithm } from '../structures/array/algorithm.ts';

// Plays `#catalog/listings/array-linear-search.md`, stopping at the lines its
// markers name.
export const arrayLinearSearch = defineArrayAlgorithm({
  args: ['target'],

  play: function* ({ run, structure: array, args }) {
    const call = run.call('linearSearch', [
      { name: 'array', value: array.toData() },
      { name: 'target', value: args.target },
    ]);

    yield run.step('enter');

    // The condition is checked once more than there are cells, and that last
    // check, with `i` past the end, is a step too: it is what ends the loop.
    for (let i = 0; ; i++) {
      call.set('i', i);
      array.setCursor('i', i);
      yield run.step('loop');

      if (i === array.nodes.length) break;

      const node = array.nodes[i];

      node.variant = 'secondary';
      yield run.step('compare');

      if (node.value === args.target) {
        node.variant = 'success';
        yield run.step('found');

        // `i` leaves scope with the return, and no color outlives the run
        // that set it.
        node.variant = 'primary';
        array.clearCursor('i');
        call.clear('i');

        return run.step('exit');
      }

      node.variant = 'primary';
    }

    array.clearCursor('i');
    call.clear('i');

    // Nothing matched, so the whole array is the answer: none of it held the
    // target.
    for (const node of array.nodes) node.variant = 'danger';
    yield run.step('missing');

    for (const node of array.nodes) node.variant = 'primary';

    return run.step('exit');
  },
});
