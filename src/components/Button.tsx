import type { PropsWithChildren } from 'react';

import cn from '#utils/cn.ts';

type ButtonVariant =
  'primary' | 'secondary' | 'accent' | 'success' | 'destructive' | 'outline';

type ButtonSize = 'sm' | 'md';

interface ButtonProps extends PropsWithChildren {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
}

// Colors fade over 300ms so a button that changes variant in place, as Next
// step does when it becomes Finish, visibly shifts color. The press and focus
// ring keep 150ms; at 300ms a press would trail the click.
const baseClasses =
  'font-en relative inline-flex cursor-pointer items-center justify-center gap-2 border font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate,scale] duration-[300ms,300ms,300ms,150ms,150ms,150ms] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background enabled:active:translate-y-px enabled:active:scale-98 disabled:cursor-not-allowed disabled:opacity-50';

// Each variant owns its border-color. Split across these strings, the winner
// is whichever Tailwind emits later, not the one listed last here.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary text-primary-foreground enabled:hover:bg-primary-hover',
  secondary:
    'border-transparent bg-secondary text-secondary-foreground enabled:hover:bg-secondary-hover',
  accent:
    'border-transparent bg-accent text-accent-foreground enabled:hover:bg-accent-hover',
  success:
    'border-transparent bg-success text-success-foreground enabled:hover:bg-success-hover',
  destructive:
    'border-transparent bg-destructive text-destructive-foreground enabled:hover:bg-destructive-hover',
  outline:
    'border-border text-foreground enabled:hover:border-muted-foreground enabled:hover:bg-surface-2',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-md px-3 text-xs',
  md: 'h-10 rounded-lg px-4 text-sm',
};

function Button(props: ButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
  } = props;

  const className = cn(baseClasses, variantClasses[variant], sizeClasses[size]);

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
