import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const contentCode = fs.readFileSync(path.resolve(__dirname, '../content.js'), 'utf8');

const extractFormatDuration = () => {
  const match = contentCode.match(/const c=(e=>{[\s\S]*?});const u=/);
  if (!match) throw new Error('Unable to locate formatDuration implementation');
  return eval(`(${match[1]})`);
};

const extractDeepGet = () => {
  const match = contentCode.match(/function b\(e,...t\)({[\s\S]*?})function F/);
  if (!match) throw new Error('Unable to locate deep getter implementation');
  return eval(`(function(e,...t)${match[1]})`);
};

const extractTimelineParser = (deepGetFn) => {
  const match = contentCode.match(/function M\(e\)({[\s\S]*?})const I=/);
  if (!match) throw new Error('Unable to locate timeline extractor');
  // Ensure the evaluated function closes over the same deepGet helper that production code uses.
  return eval(`((helper) => { const b = helper; return function(e)${match[1]}; })`)(deepGetFn);
};

describe('content.js utility behaviour', () => {
  const formatDuration = extractFormatDuration();
  const deepGet = extractDeepGet();
  const parseTimelineTweets = extractTimelineParser(deepGet);

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

  describe('deepGet helper', () => {
    it('walks nested structures when all keys are present', () => {
      const source = { a: { b: { c: 7 } } };
      expect(deepGet(source, 'a', 'b', 'c')).toBe(7);
    });

    it('returns undefined when any step is missing', () => {
      const source = { a: {} };
      expect(deepGet(source, 'a', 'x', 'y')).toBeUndefined();
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

      expect(parseTimelineTweets(payload)).toEqual([
        tweetEntity,
        hiddenTweet.tweet,
      ]);
    });

    it('returns undefined when no instructions exist', () => {
      const payload = { data: { home: {} } };
      expect(parseTimelineTweets(payload)).toBeUndefined();
    });
  });
});
