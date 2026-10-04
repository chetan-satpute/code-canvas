import { Link } from '@tanstack/react-router';

import Button from '#components/Button.tsx';
import Icon from '#components/Icon.tsx';
import useFullscreen from '#features/explore/hooks/useFullscreen.ts';

// A link rather than a `Button` wrapping one: nesting an anchor inside a
// button is invalid HTML. These reproduce Button's outline variant at size md,
// and cannot come from Button itself, which renders a <button> — its
// `enabled:` variants are dropped here because that pseudo-class never
// matches an anchor.
const homeLinkClasses =
  'col-start-1 row-start-1 justify-self-start font-en border-border text-foreground hover:border-muted-foreground hover:bg-surface-2 focus-visible:ring-ring/45 focus-visible:ring-offset-background inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold whitespace-nowrap transition duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-offset-2 active:translate-y-px active:scale-98 sm:px-4';

// Scrolls away with the page wherever the document scrolls, leaving the
// visualization the whole viewport. `shrink-0` keeps the fixed-height lg
// column from squeezing it.
function ExploreHeader() {
  const { isSupported, isFullscreen, toggle } = useFullscreen();

  return (
    <header className="border-border/60 shrink-0 border-b">
      {/* The padding matches the layout below, so the wordmark lines up with
          the first card.

          Below sm both controls are icons, laid out as an app bar: back arrow,
          centred wordmark, fullscreen. The equal outer columns keep the
          wordmark centred even when fullscreen is unsupported and its cell is
          empty. The cells are placed explicitly so the DOM stays in the sm+
          order — wordmark, then controls — and tab order follows it there. */}
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:flex sm:gap-3 sm:px-6">
        <Link
          to="/"
          className="font-en-display text-foreground col-start-2 row-start-1 text-base font-semibold sm:mr-auto"
        >
          Code Canvas
        </Link>

        {/* Below sm only the arrow survives, so the link names itself instead
            of relying on the hidden text. */}
        <Link
          to="/"
          aria-label="Pick another algorithm"
          className={homeLinkClasses}
        >
          <Icon name="arrow-left" />

          <span className="hidden sm:inline">Pick another algorithm</span>
        </Link>

        {isSupported && (
          <div className="col-start-3 row-start-1 justify-self-end">
            <Button onClick={toggle} variant="outline">
              <Icon
                name={isFullscreen ? 'minimize' : 'maximize'}
                label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
              />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default ExploreHeader;
