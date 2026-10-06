import { useState } from 'react';

import type { Algorithm } from '#catalog/algorithms.ts';
import type { Structure, StructureId } from '#catalog/structures.ts';
import type { AlgorithmRun, AlgorithmRunner } from '#engine/algorithm.ts';
import { CoreBoard } from '#engine/board.ts';
import type { CoreStep } from '#engine/step.ts';
import engines from '#engine/structures/registry.ts';
import { parseArguments } from '#utils/argument.ts';
import type { Listing } from '#utils/code.ts';
import logger from '#utils/logger.ts';

interface ActiveRun {
  algorithmId: string;
  generator: AlgorithmRun;
  // Undoes everything the run did to the board.
  revert: () => void;
  step: CoreStep;
  // The step shown is the last; the generator has returned.
  finished: boolean;
}

// The board, the structure on it and that structure's operations belong
// together, so they are built and replaced as one.
function createSession(structureId: StructureId) {
  const engine = engines[structureId];

  const board = new CoreBoard();
  const structure = engine.create();
  board.add(structure);

  return {
    structureId,
    board,
    structure,
    operations: engine.operations,
    frames: board.drainFrames(),
    run: null as ActiveRun | null,
  };
}

// What the explore route loads for an algorithm.
interface ExploreData {
  algorithm: Algorithm;
  structure: Structure;
  listing: Listing;
  runner: AlgorithmRunner;
}

// The structure on the canvas, the edits applied to it, and the run stepping
// over it.
//
// The board, the structure and the generator are mutable, and mutating them
// is not what should redraw anything. What React renders is the frames an
// edit drained or the step a run reached, and those are replaced whole.
//
// Moving to another algorithm of the same structure keeps what the user
// built. The route component is reused across algorithms, so a move to
// another structure does not remount it: the session is replaced during
// render instead, before the old structure can be drawn or edited.
function useExploreSession(data: ExploreData) {
  const { algorithm, structure: catalogStructure, listing, runner } = data;

  const [session, setSession] = useState(() =>
    createSession(catalogStructure.id),
  );

  if (session.structureId !== catalogStructure.id) {
    setSession(createSession(catalogStructure.id));
  } else if (session.run !== null && session.run.algorithmId !== algorithm.id) {
    // A run belongs to the algorithm that started it, so moving to another
    // one ends it the way Stop would: undone midway, kept once finished.
    // Reverting twice restores the same data, so a repeated render is
    // harmless.
    if (!session.run.finished) session.run.revert();
    setSession({ ...session, run: null, frames: session.board.drainFrames() });
  }

  // Returns whether the edit was made, so the form keeps values it could not
  // use.
  const applyOperation = (
    operationId: string,
    values: Record<string, string>,
  ): boolean => {
    const operation = session.operations[operationId];
    const fields = catalogStructure.operations.find(
      (candidate) => candidate.id === operationId,
    )?.args;

    if (operation === undefined || fields === undefined) {
      logger.error(`No ${session.structureId} operation '${operationId}'`);
      return false;
    }

    const args = parseArguments(fields, values);

    if (args === null) {
      logger.warn(`Cannot apply ${operationId} with these arguments`, values);
      return false;
    }

    operation(session.structure, args);

    const frames = session.board.drainFrames();
    setSession((current) => ({ ...current, frames }));

    return true;
  };

  // Advances outside the state updater, which React may call twice: the
  // generator mutates the board, so it must step exactly once.
  const advance = (run: Omit<ActiveRun, 'step' | 'finished'>) => {
    let result: IteratorResult<CoreStep, CoreStep>;

    // A generator that throws is closed, and its next `next()` would yield no
    // step at all, so the run is abandoned as a Stop would abandon it.
    try {
      result = run.generator.next();
    } catch (error) {
      logger.error(`The ${run.algorithmId} run failed`, error);
      run.revert();

      const frames = session.board.drainFrames();
      setSession((current) => ({ ...current, run: null, frames }));

      return;
    }

    const step = result.value;

    setSession((current) => ({
      ...current,
      frames: step.frames,
      run: { ...run, step, finished: result.done === true },
    }));
  };

  const run = (values: Record<string, string>) => {
    const args = parseArguments(algorithm.args, values);

    if (args === null) {
      logger.warn(`Cannot run ${algorithm.id} with these arguments`, values);
      return;
    }

    const revert = session.board.snapshot();
    const generator = runner(
      session.board,
      session.structure,
      listing.anchors,
      args,
    );

    advance({ algorithmId: algorithm.id, generator, revert });
  };

  const nextStep = () => {
    if (session.run === null || session.run.finished) return;

    advance(session.run);
  };

  // A run stopped midway leaves nothing behind; one that finished keeps what
  // it did.
  const stop = () => {
    if (session.run === null) return;

    if (!session.run.finished) session.run.revert();

    const frames = session.board.drainFrames();
    setSession((current) => ({ ...current, run: null, frames }));
  };

  return {
    frames: session.frames,
    step: session.run?.step,
    isRunning: session.run !== null,
    isFinished: session.run?.finished ?? false,
    applyOperation,
    run,
    nextStep,
    stop,
  };
}

export default useExploreSession;
