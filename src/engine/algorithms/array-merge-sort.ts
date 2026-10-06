import { NODE_HEIGHT, NODE_WIDTH } from '#canvas/elements/node.ts';

import type { AlgorithmRun } from '../algorithm.ts';
import { animateMove, appear, disappear } from '../animation.ts';
import type { CoreBoard } from '../board.ts';
import type { CoreCall } from '../call.ts';
import { CoreNode } from '../elements/node.ts';
import type { CoreRun } from '../run.ts';
import { defineArrayAlgorithm } from '../structures/array/algorithm.ts';
import { CoreArray } from '../structures/array/structure.ts';

// From an array to the halves sliced from it. The first row between holds the
// array's cursors and is the lane a copy travels along; the second holds the
// halves' indices.
const HALF_OFFSET = 3 * NODE_HEIGHT;

interface Context {
  run: CoreRun;
  board: CoreBoard;
}

type Side = 'left' | 'right';

// `merge` reads both halves the same way, line for line.
const SIDES = {
  left: {
    cursor: 'i',
    start: 'startLeft',
    take: 'takeLeft',
    next: 'nextLeft',
    drain: 'drainLeft',
    drainTake: 'drainLeftTake',
    drainNext: 'drainLeftNext',
    drainSlot: 'drainLeftSlot',
  },
  right: {
    cursor: 'j',
    start: 'startRight',
    take: 'takeRight',
    next: 'nextRight',
    drain: 'drainRight',
    drainTake: 'drainRightTake',
    drainNext: 'drainRightNext',
    drainSlot: 'drainRightSlot',
  },
} satisfies Record<Side, Record<string, string>>;

// Plays `#catalog/listings/array-merge-sort.md`, stopping at the lines its
// markers name. Each call recurses with `yield*`, so one step is still one
// `next()` however deep the run is.
export const arrayMergeSort = defineArrayAlgorithm({
  play: function* ({ run, board, structure: array }) {
    return yield* mergeSort({ run, board }, array);
  },
});

// A call's last step is returned rather than yielded, so the outermost one
// ends the run. A caller yields the step it gets back.
function* mergeSort(context: Context, array: CoreArray): AlgorithmRun {
  const { run, board } = context;

  const call = run.call('mergeSort', [
    { name: 'array', value: array.toData() },
  ]);

  // Every call sorts an array it calls `array`, whatever its caller calls it.
  array.name = 'array';
  yield run.step('enter');
  yield run.step('base');

  if (array.nodes.length <= 1) {
    for (const node of array.nodes) node.variant = 'success';
    yield run.step('sorted');

    for (const node of array.nodes) node.variant = 'primary';

    return run.return('exit');
  }

  const mid = Math.floor(array.nodes.length / 2);
  call.set('mid', mid);
  array.setCursor('mid', mid);
  yield run.step('mid');

  const left = slice(board, array, 0, mid, 'left');
  yield run.step('left');

  const right = slice(board, array, mid, array.nodes.length, 'right');
  yield run.step('right');

  // The canvas names only what the running call can reach, the way memory
  // shows only its variables: a deeper call names its own arrays and its own
  // `mid`, and `merge` has no `mid`.
  const away = () => {
    array.clearCursor('mid');
    array.name = left.name = right.name = undefined;
  };

  const back = () => {
    array.setCursor('mid', mid);
    array.name = 'array';
    left.name = 'left';
    right.name = 'right';
  };

  yield run.step('sortLeft');
  away();
  yield yield* mergeSort(context, left);
  back();
  yield run.step('sortLeft');

  yield run.step('sortRight');
  away();
  yield yield* mergeSort(context, right);
  back();
  yield run.step('sortRight');

  yield run.step('merge');
  array.clearCursor('mid');
  yield yield* merge(context, array, left, right, call);
  array.setCursor('mid', mid);
  yield run.step('merge');

  // `mid` and both halves leave scope with the return, and no color outlives
  // the call that set it.
  for (const node of array.nodes) node.variant = 'primary';
  array.clearCursor('mid');
  call.clear('mid');

  disappear(board, left, right, ...left.nodes, ...right.nodes);
  board.remove(left);
  board.remove(right);

  return run.return('exit');
}

// `array.slice(from, to)`: a new array of copies, faded in under the cells
// they were copied from. The right half starts one cell further along, which
// leaves its name room between the two.
function slice(
  board: CoreBoard,
  array: CoreArray,
  from: number,
  to: number,
  name: Side,
): CoreArray {
  const half = new CoreArray(array.toData().slice(from, to));

  half.x = array.x + (from === 0 ? 0 : from + 1) * NODE_WIDTH;
  half.y = array.y + HALF_OFFSET;
  half.name = name;
  half.opacity = 0;
  half.rearrange();

  for (const node of half.nodes) node.opacity = 0;

  board.add(half);
  appear(board, half, ...half.nodes);

  return half;
}

function* merge(
  { run, board }: Context,
  array: CoreArray,
  left: CoreArray,
  right: CoreArray,
  caller: CoreCall,
): AlgorithmRun {
  const call = run.call('merge', [
    { name: 'array', value: array.toData() },
    { name: 'left', value: left.toData() },
    { name: 'right', value: right.toData() },
  ]);

  yield run.step('mergeEnter');

  const halves = { left, right };
  const read = { left: 0, right: 0 };
  let k = 0;

  for (const side of ['left', 'right'] as const) {
    call.set(SIDES[side].cursor, 0);
    halves[side].setCursor(SIDES[side].cursor, 0);
    yield run.step(SIDES[side].start);
  }

  call.set('k', k);
  array.setCursor('k', k);
  yield run.step('startArray');

  // `array[k] = half[index]`. Both calls show this array in their signature,
  // and it changes under them.
  const write = (side: Side) => {
    copy(board, halves[side].nodes[read[side]], array, k);

    call.set('array', array.toData());
    caller.set('array', array.toData());
  };

  // `i++` or `j++`. The value read is behind it now.
  const next = (side: Side) => {
    halves[side].nodes[read[side]].variant = 'primary';
    read[side]++;

    call.set(SIDES[side].cursor, read[side]);
    halves[side].setCursor(SIDES[side].cursor, read[side]);
  };

  const nextSlot = () => {
    k++;
    call.set('k', k);
    array.setCursor('k', k);
  };

  // The check that ends the loop, with an index past its half, is a step too.
  for (;;) {
    yield run.step('loop');

    if (read.left === left.nodes.length || read.right === right.nodes.length)
      break;

    const fromLeft = left.nodes[read.left];
    const fromRight = right.nodes[read.right];

    fromLeft.variant = 'secondary';
    fromRight.variant = 'secondary';
    yield run.step('compare');

    const side = fromLeft.value <= fromRight.value ? 'left' : 'right';
    (side === 'left' ? fromRight : fromLeft).variant = 'primary';

    write(side);
    yield run.step(SIDES[side].take);

    next(side);
    yield run.step(SIDES[side].next);

    nextSlot();
    yield run.step('nextSlot');
  }

  // Only one of the two still has values to copy, but both loops are checked.
  for (const side of ['left', 'right'] as const) {
    const anchors = SIDES[side];

    for (;;) {
      yield run.step(anchors.drain);

      if (read[side] === halves[side].nodes.length) break;

      halves[side].nodes[read[side]].variant = 'secondary';
      write(side);
      yield run.step(anchors.drainTake);

      next(side);
      yield run.step(anchors.drainNext);

      nextSlot();
      yield run.step(anchors.drainSlot);
    }
  }

  // `i`, `j` and `k` leave scope with the return.
  left.clearCursor('i');
  right.clearCursor('j');
  array.clearCursor('k');
  for (const name of ['i', 'j', 'k']) call.clear(name);

  return run.return('mergeExit');
}

// `to[index] = from`, where `from` is a cell of another array. An assignment
// copies a value, so neither array gains or loses a cell: what travels is a
// copy belonging to neither, and the cell it lands on takes the value where
// it stands.
function copy(board: CoreBoard, from: CoreNode, to: CoreArray, index: number) {
  const target = to.nodes[index];

  const travelling = new CoreNode(from.value);
  travelling.x = from.x;
  travelling.y = from.y;
  travelling.variant = 'secondary';
  board.float(travelling);

  // Up into the lane under `to` first, then along it and up into the cell.
  // Straight there, it would cross the cells in between.
  animateMove(board, travelling, from.x, to.y + NODE_HEIGHT);
  animateMove(board, travelling, target.x, target.y);

  board.unfloat(travelling);
  target.value = from.value;
  target.variant = 'success';
  board.pushFrame();
}
