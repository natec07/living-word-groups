import "server-only";

/** Wrapping Date.now() here keeps the impurity out of component bodies. */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
