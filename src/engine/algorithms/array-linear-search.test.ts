import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/array-linear-search.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreArray } from '../structures/array/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { arrayLinearSearch } from './array-linear-search.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function search(values: number[], target: number) {
  const board = new CoreBoard();
  const array = new CoreArray(values);
  board.add(array);

  const run = arrayLinearSearch(board, array, listing.anchors, { target });

  const trace = traceRun(run, listing.anchors, () =>
    array.nodes.map((node) => node.variant),
  );

  return { trace, array };
}

const cases = [
  {
    name: 'an empty array',
    values: [],
    target: 4,
    anchors: ['enter', 'loop', 'missing', 'exit'],
  },
  {
    name: 'the target in the first cell',
    values: [8, 3, 21],
    target: 8,
    anchors: ['enter', 'loop', 'compare', 'found', 'exit'],
  },
  {
    name: 'the target in the last cell',
    values: [8, 3, 21],
    target: 21,
    anchors: [
      'enter',
      'loop',
      'compare',
      'loop',
      'compare',
      'loop',
      'compare',
      'found',
      'exit',
    ],
  },
  {
    name: 'a missing target',
    values: [8, 3, 21],
    target: 5,
    anchors: [
      'enter',
      'loop',
      'compare',
      'loop',
      'compare',
      'loop',
      'compare',
      'loop',
      'missing',
      'exit',
    ],
  },
  {
    name: 'a target that appears twice',
    values: [4, 7, 4],
    target: 4,
    anchors: ['enter', 'loop', 'compare', 'found', 'exit'],
  },
];

describe('linear search', () => {
  describe.each(cases)('on $name', ({ values, target, anchors }) => {
    test('stops at the expected lines', () => {
      const { trace } = search(values, target);

      expect(trace.map((step) => step.anchor)).toEqual(anchors);
    });

    test('highlights the cell `i` points at when comparing', () => {
      const { trace } = search(values, target);

      for (const step of trace.filter((step) => step.anchor === 'compare')) {
        const i = Number(step.memory.i);

        expect(step.state[i]).toBe('secondary');
      }
    });

    test('stays one call deep', () => {
      const { trace } = search(values, target);

      for (const step of trace) expect(step.depth).toBe(1);
    });

    test('leaves the array as it found it', () => {
      const { trace, array } = search(values, target);
      const exit = trace.at(-1)!;

      expect(array.toData()).toEqual(values);
      expect(exit.state.every((variant) => variant === 'primary')).toBe(true);
      expect(exit.memory).not.toHaveProperty('i');
    });
  });

  describe('when the target is found', () => {
    test('marks the first index holding it', () => {
      const { trace } = search([4, 7, 4], 4);
      const found = trace.find((step) => step.anchor === 'found')!;

      expect(found.memory.i).toBe('0');
      expect(found.state).toEqual(['success', 'primary', 'primary']);
    });
  });

  describe('when the target is missing', () => {
    test('marks every cell', () => {
      const { trace } = search([8, 3, 21], 5);
      const missing = trace.find((step) => step.anchor === 'missing')!;

      expect(missing.state).toEqual(['danger', 'danger', 'danger']);
      expect(missing.memory).not.toHaveProperty('i');
    });

    test('checks the loop condition once past the end', () => {
      const { trace } = search([8, 3, 21], 5);
      const loops = trace.filter((step) => step.anchor === 'loop');

      expect(loops.map((step) => step.memory.i)).toEqual(['0', '1', '2', '3']);
    });
  });
});
