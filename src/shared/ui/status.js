import {
  buildFollowLimitMessage,
  buildPauseMessage,
  buildRepeatAutopilotMessage,
  buildAutopilotProgressMessage,
  buildSuccessMessage,
  buildLimitReachedMessage,
  buildActiveActionMessage,
} from '../messages.js';

export const updateAutopilotButtonVisibility = async ({
  isOnHomePath,
  hasTimelineEntries,
  ensureInitialStateReady,
  showButton,
  hideButton,
}) => {
  if (isOnHomePath && !hasTimelineEntries && (await ensureInitialStateReady())) {
    showButton();
    return;
  }

  hideButton();
};

export const updateRetweetButtonVisibility = ({ shouldShow, showButton, hideButton }) => {
  if (shouldShow) {
    showButton();
  } else {
    hideButton();
  }
};

export const updateActionPanelVisibility = async ({
  isBusy,
  ensureAutopilotButton,
  followButton,
  likeButton,
  retweetButton,
  unfollowButton,
  unlikeButton,
  unretweetButton,
  statusBar,
  panel,
  showPanel,
  hidePanel,
  isSearchPath,
}) => {
  if (isBusy) return;

  if (ensureAutopilotButton) {
    await ensureAutopilotButton();
  }

  const toggles = [
    followButton,
    likeButton,
    retweetButton,
    unfollowButton,
    unlikeButton,
    unretweetButton,
  ].filter(Boolean);

  const anyVisible = toggles.reduce((visible, config) => {
    if (config.shouldShow) {
      config.show();
      return true;
    }
    config.hide();
    return visible;
  }, false);

  if (anyVisible) {
    statusBar.hide();
    panel.element.classList.toggle('xf-panel--search-page', isSearchPath);
    showPanel();
  } else {
    hidePanel();
  }
};

export const showPauseState = ({
  pausePanel,
  activePanel,
  skipButton,
  statusLabel,
  action,
  waitSeconds,
}) => {
  pausePanel.style.display = 'initial';
  activePanel.style.display = 'none';
  skipButton.style.display = 'none';

  statusLabel.textContent =
    action === 'follow'
      ? buildFollowLimitMessage(waitSeconds)
      : buildPauseMessage(action, waitSeconds);
};

export const showRepeatCountdown = ({
  pausePanel,
  activePanel,
  skipButton,
  statusLabel,
  seconds,
}) => {
  pausePanel.style.display = 'initial';
  activePanel.style.display = 'none';
  skipButton.style.display = 'none';
  statusLabel.textContent = buildRepeatAutopilotMessage(seconds);
};

export const showProgressState = ({
  pausePanel,
  activePanel,
  skipButton,
  statusLabel,
  current,
  total,
}) => {
  pausePanel.style.display = 'initial';
  activePanel.style.display = 'none';
  skipButton.style.display = 'initial';
  statusLabel.textContent = buildAutopilotProgressMessage(current, total);
};

export const showSuccessState = ({
  pausePanel,
  activePanel,
  skipButton,
  statusLabel,
  action,
  count,
}) => {
  pausePanel.style.display = 'none';
  activePanel.style.display = 'initial';
  skipButton.style.display = 'none';
  statusLabel.textContent = buildSuccessMessage(action, count);
};

export const showLimitReachedState = ({
  pausePanel,
  activePanel,
  skipButton,
  statusLabel,
  limit,
}) => {
  pausePanel.style.display = 'none';
  activePanel.style.display = 'initial';
  skipButton.style.display = 'none';
  statusLabel.textContent = buildLimitReachedMessage(limit);
};

export const showActiveActionState = ({
  pausePanel,
  activePanel,
  skipButton,
  statusLabel,
  action,
  progress,
  total,
  showSkipButton,
}) => {
  pausePanel.style.display = 'initial';
  activePanel.style.display = 'none';
  skipButton.style.display = showSkipButton ? 'initial' : 'none';
  statusLabel.textContent = buildActiveActionMessage(action, progress, total);
};
