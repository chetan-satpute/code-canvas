// What a variable can hold. Only what the algorithms so far need: widen it
// when an algorithm passes something else.
export type CoreValue = number | number[];

export interface CoreVariable {
  name: string;
  value: CoreValue;
}

// One call stack entry as the explore page reads it: the plain snapshot of a
// `CoreCall`, the way a `CanvasFrame` is the snapshot of a structure.
export interface CallStackEntry {
  signature: string;
  // Name and value, scalars only. An array is read on the canvas and printed
  // whole in the signature, so memory does not repeat it.
  memory: [name: string, value: string][];
}

function formatValue(value: CoreValue): string {
  if (Array.isArray(value)) return `[${value.join(', ')}]`;

  return value.toString();
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
      .map((variable) => `${variable.name}: ${formatValue(variable.value)}`)
      .join(', ');

    return {
      signature: `${this.name}(${parameters})`,
      memory: this.variables
        .filter((variable) => !Array.isArray(variable.value))
        .map((variable) => [variable.name, formatValue(variable.value)]),
    };
  }
}
