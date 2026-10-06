import type { ErrorComponentProps } from '@tanstack/react-router';
import { useEffect } from 'react';

import Button from '#components/Button.tsx';
import logger from '#utils/logger.ts';

import ExploreHeader from './ExploreHeader.tsx';

// The explore page's data includes the algorithm's listing chunk, so it can
// fail to load — most often in a tab opened before a deploy, asking for a
// chunk the new build no longer has. Reloading fetches the new build, whose
// pages name the chunks that now exist, so it is the one useful action.
function AlgorithmLoadError(props: ErrorComponentProps) {
  const { error } = props;

  useEffect(() => {
    logger.error('Failed to load the explore page', error);
  }, [error]);

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <ExploreHeader />

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-en-display text-xl font-semibold">
            Algorithm failed to load
          </h1>

          <p className="text-muted-foreground font-en max-w-md text-sm leading-relaxed">
            Code Canvas may have been updated since this page opened.
          </p>
        </div>

        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </main>
    </div>
  );
}

export default AlgorithmLoadError;
