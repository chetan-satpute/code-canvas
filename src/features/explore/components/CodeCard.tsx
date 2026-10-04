import type { ReactNode } from 'react';

import Card from '#components/Card.tsx';

interface CodeCardProps {
  title: string;
  description: string;
  lines: string[];
  actions: ReactNode;
}

function CodeCard(props: CodeCardProps) {
  const { title, description, lines, actions } = props;

  return (
    <Card title={title} description={description} padded={false}>
      <div className="flex h-full flex-col">
        <div className="border-border shrink-0 border-b">{actions}</div>

        {/* Capped below lg, where the card is in page flow, so the panels
            under it stay a short scroll away. */}
        <pre className="font-code text-foreground min-h-0 flex-1 overflow-auto p-5 text-sm leading-6 max-lg:max-h-96">
          {lines.map((line, index) => (
            <div key={index} className="flex gap-4">
              <span className="text-muted-foreground w-6 shrink-0 text-right select-none">
                {index + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </Card>
  );
}

export default CodeCard;
