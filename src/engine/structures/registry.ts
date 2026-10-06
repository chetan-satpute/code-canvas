import type { StructureId } from '#catalog/structures.ts';

import type { OperationRunner } from '../operation.ts';
import type { CoreStructure } from '../structure.ts';
import { arrayOperations, randomArrayValues } from './array/operations.ts';
import { CoreArray } from './array/structure.ts';

interface StructureEngine {
  create: () => CoreStructure;
  // Keyed by the catalog's operation ids.
  operations: Record<string, OperationRunner>;
}

// Keyed by `StructureId`, so a structure the catalog lists without an engine
// is a type error rather than a dead canvas.
const engines: Record<StructureId, StructureEngine> = {
  array: {
    create: () => {
      const array = new CoreArray(randomArrayValues());

      // Named on creation rather than by the algorithm that reads it, so the
      // label is there from the first paint instead of appearing when a run
      // starts. The listings call it `array`.
      array.name = 'array';

      return array;
    },
    operations: arrayOperations,
  },
};

export default engines;
