// Inclusive at both ends, which is how the callers read: "between 5 and 10
// elements" means either count is possible.
export function randomNumber(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function randomNumberArray(length: number): number[] {
  return Array.from({ length }, () => randomNumber(1, 99));
}
