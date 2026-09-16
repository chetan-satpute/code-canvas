# The progressive web app, and how a redeployment reaches a visitor

Code Canvas is installable and works offline, and a visitor who already has it
open picks up a new deployment without being told to refresh. This document
describes the three pieces that produce that — the manifest, the generated
service worker, and the registration code — and the one thing the hosting has
to get right for any of it to work.

## The manifest

`public/manifest.json` is hand-written and linked from `index.html`. It is
not generated: its icon set is the output of the process described in
[icon.md](icon.md), and regenerating it from a plugin config would put those
files' names in two places. `vite-plugin-pwa` is therefore configured with
`manifest: false` — it builds a service worker and nothing else.

Beyond the icons it declares `display: standalone`, the dark `theme_color` and
`background_color` the app already uses, `start_url: "/"`, `scope: "/"` and
`id: "/"`. The `id` is what a browser uses to decide whether an installed copy
is the same app as the one being served; pinning it means a later change to
`start_url` cannot orphan an existing installation.

## The service worker

The worker is generated at build time by `vite-plugin-pwa` in its `generateSW`
mode, configured in `vite.config.ts`. Three parts of that configuration carry
weight:

**The precache manifest** lists the hashed build output plus everything copied
from `public/`, which is what makes the app work with no network. The glob
names `manifest.json` on its own because `.json` is not one of Workbox's
default extensions, and putting `json` in the brace list would precache every
other JSON file the build happens to emit. The manifest has to be in there: it
is the one file a browser re-fetches when deciding whether an installed app has
changed.

**`navigateFallback: '/index.html'`** exists because every route is served by
the same document. Without it a cold offline visit to `/array-linear-search`
would find nothing in the cache under that URL and fail, even though the
document that renders it is sitting right there.

**`cleanupOutdatedCaches: true`** deletes the precache of every previous
deployment as the new worker activates. Without it, each deploy leaves its
whole precache behind forever.

Google Fonts are handled by two runtime caching rules rather than precaching,
since their URLs are not known at build time: the stylesheet from
`fonts.googleapis.com` is stale-while-revalidate, and the font files from
`fonts.gstatic.com` are cache-first for a year. The font rule accepts a status
of `0` because cross-origin font responses are opaque. This matters more here
than in most apps — text drawn into a canvas is rasterized once, so
`useFontsReady` exists precisely to repaint when the real faces arrive, and an
offline visit with no cached fonts would draw the whole visualization in a
fallback face.

## How an update is picked up

`registerType: 'autoUpdate'` means the generated worker calls `skipWaiting` and
`clientsClaim`: a new deployment's worker installs, activates and takes over
open pages on its own, with no prompt and nothing for the visitor to clear.
That is the whole answer for a visitor who arrives after the deploy.

A tab that was already open is the harder case, and `src/utils/serviceWorker.ts`
is where it is decided. That file is the only place in the app that talks to the
service worker; nothing else imports `virtual:pwa-register`.

**Finding the update.** A browser re-fetches the worker script when the page
navigates, which in a single-page app can be never. So the registration is
polled: `registration.update()` runs once an hour, and again whenever the tab
becomes visible, on the theory that a tab that sat in the background all day is
the one most likely to be stale the moment someone looks at it again.

**Applying it.** By the time the new worker has activated, it is already serving
every request — but the page's own scripts are still the ones it started with,
so the tab is running the old build against the new cache until it reloads.
The plugin's default is to reload immediately. Code Canvas does not, because
the page holds a structure the visitor may have spent a minute building and a
run that may be mid-animation, none of which survives a reload and none of which
is persisted anywhere. Instead `onNeedReload` defers: if the tab is already
hidden it reloads at once, and otherwise it waits for the next time the tab goes
into the background. The visitor sees the new build the next time they look at
the tab, and never sees their work vanish while they are watching it.

The cost of that choice is honest: a tab that stays in the foreground for hours
keeps rendering the old build. It is running against the new precache, which is
fine — the old document and the old bundles are still in it until the next
activation cleans them out — but it will not show new work until it is
backgrounded or reloaded.

## What the hosting must do

All of the above depends on the browser being able to see that `sw.js` has
changed. `sw.js` and `index.html` must be served with a no-cache or very short
`Cache-Control`; everything under `assets/` is content-hashed and should be
served immutable. If a CDN serves a stale `sw.js`, no amount of polling helps —
the poll fetches the same bytes and concludes there is nothing new. This is the
single most common way a PWA appears to stop updating, and it is a hosting
setting, not a code change.

There is no deployment configuration in this repository yet. Whatever host is
chosen, these headers are the requirement to check against it.

## Verifying a change here

`pnpm build` prints the worker's mode and precache entry count, which catches a
glob that stopped matching. The update path itself is only observable in a real
browser, against `pnpm preview` rather than `pnpm dev` — the worker is not
generated in development:

1. Load the preview and confirm in DevTools → Application → Service Workers
   that `sw.js` is activated and controlling the page.
2. Edit something visible, rebuild while the tab stays open, and wait for the
   hourly poll or call `navigator.serviceWorker.getRegistrations()` and
   `update()` from the console to force it.
3. The console logs that a new version is ready. The page must _not_ change.
4. Switch to another tab and back. The page is now the new build.
