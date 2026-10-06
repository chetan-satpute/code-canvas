import { NODE_HEIGHT, NODE_WIDTH } from '#canvas/elements/node.ts';
import { type CanvasFrame, createCanvasFrame } from '#canvas/frame.ts';
import { CoreEdge } from '#engine/elements/edge.ts';
import { CoreLabel } from '#engine/elements/label.ts';
import { CoreNode } from '#engine/elements/node.ts';

// Stands in for the engine until it exists: an array matching the placeholder
// memory card (`i` and `j` on cells 0 and 2) and a three-node tree, between
// them using every variant. Five cells wide and seven rows tall, which fits
// the canvas card on a 360px phone.
export function createPlaceholderFrame(): CanvasFrame {
  const frame = createCanvasFrame();

  const arrayName = new CoreLabel('array');
  arrayName.y = NODE_HEIGHT;
  arrayName.serialize(frame);

  const cells = [3, 5, 1, 8].map((value, index) => {
    const node = new CoreNode(value);
    node.x = (index + 1) * NODE_WIDTH;
    node.y = NODE_HEIGHT;
    node.setLabel('top', index.toString());

    return node;
  });

  cells[0].variant = 'secondary';
  cells[0].setLabel('bottom', 'i');
  cells[2].variant = 'tertiary';
  cells[2].setLabel('bottom', 'j');

  const treeY = 4 * NODE_HEIGHT;

  const treeName = new CoreLabel('tree');
  treeName.y = treeY;
  treeName.serialize(frame);

  const root = new CoreNode(5);
  root.x = 2 * NODE_WIDTH;
  root.y = treeY;
  root.setLabel('top', 'root');

  const left = new CoreNode(3);
  left.x = NODE_WIDTH;
  left.y = treeY + 2 * NODE_HEIGHT;
  left.variant = 'success';

  const right = new CoreNode(8);
  right.x = 3 * NODE_WIDTH;
  right.y = treeY + 2 * NODE_HEIGHT;
  right.variant = 'danger';

  new CoreEdge(root, left).serialize(frame);
  new CoreEdge(root, right).serialize(frame);

  for (const node of [...cells, root, left, right]) node.serialize(frame);

  return frame;
}
