import type { StructureId } from './structures.ts';

// What the home page lists as coming soon. Nothing here is routable: an
// algorithm moves to `algorithms.ts`, and a structure to `structures.ts`, in
// the change that makes it run, and leaves this file in the same change.

export type PlannedStructureId = 'binary-search-tree' | 'max-heap';

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

export const plannedStructures: PlannedStructure[] = [
  {
    id: 'binary-search-tree',
    title: 'Binary Search Tree',
    description:
      'A tree of nodes kept ordered, so every left child is smaller than its parent and every right child is larger.',
  },
  {
    id: 'max-heap',
    title: 'Max Heap',
    description:
      'A complete binary tree where every node is greater than or equal to its children, so the maximum sits at the root.',
  },
];

export const plannedAlgorithms: PlannedAlgorithm[] = [
  {
    id: 'array-binary-search',
    structureId: 'array',
    title: 'Binary Search',
    description:
      'Halves a sorted array on every step, discarding the side that cannot hold the target.',
  },
  {
    id: 'array-merge-sort',
    structureId: 'array',
    title: 'Merge Sort',
    description:
      'Splits the array down to single elements, then merges the halves back together in order.',
  },
  {
    id: 'array-quick-sort',
    structureId: 'array',
    title: 'Quick Sort',
    description:
      'Partitions the array around a pivot so smaller values fall left and larger right, then sorts each side.',
  },
  {
    id: 'array-insert-value',
    structureId: 'array',
    title: 'Insert Value',
    description:
      'Makes room at an index by copying every later element one place along, then writes the new value.',
  },
  {
    id: 'array-remove-value',
    structureId: 'array',
    title: 'Remove Value',
    description:
      'Closes the gap left at an index by shifting every later element one place back, then drops the last slot.',
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
    id: 'binary-search-tree-insert',
    structureId: 'binary-search-tree',
    title: 'Insert Value',
    description:
      'Descends left or right by comparing against each node, and hangs the new node off the first empty slot.',
  },
  {
    id: 'binary-search-tree-remove',
    structureId: 'binary-search-tree',
    title: 'Remove Value',
    description:
      'Unlinks a leaf, lifts a lone child into place, or — for a node with two children — replaces it with its inorder successor.',
  },
  {
    id: 'max-heap-push',
    structureId: 'max-heap',
    title: 'Push',
    description:
      'Appends the value at the end, then swaps it upwards past any smaller parent until the heap order holds.',
  },
  {
    id: 'max-heap-pop',
    structureId: 'max-heap',
    title: 'Pop',
    description:
      'Moves the last value to the root and removes the old maximum, then sinks the root past its larger child.',
  },
];
