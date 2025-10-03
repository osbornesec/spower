import { describe, it, expect, vi, afterEach } from 'vitest';

import { xfDebounce } from '../utils/perf.js';

describe('xfDebounce helper', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces consecutive calls and only invokes the latest arguments', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const debounced = xfDebounce(handler, 100);

    debounced('first');
    debounced('second');

    vi.advanceTimersByTime(99);
    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('second');
  });

  it('uses the default wait when none is provided', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const debounced = xfDebounce(handler);

    debounced();
    vi.advanceTimersByTime(149);
    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
