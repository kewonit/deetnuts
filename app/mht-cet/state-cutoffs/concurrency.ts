export async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  if (tasks.length === 0) {
    return [];
  }

  const concurrency = Math.max(1, Math.floor(limit));
  const results = new Array<T>(tasks.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < tasks.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      results[currentIndex] = await tasks[currentIndex]();
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () =>
      runWorker(),
    ),
  );

  return results;
}
