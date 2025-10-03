import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { xfIdleInit } from '../utils/perf.js';

describe('xfIdleInit', () => {
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

    xfIdleInit(fn);

    expect(globalThis.requestIdleCallback).toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();
  });

  it('falls back to setTimeout when requestIdleCallback is missing', () => {
    delete globalThis.requestIdleCallback;

    const fn = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    xfIdleInit(fn);

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

    vi.runAllTimers();

    expect(fn).toHaveBeenCalled();
  });
});