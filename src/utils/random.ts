// Inclusive at both ends, which is how the callers read: "between 5 and 10
// elements" means either count is possible.
export function randomNumber(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomValue(): number {
  return randomNumber(1, 99);
}

export function randomNumberArray(length: number): number[] {
  return Array.from({ length }, randomValue);
}

// For a structure whose operations name a node by its value, where a repeated
// value would make the name ambiguous.
export function uniqueRandomNumberArray(length: number): number[] {
  // Only 99 distinct values exist, and past that the loop below never ends.
  if (length > 99)
    throw new RangeError(`No ${length} distinct values between 1 and 99`);

  const values = new Set<number>();

  while (values.size < length) values.add(randomValue());

  return [...values];
}
