import type { StructureId } from '#catalog/structures.ts';
import type { CodeAnchors } from '#utils/code.ts';

import type { CoreBoard } from './board.ts';
import { CoreRun } from './run.ts';
import type { CoreStep } from './step.ts';
import type { CoreStructure } from './structure.ts';

export interface AlgorithmContext<
  S extends CoreStructure,
  Name extends string,
> {
  run: CoreRun;
  board: CoreBoard;
  structure: S;
  args: Record<Name, number>;
}

// A run of an algorithm, one step per `next()`. The last step is the
// generator's return value rather than a yield, so whoever steps it knows a
// step is the last while showing it, without running the algorithm ahead.
export type AlgorithmRun = Generator<CoreStep, CoreStep>;

// Like an operation, the arguments arrive already parsed by the kinds the
// catalog declares.
export type AlgorithmRunner = (
  board: CoreBoard,
  structure: CoreStructure,
  anchors: CodeAnchors,
  args: Record<string, number>,
) => AlgorithmRun;

// Binds a structure class once, the way `operationFor` does, so each
// algorithm is written against the real type with no cast: the `instanceof`
// is what narrows it.
export function algorithmFor<S extends CoreStructure>(
  structureId: StructureId,
  Structure: abstract new (...args: never[]) => S,
) {
  // `args` lists the names the algorithm reads, which must match the
  // algorithm's argument names in the catalog.
  return function defineAlgorithm<Name extends string = never>(definition: {
    args?: readonly Name[];
    play: (context: AlgorithmContext<S, Name>) => AlgorithmRun;
  }): AlgorithmRunner {
    const names = definition.args ?? [];

    return (board, structure, anchors, args) => {
      if (!(structure instanceof Structure))
        throw new Error(
          `The ${structureId} algorithm was given another structure`,
        );

      const missing = names.filter((name) => !Object.hasOwn(args, name));

      if (missing.length > 0)
        throw new Error(
          `The ${structureId} algorithm is missing arguments: ${missing.join(', ')}`,
        );

      return definition.play({
        run: new CoreRun(board, anchors),
        board,
        structure,
        args: args as Record<Name, number>,
      });
    };
  };
}
