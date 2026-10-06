import type { CatalogStructure } from '../utils/catalog.ts';
import SectionGlow from './SectionGlow.tsx';
import StructureSection from './StructureSection.tsx';

interface CatalogSectionProps {
  catalog: CatalogStructure[];
}

function CatalogSection(props: CatalogSectionProps) {
  const { catalog } = props;

  return (
    <section id="algorithms" className="border-border/60 relative border-t">
      <SectionGlow />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <header className="max-w-2xl">
          <h2 className="font-en-display text-foreground text-3xl font-semibold lg:text-4xl">
            Pick a structure, then an algorithm
          </h2>

          <p className="font-en text-muted-foreground mt-4 text-base leading-relaxed">
            Each one opens on the canvas, where you shape the structure and then
            step through the code against it. Those marked coming soon are on
            the way.
          </p>
        </header>

        <div className="mt-12 flex flex-col gap-14 lg:mt-16 lg:gap-20">
          {catalog.map((structure) => (
            <StructureSection key={structure.id} structure={structure} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CatalogSection;
