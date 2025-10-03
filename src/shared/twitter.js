export const resolveRestId = (value, depth = 0) => {
  if (!value || typeof value !== 'object' || depth > 5) {
    return undefined;
  }

  const restId = value.rest_id;
  if (typeof restId === 'string' && restId.length > 0) {
    return restId;
  }

  const nestedTweet = value.tweet && resolveRestId(value.tweet, depth + 1);
  if (nestedTweet) {
    return nestedTweet;
  }

  const nestedResult = value.result && resolveRestId(value.result, depth + 1);
  if (nestedResult) {
    return nestedResult;
  }

  const nestedTweetResults =
    value.tweet_results &&
    resolveRestId(value.tweet_results.result || value.tweet_results, depth + 1);
  if (nestedTweetResults) {
    return nestedTweetResults;
  }

  return undefined;
};
