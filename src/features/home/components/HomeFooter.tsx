import Icon from '#components/Icon.tsx';

import { repositoryUrl } from '../utils/links.ts';

function HomeFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="text-muted-foreground font-en mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row sm:px-6 lg:px-10">
        <span>© 2026 Chetan Satpute</span>

        <a
          href={repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground focus-visible:ring-ring/45 focus-visible:ring-offset-background inline-flex items-center gap-1.5 rounded-md transition duration-150 outline-none focus-visible:ring-3 focus-visible:ring-offset-2"
        >
          Source on GitHub
          <Icon name="external-link" />
        </a>
      </div>
    </footer>
  );
}

export default HomeFooter;
