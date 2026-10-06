import Card from '#components/Card.tsx';
import CodeTokens from '#components/CodeTokens.tsx';

import { highlightSignature } from '../utils/signature.ts';

interface MemoryCardProps {
  variables: [name: string, value: string][];
}

function MemoryCard(props: MemoryCardProps) {
  const { variables } = props;

  return (
    <Card title="Memory" padded={false}>
      <dl className="font-code flex h-full flex-col gap-2 overflow-auto p-5 text-sm">
        {variables.map(([name, value]) => (
          <div key={name} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{name}</dt>
            {/* A value is written the way it appears as an argument in a call
                stack signature, so it is painted by the same highlighter. */}
            <dd className="text-foreground truncate">
              <CodeTokens tokens={highlightSignature(value)} />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default MemoryCard;
