import Card from '#components/Card.tsx';

import { highlightSignature } from '../utils/signature.ts';
import CodeTokens from './CodeTokens.tsx';

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
            className="bg-surface-2 font-code text-foreground rounded-lg px-3 py-2 text-sm"
          >
            <code>
              <CodeTokens tokens={highlightSignature(frame)} />
            </code>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default CallStackCard;
