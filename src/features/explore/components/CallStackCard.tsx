import Card from '#components/Card.tsx';
import CodeTokens from '#components/CodeTokens.tsx';

import { highlightSignature } from '../utils/signature.ts';

interface CallStackCardProps {
  frames: string[];
}

function CallStackCard(props: CallStackCardProps) {
  const { frames } = props;

  return (
    <Card title="Call stack" padded={false}>
      <ul className="flex h-full flex-col gap-2 overflow-auto p-5">
        {frames.map((frame, index) => (
          <li
            key={index}
            className="bg-surface-2 font-code text-foreground has-focus-visible:ring-ring/45 rounded-lg px-3 py-2 text-sm has-focus-visible:ring-3"
          >
            {/* A scroller clips at its own padding box, so content would run
                to the pill's edge while scrolled. Scrolling a box inside the
                padding instead keeps the clip edge inset.

                Focusable so the arrow keys can reach a long signature's end;
                Safari does not make scrollers focusable on its own. The ring
                goes on the pill, since the scroller sits inset within it. */}
            <div
              tabIndex={0}
              className="no-scrollbar overflow-x-auto outline-none"
            >
              <code className="whitespace-pre">
                <CodeTokens tokens={highlightSignature(frame)} />
              </code>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default CallStackCard;
