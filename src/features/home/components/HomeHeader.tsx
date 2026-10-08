import { Link } from '@tanstack/react-router';

import Icon from '#components/Icon.tsx';

import { repositoryUrl } from '../utils/links.ts';

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

        <a
          href={repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-en text-muted-foreground hover:text-foreground focus-visible:ring-ring/45 focus-visible:ring-offset-background inline-flex items-center gap-1.5 rounded-md text-sm transition duration-150 outline-none focus-visible:ring-3 focus-visible:ring-offset-2"
        >
          GitHub
          <Icon name="external-link" />
        </a>
      </div>
    </header>
  );
}

export default HomeHeader;
