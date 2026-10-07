import type { AlgorithmRun } from '../algorithm.ts';
import type { CoreBoard } from '../board.ts';
import { STRUCTURE } from '../call.ts';
import type { CoreRun } from '../run.ts';
import type { CoreStep } from '../step.ts';
import { defineArrayAlgorithm } from '../structures/array/algorithm.ts';
import type { CoreArray } from '../structures/array/structure.ts';
import { animateSwap } from '../structures/max-heap/swap.ts';

interface Context {
  run: CoreRun;
  board: CoreBoard;
  array: CoreArray;
}

// Plays `#catalog/listings/array-quick-sort.md`, stopping at the lines its
// markers name. Each call recurses with `yield*`, so one step is still one
// `next()` however deep the run is.
export const arrayQuickSort = defineArrayAlgorithm({
  play: function* ({ run, board, structure: array }) {
    return yield* quickSort(
      { run, board, array },
      0,
      array.nodes.length - 1,
      true,
    );
  },
});

// Every call shares the one array, so a value placed by one call stays marked
// `success` through the rest of the run, and only the outermost call's
// closing brace resets the colors.
function* quickSort(
  context: Context,
  low: number,
  high: number,
  outermost: boolean,
): AlgorithmRun {
  const { run, array } = context;

  // Named bare rather than printed: every call on the stack shares the array
  // and it changes under them, while the canvas shows it as it stands.
  const call = run.call('quickSort', [
    { name: 'array', value: STRUCTURE },
    { name: 'low', value: low },
    { name: 'high', value: high },
  ]);

  array.setCursor('low', low);
  array.setCursor('high', high);
  yield run.step('enter');
  yield run.step('base');

  if (low >= high) {
    // A range of one is in its final place. An empty one, `high` just before
    // `low`, has nothing to mark.
    if (low === high) array.nodes[low].variant = 'success';
    yield run.step('sorted');

    return leave(context, outermost);
  }

  yield run.step('partition');
  clearCursors(array);
  const [partitionExit, p] = yield* partition(context, low, high);
  yield partitionExit;

  // The canvas names only what the running call can reach, the way memory
  // shows only its variables: a deeper call names its own `low` and `high`,
  // and has no `p` until it partitions.
  const back = () => {
    array.setCursor('low', low);
    array.setCursor('high', high);
    array.setCursor('p', p);
  };

  call.set('p', p);
  back();
  yield run.step('partition');

  yield run.step('sortLeft');
  clearCursors(array);
  yield yield* quickSort(context, low, p - 1, false);
  back();
  yield run.step('sortLeft');

  yield run.step('sortRight');
  clearCursors(array);
  yield yield* quickSort(context, p + 1, high, false);
  back();
  yield run.step('sortRight');

  call.clear('p');

  return leave(context, outermost);
}

// The closing brace, where the call is left. Its cursors go with it, and the
// outermost one is the run's last step, so no color outlives the run.
function leave({ run, array }: Context, outermost: boolean): CoreStep {
  clearCursors(array);
  if (outermost) for (const node of array.nodes) node.variant = 'primary';

  return run.return('exit');
}

function clearCursors(array: CoreArray) {
  for (const name of ['low', 'high', 'p', 'i', 'j']) array.clearCursor(name);
}

// Returns the call's closing-brace step, for the caller to yield, and the
// pivot's final index.
function* partition(
  { run, board, array }: Context,
  low: number,
  high: number,
): Generator<CoreStep, [CoreStep, number]> {
  const call = run.call('partition', [
    { name: 'array', value: STRUCTURE },
    { name: 'low', value: low },
    { name: 'high', value: high },
  ]);

  array.setCursor('low', low);
  array.setCursor('high', high);
  yield run.step('partitionEnter');

  // `j` stops short of `high`, so the pivot's cell holds it untouched until
  // `placePivot`.
  const pivot = array.nodes[high].value;
  call.set('pivot', pivot);
  array.nodes[high].variant = 'tertiary';
  yield run.step('pivot');

  let i = low;
  call.set('i', i);
  array.setCursor('i', i);
  yield run.step('start');

  // The check that ends the loop, with `j` on `high`, is a step too.
  for (let j = low; ; j++) {
    call.set('j', j);
    array.setCursor('j', j);
    yield run.step('loop');

    if (j === high) break;

    const node = array.nodes[j];

    node.variant = 'secondary';
    yield run.step('compare');

    if (node.value > pivot) {
      node.variant = 'primary';
      continue;
    }

    // The value read goes left, into `i`, with its color.
    swap(board, array, j, i);
    yield run.step('swap');

    array.nodes[i].variant = 'primary';
    i++;
    call.set('i', i);
    array.setCursor('i', i);
    yield run.step('next');
  }

  // Declared in the loop, so it is gone once the loop ends. That also keeps
  // the cursors' row clear between `i` and `high` for the pivot's swap.
  call.clear('j');
  array.clearCursor('j');

  swap(board, array, high, i);
  array.nodes[i].variant = 'success';
  yield run.step('placePivot');

  yield run.step('returnIndex');

  // `pivot` and `i` leave scope with the return.
  clearCursors(array);
  call.clear('pivot');
  call.clear('i');

  return [run.return('partitionExit'), i];
}

// A slot swapped with itself changes nothing, and the code still runs the
// statement, so its step shows no movement. Otherwise the cell at `a` takes
// the near lane under the row. The partition keeps every other cursor out
// from between the two: `low` is at or before `i`, and `high` past `j`.
function swap(board: CoreBoard, array: CoreArray, a: number, b: number) {
  if (a !== b) animateSwap(board, array, a, b);
}
