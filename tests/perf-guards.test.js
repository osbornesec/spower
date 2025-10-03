import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('perf helpers honour SPW_DEV flag', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when spw_dev flag is absent', async () => {
    const markSpy = vi.spyOn(performance, 'mark');
    const measureSpy = vi.spyOn(performance, 'measure');

    const { spwMark, spwMeasure } = await import('../utils/perf.js');

    spwMark('test-start');
    spwMeasure('test', 'test-start', 'test-end');

    expect(markSpy).not.toHaveBeenCalled();
    expect(measureSpy).not.toHaveBeenCalled();
  });

  it('emits marks and measures when spw_dev=1', async () => {
    localStorage.setItem('spw_dev', '1');
    const markSpy = vi.spyOn(performance, 'mark');
    const measureSpy = vi.spyOn(performance, 'measure');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.resetModules();
    const { spwMark, spwMeasure } = await import('../utils/perf.js');

    spwMark('perm-start');
    spwMark('perm-end');
    spwMeasure('range', 'perm-start', 'perm-end');

    expect(markSpy).toHaveBeenCalledTimes(2);
    expect(measureSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[SPW_PERF] range'));
  });

  it('handles errors in spwMeasure', async () => {
    localStorage.setItem('spw_dev', '1');
    const measureSpy = vi.spyOn(performance, 'measure').mockImplementation(() => {
      throw new Error('test error');
    });

    vi.resetModules();
    const { spwMeasure } = await import('../utils/perf.js');

    // This should not throw an error.
    spwMeasure('test', 'start', 'end');

    expect(measureSpy).toHaveBeenCalled();
  });
});
