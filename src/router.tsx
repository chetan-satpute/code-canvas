import {
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
  Outlet,
} from '@tanstack/react-router';

import { findAlgorithm } from '#catalog/algorithms.ts';
import { loadListing } from '#catalog/listings.ts';
import structures from '#catalog/structures.ts';
import { findAlgorithmRunner } from '#engine/algorithms/registry.ts';
import AlgorithmLoadError from '#features/explore/components/AlgorithmLoadError.tsx';
import AlgorithmNotFound from '#features/explore/components/AlgorithmNotFound.tsx';
import ExploreRoute from '#features/explore/ExploreRoute.tsx';
import HomeRoute from '#features/home/HomeRoute.tsx';
import { loadHero } from '#features/home/utils/hero.ts';
import logger from '#utils/logger.ts';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: loadHero,
  component: HomeRoute,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$algorithmId',
  loader: async ({ params }) => {
    const algorithm = findAlgorithm(params.algorithmId);

    if (!algorithm) {
      throw notFound();
    }

    const runner = findAlgorithmRunner(algorithm.id);

    if (!runner) {
      logger.error(`No runner for algorithm '${algorithm.id}'`);
      throw notFound();
    }

    const listing = await loadListing(algorithm.id);

    if (!listing) {
      throw notFound();
    }

    return {
      algorithm,
      structure: structures[algorithm.structureId],
      listing,
      runner,
    };
  },
  component: ExploreRoute,
  notFoundComponent: AlgorithmNotFound,
  errorComponent: AlgorithmLoadError,
});

const routeTree = rootRoute.addChildren([homeRoute, exploreRoute]);

export const router = createRouter({
  routeTree,
  // The page change between home and explore is animated in index.css.
  defaultViewTransition: true,
  // An algorithm's listing and code load on demand, so starting on hover
  // lets the transition begin the moment the link is clicked.
  defaultPreload: 'intent',
  // Home returns to where the reader left it, whether they come back with the
  // browser or with "Pick another algorithm". Home is keyed by its path
  // rather than by history entry, so that link, which opens a new entry, finds
  // the position too. Other pages keep the router's per-entry key, so a fresh
  // visit opens at the top. Not a `scrollRestoration` predicate limiting this
  // to home: a page it excludes also skips the router's reset to the top.
  scrollRestoration: true,
  getScrollRestorationKey: (location) =>
    location.pathname === '/'
      ? location.pathname
      : (location.state.__TSR_key ?? location.href),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
