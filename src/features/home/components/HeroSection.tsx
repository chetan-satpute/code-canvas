import { Link } from '@tanstack/react-router';
import type { MouseEvent } from 'react';

import type { Algorithm } from '#catalog/algorithms.ts';
import Icon from '#components/Icon.tsx';
import cn from '#utils/cn.ts';
import type { Listing } from '#utils/code.ts';

import useMediaQuery from '../hooks/useMediaQuery.ts';
import HeroPreview from './HeroPreview.tsx';

interface HeroSectionProps {
  // Absent when the featured algorithm cannot be shown.
  hero: { algorithm: Algorithm; listing: Listing } | null;
}

// A link styled as a large button. `Button` renders a <button>, and an anchor
// cannot sit inside one.
const ctaClasses =
  'font-en inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border px-6 text-base font-semibold whitespace-nowrap transition duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px active:scale-98 sm:w-auto';

const primaryCtaClasses =
  'border-transparent bg-primary text-primary-foreground hover:bg-primary-hover';

const outlineCtaClasses =
  'border-border text-foreground hover:border-muted-foreground hover:bg-surface-2';

function HeroSection(props: HeroSectionProps) {
  const { hero } = props;

  // The canvas draws at fixed pixel sizes rather than scaling to its box, so
  // on a phone the array would run off the edge. Below md the preview is not
  // mounted at all, rather than hidden, which would keep an unseen run
  // stepping and repainting.
  const isWide = useMediaQuery('(min-width: 48rem)');

  const handleBrowse = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;

    event.preventDefault();

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    document
      .getElementById('algorithms')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <section
      className={cn(
        'mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:items-center lg:gap-16 lg:px-10 lg:py-24',
        // Without a preview the copy keeps the full width.
        hero && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]',
      )}
    >
      <div>
        <p className="font-code text-accent text-sm">
          Interactive algorithm visualizer
        </p>

        <h1 className="font-en-display text-foreground mt-4 text-4xl leading-tight font-semibold sm:text-5xl">
          Step through algorithms, line by line.
        </h1>

        <p className="font-en text-muted-foreground mt-5 max-w-xl text-base leading-relaxed sm:mt-6 sm:text-lg">
          Code Canvas runs real code against a structure you shape. Each step
          highlights the line being run, shows every variable in memory, and
          draws the structure as the code touches it.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
          {hero && (
            <Link
              to="/$algorithmId"
              params={{ algorithmId: hero.algorithm.id }}
              className={cn(ctaClasses, primaryCtaClasses)}
            >
              <Icon name="play" />
              Try {hero.algorithm.title}
            </Link>
          )}

          {/* Scrolls by hand rather than following the hash. The router
              watches the URL: a hash change it did not make reads as a back
              or forward step, and it restores home's saved scroll position
              over the jump. Routing the hash through it instead does nothing
              once the URL already ends in #algorithms. The href stays for
              opening in a new tab. */}
          <a
            href="#algorithms"
            onClick={handleBrowse}
            className={cn(ctaClasses, outlineCtaClasses)}
          >
            Browse algorithms
            <Icon name="arrow-right" />
          </a>
        </div>
      </div>

      {hero && isWide && (
        <HeroPreview title={hero.algorithm.title} listing={hero.listing} />
      )}
    </section>
  );
}

export default HeroSection;
