import { mergeWithStoredConfig } from './storage.js';
import { buildIntervalRange } from './parsers.js';

const DEFAULT_UNLIKE_CONFIG = {
  unlikeIntervalMax: 8,
  unlikeIntervalMin: 4,
  unlikeLimit: '',
  unlikeMassLikedRequired: false,
  unlikeMinDaysSinceLike: 2,
};

export const loadUnlikeConfig = () => mergeWithStoredConfig(DEFAULT_UNLIKE_CONFIG);

export const normalizeUnlikeConfig = async () => {
  const config = await loadUnlikeConfig();

  config.intervalDurationRange = buildIntervalRange(
    config.unlikeIntervalMin,
    config.unlikeIntervalMax,
  );
  config.minDaysSinceLike = Number.parseFloat(config.unlikeMinDaysSinceLike);

  return config;
};

export const defaultUnlikeConfig = DEFAULT_UNLIKE_CONFIG;
