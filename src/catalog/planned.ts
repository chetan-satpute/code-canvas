import type { StructureId } from './structures.ts';

// What the home page lists as coming soon. Nothing here is routable: an
// algorithm moves to `algorithms.ts`, and a structure to `structures.ts`, in
// the change that makes it run, and leaves this file in the same change.

// Empty for now: every structure planned so far runs.
export type PlannedStructureId = never;

export interface PlannedStructure {
  id: PlannedStructureId;
  title: string;
  description: string;
}

export interface PlannedAlgorithm {
  id: string;
  structureId: StructureId | PlannedStructureId;
  title: string;
  description: string;
}

export const plannedStructures: PlannedStructure[] = [];

export const plannedAlgorithms: PlannedAlgorithm[] = [
  {
    id: 'array-quick-sort',
    structureId: 'array',
    title: 'Quick Sort',
    description:
      'Partitions the array around a pivot so smaller values fall left and larger right, then sorts each side.',
  },
  {
    id: 'linked-list-insert-after',
    structureId: 'linked-list',
    title: 'Insert after Target',
    description:
      'Follows the chain to the node holding the target, then splices a new node in behind it.',
  },
  {
    id: 'linked-list-remove',
    structureId: 'linked-list',
    title: 'Remove',
    description:
      'Keeps a reference to the previous node while scanning, so the match can be unlinked by pointing past it.',
  },
  {
    id: 'max-heap-pop',
    structureId: 'max-heap',
    title: 'Pop',
    description:
      'Moves the last value to the root and removes the old maximum, then sinks the root past its larger child.',
  },
];
