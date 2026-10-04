import { Play, Square, StepForward } from 'lucide-react';

// The app's only lucide-react import. Keep it named — `import * as lucide`
// would pull in the entire icon set.
const iconComponents = {
  play: Play,
  square: Square,
  'step-forward': StepForward,
} as const;

export type IconName = keyof typeof iconComponents;

interface IconProps {
  name: IconName;
}

// Sized to the surrounding text, and hidden from screen readers because every
// icon so far sits beside a text label that already says the same thing.
function Icon(props: IconProps) {
  const { name } = props;

  const LucideIconComponent = iconComponents[name];

  return <LucideIconComponent size="1em" className="shrink-0" aria-hidden />;
}

export default Icon;
