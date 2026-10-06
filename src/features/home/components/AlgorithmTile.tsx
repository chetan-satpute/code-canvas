import { Link } from '@tanstack/react-router';

import Icon from '#components/Icon.tsx';

import type { CatalogAlgorithm } from '../utils/catalog.ts';

interface AlgorithmTileProps {
  algorithm: CatalogAlgorithm;
}

function AlgorithmTile(props: AlgorithmTileProps) {
  const { algorithm } = props;

  if (!algorithm.ready) {
    // Dashed and unlit, and not a link: there is nothing to open yet.
    return (
      <div className="border-border flex h-full flex-col rounded-xl border border-dashed p-5">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-en-display text-foreground/70 text-base font-semibold">
            {algorithm.title}
          </h4>

          <span className="font-code text-muted-foreground border-border shrink-0 rounded-full border px-2 py-0.5 text-[11px]">
            Coming soon
          </span>
        </div>

        <p className="font-en text-muted-foreground/80 mt-2 text-sm leading-relaxed">
          {algorithm.description}
        </p>
      </div>
    );
  }

  return (
    <Link
      to="/$algorithmId"
      params={{ algorithmId: algorithm.id }}
      className="group bg-card to-card border-border hover:border-accent/60 focus-visible:ring-ring/45 focus-visible:ring-offset-background flex h-full flex-col rounded-xl border bg-linear-to-br from-indigo-900/50 p-5 transition duration-150 outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-en-display text-card-foreground group-hover:text-accent text-base font-semibold transition duration-150">
          {algorithm.title}
        </h4>

        <span className="text-muted-foreground group-hover:text-accent mt-1 transition duration-150 group-hover:translate-x-0.5">
          <Icon name="arrow-right" />
        </span>
      </div>

      <p className="font-en text-muted-foreground mt-2 text-sm leading-relaxed">
        {algorithm.description}
      </p>
    </Link>
  );
}

export default AlgorithmTile;
