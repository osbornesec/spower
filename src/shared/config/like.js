import { mergeWithStoredConfig } from './storage.js';
import { parseCsvList, buildIntervalRange, compileCsvRegex } from './parsers.js';

const parseIntOrFallback = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseFloatOrFallback = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const DEFAULT_LIKE_CONFIG = {
  likeMaxFollowers: '',
  likeMaxFollowersFollowingRatio: '',
  likeMaxFollowing: '',
  likeMaxTweetLikes: '',
  likeMinFollowers: '',
  likeMinFollowing: '',
  likeMinFollowersFollowingRatio: '',
  likeMinTweetLikes: '',
  likeIntervalMax: 8,
  likeIntervalMin: 4,
  likeLanguageWhitelist: '',
  likeLimit: 1000,
  likePauseWhenUnableToLike: 10,
  likeSkipFollowed: false,
  likeSkipReplies: false,
  likeSkipRetweets: false,
  likeSkipRetweetsWithComment: false,
  likeSkipLikedXTweetsFromUser: '',
  likeTweetTextBlacklist: '',
};

export const loadLikeConfig = () => mergeWithStoredConfig(DEFAULT_LIKE_CONFIG);

export const normalizeLikeConfig = async () => {
  const config = await loadLikeConfig();

  config.languageWhitelist = parseCsvList(config.likeLanguageWhitelist);
  config.intervalDurationRange = buildIntervalRange(config.likeIntervalMin, config.likeIntervalMax);
  config.skipLikedXTweetsFromUser = parseIntOrFallback(config.likeSkipLikedXTweetsFromUser, 0);
  const blacklistCsv =
    typeof config.likeTweetTextBlacklist === 'string' ? config.likeTweetTextBlacklist : '';
  config.tweetTextBlacklist = compileCsvRegex(blacklistCsv);
  config.maxFollowing = parseIntOrFallback(config.likeMaxFollowing, undefined);
  config.minFollowing = parseIntOrFallback(config.likeMinFollowing, undefined);
  config.maxFollowers = parseIntOrFallback(config.likeMaxFollowers, undefined);
  config.minFollowers = parseIntOrFallback(config.likeMinFollowers, undefined);
  config.maxFollowersFollowingRatio = parseFloatOrFallback(
    config.likeMaxFollowersFollowingRatio,
    undefined,
  );
  config.minFollowersFollowingRatio = parseFloatOrFallback(
    config.likeMinFollowersFollowingRatio,
    undefined,
  );
  config.maxTweetLikes = parseIntOrFallback(config.likeMaxTweetLikes, undefined);
  config.minTweetLikes = parseIntOrFallback(config.likeMinTweetLikes, undefined);

  return config;
};

export const defaultLikeConfig = DEFAULT_LIKE_CONFIG;
