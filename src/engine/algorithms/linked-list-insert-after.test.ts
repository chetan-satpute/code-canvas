import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/linked-list-insert-after.md?highlight';

import { CoreBoard } from '../board.ts';
import { linkedListOperations } from '../structures/linked-list/operations.ts';
import { CoreLinkedList } from '../structures/linked-list/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { linkedListInsertAfter } from './linked-list-insert-after.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function insertAfter(values: number[], target: number, value: number) {
  const board = new CoreBoard();
  const list = new CoreLinkedList(values);
  list.name = 'list';
  board.add(list);

  const run = linkedListInsertAfter(board, list, listing.anchors, {
    target,
    value,
  });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: list.toData(),
      drawn: frame.nodes.map((node) => node.value),
      edges: frame.edges.length,
      // `head` and the pointers, without the structure's own name.
      labels: frame.labels
        .filter((label) => label.text !== 'list')
        .map((label) => label.text),
      secondary: frame.nodes
        .filter((node) => node.variant === 'secondary')
        .map((node) => node.value),
    };
  });

  return { trace, list };
}

// What the structure card's Insert after leaves, which the run has to agree
// with.
function insertedByOperation(
  values: number[],
  target: number,
  value: number,
): number[] {
  const list = new CoreLinkedList(values);
  linkedListOperations['insert-after'](list, { target, value });

  return list.toData();
}

const START = ['enter', 'start'];
const ADVANCE = ['search', 'advance'];
const INSERT = ['search', 'missingCheck', 'create', 'link', 'splice', 'exit'];

const cases = [
  {
    name: 'the head',
    values: [8, 3, 21],
    target: 8,
    anchors: [...START, ...INSERT],
  },
  {
    name: 'a middle node',
    values: [8, 3, 21],
    target: 3,
    anchors: [...START, ...ADVANCE, ...INSERT],
  },
  {
    name: 'the tail',
    values: [8, 3, 21],
    target: 21,
    anchors: [...START, ...ADVANCE, ...ADVANCE, ...INSERT],
  },
  {
    name: 'the only node',
    values: [8],
    target: 8,
    anchors: [...START, ...INSERT],
  },
  {
    name: 'the first of two matches',
    values: [8, 3, 21, 3],
    target: 3,
    anchors: [...START, ...ADVANCE, ...INSERT],
  },
];

describe('insert after target', () => {
  describe.each(cases)('after $name', ({ values, target, anchors }) => {
    test('stops at the expected lines', () => {
      const { trace } = insertAfter(values, target, 42);

      expect(trace.map((step) => step.anchor)).toEqual(anchors);
    });

    test('compares each node the scan reaches', () => {
      const { trace } = insertAfter(values, target, 42);
      const searched = trace
        .filter((step) => step.anchor === 'search')
        .map((step) => step.state.secondary);

      const reached = values.slice(0, values.indexOf(target) + 1);

      expect(searched).toEqual(reached.map((node) => [node]));
    });

    test('draws the new node before the list reaches it', () => {
      const { trace } = insertAfter(values, target, 42);
      const create = trace.find((step) => step.anchor === 'create')!;
      const link = trace.find((step) => step.anchor === 'link')!;

      expect(create.state.values).toEqual(values);
      expect(create.state.drawn).toContain(42);
      expect(create.state.labels).toContain('newNode');
      expect(link.state.values).toEqual(values);
    });

    test('links the new node to the successor before splicing it in', () => {
      const { trace } = insertAfter(values, target, 42);
      const create = trace.find((step) => step.anchor === 'create')!;
      const link = trace.find((step) => step.anchor === 'link')!;
      const splice = trace.find((step) => step.anchor === 'splice')!;

      const isTail = values.indexOf(target) === values.length - 1;

      expect(link.state.edges - create.state.edges).toBe(isTail ? 0 : 1);
      // The old link is replaced, so splicing adds one only after the tail.
      expect(splice.state.edges - link.state.edges).toBe(isTail ? 1 : 0);
    });

    test('ends as the structure card would leave it', () => {
      const { trace, list } = insertAfter(values, target, 42);
      const exit = trace.at(-1)!;

      expect(list.toData()).toEqual(insertedByOperation(values, target, 42));
      expect(exit.state.labels).toEqual(['head']);
      expect(list.nodes().every((node) => node.variant === 'primary')).toBe(
        true,
      );
    });

    test('leaves the list laid out as a fresh one would be', () => {
      const { list } = insertAfter(values, target, 42);
      const fresh = new CoreLinkedList(list.toData());

      expect(list.nodes().map(({ x, y }) => ({ x, y }))).toEqual(
        fresh.nodes().map(({ x, y }) => ({ x, y })),
      );
    });

    test('keeps only the arguments in memory', () => {
      const { trace } = insertAfter(values, target, 42);

      for (const step of trace) {
        expect(step.memory).toEqual({
          target: target.toString(),
          value: '42',
        });
        expect(step.depth).toBe(1);
      }
    });
  });

  test('inserts after the first match only', () => {
    const { list } = insertAfter([8, 3, 21, 3], 3, 42);

    expect(list.toData()).toEqual([8, 3, 42, 21, 3]);
  });

  test.each([
    { name: 'an empty list', values: [], anchors: [] },
    {
      name: 'a target the list does not hold',
      values: [8, 3, 21],
      anchors: [...ADVANCE, ...ADVANCE, ...ADVANCE],
    },
  ])('changes nothing on $name', ({ values, anchors }) => {
    const { trace, list } = insertAfter(values, 5, 42);
    const missing = trace.find((step) => step.anchor === 'missing')!;
    const exit = trace.at(-1)!;

    expect(trace.map((step) => step.anchor)).toEqual([
      ...START,
      ...anchors,
      'search',
      'missingCheck',
      'missing',
      'exit',
    ]);
    expect(missing.state.labels).not.toContain('node');
    expect(list.toData()).toEqual(values);
    expect(exit.state.drawn).toEqual(values);
    expect(exit.state.labels).toEqual(values.length === 0 ? [] : ['head']);
    expect(list.nodes().every((node) => node.variant === 'primary')).toBe(true);
  });

  test('names the list bare in the signature', () => {
    const board = new CoreBoard();
    const list = new CoreLinkedList([8, 3]);
    board.add(list);

    const run = linkedListInsertAfter(board, list, listing.anchors, {
      target: 8,
      value: 42,
    });

    expect(run.next().value.callStack[0].signature).toBe(
      'insertAfter(list, target: 8, value: 42)',
    );
  });
});
