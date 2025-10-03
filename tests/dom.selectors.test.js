import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  findSelectedHomeTab,
  findTweetStatusLink,
  findUserFollowButton,
  findUserUnfollowButton,
  findUserProfileLink,
  findModalUserProfileLink,
  findTweetUserAnchor,
  findRetweetConfirmButton,
  findConfirmationSheetConfirmButton,
  findUnretweetConfirmButton,
  getTweetFooter,
} from '../src/shared/dom.js';

describe('shared dom selectors', () => {
  let logSpy;

  beforeEach(() => {
    document.body.innerHTML = '';
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('finds the selected home tab when present', () => {
    document.body.innerHTML = `
      <div role="tablist">
        <button role="tab">For you</button>
        <button role="tab" aria-selected="true">Following</button>
      </div>
    `;

    const el = findSelectedHomeTab();
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el?.textContent).toBe('Following');
  });

  it('returns tweet status links by identifier', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <a href="/alice/status/123" role="link">tweet</a>
      </article>
    `;

    const anchor = findTweetStatusLink('123');
    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    expect(anchor?.getAttribute('href')).toBe('/alice/status/123');
  });

  it('finds follow and unfollow buttons', () => {
    document.body.innerHTML = `
      <button data-testid="42-follow"></button>
      <button data-testid="42-unfollow"></button>
    `;

    expect(findUserFollowButton('42')).toBeInstanceOf(HTMLElement);
    expect(findUserUnfollowButton('42')).toBeInstanceOf(HTMLElement);
  });

  it('resolves user profile links with primary selector first', () => {
    document.body.innerHTML = `
      <div data-testid="cellInnerDiv">
        <a href="/alice" role="link" id="primary">Alice</a>
      </div>
      <div data-testid="UserCell">
        <a href="/alice" role="link" id="fallback">Fallback</a>
      </div>
    `;

    const anchor = findUserProfileLink('/alice');
    expect(anchor?.id).toBe('primary');
  });

  it('falls back to user cell link when primary not present', () => {
    document.body.innerHTML = `
      <div data-testid="UserCell">
        <a href="/bob" role="link" id="fallback">Bob</a>
      </div>
    `;

    const anchor = findUserProfileLink('/bob');
    expect(anchor?.id).toBe('fallback');
  });

  it('locates modal user profile links', () => {
    document.body.innerHTML = `
      <div aria-modal="true">
        <div data-testid="UserCell">
          <a href="/carol" role="link" id="modal">Carol</a>
        </div>
      </div>
    `;

    const anchor = findModalUserProfileLink('/carol');
    expect(anchor?.id).toBe('modal');
  });

  it('resolves anchors within tweets relative to a focusable element', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div id="focus">focus</div>
        <a href="/dave" role="link" id="tweet-user">Dave</a>
      </article>
    `;

    const focusable = document.getElementById('focus');
    const anchor = findTweetUserAnchor(focusable, '/dave');
    expect(anchor?.id).toBe('tweet-user');
  });

  it('prefers retweet confirm modal buttons when available', () => {
    document.body.innerHTML = `
      <div data-testid="retweetConfirm" id="confirm"></div>
      <div aria-modal="true">
        <div data-testid="toolBar">
          <button data-testid="tweetButton" id="fallback"></button>
        </div>
      </div>
    `;

    const button = findRetweetConfirmButton();
    expect(button?.id).toBe('confirm');
  });

  it('falls back to compose tweet button when confirm modal is absent', () => {
    document.body.innerHTML = `
      <div aria-modal="true">
        <div data-testid="toolBar">
          <button data-testid="tweetButton" id="fallback"></button>
        </div>
      </div>
    `;

    const button = findRetweetConfirmButton();
    expect(button?.id).toBe('fallback');
  });

  it('finds confirmation sheet and unretweet buttons', () => {
    document.body.innerHTML = `
      <button data-testid="confirmationSheetConfirm" id="confirm"></button>
      <div data-testid="unretweetConfirm" id="unretweet"></div>
    `;

    expect(findConfirmationSheetConfirmButton()?.id).toBe('confirm');
    expect(findUnretweetConfirmButton()?.id).toBe('unretweet');
  });

  it('provides tweet footer from a focusable element', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div id="focus">focus</div>
        <footer id="footer"></footer>
      </article>
    `;

    const focusable = document.getElementById('focus');
    const footer = getTweetFooter(focusable);
    expect(footer?.id).toBe('footer');
  });
});
