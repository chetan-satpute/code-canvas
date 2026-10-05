export interface ArgumentField {
  name: string;
  placeholder: string;
}

export interface StructureOperation {
  id: string;
  label: string;
  args: ArgumentField[];
}
