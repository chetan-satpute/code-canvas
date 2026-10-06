import { useEffect, useState } from 'react';

import type { CanvasFrame } from '#canvas/frame.ts';
import { arrayLinearSearch } from '#engine/algorithms/array-linear-search.ts';
import { CoreBoard } from '#engine/board.ts';
import { CoreArray } from '#engine/structures/array/structure.ts';
import type { Listing } from '#utils/code.ts';

// Fixed rather than randomized, so every loop ends on a match instead of
// sometimes exhausting the array. The array draws `60 + n * 60` pixels wide,
// so six cells are 420px: inside the preview at every width it is shown at.
const values = [8, 3, 21, 42, 15, 27];
const heroTarget = 42;

// Slow enough to read the highlighted line before it moves on.
const stepDelayMs = 700;

// The match is the point of the demo, and the step after it puts the array
// back to its resting colour, so that one step is held.
const foundHoldMs = 2000;

// The pause on the finished run before the array is searched again.
const restartDelayMs = 1800;

export interface HeroRun {
  frames: CanvasFrame[];
  // Absent before the first step, as on the explore page outside a run.
  activeLine?: number;
  // The innermost call's scalars, as the memory card lists them.
  variables: [name: string, value: string][];
}

// A board holding one named array, as the explore page's structure registry
// builds it: the name label is part of what the canvas draws.
function createBoard() {
  const board = new CoreBoard();
  const array = new CoreArray(values);
  array.name = 'array';
  board.add(array);

  return { board, array };
}

// Plays the real linear search on a real board, on a loop. The frames are the
// engine's own, drawn by the same canvas the explore page uses.
function useHeroRun(listing: Listing): HeroRun {
  const [run, setRun] = useState<HeroRun>(() => ({
    frames: createBoard().board.drainFrames(),
    variables: [],
  }));

  useEffect(() => {
    // A demo that restarts forever is what this setting asks pages not to
    // do, so the array is left at rest.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer = 0;

    // The first pass starts from the resting board already in state; every
    // later one puts a fresh board back on screen before it starts.
    const play = (showResting: boolean) => {
      const { board, array } = createBoard();

      if (showResting) setRun({ frames: board.drainFrames(), variables: [] });

      const steps = arrayLinearSearch(board, array, listing.anchors, {
        target: heroTarget,
      });

      const advance = () => {
        const result = steps.next();
        const { line, frames, callStack } = result.value;

        setRun({
          frames,
          activeLine: line,
          variables: callStack[0]?.memory ?? [],
        });

        if (result.done) {
          timer = window.setTimeout(() => play(true), restartDelayMs);
          return;
        }

        const found = line === listing.anchors.found;
        timer = window.setTimeout(advance, found ? foundHoldMs : stepDelayMs);
      };

      timer = window.setTimeout(advance, stepDelayMs);
    };

    play(false);

    return () => window.clearTimeout(timer);
  }, [listing]);

  return run;
}

export default useHeroRun;
