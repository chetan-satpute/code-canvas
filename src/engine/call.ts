// A structure with no literal to print, such as a linked list. The signature
// names it bare, `insertHead(list, value: 42)`, and memory leaves it out: it
// is read on the canvas.
export const STRUCTURE = Symbol('structure');

// What a variable can hold. Only what the algorithms so far need: widen it
// when an algorithm passes something else.
export type CoreValue = number | number[] | typeof STRUCTURE;

export interface CoreVariable {
  name: string;
  value: CoreValue;
}

// One call stack entry as the explore page reads it: the plain snapshot of a
// `CoreCall`, the way a `CanvasFrame` is the snapshot of a structure.
export interface CallStackEntry {
  signature: string;
  // Name and value, scalars only. An array or a structure is read on the
  // canvas, and an array is printed whole in the signature too, so memory
  // repeats neither.
  memory: [name: string, value: string][];
}

function formatValue(value: number | number[]): string {
  if (Array.isArray(value)) return `[${value.join(', ')}]`;

  return value.toString();
}

function formatParameter({ name, value }: CoreVariable): string {
  if (value === STRUCTURE) return name;

  return `${name}: ${formatValue(value)}`;
}

// One function call in progress, and everything the reader sees of it: its
// signature in the call stack, and its variables in memory.
export class CoreCall {
  readonly name: string;

  // Parameters first, in declaration order, then locals in the order they
  // were first set.
  private variables: CoreVariable[];

  private readonly parameterCount: number;

  constructor(name: string, parameters: CoreVariable[]) {
    this.name = name;

    this.variables = [...parameters];
    this.parameterCount = parameters.length;
  }

  // Declares a local, or updates an existing variable in place. Setting a
  // parameter updates the signature too, so an algorithm that reassigns an
  // argument keeps the signature true.
  set(name: string, value: CoreValue) {
    const existing = this.variables.find((variable) => variable.name === name);

    if (existing === undefined) this.variables.push({ name, value });
    else existing.value = value;
  }

  // Drops a local that has gone out of scope. Parameters live as long as the
  // call, so they are never dropped.
  clear(name: string) {
    const index = this.variables.findIndex(
      (variable) => variable.name === name,
    );

    if (index < this.parameterCount) return;

    this.variables.splice(index, 1);
  }

  serialize(): CallStackEntry {
    const parameters = this.variables
      .slice(0, this.parameterCount)
      .map(formatParameter)
      .join(', ');

    const memory: CallStackEntry['memory'] = [];

    for (const { name, value } of this.variables)
      if (typeof value === 'number') memory.push([name, formatValue(value)]);

    return { signature: `${this.name}(${parameters})`, memory };
  }
}
