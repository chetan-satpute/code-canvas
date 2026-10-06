import { useState } from 'react';

import type { ArgumentField } from '#catalog/types.ts';
import Button from '#components/Button.tsx';
import TextInput from '#components/TextInput.tsx';
import { invalidArguments, parseArgument } from '#utils/argument.ts';

interface StructureOperationRowProps {
  label: string;
  args: ArgumentField[];
  // Returns whether the values were used; the fields are cleared only then.
  onApply: (values: Record<string, string>) => boolean;
}

function StructureOperationRow(props: StructureOperationRowProps) {
  const { label, args, onApply } = props;

  const [values, setValues] = useState<Record<string, string>>({});

  // Names of the arguments the last Apply could not use.
  const [invalid, setInvalid] = useState<string[]>([]);

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));

    const kind = args.find((argument) => argument.name === name)?.kind;

    if (parseArgument(value, kind) !== null)
      setInvalid((current) => current.filter((entry) => entry !== name));
  };

  const handleApply = () => {
    const rejected = invalidArguments(args, values);
    setInvalid(rejected);

    // The fields keep what was typed, so a rejected value can be corrected
    // rather than retyped.
    if (rejected.length > 0) return;

    if (onApply(values)) setValues({});
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-card-foreground font-en text-sm font-medium">
          {label}
        </span>

        <Button variant="outline" size="sm" onClick={handleApply}>
          Apply
        </Button>
      </div>

      {args.map((argument) => (
        <TextInput
          key={argument.name}
          layout="inline"
          label={argument.name}
          value={values[argument.name] ?? ''}
          onChange={(value) => handleChange(argument.name, value)}
          placeholder={argument.placeholder}
          invalid={invalid.includes(argument.name)}
        />
      ))}
    </div>
  );
}

export default StructureOperationRow;
