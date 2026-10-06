import { useLoaderData } from '@tanstack/react-router';

import TopGlow from '#components/TopGlow.tsx';

import CatalogSection from './components/CatalogSection.tsx';
import HeroSection from './components/HeroSection.tsx';
import HomeFooter from './components/HomeFooter.tsx';
import HomeHeader from './components/HomeHeader.tsx';
import HowItWorksSection from './components/HowItWorksSection.tsx';
import { buildCatalog } from './utils/catalog.ts';

// Built from static modules, so once is enough.
const catalog = buildCatalog();

function HomeRoute() {
  const hero = useLoaderData({ from: '/' });

  // `overflow-x-clip` catches the hero preview's backlight, which runs past
  // the viewport where the preview spans the full width. Not `hidden`: that
  // makes a scroll container, and the structure headings would stop sticking.
  return (
    <div className="bg-background text-foreground relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <TopGlow />
      <HomeHeader />

      <main className="flex-1">
        <HeroSection hero={hero} />
        <CatalogSection catalog={catalog} />
        <HowItWorksSection />
      </main>

      <HomeFooter />
    </div>
  );
}

export default HomeRoute;
