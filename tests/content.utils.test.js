import { describe, it, expect } from 'vitest';

import { deepGet, requireKey } from '../src/shared/object.js';
import { parseTimelineTweets } from '../src/shared/timeline.js';
import { formatDuration, formatDurationWithMillis } from '../src/shared/time.js';
import { resolveRestId } from '../src/shared/twitter.js';
import {
  appendSuspendedAutopilotAction,
  getSuspendedAutopilotActions,
} from '../src/shared/session.js';
import {
  getFollowerCount,
  getFollowingCount,
  isFollowedByPerspective,
  followersToFollowingRatio,
} from '../src/shared/user.js';
import {
  buildActiveActionMessage,
  buildAutopilotProgressMessage,
  buildFollowLimitMessage,
  buildPauseMessage,
  buildRepeatAutopilotMessage,
  buildResumeAutopilotMessage,
  buildSuccessMessage,
  buildLimitReachedMessage,
} from '../src/shared/messages.js';

describe('shared helper behaviour', () => {
  describe('formatDuration', () => {
    it('returns raw seconds when the value is under a minute', () => {
      expect(formatDuration(42)).toBe('42');
      expect(formatDuration(0)).toBe('0');
    });

    it('formats minutes and seconds with zero padding', () => {
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(125)).toBe('2:05');
    });

    it('formats hours when the duration exceeds sixty minutes', () => {
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(7322)).toBe('2:02:02');
    });
  });

  describe('formatDurationWithMillis', () => {
    it('appends millisecond precision to formatted seconds', () => {
      expect(formatDurationWithMillis(1500)).toBe('1.500');
      expect(formatDurationWithMillis(61542)).toBe('1:01.542');
    });
  });

  describe('deepGet helper', () => {
    it('walks nested structures when all keys are present', () => {
      const source = { a: { b: { c: 7 } } };
      expect(deepGet(source, 'a', 'b', 'c')).toBe(7);
    });

    it('returns undefined when any step is missing', () => {
      const source = { a: {} };
      expect(deepGet(source, 'a', 'x', 'y')).toBeUndefined();
    });

    it('does not throw when encountering nullish segments', () => {
      const source = { a: null };
      expect(() => deepGet(source, 'a', 'b')).not.toThrow();
      expect(deepGet(source, 'a', 'b')).toBeUndefined();
    });
  });

  describe('requireKey helper', () => {
    it('returns the value when the key exists', () => {
      const source = { name: 'xf' };
      expect(requireKey(source, 'name')).toBe('xf');
    });

    it('throws when the property is missing', () => {
      const source = {};
      expect(() => requireKey(source, 'missing')).toThrow(/missing/);
    });
  });

  describe('parseTimelineTweets', () => {
    it('collects tweet payloads from TimelineAddEntries instructions', () => {
      const tweetEntity = { rest_id: '1', legacy: { full_text: 'tweet' } };
      const hiddenTweet = { __typename: 'TweetWithVisibilityResults', tweet: { rest_id: '2' } };

      const payload = {
        data: {
          list: {
            tweets_timeline: {
              timeline: {
                instructions: [
                  {
                    type: 'TimelineAddEntries',
                    entries: [
                      { content: { itemContent: { tweet_results: { result: tweetEntity } } } },
                      { content: { itemContent: { tweet_results: { result: hiddenTweet } } } },
                    ],
                  },
                ],
              },
            },
          },
        },
      };

      expect(parseTimelineTweets(payload)).toEqual([tweetEntity, hiddenTweet.tweet]);
    });

    it('returns undefined when no instructions exist', () => {
      const payload = { data: { home: {} } };
      expect(parseTimelineTweets(payload)).toBeUndefined();
    });

    it('ignores entries without tweet results', () => {
      const payload = {
        data: {
          home: {
            home_timeline_urt: {
              instructions: [
                {
                  type: 'TimelineAddEntries',
                  entries: [{ content: { itemContent: {} } }],
                },
              ],
            },
          },
        },
      };

      expect(parseTimelineTweets(payload)).toEqual([]);
    });

    it('parses TweetDetail threaded conversation instructions', () => {
      const tweetEntity = { rest_id: '42', legacy: { full_text: 'conversation tweet' } };
      const payload = {
        data: {
          threaded_conversation_with_injections: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  { content: { itemContent: { tweet_results: { result: tweetEntity } } } },
                ],
              },
            ],
          },
        },
      };

      expect(parseTimelineTweets(payload)).toEqual([tweetEntity]);
    });

    it('collects tweet payloads from TimelineAddToModule instructions', () => {
      const tweetEntity = { rest_id: '7', legacy: { full_text: 'module tweet' } };
      const payload = {
        data: {
          threaded_conversation_with_injections_v2: {
            instructions: [
              {
                type: 'TimelineAddToModule',
                moduleItems: [
                  { item: { itemContent: { tweet_results: { result: tweetEntity } } } },
                ],
              },
            ],
          },
        },
      };

      expect(parseTimelineTweets(payload)).toEqual([tweetEntity]);
    });
  });

  describe('resolveRestId', () => {
    it('returns the rest_id when present', () => {
      expect(resolveRestId({ rest_id: '123' })).toBe('123');
    });

    it('dives through nested structures to resolve the id', () => {
      const payload = { result: { tweet: { tweet_results: { result: { rest_id: '789' } } } } };
      expect(resolveRestId(payload)).toBe('789');
    });

    it('returns undefined when no id exists', () => {
      expect(resolveRestId({})).toBeUndefined();
    });
  });

  describe('suspended autopilot helpers', () => {
    it('returns an empty array when no data is stored', () => {
      const storage = new Map();
      storage.getItem = storage.get.bind(storage);
      storage.setItem = storage.set.bind(storage);

      expect(getSuspendedAutopilotActions(storage)).toEqual([]);
    });

    it('appends action types and persists them to storage', () => {
      const storage = new Map();
      storage.getItem = storage.get.bind(storage);
      storage.setItem = storage.set.bind(storage);

      appendSuspendedAutopilotAction('follow', storage);
      appendSuspendedAutopilotAction('like', storage);

      expect(getSuspendedAutopilotActions(storage)).toEqual(['follow', 'like']);
    });
  });

  describe('user helpers', () => {
    const user = { legacy: { followers_count: 100, friends_count: 20 } };

    it('returns follower count', () => {
      expect(getFollowerCount(user)).toBe(100);
    });

    it('returns following count', () => {
      expect(getFollowingCount(user)).toBe(20);
    });

    it('calculates follower/following ratio', () => {
      expect(followersToFollowingRatio(user)).toBe(5);
    });

    it('detects followed relationship perspective', () => {
      expect(isFollowedByPerspective({ relationship_perspectives: { followed_by: 1 } })).toBe(true);
      expect(isFollowedByPerspective({ relationship_perspectives: { followed_by: 0 } })).toBe(
        false,
      );
    });
  });

  describe('status message helpers', () => {
    it('builds resume and repeat messages', () => {
      expect(buildResumeAutopilotMessage(1500)).toBe('Continuing autopilot in 1.500 ...');
      expect(buildRepeatAutopilotMessage(120)).toBe('Repeating autopilot in 2:00 ...');
    });

    it('builds pause and limit messages', () => {
      expect(buildPauseMessage('like', 90)).toBe('Unable to like. Continuing in 1:30 ...');
      expect(buildFollowLimitMessage(60)).toBe(
        'Twitter follow limit exceeded. Continuing in 1:00 ...',
      );
    });

    it('builds autopilot progress and success messages', () => {
      expect(buildAutopilotProgressMessage(2, 5)).toBe('Autopilot 2/5 ...');
      expect(buildSuccessMessage('retweet', 7)).toBe('Successfully retweeted 7 Tweets');
    });

    it('builds daily limit reached message', () => {
      expect(buildLimitReachedMessage(123)).toBe('You have reached the daily limit of 123');
    });

    it('builds active action messages', () => {
      expect(buildActiveActionMessage('follow', 3, 10)).toBe('Follow 3/10 ...');
      expect(buildActiveActionMessage('like', 5)).toBe('Like 5 ...');
    });
  });
});
