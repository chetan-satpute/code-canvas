import { describe, expect, test } from 'vitest';

import structures from '#catalog/structures.ts';

import { seedRandom } from '../testing/random.ts';
import engines from './registry.ts';

// The catalog and the engines are joined only by id and by argument name, so
// a mismatch would otherwise surface on the structure card.
describe('structure registry', () => {
  describe.each(Object.values(structures))('$id', ({ id, operations }) => {
    test.each(operations)(
      'applies $id given the arguments the catalog declares',
      ({ id: operationId, args }) => {
        seedRandom(42);

        const operation = engines[id].operations[operationId];
        const values = Object.fromEntries(args.map(({ name }) => [name, 1]));

        expect(operation).toBeDefined();
        expect(() => operation(engines[id].create(), values)).not.toThrow();
      },
    );
  });
});
