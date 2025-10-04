import { deepGet } from './object.js';

const TIMELINE_INSTRUCTION_PATHS = [
  ['data', 'list', 'tweets_timeline', 'timeline', 'instructions'],
  ['data', 'user', 'result', 'timeline', 'timeline', 'instructions'],
  ['data', 'user', 'result', 'timeline_v2', 'timeline', 'instructions'],
  ['data', 'community', 'community_timeline', 'timeline', 'instructions'],
  ['data', 'topic_by_rest_id', 'topic_page', 'body', 'timeline', 'instructions'],
  ['data', 'home', 'home_timeline_urt', 'instructions'],
  ['data', 'search_by_raw_query', 'search_timeline', 'timeline', 'instructions'],
  ['data', 'threaded_conversation_with_injections', 'instructions'],
  ['data', 'threaded_conversation_with_injections_v2', 'instructions'],
];

export const parseTimelineTweets = (payload) => {
  const instructions = TIMELINE_INSTRUCTION_PATHS.map((path) => deepGet(payload, ...path)).find(
    (result) => Array.isArray(result),
  );

  if (!instructions) {
    return undefined;
  }

  const tweets = [];
  instructions.forEach((instruction) => {
    if (instruction?.type === 'TimelineAddEntries') {
      instruction.entries?.forEach((entry) => {
        const result = deepGet(entry, 'content', 'itemContent', 'tweet_results', 'result');
        if (!result || typeof result !== 'object') return;
        const tweet = result.__typename === 'TweetWithVisibilityResults' ? result.tweet : result;
        if (tweet && typeof tweet === 'object') tweets.push(tweet);
      });
    } else if (instruction?.type === 'TimelineAddToModule') {
      // Some conversation/detail responses use TimelineAddToModule with moduleItems holding tweets
      instruction.moduleItems?.forEach((item) => {
        const result = deepGet(item, 'item', 'itemContent', 'tweet_results', 'result');
        if (!result || typeof result !== 'object') return;
        const tweet = result.__typename === 'TweetWithVisibilityResults' ? result.tweet : result;
        if (tweet && typeof tweet === 'object') tweets.push(tweet);
      });
    }
  });

  return tweets;
};
