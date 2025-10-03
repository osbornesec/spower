export const XF_DEV = globalThis.localStorage?.getItem('xf_dev') === '1';

export const xfMark = (label) => {
  if (XF_DEV && globalThis.performance) {
    performance.mark(label);
  }
};

export const xfMeasure = (name, start, end) => {
  if (!XF_DEV || !globalThis.performance) return;
  try {
    performance.measure(name, start, end);
    const entry = performance.getEntriesByName(name).pop();
    if (entry) {
      console.log(`[XF_PERF] ${name}: ${entry.duration.toFixed(1)}ms`);
    }
  } catch {}
};

export const xfDebounce = (fn, wait = 150) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
};

export const xfIdleInit = (fn) =>
  'requestIdleCallback' in globalThis
    ? requestIdleCallback(fn, { timeout: 100 })
    : setTimeout(fn, 0);