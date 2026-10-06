import type { Listing } from '#utils/code.ts';
import logger from '#utils/logger.ts';

// Keyed by path, so a listing is found by naming its file after the algorithm
// id. Each one is its own chunk, fetched only when its explore page loads.
const loaders = import.meta.glob<Listing>('./listings/*.md', {
  query: '?highlight',
  import: 'default',
});

// Undefined when the catalog lists an algorithm with no listing file, which
// the explore page treats as an algorithm it cannot show.
export async function loadListing(id: string): Promise<Listing | undefined> {
  const load = loaders[`./listings/${id}.md`];

  if (!load) {
    logger.error(`No listing for algorithm '${id}'`);
    return undefined;
  }

  return load();
}
