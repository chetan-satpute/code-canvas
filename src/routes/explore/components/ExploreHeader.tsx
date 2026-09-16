import { Link } from '@tanstack/react-router';

import BrandMark from '#components/BrandMark.tsx';
import Button from '#components/Button.tsx';
import Icon from '#components/Icon.tsx';
import useFullscreen from '#hooks/useFullscreen.ts';

// A link rather than a `Button` wrapping one: nesting an anchor inside a
// button is invalid HTML. These reproduce Button's outline variant at size md,
// and cannot come from Button itself, which renders a <button> — its
// `enabled:` variants are dropped here because that pseudo-class never
// matches an anchor.
const catalogLinkClasses =
  'font-en border-border text-foreground hover:border-muted-foreground hover:bg-surface-2 focus-visible:ring-ring/45 focus-visible:ring-offset-background inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold whitespace-nowrap transition duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-offset-2 active:translate-y-px active:scale-[0.98] sm:px-4';

// Same chrome as the home header, minus `sticky`: the explore page is a
// fixed-height flex column whose content scrolls in its own container, so the
// header only has to refuse to shrink.
function ExploreHeader() {
  const { isSupported, isFullscreen, toggle } = useFullscreen();

  return (
    <header className="border-border/60 bg-background/80 z-20 shrink-0 border-b backdrop-blur-md">
      {/* Full width rather than the home header's centred `max-w-6xl`, with
          the padding of the grid below, so the brand lines up with the first
          card. */}
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark />

          <span className="font-en-display text-foreground text-base font-semibold">
            Code Canvas
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Lands on the catalog rather than the hero, since the reader is
              already past the pitch. Below sm only the arrow survives — the
              label is the first thing worth dropping when the brand and the
              fullscreen toggle both have to fit, which is why the link names
              itself instead of relying on that text. */}
          <Link
            to="/"
            hash="catalog"
            aria-label="Pick another algorithm"
            className={catalogLinkClasses}
          >
            <Icon name="arrow-left" size="sm" />

            <span className="hidden sm:inline">Pick another algorithm</span>
          </Link>

          {isSupported && (
            <Button onClick={toggle} variant="outline">
              <Icon
                name={isFullscreen ? 'minimize' : 'maximize'}
                size="sm"
                label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
              />
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default ExploreHeader;
