import { Link } from '@tanstack/react-router';

import Icon from '#components/Icon.tsx';
import cn from '#utils/cn.ts';

import { repositoryUrl } from '../utils/links.ts';

// Carries no display utility: each link picks its own, because a `display`
// set here would fight the `hidden` a link adds, and between two plain
// utilities the winner is whichever Tailwind emits later.
const navLinkClasses =
  'font-en text-muted-foreground hover:text-foreground focus-visible:ring-ring/45 focus-visible:ring-offset-background items-center gap-1.5 rounded-md text-sm transition duration-150 outline-none focus-visible:ring-3 focus-visible:ring-offset-2';

function HomeHeader() {
  return (
    <header className="border-border/60 shrink-0 border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link
          to="/"
          className="font-en-display text-foreground text-base font-semibold"
        >
          Code Canvas
        </Link>

        {/* The in-page links drop below md, where they would crowd the
            wordmark and the page is a short scroll anyway. */}
        <nav className="flex items-center gap-6">
          <a
            href="#algorithms"
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
