import type { NodeVariant } from './elements/node.ts';

// The canvas's colors and face, resolved from the --canvas-* tokens and
// --font-code in index.css, which stays the one place the theme is defined.
export interface CanvasTheme {
  nodeFill: Record<NodeVariant, string>;
  nodeForeground: string;
  nodeRim: string;
  nodeSheen: string;
  edge: string;
  label: string;
  font: string;
}

let cached: CanvasTheme | undefined;

// Read once, on the first draw: the theme has a single, static palette, so
// nothing can change these after the stylesheet has loaded.
export function canvasTheme(): CanvasTheme {
  cached ??= readCanvasTheme();
  return cached;
}

function readCanvasTheme(): CanvasTheme {
  const styles = getComputedStyle(document.documentElement);

  // A token renamed in the stylesheet would otherwise reach the canvas as an
  // empty string, which it ignores, silently drawing in the previous color.
  const token = (name: string) => {
    const value = styles.getPropertyValue(name).trim();
    if (value === '') throw new Error(`Canvas token ${name} is not defined`);

    return value;
  };

  return {
    nodeFill: {
      primary: token('--canvas-node-primary'),
      secondary: token('--canvas-node-secondary'),
      tertiary: token('--canvas-node-tertiary'),
      success: token('--canvas-node-success'),
      danger: token('--canvas-node-danger'),
    },
    nodeForeground: token('--canvas-node-foreground'),
    nodeRim: token('--canvas-node-rim'),
    nodeSheen: token('--canvas-node-sheen'),
    edge: token('--canvas-edge'),
    label: token('--canvas-label'),
    font: token('--font-code'),
  };
}
