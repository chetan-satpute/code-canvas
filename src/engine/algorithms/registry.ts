import type { AlgorithmRunner } from '../algorithm.ts';
import { arrayBinarySearch } from './array-binary-search.ts';
import { arrayLinearSearch } from './array-linear-search.ts';
import { arrayMergeSort } from './array-merge-sort.ts';
import { binarySearchTreeInsert } from './binary-search-tree-insert.ts';
import { binarySearchTreeRemove } from './binary-search-tree-remove.ts';
import { linkedListInsertHead } from './linked-list-insert-head.ts';
import { maxHeapPush } from './max-heap-push.ts';

// Keyed by the catalog's algorithm ids. An algorithm listed without a runner
// is one the explore page cannot show, the same as one without a listing.
const runners: Record<string, AlgorithmRunner> = {
  'array-binary-search': arrayBinarySearch,
  'array-linear-search': arrayLinearSearch,
  'array-merge-sort': arrayMergeSort,
  'linked-list-insert-head': linkedListInsertHead,
  'binary-search-tree-insert': binarySearchTreeInsert,
  'binary-search-tree-remove': binarySearchTreeRemove,
  'max-heap-push': maxHeapPush,
};

// `Object.hasOwn` keeps ids such as `constructor` from resolving to
// prototype members.
export function findAlgorithmRunner(id: string): AlgorithmRunner | undefined {
  return Object.hasOwn(runners, id) ? runners[id] : undefined;
}
