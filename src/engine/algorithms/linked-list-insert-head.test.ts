import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/linked-list-insert-head.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreLinkedList } from '../structures/linked-list/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { linkedListInsertHead } from './linked-list-insert-head.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function insertHead(values: number[], value: number) {
  const board = new CoreBoard();
  const list = new CoreLinkedList(values);
  list.name = 'list';
  board.add(list);

  const run = linkedListInsertHead(board, list, listing.anchors, { value });

  const trace = traceRun(run, listing.anchors, () => {
    const frame = board.toFrame();

    return {
      values: list.toData(),
      drawn: frame.nodes.map((node) => node.value),
      edges: frame.edges.length,
      labels: frame.labels.map((label) => label.text),
    };
  });

  return { trace, list };
}

const cases = [
  { name: 'an empty list', values: [] },
  { name: 'a list of one', values: [8] },
  { name: 'a longer list', values: [8, 3, 21] },
];

describe('insert at head', () => {
  describe.each(cases)('on $name', ({ values }) => {
    test('stops at the expected lines', () => {
      const { trace } = insertHead(values, 42);

      expect(trace.map((step) => step.anchor)).toEqual([
        'enter',
        'create',
        'link',
        'setHead',
        'exit',
      ]);
    });

    test('draws the new node before the list reaches it', () => {
      const { trace } = insertHead(values, 42);
      const [, create, link] = trace;

      expect(create.state.values).toEqual(values);
      expect(create.state.drawn).toContain(42);
      expect(create.state.labels).toContain('node');
      expect(link.state.values).toEqual(values);
    });

    test('links the new node to the old head before moving the head', () => {
      const { trace } = insertHead(values, 42);
      const [, create, link] = trace;

      const links = values.length === 0 ? 0 : 1;

      expect(link.state.edges - create.state.edges).toBe(links);
    });

    test('ends with the value at the head', () => {
      const { trace, list } = insertHead(values, 42);
      const exit = trace.at(-1)!;

      expect(list.toData()).toEqual([42, ...values]);
      expect(exit.state.labels).not.toContain('node');
      expect(list.nodes().every((node) => node.variant === 'primary')).toBe(
        true,
      );
    });

    test('leaves the list laid out as a fresh one would be', () => {
      const { list } = insertHead(values, 42);
      const fresh = new CoreLinkedList(list.toData());

      expect(list.nodes().map(({ x, y }) => ({ x, y }))).toEqual(
        fresh.nodes().map(({ x, y }) => ({ x, y })),
      );
    });

    test('keeps only the value in memory', () => {
      const { trace } = insertHead(values, 42);

      for (const step of trace) {
        expect(step.memory).toEqual({ value: '42' });
        expect(step.depth).toBe(1);
      }
    });
  });

  test('names the list bare in the signature', () => {
    const board = new CoreBoard();
    const list = new CoreLinkedList([8, 3]);
    board.add(list);

    const run = linkedListInsertHead(board, list, listing.anchors, {
      value: 42,
    });

    expect(run.next().value.callStack[0].signature).toBe(
      'insertHead(list, value: 42)',
    );
  });
});
