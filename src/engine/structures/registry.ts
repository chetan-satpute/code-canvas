import type { StructureId } from '#catalog/structures.ts';

import type { OperationRunner } from '../operation.ts';
import type { CoreStructure } from '../structure.ts';
import { arrayOperations, randomArrayValues } from './array/operations.ts';
import { CoreArray } from './array/structure.ts';
import {
  binarySearchTreeOperations,
  randomBinarySearchTreeValues,
} from './binary-search-tree/operations.ts';
import { CoreBinarySearchTree } from './binary-search-tree/structure.ts';
import {
  linkedListOperations,
  randomLinkedListValues,
} from './linked-list/operations.ts';
import { CoreLinkedList } from './linked-list/structure.ts';

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
  'linked-list': {
    create: () => {
      const list = new CoreLinkedList(randomLinkedListValues());
      list.name = 'list';

      return list;
    },
    operations: linkedListOperations,
  },
  'binary-search-tree': {
    create: () => {
      const tree = new CoreBinarySearchTree(randomBinarySearchTreeValues());
      tree.name = 'tree';

      return tree;
    },
    operations: binarySearchTreeOperations,
  },
};

export default engines;
