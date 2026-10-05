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
};

// `Object.hasOwn` keeps ids such as `constructor` from resolving to
// prototype members.
export function findAlgorithm(id: string): Algorithm | undefined {
  return Object.hasOwn(algorithms, id) ? algorithms[id] : undefined;
}

export default algorithms;
