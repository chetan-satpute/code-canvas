import type { CatalogStructure } from '../utils/catalog.ts';
import AlgorithmTile from './AlgorithmTile.tsx';

interface StructureSectionProps {
  structure: CatalogStructure;
}

function StructureSection(props: StructureSectionProps) {
  const { structure } = props;

  return (
    <section className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
      {/* Sticky on wide screens, so a long list stays labelled with its
          structure while it scrolls past. */}
      <header className="lg:sticky lg:top-8 lg:self-start">
        <h3 className="font-en-display text-foreground text-2xl font-semibold">
          {structure.title}
        </h3>

        <p className="font-en text-muted-foreground mt-2 text-sm leading-relaxed">
          {structure.description}
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {structure.algorithms.map((algorithm) => (
          <li key={algorithm.id}>
            <AlgorithmTile algorithm={algorithm} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default StructureSection;
