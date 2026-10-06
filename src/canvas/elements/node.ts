import type { CanvasTheme } from '../theme.ts';

export const NODE_WIDTH = 60;
export const NODE_HEIGHT = 30;
export const NODE_RADIUS = NODE_HEIGHT * 0.25;

// How an algorithm says what it is doing to a value. `primary` is the resting
// state; `secondary` and `tertiary` mark what is being looked at; `success`
// and `danger` mark an outcome.
export type NodeVariant =
  'primary' | 'secondary' | 'tertiary' | 'success' | 'danger';

const NODE_FONT_SIZE = NODE_HEIGHT * 0.5;

export interface CanvasNode {
  // Top-left corner.
  x: number;
  y: number;
  value: number;
  variant: NodeVariant;
  opacity: number;
}

export function drawCanvasNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  theme: CanvasTheme,
) {
  const { x, y, value, variant, opacity } = node;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  ctx.roundRect(x, y, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS);
  ctx.fillStyle = theme.nodeFill[variant];
  ctx.fill();

  // A dark node on a dark canvas has no silhouette of its own, so every node
  // carries a top sheen and a hairline rim. The sheen fades out by the
  // vertical middle so it lights the top edge instead of washing the face.
  const sheen = ctx.createLinearGradient(0, y, 0, y + NODE_HEIGHT / 2);
  sheen.addColorStop(0, theme.nodeSheen);
  sheen.addColorStop(1, 'transparent');
  ctx.fillStyle = sheen;
  ctx.fill();

  // Inset by half the line width so the 1px rim lands inside the fill and
  // stays crisp instead of straddling the edge.
  ctx.beginPath();
  ctx.roundRect(
    x + 0.5,
    y + 0.5,
    NODE_WIDTH - 1,
    NODE_HEIGHT - 1,
    NODE_RADIUS - 0.5,
  );
  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.nodeRim;
  ctx.stroke();

  ctx.fillStyle = theme.nodeForeground;
  ctx.font = `${NODE_FONT_SIZE}px ${theme.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toString(), x + NODE_WIDTH / 2, y + NODE_HEIGHT / 2);

  ctx.restore();
}
