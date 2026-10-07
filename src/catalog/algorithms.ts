import type { StructureId } from './structures.ts';
import type { ArgumentField } from './types.ts';

export interface Algorithm {
  id: string;
  structureId: StructureId;
  title: string;
  description: string;
  args: ArgumentField[];
}

// Ids are the explore route's only parameter, so they carry the structure as
// a prefix to stay unique across structures that share an operation name.
const algorithms: Record<string, Algorithm> = {
  'array-linear-search': {
    id: 'array-linear-search',
    structureId: 'array',
    title: 'Linear Search',
    description:
      'Walks the array from the front, comparing every element until the target turns up or the end is reached.',
    args: [{ name: 'target', placeholder: 'e.g. 42' }],
  },
  'array-binary-search': {
    id: 'array-binary-search',
    structureId: 'array',
    title: 'Binary Search',
    description:
      'Halves a sorted array on every step, discarding the side that cannot hold the target. Sort the array first: an unsorted one can hide the target from it.',
    args: [{ name: 'target', placeholder: 'e.g. 42' }],
  },
  'array-merge-sort': {
    id: 'array-merge-sort',
    structureId: 'array',
    title: 'Merge Sort',
    description:
      'Splits the array down to single elements, then merges the halves back together in order.',
    args: [],
  },
  'array-insert-value': {
    id: 'array-insert-value',
    structureId: 'array',
    title: 'Insert Value',
    description:
      'Makes room at an index by copying every later element one place along, then writes the new value.',
    args: [
      { name: 'index', placeholder: 'e.g. 2', kind: 'integer' },
      { name: 'value', placeholder: 'e.g. 42' },
    ],
  },
  'array-remove-value': {
    id: 'array-remove-value',
    structureId: 'array',
    title: 'Remove Value',
    description:
      'Closes the gap left at an index by copying every later element one place back, then drops the last slot.',
    args: [{ name: 'index', placeholder: 'e.g. 2', kind: 'integer' }],
  },
  'linked-list-insert-head': {
    id: 'linked-list-insert-head',
    structureId: 'linked-list',
    title: 'Insert at Head',
    description:
      'Points a new node at the current head and makes it the head, so the list grows in constant time.',
    args: [{ name: 'value', placeholder: 'e.g. 42' }],
  },
  'binary-search-tree-insert': {
    id: 'binary-search-tree-insert',
    structureId: 'binary-search-tree',
    title: 'Insert Value',
    description:
      'Descends left or right by comparing against each node, and hangs the new node off the first empty slot.',
    args: [{ name: 'value', placeholder: 'e.g. 42' }],
  },
  'binary-search-tree-remove': {
    id: 'binary-search-tree-remove',
    structureId: 'binary-search-tree',
    title: 'Remove Value',
    description:
      'Unlinks a leaf, lifts a lone child into place, or — for a node with two children — replaces it with its inorder successor.',
    args: [{ name: 'value', placeholder: 'e.g. 13' }],
  },
  'max-heap-push': {
    id: 'max-heap-push',
    structureId: 'max-heap',
    title: 'Push',
    description:
      'Appends the value at the end, then swaps it upwards past any smaller parent until the heap order holds.',
    args: [{ name: 'value', placeholder: 'e.g. 42' }],
  },
};

// `Object.hasOwn` keeps ids such as `constructor` from resolving to
// prototype members.
export function findAlgorithm(id: string): Algorithm | undefined {
  return Object.hasOwn(algorithms, id) ? algorithms[id] : undefined;
}

export default algorithms;
