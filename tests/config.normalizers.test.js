import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { normalizeLikeConfig } from '../src/shared/config/like.js';
import { normalizeRetweetConfig } from '../src/shared/config/retweet.js';
import { normalizeUnlikeConfig } from '../src/shared/config/unlike.js';
import { normalizeUnretweetConfig } from '../src/shared/config/unretweet.js';
import { buildIntervalRange, parseCsvList, compileCsvRegex } from '../src/shared/config/parsers.js';

const mockStorage = (syncPayload, localPayload) => {
  chrome.storage = {
    sync: {
      get: vi.fn((keys, callback) => {
        callback(typeof syncPayload === 'function' ? syncPayload(keys) : syncPayload);
      }),
    },
    local: {
      get: vi.fn((keys, callback) => {
        callback(typeof localPayload === 'function' ? localPayload(keys) : localPayload);
      }),
    },
  };
};

describe('config normalisers', () => {
  beforeEach(() => {
    global.chrome = { storage: { sync: { get: vi.fn() }, local: { get: vi.fn() } } };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.chrome;
  });

  it('normalises like config values', async () => {
    mockStorage(
      {},
      {
        likeLanguageWhitelist: 'en, es',
        likeIntervalMin: '3',
        likeIntervalMax: '4',
        likeSkipLikedXTweetsFromUser: '5',
        likeTweetTextBlacklist: 'foo, bar',
        likeMaxFollowing: '100',
        likeMinFollowing: '10',
        likeMaxFollowers: '200',
        likeMinFollowers: '20',
        likeMaxFollowersFollowingRatio: '1.5',
        likeMinFollowersFollowingRatio: '0.2',
        likeMaxTweetLikes: '500',
        likeMinTweetLikes: '5',
      },
    );

    const config = await normalizeLikeConfig();

    expect(config.languageWhitelist).toEqual(parseCsvList('en, es'));
    expect(config.intervalDurationRange).toEqual(buildIntervalRange('3', '4'));
    expect(config.skipLikedXTweetsFromUser).toBe(5);
    expect(config.tweetTextBlacklist).toEqual(compileCsvRegex('foo, bar'));
    expect(config.maxFollowing).toBe(100);
    expect(config.minFollowing).toBe(10);
    expect(config.maxFollowers).toBe(200);
    expect(config.minFollowers).toBe(20);
    expect(config.maxFollowersFollowingRatio).toBeCloseTo(1.5);
    expect(config.minFollowersFollowingRatio).toBeCloseTo(0.2);
    expect(config.maxTweetLikes).toBe(500);
    expect(config.minTweetLikes).toBe(5);
  });

  it('normalises retweet config values', async () => {
    mockStorage(
      {},
      {
        retweetLanguageWhitelist: 'en, fr',
        retweetIntervalMin: '2',
        retweetIntervalMax: '3',
        retweetTweetTextBlacklist: 'spam',
      },
    );

    const config = await normalizeRetweetConfig();

    expect(config.languageWhitelist).toEqual(parseCsvList('en, fr'));
    expect(config.intervalDurationRange).toEqual(buildIntervalRange('2', '3'));
    expect(config.tweetTextBlacklist).toEqual(compileCsvRegex('spam'));
  });

  it('normalises unlike config values', async () => {
    mockStorage(
      {},
      {
        unlikeIntervalMin: '4',
        unlikeIntervalMax: '5',
        unlikeMinDaysSinceLike: '7.5',
      },
    );

    const config = await normalizeUnlikeConfig();

    expect(config.intervalDurationRange).toEqual(buildIntervalRange('4', '5'));
    expect(config.minDaysSinceLike).toBeCloseTo(7.5);
  });

  it('normalises unretweet config values', async () => {
    mockStorage(
      {},
      {
        unretweetIntervalMin: '6',
        unretweetIntervalMax: '7',
        unretweetMinDaysSinceRetweet: '9.25',
      },
    );

    const config = await normalizeUnretweetConfig();

    expect(config.intervalDurationRange).toEqual(buildIntervalRange('6', '7'));
    expect(config.minDaysSinceRetweet).toBeCloseTo(9.25);
  });
});
