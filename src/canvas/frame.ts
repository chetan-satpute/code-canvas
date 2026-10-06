import { type CanvasEdge, drawCanvasEdge } from './elements/edge.ts';
import {
  type CanvasLabel,
  drawCanvasLabel,
  LABEL_HEIGHT,
  LABEL_WIDTH,
} from './elements/label.ts';
import {
  type CanvasNode,
  drawCanvasNode,
  NODE_HEIGHT,
  NODE_WIDTH,
} from './elements/node.ts';
import { type CanvasTheme, canvasTheme } from './theme.ts';

// Space left around the drawing on every side, so a frame that overflows the
// card and is scrolled to its end does not sit flush against the card's edge.
const FRAME_MARGIN = 12;

// One drawn moment, and the only thing the engine hands the renderer. Its
// coordinates start at 0 and never go negative.
export interface CanvasFrame {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  labels: CanvasLabel[];
}

export function createCanvasFrame(): CanvasFrame {
  return { nodes: [], edges: [], labels: [] };
}

// Edges never reach their own nodes (see edge.ts), but a node can pass over
// an edge it is not part of — a value in flight crossing a tree — and should
// cover it. Labels go on top so an annotation is never hidden.
export function drawCanvasFrame(
  ctx: CanvasRenderingContext2D,
  frame: CanvasFrame,
  theme: CanvasTheme,
) {
  for (const edge of frame.edges) drawCanvasEdge(ctx, edge, theme);
  for (const node of frame.nodes) drawCanvasNode(ctx, node, theme);
  for (const label of frame.labels) drawCanvasLabel(ctx, label, theme);
}

// The extent of the drawing, in CSS pixels, before the margin is added.
export interface CanvasSize {
  width: number;
  height: number;
}

// Edges are spanned between nodes, so they never reach past one and cannot
// extend the bounds on their own.
export function frameBounds(frame: CanvasFrame): CanvasSize {
  let width = 0;
  let height = 0;

  for (const node of frame.nodes) {
    width = Math.max(width, node.x + NODE_WIDTH);
    height = Math.max(height, node.y + NODE_HEIGHT);
  }

  for (const label of frame.labels) {
    width = Math.max(width, label.x + LABEL_WIDTH);
    height = Math.max(height, label.y + LABEL_HEIGHT);
  }

  return { width, height };
}

// A step's frames are played into one element, so the element is sized once
// to the largest of them rather than to each in turn.
export function canvasFramesSize(frames: CanvasFrame[]): CanvasSize {
  let width = 0;
  let height = 0;

  for (const frame of frames) {
    const bounds = frameBounds(frame);

    width = Math.max(width, bounds.width);
    height = Math.max(height, bounds.height);
  }

  return { width, height };
}

// `size` is held apart from the frame's own bounds so a structure growing
// mid-animation does not resize the element on every frame, which would make
// it jitter against its container.
export function renderCanvasFrame(
  canvas: HTMLCanvasElement,
  frame: CanvasFrame,
  size: CanvasSize,
) {
  const ratio = window.devicePixelRatio;
  const width = size.width + 2 * FRAME_MARGIN;
  const height = size.height + 2 * FRAME_MARGIN;

  // Assigning width/height clears the canvas and resets the context, so the
  // transform mapping CSS pixels onto the scaled backing store has to be set
  // after it — and the clear is why it is assigned every frame.
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx === null) return;

  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    FRAME_MARGIN * ratio,
    FRAME_MARGIN * ratio,
  );
  drawCanvasFrame(ctx, frame, canvasTheme());
}
