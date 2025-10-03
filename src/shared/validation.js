import { daysSince } from './time.js';

export const evaluateUnlikeEligibility = (
  { isLiked, massLikeRecordCreatedAt },
  options,
  now = Date.now(),
) => {
  if (!isLiked) return undefined;

  if (options.unlikeMassLikedRequired && !massLikeRecordCreatedAt) {
    return 'has not been mass liked';
  }

  if (options.minDaysSinceLike && Number.isFinite(massLikeRecordCreatedAt)) {
    const days = daysSince(massLikeRecordCreatedAt, now);
    if (days < options.minDaysSinceLike) {
      return `${days.toFixed(2)} days since like, but ${options.minDaysSinceLike} minimum required`;
    }
  }

  return true;
};

export const evaluateUnretweetEligibility = (
  { isRetweeted, retweetCreatedAt, hasMassRetweetRecord },
  options,
  now = Date.now(),
) => {
  if (!isRetweeted) return undefined;

  if (options.minDaysSinceRetweet && Number.isFinite(retweetCreatedAt)) {
    const days = daysSince(retweetCreatedAt, now);
    if (days < options.minDaysSinceRetweet) {
      return `${days.toFixed(2)} days since retweet, but ${options.minDaysSinceRetweet} minimum required`;
    }
  }

  if (options.unretweetMassRetweetedRequired && !hasMassRetweetRecord) {
    return 'has not been mass retweeted';
  }

  return true;
};
