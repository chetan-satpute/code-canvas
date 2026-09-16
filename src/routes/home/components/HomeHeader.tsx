import { Link } from '@tanstack/react-router';

import BrandMark from '#components/BrandMark.tsx';
import Icon from '#components/Icon.tsx';
import cn from '#utils/cn.ts';

const repositoryUrl = 'https://github.com/chetan-satpute/code-canvas';

// Deliberately carries no display utility: each link picks its own, because a
// `display` set here would outrank the `hidden` a call site adds — between two
// plain utilities the winner is whichever Tailwind emits later, and it emits
// `inline-flex` after `hidden`.
const navLinkClasses =
  'font-en text-muted-foreground hover:text-foreground focus-visible:ring-ring/45 focus-visible:ring-offset-background items-center gap-1.5 rounded-md text-sm transition duration-150 outline-none focus-visible:ring-3 focus-visible:ring-offset-2';

function HomeHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-20 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark />

          <span className="font-en-display text-foreground text-base font-semibold">
            Code Canvas
          </span>
        </Link>

        {/* The in-page links drop below md. They are the only nav worth
            losing on a small screen — the page is a short scroll there
            anyway — and keeping them would crowd the brand against GitHub. */}
        <nav className="flex items-center gap-5 sm:gap-7">
          <a
            href="#catalog"
            className={cn(navLinkClasses, 'hidden md:inline-flex')}
          >
            Algorithms
          </a>

          <a
            href="#how-it-works"
            className={cn(navLinkClasses, 'hidden md:inline-flex')}
          >
            How it works
          </a>

          <a
            href={repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(navLinkClasses, 'inline-flex')}
          >
            GitHub
            <Icon name="external-link" />
          </a>
        </nav>
      </div>
    </header>
  );
}

export default HomeHeader;
