import { describe, it, expect } from 'vitest';

import {
  evaluateUnlikeEligibility,
  evaluateUnretweetEligibility,
} from '../src/shared/validation.js';

const NOW = Date.UTC(2024, 0, 31);

describe('evaluateUnlikeEligibility', () => {
  it('returns undefined when tweet is not liked', () => {
    const result = evaluateUnlikeEligibility(
      { isLiked: false, massLikeRecordCreatedAt: undefined },
      {},
      NOW,
    );
    expect(result).toBeUndefined();
  });

  it('requires mass-like record when configured', () => {
    const result = evaluateUnlikeEligibility(
      { isLiked: true, massLikeRecordCreatedAt: undefined },
      { unlikeMassLikedRequired: true },
      NOW,
    );
    expect(result).toBe('has not been mass liked');
  });

  it('enforces minimum days since like', () => {
    const threeDaysAgo = NOW - 3 * 24 * 60 * 60 * 1_000;
    const result = evaluateUnlikeEligibility(
      { isLiked: true, massLikeRecordCreatedAt: threeDaysAgo },
      { minDaysSinceLike: 5 },
      NOW,
    );
    expect(result).toBe('3.00 days since like, but 5 minimum required');
  });

  it('returns true when all conditions pass', () => {
    const result = evaluateUnlikeEligibility(
      { isLiked: true, massLikeRecordCreatedAt: NOW - 10 * 24 * 60 * 60 * 1_000 },
      { unlikeMassLikedRequired: true, minDaysSinceLike: 5 },
      NOW,
    );
    expect(result).toBe(true);
  });
});

describe('evaluateUnretweetEligibility', () => {
  it('returns undefined when tweet is not retweeted', () => {
    const result = evaluateUnretweetEligibility(
      { isRetweeted: false, retweetCreatedAt: undefined, hasMassRetweetRecord: true },
      {},
      NOW,
    );
    expect(result).toBeUndefined();
  });

  it('requires mass retweet record when configured', () => {
    const result = evaluateUnretweetEligibility(
      { isRetweeted: true, retweetCreatedAt: NOW, hasMassRetweetRecord: false },
      { unretweetMassRetweetedRequired: true },
      NOW,
    );
    expect(result).toBe('has not been mass retweeted');
  });

  it('enforces minimum days since retweet', () => {
    const result = evaluateUnretweetEligibility(
      {
        isRetweeted: true,
        retweetCreatedAt: NOW - 2 * 24 * 60 * 60 * 1_000,
        hasMassRetweetRecord: true,
      },
      { minDaysSinceRetweet: 5 },
      NOW,
    );
    expect(result).toBe('2.00 days since retweet, but 5 minimum required');
  });

  it('returns true when retweet passes all rules', () => {
    const result = evaluateUnretweetEligibility(
      {
        isRetweeted: true,
        retweetCreatedAt: NOW - 7 * 24 * 60 * 60 * 1_000,
        hasMassRetweetRecord: true,
      },
      { minDaysSinceRetweet: 5 },
      NOW,
    );
    expect(result).toBe(true);
  });
});
