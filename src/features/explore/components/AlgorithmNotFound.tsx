import { useParams } from '@tanstack/react-router';

import ExploreHeader from './ExploreHeader.tsx';

function AlgorithmNotFound() {
  const { algorithmId } = useParams({ from: '/$algorithmId' });

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <ExploreHeader />

      <main className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center sm:p-6">
        <h1 className="font-en-display text-xl font-semibold">
          Algorithm not available
        </h1>

        <p className="text-muted-foreground font-en max-w-md text-sm leading-relaxed break-words">
          Code Canvas doesn&apos;t cover{' '}
          <span className="font-code text-foreground">{algorithmId}</span>.
        </p>
      </main>
    </div>
  );
}

export default AlgorithmNotFound;
