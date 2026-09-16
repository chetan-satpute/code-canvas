import { registerSW } from 'virtual:pwa-register';

import logger from './logger.ts';

// An open tab re-fetches the worker script only when it navigates, which for a
// single-page app can be never, so a redeploy would go unnoticed until the
// visitor reloaded by hand.
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

// Set once the new build has taken over and the reload is only waiting for the
// tab to go into the background. It keeps a second update from queueing a
// second reload behind the first.
let reloadPending = false;

// The one place the app talks to the service worker. Everything about how an
// update is picked up is decided here; see docs/pwa.md.
export function registerServiceWorker() {
  registerSW({
    onRegisteredSW: (_url, registration) => {
      if (!registration) return;

      const check = () => void registration.update();

      setInterval(check, UPDATE_CHECK_INTERVAL);

      // A tab that sat in the background all day is the one most likely to be
      // stale the moment it is looked at again.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },

    onNeedReload: () => {
      logger.info(
        'A new version is ready and will load when this tab is in the background.',
      );
      reloadWhenHidden();
    },

    onRegisterError: (error) => {
      logger.error('Service worker registration failed.', error);
    },
  });
}

// By the time this runs the new worker is already serving; only the scripts
// this page started with are from the old build. Reloading immediately would
// throw away a structure the visitor has built and a run in progress, so the
// reload waits until they are looking somewhere else.
function reloadWhenHidden() {
  if (reloadPending) return;

  reloadPending = true;

  if (document.visibilityState === 'hidden') {
    window.location.reload();
    return;
  }

  const reloadIfHidden = () => {
    if (document.visibilityState !== 'hidden') return;

    document.removeEventListener('visibilitychange', reloadIfHidden);
    window.location.reload();
  };

  document.addEventListener('visibilitychange', reloadIfHidden);
}
