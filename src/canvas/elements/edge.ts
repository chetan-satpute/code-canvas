import type { CanvasTheme } from '../theme.ts';
import { NODE_HEIGHT, NODE_WIDTH } from './node.ts';

const EDGE_WIDTH = 2;

const ARROW_LENGTH = 10;
const ARROW_HALF_WIDTH = 4;

// Distance kept between a node's border and the edge, so the line reads as
// connecting two boxes instead of growing out of them.
const EDGE_GAP = 4;

// An edge is structure, not state: it says two nodes are connected, while the
// nodes carry the color that says what the algorithm is doing.
export interface CanvasEdge {
  // The two nodes' top-left corners, the same points the nodes are drawn at —
  // not their centers.
  start: { x: number; y: number };
  end: { x: number; y: number };
  opacity: number;
}

// Distance from a node's center to its border along a unit direction. The
// corner radius is ignored: at the node's radius the error is under a pixel,
// and the gap absorbs it.
function distanceToNodeBorder(ux: number, uy: number) {
  const toVerticalEdge = ux === 0 ? Infinity : NODE_WIDTH / 2 / Math.abs(ux);
  const toHorizontalEdge = uy === 0 ? Infinity : NODE_HEIGHT / 2 / Math.abs(uy);

  return Math.min(toVerticalEdge, toHorizontalEdge);
}

export function drawCanvasEdge(
  ctx: CanvasRenderingContext2D,
  edge: CanvasEdge,
  theme: CanvasTheme,
) {
  const { start, end, opacity } = edge;

  const startX = start.x + NODE_WIDTH / 2;
  const startY = start.y + NODE_HEIGHT / 2;
  const endX = end.x + NODE_WIDTH / 2;
  const endY = end.y + NODE_HEIGHT / 2;

  const distance = Math.hypot(endX - startX, endY - startY);
  if (distance === 0) return;

  const ux = (endX - startX) / distance;
  const uy = (endY - startY) / distance;

  // Both ends are pulled back to their node's border, so the edge is drawn
  // only in the gap between the two nodes and never runs underneath one —
  // whatever order nodes and edges are drawn in.
  const inset = distanceToNodeBorder(ux, uy) + EDGE_GAP;
  const span = distance - 2 * inset;
  if (span <= 0) return;

  const tailX = startX + ux * inset;
  const tailY = startY + uy * inset;
  const tipX = endX - ux * inset;
  const tipY = endY - uy * inset;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = theme.edge;
  ctx.fillStyle = theme.edge;
  ctx.lineWidth = EDGE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // On a span shorter than a full arrowhead, the head shortens to fit rather
  // than reaching back past the tail into the start node's gap.
  const arrowLength = Math.min(ARROW_LENGTH, span);
  const baseX = tipX - ux * arrowLength;
  const baseY = tipY - uy * arrowLength;

  // The shaft stops at the arrowhead's base rather than the tip: a
  // translucent edge would otherwise show a seam where the two overlap.
  if (span > arrowLength) {
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(baseX, baseY);
    ctx.stroke();
  }

  // Perpendicular to the edge, spreading the base corners either side of it.
  const px = -uy * ARROW_HALF_WIDTH;
  const py = ux * ARROW_HALF_WIDTH;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX + px, baseY + py);
  ctx.lineTo(baseX - px, baseY - py);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
