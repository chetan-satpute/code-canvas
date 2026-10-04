import Card from '#components/Card.tsx';

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
            {frame}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default CallStackCard;
