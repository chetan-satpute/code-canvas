import type { StructureOperation } from './types.ts';

export type StructureId = 'array';

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
};

export default structures;
