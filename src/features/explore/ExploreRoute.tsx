import { useParams } from '@tanstack/react-router';

function ExploreRoute() {
  const { algorithmId } = useParams({ from: '/$algorithmId' });

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <h1 className="font-en-display text-xl">{algorithmId}</h1>
    </div>
  );
}

export default ExploreRoute;
