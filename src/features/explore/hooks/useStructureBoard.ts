import { useState } from 'react';

import type { Structure, StructureId } from '#catalog/structures.ts';
import { CoreBoard } from '#engine/board.ts';
import engines from '#engine/structures/registry.ts';
import { parseArguments } from '#utils/argument.ts';
import logger from '#utils/logger.ts';

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
  };
}

// The structure on the canvas and the edits applied to it.
//
// The board and the structure are mutable, and mutating them is not what
// should redraw anything. What React renders is the frames an edit drained,
// and those are replaced whole.
//
// Moving to another algorithm of the same structure keeps what the user
// built. The route component is reused across algorithms, so a move to
// another structure does not remount it: the session is replaced during
// render instead, before the old structure can be drawn or edited.
function useStructureBoard(catalogStructure: Structure) {
  const [session, setSession] = useState(() =>
    createSession(catalogStructure.id),
  );

  if (session.structureId !== catalogStructure.id)
    setSession(createSession(catalogStructure.id));

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

  return { frames: session.frames, applyOperation };
}

export default useStructureBoard;
