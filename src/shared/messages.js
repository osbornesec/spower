import { formatDuration, formatDurationWithMillis } from './time.js';

const ACTION_LABELS = {
  follow: 'follow',
  unfollow: 'unfollow',
  like: 'like',
  retweet: 'retweet',
  unretweet: 'unretweet',
  unlike: 'unlike',
};

const actionLabel = (action) => ACTION_LABELS[action] ?? action ?? 'perform the next action';

export const buildResumeAutopilotMessage = (milliseconds) =>
  `Continuing autopilot in ${formatDurationWithMillis(milliseconds)} ...`;

export const buildFollowLimitMessage = (waitSeconds) =>
  `Twitter follow limit exceeded. Continuing in ${formatDuration(waitSeconds)} ...`;

export const buildPauseMessage = (action, waitSeconds) =>
  `Unable to ${actionLabel(action)}. Continuing in ${formatDuration(waitSeconds)} ...`;

export const buildRepeatAutopilotMessage = (seconds) =>
  `Repeating autopilot in ${formatDuration(seconds)} ...`;

export const buildAutopilotProgressMessage = (current, total) =>
  `Autopilot ${current}/${total} ...`;

export const buildSuccessMessage = (action, count) => {
  switch (action) {
    case 'follow':
      return `Successfully followed ${count} users`;
    case 'unfollow':
      return `Successfully unfollowed ${count} users`;
    case 'like':
      return `Successfully liked ${count} Tweets`;
    case 'retweet':
      return `Successfully retweeted ${count} Tweets`;
    case 'unretweet':
      return `Successfully unretweeted ${count} Tweets`;
    case 'unlike':
      return `Successfully unliked ${count} Tweets`;
    default:
      return `Completed ${count} actions`;
  }
};

export const buildLimitReachedMessage = (limit) => `You have reached the daily limit of ${limit}`;

export const buildActiveActionMessage = (action, progress, total) => {
  const label = actionLabel(action);
  const suffix = total ? `${progress}/${total}` : progress;
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${suffix} ...`;
};
