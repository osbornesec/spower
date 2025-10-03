import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  loadFirstAutopilotAction,
  navigateToAutopilotAction,
  pickRandomDelaySeconds,
  scheduleAutopilotRepeat,
  advanceAutopilotQueue,
} from '../src/shared/autopilot/scheduler.js';

describe('autopilot scheduler helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads the first autopilot action', async () => {
    const fetchActions = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await expect(loadFirstAutopilotAction(fetchActions)).resolves.toEqual({ id: 1 });
    expect(fetchActions).toHaveBeenCalled();
  });

  it('navigates to the correct target for follow-like actions', () => {
    const navigate = vi.fn();
    const setCurrentActionId = vi.fn();
    navigateToAutopilotAction(
      { id: 'a', type: 'mass_like', url: '/somewhere' },
      {
        setCurrentActionId,
        buildProfileUrl: (path) => path,
        getCurrentUserScreenName: () => 'me',
        navigate,
      },
    );
    expect(setCurrentActionId).toHaveBeenCalledWith('a');
    expect(navigate).toHaveBeenCalledWith('/somewhere');
  });

  it('navigates to the profile-derived targets for unlike/unretweet', () => {
    const navigate = vi.fn();
    navigateToAutopilotAction(
      { id: 'b', type: 'mass_unretweet', url: '/unused' },
      {
        setCurrentActionId: () => {},
        buildProfileUrl: (path) => `https://x.com${path}`,
        getCurrentUserScreenName: () => 'me',
        navigate,
      },
    );
    expect(navigate).toHaveBeenCalledWith('https://x.com/me');
  });

  it('builds a random delay using minute inputs', () => {
    const selectValue = vi.fn().mockReturnValue(180);
    const seconds = pickRandomDelaySeconds('2', '3', selectValue);
    expect(selectValue).toHaveBeenCalled();
    expect(seconds).toBe(180);
  });

  it('schedules a repeat when configuration is present', async () => {
    const runAction = vi.fn();
    const timerId = await scheduleAutopilotRepeat({
      loadConfig: async () => ({ autopilotRepeatAfter: '1', autopilotRepeatAfterMax: '1' }),
      isProEnabled: async () => true,
      selectDelaySeconds: () => 5,
      showCountdown: vi.fn(),
      runAction,
      isPaused: () => false,
    });

    expect(timerId).not.toBeNull();
    vi.advanceTimersByTime(5_000);
    expect(runAction).toHaveBeenCalled();
  });

  it('returns null when repeat configuration missing', async () => {
    const result = await scheduleAutopilotRepeat({
      loadConfig: async () => ({ autopilotRepeatAfter: '' }),
      isProEnabled: async () => true,
      selectDelaySeconds: () => 1,
      showCountdown: vi.fn(),
      runAction: vi.fn(),
      isPaused: () => false,
    });
    expect(result).toBeNull();
  });

  it('advances to the next action and honours pause settings', async () => {
    const showPauseTick = vi.fn();
    const showProgress = vi.fn();
    const navigateAction = vi.fn();
    const scheduleRepeat = vi.fn();

    await advanceAutopilotQueue({
      currentAction: { id: '1', number: 1, type: 'mass_follow' },
      limit: 5,
      fetchActions: async () => [
        { id: '1', number: 1, type: 'mass_follow', url: '/one' },
        { id: '2', number: 2, type: 'mass_like', url: '/two' },
      ],
      getSuspendedTypes: () => [],
      loadConfig: async () => ({
        autopilotPauseAfterActionMin: '0.1',
        autopilotPauseAfterActionMax: '0.1',
      }),
      selectRandomValue: () => 100,
      sleep: vi.fn().mockResolvedValue(undefined),
      showPauseTick,
      isPaused: () => false,
      showProgress,
      navigateAction,
      scheduleRepeat,
    });

    expect(showPauseTick).toHaveBeenCalledWith(100);
    expect(showProgress).toHaveBeenCalledWith(2, 5);
    expect(navigateAction).toHaveBeenCalledWith({
      id: '2',
      number: 2,
      type: 'mass_like',
      url: '/two',
    });
    expect(scheduleRepeat).not.toHaveBeenCalled();
  });

  it('schedules repeat when queue is exhausted', async () => {
    const scheduleRepeat = vi.fn();
    await advanceAutopilotQueue({
      currentAction: { id: '2', number: 2, type: 'mass_like' },
      limit: 5,
      fetchActions: async () => [{ id: '2', number: 2, type: 'mass_like', url: '/two' }],
      getSuspendedTypes: () => [],
      loadConfig: async () => ({}),
      selectRandomValue: () => 0,
      sleep: vi.fn(),
      showPauseTick: vi.fn(),
      isPaused: () => false,
      showProgress: vi.fn(),
      navigateAction: vi.fn(),
      scheduleRepeat,
    });
    expect(scheduleRepeat).toHaveBeenCalled();
  });
});
