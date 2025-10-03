export const getTweetElement = (focusableEl) => focusableEl?.closest('[data-testid="tweet"]');

export const getTweetActionButton = (focusableEl, testId) => {
  const tweet = getTweetElement(focusableEl);
  return tweet?.querySelector(`[data-testid="${testId}"]`);
};

export const getUserCell = (focusableEl) => focusableEl?.closest('[data-testid="UserCell"]');

export const getTweetFooter = (focusableEl) => getTweetElement(focusableEl)?.lastElementChild;

export const findSelectedHomeTab = () =>
  document.querySelector('[role="tab"][aria-selected="true"]');

export const findTweetStatusLink = (statusId) => {
  if (!statusId) return null;
  const selector = `[data-testid="tweet"] a[href$="/status/${statusId}"][role="link"]`;
  return document.querySelector(selector);
};

export const findUserFollowButton = (restId, label = restId) => {
  if (!restId) return null;
  const selector = `[data-testid="${restId}-follow"]`;
  return document.querySelector(selector);
};

export const findUserUnfollowButton = (restId, label = restId) => {
  if (!restId) return null;
  const selector = `[data-testid="${restId}-unfollow"]`;
  return document.querySelector(selector);
};

export const findUserProfileLink = (profilePath, label = profilePath) => {
  if (!profilePath) return null;
  const primarySelector = `[data-testid="cellInnerDiv"] a[href="${profilePath}"][role="link"]`;
  const fallbackSelector = `[data-testid="UserCell"] a[href="${profilePath}"][role="link"]`;
  return document.querySelector(primarySelector) || document.querySelector(fallbackSelector);
};

export const findModalUserProfileLink = (profilePath, label = profilePath) => {
  if (!profilePath) return null;
  const selector = `[aria-modal="true"] [data-testid="UserCell"] a[href="${profilePath}"][role="link"]:not([dir])`;
  return document.querySelector(selector);
};

export const findTweetUserAnchor = (focusableEl, profilePath) => {
  if (!focusableEl || !profilePath) return null;
  const tweet = getTweetElement(focusableEl);
  return tweet?.querySelector(`a[href="${profilePath}"][role="link"]`);
};

export const findRetweetConfirmButton = () =>
  document.querySelector('div[data-testid="retweetConfirm"]') ||
  document.querySelector('[aria-modal="true"] [data-testid="toolBar"] [data-testid="tweetButton"]');

export const findConfirmationSheetConfirmButton = () =>
  document.querySelector('[data-testid="confirmationSheetConfirm"]');

export const findUnretweetConfirmButton = () =>
  document.querySelector('div[data-testid="unretweetConfirm"]');
