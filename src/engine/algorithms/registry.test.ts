import { describe, expect, test } from 'vitest';

import algorithms from '#catalog/algorithms.ts';
import { loadListing } from '#catalog/listings.ts';

import { CoreBoard } from '../board.ts';
import engines from '../structures/registry.ts';
import { seedRandom } from '../testing/random.ts';
import { traceRun } from '../testing/trace.ts';
import { findAlgorithmRunner } from './registry.ts';

// The catalog, the runners and the listings are joined only by id and by
// argument name, so a mismatch would otherwise surface on the explore page.
describe('algorithm registry', () => {
  describe.each(Object.values(algorithms))(
    '$id',
    ({ id, structureId, args }) => {
      test('has a runner and a listing', async () => {
        expect(findAlgorithmRunner(id)).toBeDefined();
        expect(await loadListing(id)).toBeDefined();
      });

      test('runs to its end given the arguments the catalog declares', async () => {
        seedRandom(42);

        const runner = findAlgorithmRunner(id)!;
        const { anchors } = (await loadListing(id))!;

        const board = new CoreBoard();
        const structure = engines[structureId].create();
        board.add(structure);

        const values = Object.fromEntries(args.map(({ name }) => [name, 1]));
        const trace = traceRun(
          runner(board, structure, anchors, values),
          anchors,
          () => null,
        );

        expect(trace.at(-1)!.anchor).toBe('exit');
      });
    },
  );
});
