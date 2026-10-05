import {
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
  Outlet,
} from '@tanstack/react-router';

import { findAlgorithm } from '#catalog/algorithms.ts';
import structures from '#catalog/structures.ts';
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
  loader: ({ params }) => {
    const algorithm = findAlgorithm(params.algorithmId);

    if (!algorithm) {
      throw notFound();
    }

    return { algorithm, structure: structures[algorithm.structureId] };
  },
  component: ExploreRoute,
  notFoundComponent: AlgorithmNotFound,
});

const routeTree = rootRoute.addChildren([homeRoute, exploreRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
