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
import AlgorithmLoadError from '#features/explore/components/AlgorithmLoadError.tsx';
import AlgorithmNotFound from '#features/explore/components/AlgorithmNotFound.tsx';
import ExploreRoute from '#features/explore/ExploreRoute.tsx';
import HomeRoute from '#features/home/HomeRoute.tsx';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
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

    const listing = await loadListing(algorithm.id);

    if (!listing) {
      throw notFound();
    }

    return { algorithm, structure: structures[algorithm.structureId], listing };
  },
  component: ExploreRoute,
  notFoundComponent: AlgorithmNotFound,
  errorComponent: AlgorithmLoadError,
});

const routeTree = rootRoute.addChildren([homeRoute, exploreRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
