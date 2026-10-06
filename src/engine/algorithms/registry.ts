import type { AlgorithmRunner } from '../algorithm.ts';
import { arrayLinearSearch } from './array-linear-search.ts';
import { linkedListInsertHead } from './linked-list-insert-head.ts';

// Keyed by the catalog's algorithm ids. An algorithm listed without a runner
// is one the explore page cannot show, the same as one without a listing.
const runners: Record<string, AlgorithmRunner> = {
  'array-linear-search': arrayLinearSearch,
  'linked-list-insert-head': linkedListInsertHead,
};

// `Object.hasOwn` keeps ids such as `constructor` from resolving to
// prototype members.
export function findAlgorithmRunner(id: string): AlgorithmRunner | undefined {
  return Object.hasOwn(runners, id) ? runners[id] : undefined;
}
