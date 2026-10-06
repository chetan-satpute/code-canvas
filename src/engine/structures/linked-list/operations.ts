import { randomNumber, uniqueRandomNumberArray } from '#utils/random.ts';

import { operationFor, type OperationRunner } from '../../operation.ts';
import { CoreLinkedList, CoreLinkedListNode } from './structure.ts';

const defineLinkedListOperation = operationFor('linked-list', CoreLinkedList);

// Distinct, because Insert after and Remove name their node by its value. A
// node is two cells apart from the next, so six already draw 720px wide.
export function randomLinkedListValues(): number[] {
  return uniqueRandomNumberArray(randomNumber(4, 6));
}

const randomize = defineLinkedListOperation({
  apply: (list) => {
    list.restore(randomLinkedListValues());
  },
});

const insertHead = defineLinkedListOperation({
  args: ['value'],
  apply: (list, args) => {
    const node = new CoreLinkedListNode(args.value);

    node.setNext(list.head);
    list.head = node;
    list.rearrange();
  },
});

// A target the list does not hold leaves nowhere to insert, so nothing
// changes.
const insertAfter = defineLinkedListOperation({
  args: ['target', 'value'],
  apply: (list, args) => {
    const previous = list.find(args.target);
    if (previous === undefined) return;

    const node = new CoreLinkedListNode(args.value);

    node.setNext(previous.successor);
    previous.setNext(node);
    list.rearrange();
  },
});

const remove = defineLinkedListOperation({
  args: ['target'],
  apply: (list, args) => {
    const nodes = list.nodes();
    const index = nodes.findIndex((node) => node.value === args.target);
    if (index === -1) return;

    const successor = nodes[index].successor;

    if (index === 0) list.head = successor;
    else nodes[index - 1].setNext(successor);

    list.rearrange();
  },
});

// Keyed by the operation ids in `#catalog/structures.ts`.
export const linkedListOperations: Record<string, OperationRunner> = {
  randomize,
  'insert-head': insertHead,
  'insert-after': insertAfter,
  remove,
};
