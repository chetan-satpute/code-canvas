import { describe, expect, test } from 'vitest';

import listing from '#catalog/listings/array-linear-search.md?highlight';

import { arrayLinearSearch } from './algorithms/array-linear-search.ts';
import { CoreBoard } from './board.ts';
import { CoreArray } from './structures/array/structure.ts';
import { CoreLinkedList } from './structures/linked-list/structure.ts';

describe('algorithm runner', () => {
  test('refuses a structure of another kind', () => {
    expect(() =>
      arrayLinearSearch(
        new CoreBoard(),
        new CoreLinkedList([8]),
        listing.anchors,
        { target: 8 },
      ),
    ).toThrow('The array algorithm was given another structure');
  });

  test('refuses arguments that lack one the algorithm reads', () => {
    expect(() =>
      arrayLinearSearch(
        new CoreBoard(),
        new CoreArray([8]),
        listing.anchors,
        {},
      ),
    ).toThrow('The array algorithm is missing arguments: target');
  });

  test('refuses to step to a line the listing does not name', () => {
    const run = arrayLinearSearch(
      new CoreBoard(),
      new CoreArray([8]),
      {},
      { target: 8 },
    );

    expect(() => run.next()).toThrow("The listing has no line named 'enter'");
  });
});
