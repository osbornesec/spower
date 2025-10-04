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
    const callbackSpy = vi.fn();
    globalThis.requestIdleCallback = vi.fn((callback) => callback());

    xfIdleInit(callbackSpy);

    expect(globalThis.requestIdleCallback).toHaveBeenCalled();
    expect(callbackSpy).toHaveBeenCalled();
  });

  it('falls back to setTimeout when requestIdleCallback is missing', () => {
    delete globalThis.requestIdleCallback;

    const callbackSpy = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    xfIdleInit(callbackSpy);

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

    vi.runAllTimers();

    expect(callbackSpy).toHaveBeenCalled();
  });
});
