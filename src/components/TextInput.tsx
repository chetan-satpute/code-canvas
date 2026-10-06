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
  // Marks the field as rejected. Set when a submission could not use the
  // value, and cleared as soon as it reads as valid again.
  invalid?: boolean;
}

const inputClassesBase =
  'bg-surface-2 text-foreground font-code rounded-lg border px-3 py-2 text-sm outline-none focus:ring-3';

// A rejected field carries the same ring focus does, not just a recolored
// border: a 1px hairline on a dark card is easy to miss while the eye is on
// the button that was just pressed. It keeps the ring through focus, so
// focusing the field to fix it does not clear the marking first.
const inputStateClasses = {
  valid: 'border-input focus:border-ring focus:ring-ring/45',
  invalid:
    'border-destructive ring-3 ring-destructive/45 focus:border-destructive focus:ring-destructive/45',
};

function TextInput(props: TextInputProps) {
  const {
    label,
    value,
    onChange,
    placeholder,
    layout = 'stacked',
    invalid = false,
  } = props;
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
    inputStateClasses[invalid ? 'invalid' : 'valid'],
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
        aria-invalid={invalid}
      />
    </div>
  );
}

export default TextInput;
