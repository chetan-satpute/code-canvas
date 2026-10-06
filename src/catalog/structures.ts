import type { StructureOperation } from './types.ts';

export type StructureId =
  'array' | 'linked-list' | 'binary-search-tree' | 'max-heap';

export interface Structure {
  id: StructureId;
  title: string;
  description: string;
  operations: StructureOperation[];
}

const structures: Record<StructureId, Structure> = {
  array: {
    id: 'array',
    title: 'Array',
    description:
      'A fixed-size collection of elements stored in order, where each element is reached directly by its index.',
    operations: [
      { id: 'randomize', label: 'Randomize', args: [] },
      { id: 'sort', label: 'Sort', args: [] },
      {
        id: 'insert',
        label: 'Insert',
        args: [
          { name: 'index', placeholder: 'e.g. 2', kind: 'integer' },
          { name: 'value', placeholder: 'e.g. 42' },
        ],
      },
      {
        id: 'remove',
        label: 'Remove',
        args: [{ name: 'index', placeholder: 'e.g. 2', kind: 'integer' }],
      },
    ],
  },
  'linked-list': {
    id: 'linked-list',
    title: 'Linked List',
    description:
      'A linear chain of nodes, where each node holds a value and a reference to the next node in the sequence.',
    operations: [
      { id: 'randomize', label: 'Randomize', args: [] },
      {
        id: 'insert-head',
        label: 'Insert at head',
        args: [{ name: 'value', placeholder: 'e.g. 42' }],
      },
      {
        id: 'insert-after',
        label: 'Insert after',
        args: [
          { name: 'target', placeholder: 'e.g. 13' },
          { name: 'value', placeholder: 'e.g. 42' },
        ],
      },
      {
        id: 'remove',
        label: 'Remove',
        args: [{ name: 'target', placeholder: 'e.g. 13' }],
      },
    ],
  },
  'binary-search-tree': {
    id: 'binary-search-tree',
    title: 'Binary Search Tree',
    description:
      'A tree of nodes kept ordered, so every left child is smaller than its parent and every right child is larger.',
    operations: [
      { id: 'randomize', label: 'Randomize', args: [] },
      {
        id: 'insert',
        label: 'Insert',
        args: [{ name: 'value', placeholder: 'e.g. 42' }],
      },
      {
        id: 'remove',
        label: 'Remove',
        args: [{ name: 'value', placeholder: 'e.g. 13' }],
      },
    ],
  },
  'max-heap': {
    id: 'max-heap',
    title: 'Max Heap',
    description:
      'A complete binary tree where every node is greater than or equal to its children, so the maximum sits at the root.',
    operations: [
      { id: 'randomize', label: 'Randomize', args: [] },
      {
        id: 'push',
        label: 'Push',
        args: [{ name: 'value', placeholder: 'e.g. 42' }],
      },
      { id: 'pop', label: 'Pop', args: [] },
    ],
  },
};

export default structures;
