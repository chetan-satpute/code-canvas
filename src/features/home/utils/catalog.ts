import algorithms from '#catalog/algorithms.ts';
import {
  type PlannedAlgorithm,
  plannedAlgorithms,
  plannedStructures,
} from '#catalog/planned.ts';
import structures from '#catalog/structures.ts';

export interface CatalogAlgorithm {
  id: string;
  title: string;
  description: string;
  // Opens on the explore page; otherwise listed as coming soon.
  ready: boolean;
}

export interface CatalogStructure {
  id: string;
  title: string;
  description: string;
  algorithms: CatalogAlgorithm[];
}

function listAlgorithms(
  // A ready algorithm has every field a planned one does.
  from: PlannedAlgorithm[],
  structureId: string,
  ready: boolean,
): CatalogAlgorithm[] {
  return from
    .filter((algorithm) => algorithm.structureId === structureId)
    .map(({ id, title, description }) => ({ id, title, description, ready }));
}

// Every structure with its algorithms, as the home page lists them. Ready
// structures come before planned ones, and within a structure ready
// algorithms come before planned ones, so what can be opened today leads.
export function buildCatalog(): CatalogStructure[] {
  const listed = [...Object.values(structures), ...plannedStructures];
  const readyAlgorithms = Object.values(algorithms);

  return listed.map((structure) => ({
    id: structure.id,
    title: structure.title,
    description: structure.description,
    algorithms: [
      ...listAlgorithms(readyAlgorithms, structure.id, true),
      ...listAlgorithms(plannedAlgorithms, structure.id, false),
    ],
  }));
}
