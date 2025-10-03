import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { spwIdleInit } from '../utils/perf.js';

describe('spwIdleInit', () => {
  let originalRequestIdleCallback;

  beforeEach(() => {
    vi.useFakeTimers();
    originalRequestIdleCallback = globalThis.requestIdleCallback;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalRequestIdleCallback === undefined) {
      delete globalThis.requestIdleCallback;
    } else {
      globalThis.requestIdleCallback = originalRequestIdleCallback;
    }
  });

  it('uses requestIdleCallback when available', () => {
    const fn = vi.fn();
    globalThis.requestIdleCallback = vi.fn((cb) => cb());

    spwIdleInit(fn);

    expect(globalThis.requestIdleCallback).toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();
  });

  it('falls back to setTimeout when requestIdleCallback is missing', () => {
    delete globalThis.requestIdleCallback;

    const fn = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    spwIdleInit(fn);

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

    vi.runAllTimers();

    expect(fn).toHaveBeenCalled();
  });
});
