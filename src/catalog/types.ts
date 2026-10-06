import type { ArgumentKind } from '#utils/argument.ts';

export interface ArgumentField {
  name: string;
  placeholder: string;
  // Defaults to any finite number.
  kind?: ArgumentKind;
}

export interface StructureOperation {
  id: string;
  label: string;
  args: ArgumentField[];
}
