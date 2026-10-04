import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';

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
  component: ExploreRoute,
});

const routeTree = rootRoute.addChildren([homeRoute, exploreRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
