import type { StructureOperation } from '#catalog/types.ts';
import Card from '#components/Card.tsx';

import StructureOperationRow from './StructureOperationRow.tsx';

interface StructureCardProps {
  title: string;
  description: string;
  operations: StructureOperation[];
  onApply: (operationId: string, values: Record<string, string>) => boolean;
}

function StructureCard(props: StructureCardProps) {
  const { title, description, operations, onApply } = props;

  return (
    <Card title={title} description={description} padded={false}>
      {/* Capped below lg, where the card is in page flow; on lg it fills the
          grid cell. */}
      <div className="flex max-h-80 flex-col gap-8 overflow-auto p-5 lg:h-full lg:max-h-none">
        {operations.map((operation) => (
          <StructureOperationRow
            key={operation.id}
            label={operation.label}
            args={operation.args}
            onApply={(values) => onApply(operation.id, values)}
          />
        ))}
      </div>
    </Card>
  );
}

export default StructureCard;
