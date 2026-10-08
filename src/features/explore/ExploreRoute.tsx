import { useLoaderData } from '@tanstack/react-router';

import CanvasCard from '#components/CanvasCard.tsx';
import FadeSwap from '#components/FadeSwap.tsx';
import TopGlow from '#components/TopGlow.tsx';
import cn from '#utils/cn.ts';

import AlgorithmArguments from './components/AlgorithmArguments.tsx';
import CallStackCard from './components/CallStackCard.tsx';
import CodeCard from './components/CodeCard.tsx';
import ExploreHeader from './components/ExploreHeader.tsx';
import MemoryCard from './components/MemoryCard.tsx';
import RunControls from './components/RunControls.tsx';
import StructureCard from './components/StructureCard.tsx';
import useExploreSession from './hooks/useExploreSession.ts';

/*
 * Both views share one layout, and the canvas and the code card render
 * outside the view branch, so neither moves or remounts when a run starts or
 * stops. Only the contents of the cell under the canvas and the code card's
 * actions swap, and both fade from one to the other.
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

function ExploreRoute() {
  const data = useLoaderData({ from: '/$algorithmId' });
  const { algorithm, structure, listing } = data;

  const {
    frames,
    step,
    isRunning,
    isFinished,
    applyOperation,
    run,
    nextStep,
    stop,
  } = useExploreSession(data);

  const callStack = step?.callStack ?? [];

  const actions = (
    <FadeSwap id={isRunning ? 'run' : 'arguments'} animateHeight>
      {isRunning ? (
        <RunControls
          finished={isFinished}
          onStop={stop}
          onNextStep={nextStep}
          onFinish={stop}
        />
      ) : (
        <AlgorithmArguments
          // The route is reused across algorithms, so without a key one
          // algorithm's values and invalid marks would carry over to the next.
          key={algorithm.id}
          args={algorithm.args}
          onRun={run}
        />
      )}
    </FadeSwap>
  );

  return (
    <div className="bg-background text-foreground relative isolate flex min-h-dvh flex-col lg:h-dvh lg:min-h-168">
      <TopGlow />
      <ExploreHeader />

      <main className={layoutClasses}>
        <div className={canvasColumnClasses}>
          <div className={canvasClasses}>
            <CanvasCard frames={frames} />
          </div>

          <div className={underCanvasClasses}>
            <FadeSwap id={isRunning ? 'run' : 'structure'}>
              {isRunning ? (
                <div className={cn('h-full', stackAndMemoryClasses)}>
                  <div className="sm:col-span-3">
                    <CallStackCard
                      frames={callStack.map((entry) => entry.signature)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    {/* The innermost call, which is the one running. */}
                    <MemoryCard variables={callStack[0]?.memory ?? []} />
                  </div>
                </div>
              ) : (
                <StructureCard
                  title={structure.title}
                  description={structure.description}
                  operations={structure.operations}
                  onApply={applyOperation}
                />
              )}
            </FadeSwap>
          </div>
        </div>

        <div className={codeClasses}>
          <CodeCard
            title={algorithm.title}
            description={algorithm.description}
            lines={listing.lines}
            activeLine={step?.line}
            actions={actions}
          />
        </div>
      </main>
    </div>
  );
}

export default ExploreRoute;
