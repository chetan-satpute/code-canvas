import { randomNumber, randomNumberArray } from '#utils/random.ts';

import { CoreNode } from '../../elements/node.ts';
import { operationFor, type OperationRunner } from '../../operation.ts';
import { CoreArray } from './structure.ts';

const defineArrayOperation = operationFor('array', CoreArray);

// Being out of range is ordinary: the bound depends on the array's current
// length, which the form does not know, so an index is clamped rather than
// refused.
function clamp(index: number, max: number): number {
  return Math.min(Math.max(index, 0), max);
}

export function randomArrayValues(): number[] {
  return randomNumberArray(randomNumber(5, 10));
}

const randomize = defineArrayOperation({
  apply: (array) => {
    array.restore(randomArrayValues());
  },
});

const sort = defineArrayOperation({
  apply: (array) => {
    array.nodes.sort((a, b) => a.value - b.value);
    array.rearrange();
  },
});

const insert = defineArrayOperation({
  args: ['index', 'value'],
  apply: (array, args) => {
    const index = clamp(args.index, array.nodes.length);

    array.nodes.splice(index, 0, new CoreNode(args.value));
    array.rearrange();
  },
});

const remove = defineArrayOperation({
  args: ['index'],
  apply: (array, args) => {
    if (array.nodes.length === 0) return;

    const index = clamp(args.index, array.nodes.length - 1);

    array.nodes.splice(index, 1);
    array.rearrange();
  },
});

// Keyed by the operation ids in `#catalog/structures.ts`.
export const arrayOperations: Record<string, OperationRunner> = {
  randomize,
  sort,
  insert,
  remove,
};
