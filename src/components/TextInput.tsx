import type { ChangeEvent } from 'react';
import { useId } from 'react';

import cn from '#utils/cn.ts';

// `inline` puts the label beside the field so a whole control fits on one row.
type TextInputLayout = 'stacked' | 'inline';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  layout?: TextInputLayout;
}

const inputClassesBase =
  'bg-surface-2 text-foreground font-en border-input focus:border-ring focus:ring-ring/45 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-3';

function TextInput(props: TextInputProps) {
  const { label, value, onChange, placeholder, layout = 'stacked' } = props;
  const id = useId();

  const inline = layout === 'inline';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const containerClasses = cn(inline && 'flex items-center gap-3');

  const labelClasses = cn(
    'text-muted-foreground font-en text-sm',
    inline ? 'w-20 shrink-0 truncate sm:w-24' : 'mb-1.5 block',
  );

  // min-w-0 keeps the field from forcing the inline row wider than the card.
  const inputClasses = cn(
    inputClassesBase,
    inline ? 'min-w-0 flex-1' : 'w-full',
  );

  return (
    <div className={containerClasses}>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <input
        id={id}
        className={inputClasses}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

export default TextInput;
