import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
  useIsPresent,
  useReducedMotion,
} from 'motion/react';
import {
  type PropsWithChildren,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

interface FadeSwapProps extends PropsWithChildren {
  // Changing it fades the current children out, then the new ones in.
  id: string;
  // For a box whose height follows its content: it eases to the incoming
  // content's height instead of jumping, so whatever sits below slides rather
  // than snaps. Leave off where the parent sizes the box, since the children
  // then fill it with `h-full` and there is no content height to follow.
  animateHeight?: boolean;
}

// The outgoing content shrinks slightly as it fades and the incoming grows
// into place. Sequential rather than overlapping: two translucent surfaces
// crossfading in the same spot look muddy. Under reduced motion the scale is
// dropped and the fade kept, and the height snaps.
function FadeSwap(props: FadeSwapProps) {
  const { id, children, animateHeight = false } = props;

  const swap = (
    <AnimatePresence mode="wait" initial={false}>
      <SwapPanel key={id}>{children}</SwapPanel>
    </AnimatePresence>
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {animateHeight ? <HeightFollower>{swap}</HeightFollower> : swap}
      </MotionConfig>
    </LazyMotion>
  );
}

function SwapPanel(props: PropsWithChildren) {
  const { children } = props;

  // The outgoing content stays mounted through its fade with the props and
  // handlers of the render that removed it. Left interactive, a second click
  // on Run would start another run from a stale session, dropping the first
  // run's revert.
  const isPresent = useIsPresent();

  return (
    <m.div
      className="h-full"
      inert={!isPresent}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      exit={{
        opacity: 0,
        scale: 0.97,
        transition: { duration: 0.12, ease: 'easeIn' },
      }}
    >
      {children}
    </m.div>
  );
}

function HeightFollower(props: PropsWithChildren) {
  const { children } = props;

  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  // `reducedMotion="user"` only stops transforms; height still needs stopping.
  const reduceMotion = useReducedMotion();

  // Measured with an observer rather than animated to 'auto', so the box
  // follows the content whenever it resizes, not only when the swap happens.
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.borderBoxSize[0].blockSize);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Clipped so the incoming content does not spill past the box while it
  // grows. The swapped content keeps its own padding, so focus rings stay
  // inside the clip.
  return (
    <m.div
      className="overflow-hidden"
      initial={false}
      animate={{ height }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
    >
      <div ref={content}>{children}</div>
    </m.div>
  );
}

export default FadeSwap;
