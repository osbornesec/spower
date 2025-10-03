import { describe, it, expect, vi, afterEach } from 'vitest';

import { sleep, poll } from '../src/shared/async.js';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('sleep helper', () => {
  it('resolves after the requested delay', async () => {
    vi.useFakeTimers();
    const spy = vi.fn();

    const promise = sleep(250).then(spy);

    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(249);
    await Promise.resolve();
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await promise;
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('poll helper', () => {
  it('invokes the success callback when resolver yields a value', () => {
    vi.useFakeTimers();

    const resolver = vi
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(null)
      .mockReturnValue('ready');
    const onSuccess = vi.fn();
    const onTimeout = vi.fn();

    poll(resolver, 500, onSuccess, onTimeout);

    expect(resolver).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(resolver).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(100);
    expect(resolver).toHaveBeenCalledTimes(3);
    expect(onSuccess).toHaveBeenCalledWith('ready');
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('invokes the timeout callback once the limit is exhausted', () => {
    vi.useFakeTimers();

    const resolver = vi.fn().mockReturnValue(undefined);
    const onSuccess = vi.fn();
    const onTimeout = vi.fn();

    poll(resolver, 200, onSuccess, onTimeout);

    expect(resolver).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(resolver).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(100);
    expect(onTimeout).toHaveBeenCalledWith('time limit exceeded');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
