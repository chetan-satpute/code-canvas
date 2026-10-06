import {
  ArrowLeft,
  Check,
  Maximize,
  Minimize,
  Play,
  Square,
  StepForward,
} from 'lucide-react';

// The app's only lucide-react import. Keep it named — `import * as lucide`
// would pull in the entire icon set.
const iconComponents = {
  'arrow-left': ArrowLeft,
  check: Check,
  maximize: Maximize,
  minimize: Minimize,
  play: Play,
  square: Square,
  'step-forward': StepForward,
} as const;

export type IconName = keyof typeof iconComponents;

interface IconProps {
  name: IconName;
  label?: string;
}

// Sized to the surrounding text. Without a label the icon is assumed to sit
// beside text that already says the same thing, so it is hidden from screen
// readers; an icon standing alone needs the label to be named at all.
function Icon(props: IconProps) {
  const { name, label } = props;

  const LucideIconComponent = iconComponents[name];

  const decorative = label === undefined;

  return (
    <LucideIconComponent
      size="1em"
      className="shrink-0"
      aria-hidden={decorative || undefined}
      aria-label={label}
      role={decorative ? undefined : 'img'}
    />
  );
}

export default Icon;
