import type { AlgorithmRunner } from '../algorithm.ts';
import { arrayLinearSearch } from './array-linear-search.ts';

// Keyed by the catalog's algorithm ids. An algorithm listed without a runner
// is one the explore page cannot show, the same as one without a listing.
const runners: Record<string, AlgorithmRunner> = {
  'array-linear-search': arrayLinearSearch,
};

// `Object.hasOwn` keeps ids such as `constructor` from resolving to
// prototype members.
export function findAlgorithmRunner(id: string): AlgorithmRunner | undefined {
  return Object.hasOwn(runners, id) ? runners[id] : undefined;
}
