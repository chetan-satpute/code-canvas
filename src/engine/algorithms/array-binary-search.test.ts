import { describe, expect, test } from 'vitest';

import { NODE_WIDTH } from '#canvas/elements/node.ts';
import listing from '#catalog/listings/array-binary-search.md?highlight';

import { CoreBoard } from '../board.ts';
import { CoreArray } from '../structures/array/structure.ts';
import { traceRun } from '../testing/trace.ts';
import { arrayBinarySearch } from './array-binary-search.ts';

// Runs against the real listing, so a step naming a line the listing lacks
// fails here rather than on the explore page.
function search(values: number[], target: number) {
  const board = new CoreBoard();
  const array = new CoreArray(values);
  board.add(array);

  const run = arrayBinarySearch(board, array, listing.anchors, { target });

  const trace = traceRun(run, listing.anchors, () => ({
    variants: array.nodes.map((node) => node.variant),
    opacities: array.nodes.map((node) => node.opacity),
    // Cursor labels by the index of the cell they sit under, which can be -1
    // or past the end. The index labels above the cells are not cursors.
    cursors: Object.fromEntries(
      board
        .toFrame()
        .labels.filter((label) => /\D/.test(label.text.replace('-', '')))
        .map((label) => [label.text, (label.x - array.x) / NODE_WIDTH]),
    ),
  }));

  return { trace, array };
}

const sorted = [2, 5, 8, 13, 21, 34, 55];

const start = ['enter', 'low', 'high'];
const probe = ['loop', 'mid', 'compare'];

const cases = [
  {
    name: 'an empty array',
    values: [],
    target: 4,
    anchors: [...start, 'loop', 'missing', 'exit'],
  },
  {
    name: 'the target at the first middle',
    values: sorted,
    target: 13,
    anchors: [...start, ...probe, 'found', 'exit'],
  },
  {
    name: 'a target found after narrowing right',
    values: sorted,
    target: 34,
    anchors: [...start, ...probe, 'less', 'right', ...probe, 'found', 'exit'],
  },
  {
    name: 'a target found after narrowing left',
    values: sorted,
    target: 5,
    anchors: [...start, ...probe, 'less', 'left', ...probe, 'found', 'exit'],
  },
  {
    name: 'a target found after narrowing both ways',
    values: sorted,
    target: 21,
    anchors: [
      ...start,
      ...probe,
      'less',
      'right',
      ...probe,
      'less',
      'left',
      ...probe,
      'found',
      'exit',
    ],
  },
  {
    name: 'a target below the smallest',
    values: sorted,
    target: 1,
    anchors: [
      ...start,
      ...[...probe, 'less', 'left', ...probe, 'less', 'left'],
      ...[...probe, 'less', 'left', 'loop', 'missing', 'exit'],
    ],
  },
  {
    name: 'a target above the largest',
    values: sorted,
    target: 99,
    anchors: [
      ...start,
      ...[...probe, 'less', 'right', ...probe, 'less', 'right'],
      ...[...probe, 'less', 'right', 'loop', 'missing', 'exit'],
    ],
  },
  {
    name: 'a target in a gap',
    values: sorted,
    target: 10,
    anchors: [
      ...start,
      ...[...probe, 'less', 'left', ...probe, 'less', 'right'],
      ...[...probe, 'less', 'right', 'loop', 'missing', 'exit'],
    ],
  },
  {
    name: 'a single element that matches',
    values: [7],
    target: 7,
    anchors: [...start, ...probe, 'found', 'exit'],
  },
  {
    name: 'a single element below the target',
    values: [7],
    target: 9,
    anchors: [
      ...start,
      ...[...probe, 'less', 'right', 'loop', 'missing', 'exit'],
    ],
  },
  {
    name: 'a single element above the target',
    values: [7],
    target: 3,
    anchors: [
      ...start,
      ...[...probe, 'less', 'left', 'loop', 'missing', 'exit'],
    ],
  },
  {
    name: 'two elements, the target second',
    values: [3, 8],
    target: 8,
    anchors: [...start, ...probe, 'less', 'right', ...probe, 'found', 'exit'],
  },
  {
    name: 'two elements, the target below both',
    values: [3, 8],
    target: 1,
    anchors: [
      ...start,
      ...[...probe, 'less', 'left', 'loop', 'missing', 'exit'],
    ],
  },
  {
    name: 'two elements, the target above both',
    values: [3, 8],
    target: 9,
    anchors: [
      ...start,
      ...[...probe, 'less', 'right', ...probe, 'less', 'right'],
      ...['loop', 'missing', 'exit'],
    ],
  },
  {
    name: 'a target that appears several times',
    values: [4, 4, 4, 4],
    target: 4,
    anchors: [...start, ...probe, 'found', 'exit'],
  },
];

describe('array binary search', () => {
  describe.each(cases)('on $name', ({ values, target, anchors }) => {
    test('stops at the expected lines', () => {
      const { trace } = search(values, target);

      expect(trace.map((step) => step.anchor)).toEqual(anchors);
    });

    test('stays one call deep', () => {
      const { trace } = search(values, target);

      for (const step of trace) expect(step.depth).toBe(1);
    });

    test('leaves the array as it found it', () => {
      const { trace, array } = search(values, target);
      const exit = trace.at(-1)!;

      expect(array.toData()).toEqual(values);
      expect(exit.state.variants.every((v) => v === 'primary')).toBe(true);
      expect(exit.state.opacities.every((opacity) => opacity === 1)).toBe(true);
      expect(exit.state.cursors).toEqual({});
      expect(Object.keys(exit.memory)).toEqual(['target']);
    });
  });

  test('puts `low` and `high` under the ends, and `mid` between them', () => {
    const { trace } = search(sorted, 34);
    const mids = trace.filter((step) => step.anchor === 'mid');

    expect(mids.map((step) => step.state.cursors)).toEqual([
      { low: 0, high: 6, mid: 3 },
      { low: 4, high: 6, mid: 5 },
    ]);
    expect(mids.map((step) => step.memory)).toEqual([
      { target: '34', low: '0', high: '6', mid: '3' },
      { target: '34', low: '4', high: '6', mid: '5' },
    ]);
  });

  test('rounds the middle down on an even range', () => {
    const { trace } = search([2, 5, 8, 13, 21, 34], 34);
    const mids = trace.filter((step) => step.anchor === 'mid');

    expect(mids.map((step) => step.memory.mid)).toEqual(['2', '4', '5']);
  });

  test('shares one label between cursors on the same cell', () => {
    const { trace } = search([7], 7);
    const mid = trace.find((step) => step.anchor === 'mid')!;

    expect(mid.state.cursors).toEqual({ 'low high mid': 0 });
  });

  test('draws `high` left of the array once nothing is left on the left', () => {
    const { trace } = search(sorted, 1);
    const last = trace.findLast((step) => step.anchor === 'loop')!;

    expect(last.memory).toEqual({ target: '1', low: '0', high: '-1' });
    expect(last.state.cursors).toEqual({ low: 0, high: -1 });
  });

  test('draws `low` past the end once nothing is left on the right', () => {
    const { trace } = search(sorted, 99);
    const last = trace.findLast((step) => step.anchor === 'loop')!;

    expect(last.state.cursors).toEqual({ low: 7, high: 6 });
  });

  test('marks the cell being compared, and the one found', () => {
    const { trace } = search(sorted, 34);
    const compares = trace.filter((step) => step.anchor === 'compare');
    const found = trace.find((step) => step.anchor === 'found')!;

    expect(compares[0].state.variants[3]).toBe('secondary');
    expect(compares[1].state.variants[5]).toBe('secondary');
    expect(found.state.variants[5]).toBe('success');
    expect(found.state.variants.filter((v) => v === 'primary')).toHaveLength(6);
  });

  describe('dimming', () => {
    test('rules out `low` up to and including the middle going right', () => {
      const { trace } = search(sorted, 34);
      const right = trace.find((step) => step.anchor === 'right')!;

      expect(right.state.opacities).toEqual([0.3, 0.3, 0.3, 0.3, 1, 1, 1]);
      expect(right.state.variants[3]).toBe('primary');
      expect(right.state.cursors).toEqual({ low: 4, high: 6, mid: 3 });
      expect(right.memory.mid).toBe('3');
    });

    test('rules out the middle through `high` going left', () => {
      const { trace } = search(sorted, 5);
      const left = trace.find((step) => step.anchor === 'left')!;

      expect(left.state.opacities).toEqual([1, 1, 1, 0.3, 0.3, 0.3, 0.3]);
    });

    test('keeps what was ruled out dim when the range narrows again', () => {
      const { trace } = search(sorted, 21);
      const left = trace.find((step) => step.anchor === 'left')!;

      expect(left.state.opacities).toEqual([0.3, 0.3, 0.3, 0.3, 1, 0.3, 0.3]);
    });

    test('drops `mid` from scope before the loop is checked again', () => {
      const { trace } = search(sorted, 34);
      const loops = trace.filter((step) => step.anchor === 'loop');

      for (const step of loops) expect(step.memory).not.toHaveProperty('mid');
      for (const step of loops)
        expect(step.state.cursors).not.toHaveProperty('mid');
    });
  });

  describe('when the target is missing', () => {
    test('marks every cell, in full', () => {
      const { trace } = search(sorted, 10);
      const missing = trace.find((step) => step.anchor === 'missing')!;

      expect(missing.state.variants).toEqual(sorted.map(() => 'danger'));
      expect(missing.state.opacities).toEqual(sorted.map(() => 1));
      expect(missing.memory).toEqual({ target: '10', low: '3', high: '2' });
    });
  });

  describe('when the target appears several times', () => {
    test('finds the middle one, not the first', () => {
      const { trace } = search([1, 4, 4, 4, 9], 4);
      const found = trace.find((step) => step.anchor === 'found')!;

      expect(found.memory.mid).toBe('2');
    });
  });

  describe('on an array that is not sorted', () => {
    test('does what the code says, which can miss the target', () => {
      const { trace } = search([9, 1, 5], 9);
      const anchors = trace.map((step) => step.anchor);

      expect(anchors).toContain('missing');
      expect(anchors).not.toContain('found');
    });
  });
});
