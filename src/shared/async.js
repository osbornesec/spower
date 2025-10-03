export const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export const poll = (resolver, timeout, onSuccess, onTimeout) => {
  if (typeof timeout !== 'number' || timeout <= 0) {
    throw new Error('timeout must be a positive number');
  }

  const attempt = () => {
    const result = resolver();
    if (result) {
      onSuccess?.(result);
      return true;
    }
    return false;
  };

  if (attempt()) {
    return;
  }

  let remaining = timeout - 100;
  const intervalId = setInterval(() => {
    if (attempt()) {
      clearInterval(intervalId);
      return;
    }

    if (remaining <= 0) {
      clearInterval(intervalId);
      onTimeout?.('time limit exceeded');
      return;
    }

    remaining -= 100;
  }, 100);
};
