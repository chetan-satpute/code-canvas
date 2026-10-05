import { useState } from 'react';

import type { ArgumentField } from '#catalog/types.ts';
import Button from '#components/Button.tsx';
import Icon from '#components/Icon.tsx';
import TextInput from '#components/TextInput.tsx';

interface AlgorithmArgumentsProps {
  args: ArgumentField[];
  onRun: () => void;
}

function AlgorithmArguments(props: AlgorithmArgumentsProps) {
  const { args, onRun } = props;

  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="flex flex-col">
      {/* Capped so a long argument list never squeezes the code below. The
          padding sits inside the scroll box rather than around it, so the
          scrollbar lands on the card's edge and the fields' focus rings are
          not clipped. `pb-1` covers the ring under the last field; Run's
          `pt-3` makes up the rest of the gap. */}
      <div className="flex max-h-48 flex-col gap-4 overflow-auto px-5 pt-5 pb-1">
        {args.map((argument) => (
          <TextInput
            key={argument.name}
            label={argument.name}
            value={values[argument.name] ?? ''}
            onChange={(value) => handleChange(argument.name, value)}
            placeholder={argument.placeholder}
          />
        ))}
      </div>

      <div className="flex flex-col px-5 pt-3 pb-5">
        <Button onClick={onRun}>
          <Icon name="play" />
          Run
        </Button>
      </div>
    </div>
  );
}

export default AlgorithmArguments;
