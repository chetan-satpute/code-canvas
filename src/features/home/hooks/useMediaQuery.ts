import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Whether the viewport matches a media query, re-rendering when that changes.
// Styling alone is Tailwind's job; this is for a component that should not be
// mounted at all on some viewports, rather than mounted and hidden.
function useMediaQuery(query: string): boolean {
  const list = useMemo(() => window.matchMedia(query), [query]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      list.addEventListener('change', onChange);

      return () => list.removeEventListener('change', onChange);
    },
    [list],
  );

  const getSnapshot = useCallback(() => list.matches, [list]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export default useMediaQuery;
