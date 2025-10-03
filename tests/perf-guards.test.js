import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('perf helpers honour XF_DEV flag', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when xf_dev flag is absent', async () => {
    const markSpy = vi.spyOn(performance, 'mark');
    const measureSpy = vi.spyOn(performance, 'measure');

    const { xfMark, xfMeasure } = await import('../utils/perf.js');

    xfMark('test-start');
    xfMeasure('test', 'test-start', 'test-end');

    expect(markSpy).not.toHaveBeenCalled();
    expect(measureSpy).not.toHaveBeenCalled();
  });

  it('emits marks and measures when xf_dev=1', async () => {
    localStorage.setItem('xf_dev', '1');
    const markSpy = vi.spyOn(performance, 'mark');
    const measureSpy = vi.spyOn(performance, 'measure');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.resetModules();
    const { xfMark, xfMeasure } = await import('../utils/perf.js');

    xfMark('perm-start');
    xfMark('perm-end');
    xfMeasure('range', 'perm-start', 'perm-end');

    expect(markSpy).toHaveBeenCalledTimes(2);
    expect(measureSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[XF_PERF] range'));
  });

  it('handles errors in xfMeasure', async () => {
    localStorage.setItem('xf_dev', '1');
    const measureSpy = vi.spyOn(performance, 'measure').mockImplementation(() => {
      throw new Error('test error');
    });

    vi.resetModules();
    const { xfMeasure } = await import('../utils/perf.js');

    // This should not throw an error.
    xfMeasure('test', 'start', 'end');

    expect(measureSpy).toHaveBeenCalled();
  });
});