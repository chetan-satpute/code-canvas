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
];
