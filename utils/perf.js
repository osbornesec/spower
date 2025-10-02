export const SPW_DEV = globalThis.localStorage?.getItem('spw_dev') === '1';

export const spwMark = (label) => {
  if (SPW_DEV && globalThis.performance) {
    performance.mark(label);
  }
};

export const spwMeasure = (name, start, end) => {
  if (!SPW_DEV || !globalThis.performance) return;
  try {
    performance.measure(name, start, end);
    const entry = performance.getEntriesByName(name).pop();
    if (entry) {
      console.log(`[SPW_PERF] ${name}: ${entry.duration.toFixed(1)}ms`);
    }
  } catch {}
};

export const spwDebounce = (fn, wait = 150) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
};

export const spwIdleInit = (fn) =>
  'requestIdleCallback' in globalThis
    ? requestIdleCallback(fn, { timeout: 100 })
    : setTimeout(fn, 0);
