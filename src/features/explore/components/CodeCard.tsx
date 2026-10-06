import { type ReactNode, useEffect, useRef } from 'react';

import Card from '#components/Card.tsx';
import CodeTokens from '#components/CodeTokens.tsx';
import cn from '#utils/cn.ts';
import type { CodeLine } from '#utils/code.ts';

interface CodeCardProps {
  title: string;
  description: string;
  lines: CodeLine[];
  // The line the run is currently on, numbered from 1 as the gutter is.
  // Absent outside a run, when no line is current.
  activeLine?: number;
  actions: ReactNode;
}

function CodeCard(props: CodeCardProps) {
  const { title, description, lines, activeLine, actions } = props;

  const scroller = useRef<HTMLDivElement>(null);
  const activeRow = useRef<HTMLLIElement>(null);

  // A listing is usually taller than the card, so stepping would otherwise
  // walk the highlight off screen. This scrolls by as little as it takes, and
  // not at all while the line is in view. `scrollIntoView` would do the same
  // but also scroll every scrolling ancestor — below lg that is the page,
  // which would pull the canvas away from someone watching it.
  useEffect(() => {
    const container = scroller.current;
    const row = activeRow.current;
    if (!container || !row) return;

    const box = container.getBoundingClientRect();
    const { top, bottom } = row.getBoundingClientRect();

    if (top < box.top) container.scrollTop -= box.top - top;
    else if (bottom > box.bottom) container.scrollTop += bottom - box.bottom;
  }, [activeLine, lines]);

  return (
    <Card title={title} description={description} padded={false}>
      <div className="flex h-full flex-col">
        <div className="border-border shrink-0 border-b">{actions}</div>

        {/* Capped below lg, where the card is in page flow, so the panels
            under it stay a short scroll away.

            Only the vertical padding sits here: a scroll container's end
            padding is not part of what it scrolls, so padding-right would
            disappear the moment a long line was scrolled to. The rows carry it
            instead, and the listing takes the width of its longest line —
            floored at the container's — so every row, and the active line's
            marker, is as wide as the widest one. */}
        <div
          ref={scroller}
          className="min-h-0 flex-1 overflow-auto py-5 max-lg:max-h-96"
        >
          <ol className="font-code w-min min-w-full text-sm leading-6">
            {lines.map((tokens, index) => {
              const isActive = index + 1 === activeLine;

              return (
                <li
                  key={index}
                  ref={isActive ? activeRow : null}
                  className={cn(
                    'flex gap-4 px-5',
                    // Fading out rather than filling the row keeps the marker
                    // clear of the code, which carries colors of its own.
                    isActive && 'from-accent/20 bg-linear-to-r to-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'w-6 shrink-0 text-right select-none',
                      isActive ? 'text-accent' : 'text-muted-foreground',
                    )}
                  >
                    {index + 1}
                  </span>

                  {/* Shows through wherever the theme colors nothing. */}
                  <code className="text-foreground whitespace-pre">
                    <CodeTokens tokens={tokens} />
                  </code>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Card>
  );
}

export default CodeCard;
