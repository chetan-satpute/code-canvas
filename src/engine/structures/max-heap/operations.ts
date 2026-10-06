import { randomNumber, randomNumberArray } from '#utils/random.ts';

import { operationFor, type OperationRunner } from '../../operation.ts';
import { CoreMaxHeap, parentOf } from './structure.ts';

const defineMaxHeapOperation = operationFor('max-heap', CoreMaxHeap);

// Moves the value at `index` up past every smaller parent.
function siftUp(values: number[], index: number) {
  while (index > 0) {
    const parent = parentOf(index);

    if (values[index] <= values[parent]) return;

    [values[index], values[parent]] = [values[parent], values[index]];
    index = parent;
  }
}

// Moves the value at `index` down past every larger child, taking the larger
// of the two each time.
function siftDown(values: number[], index: number) {
  for (;;) {
    const left = 2 * index + 1;
    const right = 2 * index + 2;
    let largest = index;

    if (left < values.length && values[left] > values[largest]) largest = left;
    if (right < values.length && values[right] > values[largest])
      largest = right;

    if (largest === index) return;

    [values[index], values[largest]] = [values[largest], values[index]];
    index = largest;
  }
}

// Random values put in heap order by sifting each parent down, deepest first.
// Every node has a column of its own in the tree, so seven draw 480px wide.
export function randomMaxHeapValues(): number[] {
  const values = randomNumberArray(randomNumber(5, 7));

  for (let index = parentOf(values.length - 1); index >= 0; index--)
    siftDown(values, index);

  return values;
}

const randomize = defineMaxHeapOperation({
  apply: (heap) => {
    heap.restore(randomMaxHeapValues());
  },
});

const push = defineMaxHeapOperation({
  args: ['value'],
  apply: (heap, args) => {
    const values = heap.toData();

    values.push(args.value);
    siftUp(values, values.length - 1);

    heap.restore(values);
  },
});

// The last value replaces the maximum at the root and sinks. Popping an empty
// heap does nothing.
const pop = defineMaxHeapOperation({
  apply: (heap) => {
    const values = heap.toData();
    const last = values.pop();

    if (last !== undefined && values.length > 0) {
      values[0] = last;
      siftDown(values, 0);
    }

    heap.restore(values);
  },
});

// Keyed by the operation ids in `#catalog/structures.ts`.
export const maxHeapOperations: Record<string, OperationRunner> = {
  randomize,
  push,
  pop,
};
