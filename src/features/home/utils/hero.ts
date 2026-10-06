import { findAlgorithm } from '#catalog/algorithms.ts';
import { loadListing } from '#catalog/listings.ts';
import logger from '#utils/logger.ts';

// The hero plays this one algorithm end to end, and its call to action opens
// it. Curated rather than derived from the catalog: `useHeroRun` drives this
// algorithm's runner with values and a target chosen for it.
const heroAlgorithmId = 'array-linear-search';

// Null when the algorithm or its listing is missing, or the listing's chunk
// fails to load (a tab opened before a deploy), which leaves the home page
// without a demo rather than without a page.
export async function loadHero() {
  const algorithm = findAlgorithm(heroAlgorithmId);
  let listing;

  try {
    listing = algorithm && (await loadListing(algorithm.id));
  } catch (error) {
    logger.error(`The hero's listing failed to load`, error);
  }

  if (!algorithm || !listing) {
    logger.error(`The hero cannot show '${heroAlgorithmId}'`);
    return null;
  }

  return { algorithm, listing };
}
