import { useCallback, useEffect, useState } from 'react';

import logger from '#utils/logger.ts';

interface Fullscreen {
  isSupported: boolean;
  isFullscreen: boolean;
  toggle: () => void;
}

// Browsers that expose no Fullscreen API at all (Safari on iPhone) leave
// `fullscreenEnabled` undefined; an iframe without `allow="fullscreen"` sets
// it to false. Both mean the request would fail.
const isSupported = document.fullscreenEnabled === true;

function useFullscreen(): Fullscreen {
  // Loose `!= null` on purpose: those same browsers leave `fullscreenElement`
  // undefined, not null.
  const [isFullscreen, setIsFullscreen] = useState(
    () => document.fullscreenElement != null,
  );

  // Esc and the browser's own chrome exit fullscreen without going through
  // `toggle`, so the event is the only reliable source for the flag.
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement != null);
    };

    document.addEventListener('fullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  const toggle = useCallback(() => {
    // Either call rejects when the browser refuses the change. There is
    // nothing to recover from — fullscreenchange never fires, so the flag
    // stays correct and the page stays as it was — but a refusal looks
    // exactly like a dead button, so leave a trace.
    const handleRejection = (error: unknown) => {
      logger.error('Fullscreen toggle failed', error);
    };

    if (document.fullscreenElement == null) {
      void document.documentElement.requestFullscreen().catch(handleRejection);
    } else {
      void document.exitFullscreen().catch(handleRejection);
    }
  }, []);

  return { isSupported, isFullscreen, toggle };
}

export default useFullscreen;
