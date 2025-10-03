import { mergeWithStoredConfig } from './storage.js';
import { parseCsvList, buildIntervalRange, compileCsvRegex } from './parsers.js';

const DEFAULT_RETWEET_CONFIG = {
  retweetIntervalMax: 8,
  retweetIntervalMin: 4,
  retweetLanguageWhitelist: '',
  retweetLimit: 1000,
  retweetPauseWhenUnableToRetweet: 10,
  retweetSkipFollowed: false,
  retweetSkipReplies: false,
  retweetSkipRetweets: false,
  retweetSkipRetweetsWithComment: false,
  retweetTweetTextBlacklist: '',
};

export const loadRetweetConfig = () => mergeWithStoredConfig(DEFAULT_RETWEET_CONFIG);

export const normalizeRetweetConfig = async () => {
  const config = await loadRetweetConfig();

  config.languageWhitelist = parseCsvList(config.retweetLanguageWhitelist);
  config.intervalDurationRange = buildIntervalRange(
    config.retweetIntervalMin,
    config.retweetIntervalMax,
  );
  config.tweetTextBlacklist = compileCsvRegex(config.retweetTweetTextBlacklist);

  return config;
};

export const defaultRetweetConfig = DEFAULT_RETWEET_CONFIG;
