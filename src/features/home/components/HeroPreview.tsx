import CanvasCard from '#components/CanvasCard.tsx';
import Card from '#components/Card.tsx';
import CodeTokens from '#components/CodeTokens.tsx';
import cn from '#utils/cn.ts';
import type { Listing } from '#utils/code.ts';

import useHeroRun from '../hooks/useHeroRun.ts';

interface HeroPreviewProps {
  title: string;
  listing: Listing;
}

function HeroPreview(props: HeroPreviewProps) {
  const { title, listing } = props;

  const { frames, activeLine, variables } = useHeroRun(listing);

  return (
    <div className="relative">
      {/* Lights the preview from behind, so the page's light seems to come
          from the thing it is showing. */}
      <div
        aria-hidden
        className="bg-sapphire-500/15 pointer-events-none absolute -inset-8 -z-10 rounded-full blur-3xl"
      />

      <div className="flex flex-col gap-3">
        {/* Sized for the array's single row rather than the explore page's
            room for structures a reader grows. */}
        <div className="h-40">
          <CanvasCard frames={frames} />
        </div>

        {/* The code card's look at hero scale, rather than `CodeCard` itself,
            whose title, description and actions slot are sized for the
            explore page. The tokens and the highlight are the real ones. */}
        <Card padded={false}>
          <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-3">
            <span className="font-en-display text-card-foreground text-sm font-semibold">
              {title}
            </span>

            <dl className="font-code flex gap-4 text-xs">
              {variables.map(([name, value]) => (
                <div key={name} className="flex gap-1.5">
                  <dt className="text-muted-foreground">{name}</dt>
                  <dd className="text-accent">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* As in `CodeCard`: the rows carry the end padding, and the listing
              takes its longest line's width, so a scrolled row keeps its
              padding and the active line's marker spans every row. */}
          <div className="overflow-x-auto py-3">
            <ol className="font-code w-min min-w-full text-[13px] leading-6">
              {listing.lines.map((tokens, index) => {
                const isActive = index + 1 === activeLine;

                return (
                  <li
                    key={index}
                    className={cn(
                      'flex gap-4 px-5 transition-colors duration-200',
                      isActive &&
                        'from-accent/20 bg-linear-to-r to-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'w-4 shrink-0 text-right select-none',
                        isActive ? 'text-accent' : 'text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>

                    <code className="text-foreground whitespace-pre">
                      <CodeTokens tokens={tokens} />
                    </code>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default HeroPreview;
