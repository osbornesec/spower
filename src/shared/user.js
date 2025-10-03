export const getFollowerCount = (user) => user?.legacy?.followers_count;

export const getFollowingCount = (user) => user?.legacy?.friends_count;

export const isFollowedByPerspective = (entity) =>
  entity?.relationship_perspectives?.followed_by === 1;

export const followersToFollowingRatio = (user) => {
  const followers = user?.legacy?.followers_count;
  if (typeof followers !== 'number') {
    return undefined;
  }
  const following = user?.legacy?.friends_count;
  if (typeof following !== 'number' || following === 0) {
    return undefined;
  }
  return followers / following;
};
