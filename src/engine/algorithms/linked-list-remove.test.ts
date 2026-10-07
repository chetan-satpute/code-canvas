import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/linked-list-remove.md?highlight';

import { CoreBoard } from '../board.ts';
import { linkedListOperations } from '../structures/linked-list/operations.ts';
import { CoreLinkedList } from '../structures/linked-list/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { linkedListRemove } from './linked-list-remove.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function remove(values: number[], target: number) {
  const board = new CoreBoard();
  const list = new CoreLinkedList(values);
  list.name = 'list';
  board.add(list);

  const run = linkedListRemove(board, list, listing.anchors, { target });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: list.toData(),
      // A node faded out is still serialized while a pointer holds it.
      drawn: frame.nodes
        .filter((node) => node.opacity > 0)
        .map((node) => node.value),
      edges: frame.edges.filter((edge) => edge.opacity > 0).length,
      // `head` and the pointers, without the structure's own name.
      labels: frame.labels
        .filter((label) => label.opacity > 0 && label.text !== 'list')
        .map((label) => label.text),
    };
  });

  return { trace, list };
}

// What the structure card's Remove leaves, which the run has to agree with.
function removedByOperation(values: number[], target: number): number[] {
  const list = new CoreLinkedList(values);
  linkedListOperations.remove(list, { target });

  return list.toData();
}

const START = ['enter', 'start', 'noPrevious'];
const ADVANCE = ['search', 'setPrevious', 'advance'];
const FOUND = ['search', 'missingCheck', 'headCheck'];

const cases = [
  {
    name: 'the head',
    values: [8, 3, 21],
    target: 8,
    anchors: [...START, ...FOUND, 'setHead', 'exit'],
  },
  {
    name: 'a middle node',
    values: [8, 3, 21],
    target: 3,
    anchors: [...START, ...ADVANCE, ...FOUND, 'setNext', 'exit'],
  },
  {
    name: 'the tail',
    values: [8, 3, 21],
    target: 21,
    anchors: [...START, ...ADVANCE, ...ADVANCE, ...FOUND, 'setNext', 'exit'],
  },
  {
    name: 'the only node',
    values: [8],
    target: 8,
    anchors: [...START, ...FOUND, 'setHead', 'exit'],
  },
  {
    name: 'the first of two matches',
    values: [8, 3, 21, 3],
    target: 3,
    anchors: [...START, ...ADVANCE, ...FOUND, 'setNext', 'exit'],
  },
];

describe('remove', () => {
  describe.each(cases)('removing $name', ({ values, target, anchors }) => {
    test('stops at the expected lines', () => {
      const { trace } = remove(values, target);

      expect(trace.map((step) => step.anchor)).toEqual(anchors);
    });

    test('keeps `previous` one node behind `node`', () => {
      const { trace } = remove(values, target);

      for (const step of trace.filter((step) => step.anchor === 'advance'))
        expect(step.state.labels).toEqual(['head', 'previous', 'node']);
    });

    test('takes the node out at the unlink', () => {
      const { trace } = remove(values, target);
      const index = trace.findIndex(
        (step) => step.anchor === 'setHead' || step.anchor === 'setNext',
      );
      const before = trace[index - 1];
      const after = trace[index];
      const result = removedByOperation(values, target);

      expect(before.state.values).toEqual(values);
      expect(after.state.values).toEqual(result);
      expect(after.state.drawn).toEqual(result);
      // Every node left links to the next, and only those links are drawn.
      expect(after.state.edges).toBe(Math.max(result.length - 1, 0));
    });

    test('ends as the structure card would leave it', () => {
      const { trace, list } = remove(values, target);
      const exit = trace.at(-1)!;

      expect(list.toData()).toEqual(removedByOperation(values, target));
      expect(exit.state.labels).toEqual(list.head === null ? [] : ['head']);
      expect(list.nodes().every((node) => node.variant === 'primary')).toBe(
        true,
      );
    });

    test('leaves the list laid out as a fresh one would be', () => {
      const { list } = remove(values, target);
      const fresh = new CoreLinkedList(list.toData());

      expect(list.nodes().map(({ x, y }) => ({ x, y }))).toEqual(
        fresh.nodes().map(({ x, y }) => ({ x, y })),
      );
    });

    test('keeps only the target in memory', () => {
      const { trace } = remove(values, target);

      for (const step of trace) {
        expect(step.memory).toEqual({ target: target.toString() });
        expect(step.depth).toBe(1);
      }
    });
  });

  test('removes the first match only', () => {
    const { list } = remove([8, 3, 21, 3], 3);

    expect(list.toData()).toEqual([8, 21, 3]);
  });

  test.each([
    { name: 'an empty list', values: [], anchors: [] },
    {
      name: 'a target the list does not hold',
      values: [8, 3, 21],
      anchors: [...ADVANCE, ...ADVANCE, ...ADVANCE],
    },
  ])('changes nothing on $name', ({ values, anchors }) => {
    const { trace, list } = remove(values, 5);
    const exit = trace.at(-1)!;

    expect(trace.map((step) => step.anchor)).toEqual([
      ...START,
      ...anchors,
      'search',
      'missingCheck',
      'missing',
      'exit',
    ]);
    expect(list.toData()).toEqual(values);
    expect(exit.state.drawn).toEqual(values);
    expect(exit.state.labels).toEqual(values.length === 0 ? [] : ['head']);
    expect(list.nodes().every((node) => node.variant === 'primary')).toBe(true);
  });

  test('names the list bare in the signature', () => {
    const board = new CoreBoard();
    const list = new CoreLinkedList([8, 3]);
    board.add(list);

    const run = linkedListRemove(board, list, listing.anchors, { target: 3 });

    expect(run.next().value.callStack[0].signature).toBe(
      'remove(list, target: 3)',
    );
  });
});
