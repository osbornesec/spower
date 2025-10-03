import { mergeWithStoredConfig } from './storage.js';
import { parseCsvList, buildIntervalRange, compileCsvRegex } from './parsers.js';

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
  config.skipLikedXTweetsFromUser = Number.parseInt(config.likeSkipLikedXTweetsFromUser, 10);
  config.tweetTextBlacklist = compileCsvRegex(config.likeTweetTextBlacklist);
  config.maxFollowing = Number.parseInt(config.likeMaxFollowing, 10);
  config.minFollowing = Number.parseInt(config.likeMinFollowing, 10);
  config.maxFollowers = Number.parseInt(config.likeMaxFollowers, 10);
  config.minFollowers = Number.parseInt(config.likeMinFollowers, 10);
  config.maxFollowersFollowingRatio = Number.parseFloat(config.likeMaxFollowersFollowingRatio);
  config.minFollowersFollowingRatio = Number.parseFloat(config.likeMinFollowersFollowingRatio);
  config.maxTweetLikes = Number.parseInt(config.likeMaxTweetLikes, 10);
  config.minTweetLikes = Number.parseInt(config.likeMinTweetLikes, 10);

  return config;
};

export const defaultLikeConfig = DEFAULT_LIKE_CONFIG;
