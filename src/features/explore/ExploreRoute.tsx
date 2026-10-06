import { useLoaderData } from '@tanstack/react-router';
import { useState } from 'react';

import cn from '#utils/cn.ts';

import AlgorithmArguments from './components/AlgorithmArguments.tsx';
import CallStackCard from './components/CallStackCard.tsx';
import CanvasCard from './components/CanvasCard.tsx';
import CodeCard from './components/CodeCard.tsx';
import ExploreHeader from './components/ExploreHeader.tsx';
import MemoryCard from './components/MemoryCard.tsx';
import RunControls from './components/RunControls.tsx';
import StructureCard from './components/StructureCard.tsx';

// Placeholders until the engine exists.
const placeholderFrames = [
  'linearSearch(array: [1,2,3,4,5], target: 45)',
  'insert(bst, value: 46)',
];
const placeholderVariables: [string, string][] = [
  ['array', '[3, 5, 1, 8]'],
  ['i', '0'],
  ['j', '2'],
];

/*
 * Both views share one layout, and the canvas and the code card render
 * outside the view branch, so neither moves or remounts when a run starts or
 * stops. Only the cell under the canvas and the code card's actions swap.
 *
 * lg+: a row of the canvas column (canvas over that cell, 3:2) and a
 * fixed-width code card beside it. The row fills the viewport without
 * scrolling, but the page header (64px) and the code card's header and
 * arguments (about 375px) never shrink, so the page gets a minimum height that
 * keeps Run and a few lines of code visible. Shorter windows scroll the whole
 * page instead of clipping Run.
 *
 * Below lg the page is one column and the document itself scrolls, header
 * included. Scrolling `main` instead would put its scrollbar inside the
 * right padding, leaving the cards wider of the left edge than the right and
 * out of line with the header. The canvas column is `contents` there, so its
 * two children join that column directly, and `order-last` moves the cell
 * below the code card.
 */
const layoutClasses =
  'flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:overflow-hidden';

const canvasColumnClasses =
  'contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-4';

const canvasClasses =
  'aspect-4/3 sm:aspect-video lg:aspect-auto lg:min-h-0 lg:flex-3';

const underCanvasClasses = 'order-last lg:order-none lg:min-h-0 lg:flex-2';

const codeClasses = 'lg:w-104 lg:shrink-0 xl:w-128';

// Call stack signatures need the wider share; memory holds short name/value
// rows. `grid-cols-1` is `minmax(0, 1fr)`: without it the single column below
// sm is an implicit auto track, which grows to fit an unwrapped signature and
// pushes the page wider instead of letting the entry scroll.
const stackAndMemoryClasses =
  'grid grid-cols-1 gap-4 sm:grid-cols-5 lg:grid-rows-1';

type View = 'planning' | 'running';

function ExploreRoute() {
  const { algorithm, structure, listing } = useLoaderData({
    from: '/$algorithmId',
  });

  const [view, setView] = useState<View>('planning');

  const actions =
    view === 'planning' ? (
      <AlgorithmArguments
        args={algorithm.args}
        onRun={() => setView('running')}
      />
    ) : (
      <RunControls onStop={() => setView('planning')} onNextStep={() => {}} />
    );

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col lg:h-dvh lg:min-h-168">
      <ExploreHeader />

      <main className={layoutClasses}>
        <div className={canvasColumnClasses}>
          <div className={canvasClasses}>
            <CanvasCard />
          </div>

          {view === 'planning' ? (
            <div className={underCanvasClasses}>
              <StructureCard
                title={structure.title}
                description={structure.description}
                operations={structure.operations}
              />
            </div>
          ) : (
            <div className={cn(underCanvasClasses, stackAndMemoryClasses)}>
              <div className="sm:col-span-3">
                <CallStackCard frames={placeholderFrames} />
              </div>
              <div className="sm:col-span-2">
                <MemoryCard variables={placeholderVariables} />
              </div>
            </div>
          )}
        </div>

        <div className={codeClasses}>
          <CodeCard
            title={algorithm.title}
            description={algorithm.description}
            lines={listing.lines}
            // Until the engine steps a run, a run stays on its entry line.
            activeLine={
              view === 'running' ? listing.anchors['enter'] : undefined
            }
            actions={actions}
          />
        </div>
      </main>
    </div>
  );
}

export default ExploreRoute;
