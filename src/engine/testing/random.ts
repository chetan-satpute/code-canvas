import { onTestFinished, vi } from 'vitest';

// Stands a Park–Miller generator in for `Math.random` until the test ends, so
// a test over random input fails the same way on every run.
export function seedRandom(seed: number) {
  let state = seed;

  const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
    state = (state * 16807) % (2 ** 31 - 1);

    return (state - 1) / (2 ** 31 - 2);
  });

  onTestFinished(() => spy.mockRestore());
}
