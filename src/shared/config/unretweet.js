import { mergeWithStoredConfig } from './storage.js';
import { buildIntervalRange } from './parsers.js';

const DEFAULT_UNRETWEET_CONFIG = {
  unretweetIntervalMax: 8,
  unretweetIntervalMin: 4,
  unretweetLimit: '',
  unretweetMassRetweetedRequired: false,
  unretweetMinDaysSinceRetweet: 2,
};

export const loadUnretweetConfig = () => mergeWithStoredConfig(DEFAULT_UNRETWEET_CONFIG);

export const normalizeUnretweetConfig = async () => {
  const config = await loadUnretweetConfig();

  config.intervalDurationRange = buildIntervalRange(
    config.unretweetIntervalMin,
    config.unretweetIntervalMax,
  );
  config.minDaysSinceRetweet = Number.parseFloat(config.unretweetMinDaysSinceRetweet);

  return config;
};

export const defaultUnretweetConfig = DEFAULT_UNRETWEET_CONFIG;
