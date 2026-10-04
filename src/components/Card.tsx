import type { PropsWithChildren } from 'react';

import cn from '#utils/cn.ts';

interface CardProps extends PropsWithChildren {
  title?: string;
  description?: string;
  padded?: boolean;
}

function Card(props: CardProps) {
  const { children, title, description, padded = true } = props;

  // `h-full` lets a parent give the card a height (a grid row, an aspect
  // ratio); in an auto-height parent it resolves to the content height.
  const containerClasses =
    'bg-card border-border flex h-full min-h-0 flex-col overflow-hidden rounded-xl border';

  const bodyClasses = cn('min-h-0 flex-1', padded && 'p-5');

  return (
    <div className={containerClasses}>
      {title && (
        <div className="border-border shrink-0 border-b px-5 py-4">
          <h2 className="text-card-foreground font-en-display text-base font-semibold">
            {title}
          </h2>

          {description && (
            <p className="text-muted-foreground font-en mt-1 text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      <div className={bodyClasses}>{children}</div>
    </div>
  );
}

export default Card;
