import type { StructureId } from '#catalog/structures.ts';

import type { CoreStructure } from './structure.ts';

// An edit from the explore page's structure card. Unlike an algorithm it is
// neither stepped nor animated: the structure simply changes, and the next
// frame drawn shows it.
//
// The arguments arrive already parsed, by the kinds the catalog declares, so
// an operation never decides for itself what a valid value looks like.
export type OperationRunner = (
  structure: CoreStructure,
  args: Record<string, number>,
) => void;

// Binds a structure class once, so each operation for that structure is
// written against the real type with no cast anywhere: the `instanceof` is
// what narrows it. The id names the structure in errors, since class names do
// not survive minification.
export function operationFor<S extends CoreStructure>(
  structureId: StructureId,
  Structure: abstract new (...args: never[]) => S,
) {
  // `args` lists the names the operation reads, which must match the
  // argument names of the same operation in the catalog.
  return function defineOperation<Name extends string = never>(definition: {
    args?: readonly Name[];
    apply: (structure: S, args: Record<Name, number>) => void;
  }): OperationRunner {
    const names = definition.args ?? [];

    return (structure, args) => {
      if (!(structure instanceof Structure))
        throw new Error(
          `The ${structureId} operation was given another structure`,
        );

      const missing = names.filter((name) => !Object.hasOwn(args, name));

      if (missing.length > 0)
        throw new Error(
          `The ${structureId} operation is missing arguments: ${missing.join(', ')}`,
        );

      definition.apply(structure, args as Record<Name, number>);
    };
  };
}
