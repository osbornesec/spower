export const sleep = (milliseconds) =>
  new Promise((resolve) => {
    console.log(`Sleeping ${milliseconds} ms ...`);
    setTimeout(resolve, milliseconds);
  });

export const poll = (resolver, timeout, onSuccess, onTimeout) => {
  const result = resolver();
  if (result) {
    onSuccess(result);
    return;
  }

  if (typeof timeout === 'number') {
    if (timeout <= 0) {
      onTimeout('time limit exceeded');
      return;
    }
    setTimeout(() => poll(resolver, timeout - 100, onSuccess, onTimeout), 100);
    return;
  }

  setTimeout(() => poll(resolver, timeout, onSuccess, onTimeout), 100);
};
