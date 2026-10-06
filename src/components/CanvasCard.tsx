import { useRef } from 'react';

import type { CanvasFrame } from '#canvas/frame.ts';
import Card from '#components/Card.tsx';
import useCanvasFrames from '#hooks/useCanvasFrames.ts';

interface CanvasCardProps {
  // The frames of the current step, played in order. The canvas is drawn at
  // a fixed size, so a structure larger than the card is reached by
  // scrolling rather than shrunk.
  frames: CanvasFrame[];
}

function CanvasCard(props: CanvasCardProps) {
  const { frames } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasFrames(canvasRef, frames);

  return (
    <Card padded={false}>
      {/* currentColor in the gradient resolves against text-border. */}
      <div className="text-border flex h-full overflow-auto bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-size-[24px_24px] bg-center">
        {/* Pinned top-left rather than centered: the canvas resizes whenever
            the structure does, and centering would shift everything already
            drawn by half the change. */}
        <canvas ref={canvasRef} className="block shrink-0 self-start" />
      </div>
    </Card>
  );
}

export default CanvasCard;
