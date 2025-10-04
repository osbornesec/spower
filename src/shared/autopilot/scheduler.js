import { buildIntervalRange } from '../config/parsers.js';

export const loadFirstAutopilotAction = async (fetchActions) => {
  const actions = await fetchActions();
  return actions?.[0];
};

export const navigateToAutopilotAction = (
  action,
  { setCurrentActionId, buildProfileUrl, getCurrentUserScreenName, navigate },
) => {
  setCurrentActionId(action.id);

  switch (action.type) {
    case 'mass_follow':
    case 'mass_like':
    case 'mass_retweet':
      navigate(action.url);
      break;
    case 'mass_unfollow':
      navigate(buildProfileUrl(`/${getCurrentUserScreenName()}/following`));
      break;
    case 'mass_unlike':
      navigate(buildProfileUrl(`/${getCurrentUserScreenName()}/likes`));
      break;
    case 'mass_unretweet':
      navigate(buildProfileUrl(`/${getCurrentUserScreenName()}`));
      break;
    default:
      navigate(action.url);
  }
};

export const beginAutopilotAction = async ({
  clearSuspendedActions,
  loadNextAction,
  setPaused,
  onActionLoaded,
  computeBatchSize,
  renderProgress,
  showPanel,
  setupStatusBar,
  navigateAction,
}) => {
  clearSuspendedActions();
  const action = await loadNextAction();
  setPaused(false);
  if (!action) {
    return { action: undefined, batchSize: 0 };
  }
  onActionLoaded?.(action);

  const batchSize = await computeBatchSize();
  renderProgress(action.number, batchSize);
  showPanel();
  setupStatusBar();
  navigateAction(action);

  return { action, batchSize };
};

export const pickRandomDelaySeconds = (minMinutes, maxMinutes, selectValue) => {
  const min = Number.parseFloat(minMinutes);
  const max = Number.parseFloat(maxMinutes);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;

  const [lowerBoundMinutes, upperBoundMinutes] = min <= max ? [min, max] : [max, min];
  let seconds = 60 * lowerBoundMinutes;
  const target = 60 * upperBoundMinutes;
  const candidates = [seconds];
  while (seconds < target) {
    seconds += 60;
    candidates.push(seconds);
  }
  return selectValue(candidates);
};

export const scheduleAutopilotRepeat = async ({
  loadConfig,
  isProEnabled,
  selectDelaySeconds,
  showCountdown,
  runAction,
  isPaused,
}) => {
  const config = await loadConfig();
  if (!config?.autopilotRepeatAfter) return null;
  if (!(await isProEnabled())) return null;

  let remaining = selectDelaySeconds(
    config.autopilotRepeatAfter,
    config.autopilotRepeatAfterMax ?? config.autopilotRepeatAfter,
  );

  showCountdown(remaining);

  const timerId = setInterval(() => {
    if (isPaused()) {
      clearInterval(timerId);
      return;
    }

    remaining -= 1;
    showCountdown(remaining);

    if (remaining <= 0) {
      clearInterval(timerId);
      runAction();
    }
  }, 1_000);

  return timerId;
};

export const advanceAutopilotQueue = async ({
  currentAction,
  limit,
  fetchActions,
  getSuspendedTypes,
  loadConfig,
  selectRandomValue,
  sleep,
  showPauseTick,
  isPaused,
  showProgress,
  navigateAction,
  scheduleRepeat,
}) => {
  const actions = await fetchActions();
  if (!Array.isArray(actions) || !currentAction) {
    await scheduleRepeat();
    return undefined;
  }

  const suspendedTypes = getSuspendedTypes?.() ?? [];
  const queue = actions.filter(
    (action) => action.id === currentAction.id || !suspendedTypes.includes(action.type),
  );
  const currentIndex = queue.findIndex((action) => action.id === currentAction.id);
  const nextAction = currentIndex >= 0 ? queue[currentIndex + 1] : undefined;

  if (nextAction && (!Number.isFinite(limit) || nextAction.number <= limit)) {
    const config = await loadConfig();
    const pauseMin = config?.autopilotPauseAfterActionMin;
    const pauseMax = config?.autopilotPauseAfterActionMax;

    if (pauseMin && pauseMax) {
      let remaining = selectRandomValue(buildIntervalRange(pauseMin, pauseMax));

      while (remaining > 0) {
        if (isPaused()) return undefined;
        showPauseTick(remaining);
        remaining -= 100;
        await sleep(100);
      }

      if (isPaused()) return undefined;
    }

    showProgress(nextAction.number, limit);
    navigateAction(nextAction);
    return nextAction;
  }

  await scheduleRepeat();
  return undefined;
};
