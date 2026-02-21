export function createTaskQueue(concurrency = 1) {
  let running = 0;
  const queue = [];

  const runNext = () => {
    if (running >= concurrency || queue.length === 0) return;
    const { task, resolve, reject } = queue.shift();
    running += 1;
    Promise.resolve()
      .then(task)
      .then((result) => resolve(result))
      .catch((err) => reject(err))
      .finally(() => {
        running -= 1;
        runNext();
      });
  };

  const enqueue = (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      runNext();
    });

  return { enqueue };
}
