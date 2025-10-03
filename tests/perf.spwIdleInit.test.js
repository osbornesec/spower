import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spwIdleInit } from '../utils/perf';

describe('spwIdleInit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should use requestIdleCallback when available', () => {
    const fn = vi.fn();
    globalThis.requestIdleCallback = vi.fn((cb) => cb());

    spwIdleInit(fn);

    expect(globalThis.requestIdleCallback).toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();

    delete globalThis.requestIdleCallback;
  });

  it('should use setTimeout as a fallback', () => {
    const fn = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    spwIdleInit(fn);

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

    vi.runAllTimers();

    expect(fn).toHaveBeenCalled();
  });
});