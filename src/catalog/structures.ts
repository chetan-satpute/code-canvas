import type { StructureOperation } from './types.ts';

export type StructureId = 'array' | 'linked-list';

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
};

export default structures;
