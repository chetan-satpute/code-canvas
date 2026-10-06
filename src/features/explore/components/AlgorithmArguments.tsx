import { useState } from 'react';

import type { ArgumentField } from '#catalog/types.ts';
import Button from '#components/Button.tsx';
import Icon from '#components/Icon.tsx';
import TextInput from '#components/TextInput.tsx';
import { invalidArguments, parseArgument } from '#utils/argument.ts';

interface AlgorithmArgumentsProps {
  args: ArgumentField[];
  onRun: (values: Record<string, string>) => void;
}

function AlgorithmArguments(props: AlgorithmArgumentsProps) {
  const { args, onRun } = props;

  // Unmounted while a run plays, so the fields start empty after every run.
  const [values, setValues] = useState<Record<string, string>>({});

  // Names of the arguments the last Run could not use.
  const [invalid, setInvalid] = useState<string[]>([]);

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));

    const kind = args.find((argument) => argument.name === name)?.kind;

    if (parseArgument(value, kind) !== null)
      setInvalid((current) => current.filter((entry) => entry !== name));
  };

  const handleRun = () => {
    const rejected = invalidArguments(args, values);
    setInvalid(rejected);

    if (rejected.length > 0) return;

    onRun(values);
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
            invalid={invalid.includes(argument.name)}
          />
        ))}
      </div>

      <div className="flex flex-col px-5 pt-3 pb-5">
        <Button onClick={handleRun}>
          <Icon name="play" />
          Run
        </Button>
      </div>
    </div>
  );
}

export default AlgorithmArguments;
