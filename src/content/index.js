import { deepGet, requireKey } from '../shared/object.js';
import { parseTimelineTweets } from '../shared/timeline.js';
import { resolveRestId } from '../shared/twitter.js';
import { sleep, poll } from '../shared/async.js';
import { daysSince } from '../shared/time.js';
import {
  appendSuspendedAutopilotAction,
  getSuspendedAutopilotActions,
  SUSPENDED_AUTOPILOT_KEY,
} from '../shared/session.js';
import {
  getFollowerCount,
  getFollowingCount,
  isFollowedByPerspective,
  followersToFollowingRatio,
} from '../shared/user.js';
import {
  buildResumeAutopilotMessage,
  buildFollowLimitMessage,
  buildPauseMessage,
  buildRepeatAutopilotMessage,
  buildAutopilotProgressMessage,
  buildSuccessMessage,
  buildLimitReachedMessage,
  buildActiveActionMessage,
} from '../shared/messages.js';
import {
  getTweetActionButton,
  getTweetFooter,
  getUserCell,
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
} from '../shared/dom.js';
import { getStoredConfigValues, mergeWithStoredConfig } from '../shared/config/storage.js';
import { normalizeLikeConfig } from '../shared/config/like.js';
import { normalizeRetweetConfig } from '../shared/config/retweet.js';
import { normalizeUnlikeConfig } from '../shared/config/unlike.js';
import { normalizeUnretweetConfig } from '../shared/config/unretweet.js';
import { evaluateUnlikeEligibility, evaluateUnretweetEligibility } from '../shared/validation.js';
import { parseCsvList, buildIntervalRange, compileCsvRegex } from '../shared/config/parsers.js';
import {
  updateAutopilotButtonVisibility,
  updateRetweetButtonVisibility,
  updateActionPanelVisibility,
  showPauseState,
  showRepeatCountdown,
  showProgressState,
  showSuccessState,
  showLimitReachedState,
  showActiveActionState,
} from '../shared/ui/status.js';
import {
  loadFirstAutopilotAction,
  navigateToAutopilotAction,
  beginAutopilotAction,
  pickRandomDelaySeconds,
  scheduleAutopilotRepeat,
  advanceAutopilotQueue,
} from '../shared/autopilot/scheduler.js';

/**
 * @fileoverview Content script entry for XFlow; handles autopilot
 * actions, timeline parsing, and UI prompts on x.com pages.
 */
(() => {
  'use strict';
  const XF_INITIAL_DEV = (() => {
    try {
      return globalThis.localStorage?.getItem('xf_dev') === '1';
    } catch {
      return false;
    }
  })();
  let xfMark = (label) => {
    if (XF_INITIAL_DEV && globalThis.performance) {
      performance.mark(label);
    }
  };
  let xfMeasure = (name, start, end) => {
    if (!XF_INITIAL_DEV || !globalThis.performance) return;
    try {
      performance.measure(name, start, end);
      const entry = performance.getEntriesByName(name).pop();
      if (entry) {
        console.log(`[XF_PERF] ${name}: ${entry.duration.toFixed(1)}ms`);
      }
    } catch {}
  };
  let xfDebounce = (fn, wait = 150) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), wait);
    };
  };
  let xfIdleInit = (fn) =>
    'requestIdleCallback' in globalThis
      ? requestIdleCallback(fn, { timeout: 100 })
      : setTimeout(fn, 0);
  const xfPerfModuleURL = chrome.runtime?.getURL?.('utils/perf.js');
  if (xfPerfModuleURL) {
    import(xfPerfModuleURL)
      .then((mod) => {
        if (!mod) return;
        if (mod.xfMark) xfMark = mod.xfMark;
        if (mod.xfMeasure) xfMeasure = mod.xfMeasure;
        if (mod.xfDebounce) xfDebounce = mod.xfDebounce;
        if (mod.xfIdleInit) xfIdleInit = mod.xfIdleInit;
      })
      .catch(() => {});
  }
  xfMark('XF_PERF_START');
  const xfFinalize = () => {
    xfMark('XF_PERF_END');
    xfMeasure('XF_PERF_CONTENT_INIT', 'XF_PERF_START', 'XF_PERF_END');
  };
  xfIdleInit(xfFinalize);
  (() => {
    /**
     * Pause for the given number of milliseconds.
     * Delegates to the shared `sleep` helper to return a promise that resolves after the delay.
     */
    const e = sleep;
    const t = SUSPENDED_AUTOPILOT_KEY;
    const n = () => getSuspendedAutopilotActions(); /**
     * Append the current global autopilot action type to the suspended-actions list.
     *
     * If the global `wi` is an object, its `type` is added to the suspended-autopilot actions and the updated list is persisted to sessionStorage under the key `t`. If `wi` is not an object, the function does nothing.
     */
    function i() {
      if ('object' != typeof wi) return;
      appendSuspendedAutopilotAction(wi.type);
    }
    const o = [],
      l = ({ text: e, title: t, action: n }) =>
        `\n    <div class="xf-ad animated fadeInRight">\n      <div class="xf-ad__title">${t}</div>\n      <div class="xf-ad__text">${e}</div>\n      <a class="xf-ad__action" href="${n.url}" target="_blank">${n.text}</a>\n    </div>\n  `,
      a = document.createElement('div'); /**
     * Hides the DOM element referenced by the global variable `a`.
     *
     * Sets the element's inline `display` style to `"none"`, removing it from layout and visual rendering.
     */
    function s() {
      a.style.display = 'none';
    } /**
     * Clears the global UI container and hides it from layout.
     *
     * Removes all child markup from the element referenced by `a` and sets its `display` style to `"none"`.
     */
    function r() {
      ((a.innerHTML = ''), (a.style.display = 'none'));
    }
    const xfBody = document.body;
    /* XF_OPTIMIZED_QUERY */ (a.classList.add('xf-ads'),
      xfIdleInit(() => xfBody.appendChild(a)));
    const u = document.createElement('div');
    let w; /**
     * Set the global action mode to "follow".
     */
    function f() {
      w = 'follow';
    } /**
     * Select the "unfollow" mass-action mode.
     *
     * Updates the module's current mass-action mode to "unfollow".
     */
    function d() {
      w = 'unfollow';
    } /**
     * Selects "like" as the current global autopilot action.
     */
    function m() {
      w = 'like';
    } /**
     * Set the global action flag to "retweet".
     *
     * Sets the global variable `w` to the string `"retweet"`.
     */
    function p() {
      w = 'retweet';
    } /**
     * Set the module's current action mode to "unretweet".
     *
     * Updates the internal action selector so subsequent operations use the unretweet flow.
     */
    function y() {
      w = 'unretweet';
    } /**
     * Set the current global autopilot action to "unlike".
     *
     * Updates the module-scoped marker so subsequent logic treats the active action as an unlike operation.
     */
    function g() {
      w = 'unlike';
    } /**
     * Set the status element text to a message showing the remaining countdown until autopilot resumes.
     * @param {number} e - Milliseconds remaining until autopilot resumes.
     */
    function k(e) {
      u.textContent = buildResumeAutopilotMessage(e);
    } /**
     * Retrieve a nested property by following a sequence of property keys.
     * Uses the shared `deepGet` helper to keep traversal semantics consistent across modules.
     */
    const b = deepGet; /**
     * Retrieve a required property from an object or throw if it is missing.
     * @param {Object} e - The object to read the property from.
     * @param {string} t - The property key to retrieve.
     * @returns {*} The value of the property `t` on object `e`.
     * Throws when the key is absent to surface developer errors early.
     */
    const F = requireKey;
    const xfResolveRestId = resolveRestId;
    const XF_TABLIST_ROLE = 'tablist';
    const xfNormalizeKey = (e) => ('string' == typeof e ? e.toUpperCase() : e);
    const xfResolveHomeTab = () => {
      const focused = document.activeElement;
      if (
        focused &&
        focused.getAttribute('role') === 'tab' &&
        focused.parentElement?.getAttribute('role') === XF_TABLIST_ROLE
      ) {
        return focused;
      }
      return findSelectedHomeTab();
    };
    const xfCurrentPageKey = () => {
      const hrefKey = xfNormalizeKey(location.href);
      if (location.pathname !== '/home') {
        return hrefKey;
      }
      const tabEl = xfResolveHomeTab();
      if (!tabEl) {
        return hrefKey;
      }
      const rawLabel = tabEl.textContent?.trim();
      if (!rawLabel) {
        return hrefKey;
      }
      const normalizedLabel = rawLabel.replace(/\s+/g, ' ');
      return `${hrefKey}::${xfNormalizeKey(normalizedLabel)}`;
    };
    u.classList.add('xf-status-bar__label');
    const xfInitialStatePattern = /window.__INITIAL_STATE__=({[\s\S]*?});window.__META_DATA__/;
    let h =
      globalThis.__INITIAL_STATE__ && 'object' == typeof globalThis.__INITIAL_STATE__
        ? globalThis.__INITIAL_STATE__
        : void 0;
    if (!h) {
      for (const e of document.querySelectorAll('script')) {
        const t = e.textContent || '';
        if (!t.includes('__INITIAL_STATE__')) continue;
        const n = t.match(xfInitialStatePattern);
        if (n && n[1]) {
          try {
            h = JSON.parse(n[1]);
            break;
          } catch (e) {
            console.warn('[XF] failed to parse __INITIAL_STATE__ payload', e);
          }
        }
      }
    }
    if (!h) {
      console.warn('[XF] initial state unavailable; skipping bootstrap');
      return;
    }
    const x = h.session,
      R = b(h, 'entities', 'users', 'entities'),
      L = () => F(x, 'user_id'); /**
     * Get the current user's screen name.
     * @returns {string|undefined} The user's screen_name if available, otherwise `undefined`.
     */
    function S() {
      const e = R ? F(R, L()) : F(x, 'user');
      return F(e, 'screen_name');
    } /**
     * Determine whether the current page is the user's "following" page.
     * @returns {boolean} `true` if the current pathname equals `/<username>/following` (case-insensitive), `false` otherwise.
     */
    function v() {
      return location.pathname.toUpperCase() == `/${S()}/following`.toUpperCase();
    } /**
     * Determines whether the current location path is the user's likes page.
     * @returns {boolean} `true` if the current pathname equals "/{user}/likes" (case-insensitive), `false` otherwise.
     */
    function T() {
      return location.pathname.toUpperCase() == `/${S()}/likes`.toUpperCase();
    } /**
     * Determines whether the current location path matches the configured home route.
     * @returns {boolean} `true` if the current pathname equals the configured home route (case-insensitive), `false` otherwise.
     */
    function _() {
      return location.pathname.toUpperCase() == `/${S()}`.toUpperCase();
    } /**
     * Checks whether the current page path corresponds to a lists page.
     * @returns {boolean} `true` if the location pathname contains "/lists/", `false` otherwise.
     */
    function $() {
      return location.pathname.includes('/lists/');
    } /**
     * Extracts tweet objects from timeline-related instruction arrays in a GraphQL/REST response payload.
     * Delegates to the shared `parseTimelineTweets` helper so other modules can reuse the traversal logic.
     */
    const M = parseTimelineTweets;
    const I = poll; /**
     * Return a promise that will be settled by a polling routine invoked with the given arguments.
     *
     * Invokes the polling function with `e`, `t`, and the promise's `resolve`/`reject` callbacks so the promise
     * resolves or rejects according to the polling routine's outcome.
     * @param {*} e - First value forwarded to the polling routine.
     * @param {*} t - Second value forwarded to the polling routine.
     * @returns {Promise<*>} A promise that resolves with the polling routine's success value or rejects with its error.
     */
    function E(e, t) {
      return new Promise((n, i) => {
        I(e, t, n, i);
      });
    }
    let A;
    const C = async ({ fromIndex: t = 0, getList: n, getFocusableEl: i }) => {
        if (!Un) {
          (Gn(), console.log('Scan list for usable index ...'));
          for (let e = t; e < n().length; e++) {
            if (i(n()[e])) return e;
          }
          return (
            window.scrollBy(0, 300),
            await e(500),
            await C({ fromIndex: t, getList: n, getFocusableEl: i })
          );
        }
      },
      D = async ({ callback: e, getList: t, getFocusableEl: n, index: i }) => {
        if (Un) return;
        if ((Gn(), Pn))
          return void (await q({
            callback: e,
            getList: t,
            getFocusableEl: n,
            index: i,
            milliseconds: 500,
          }));
        if (void 0 === t()) return;
        const o = t()[i];
        if (void 0 === o)
          await q({ callback: e, getList: t, getFocusableEl: n, index: i, milliseconds: 100 });
        else {
          try {
            ((o.focusableEl = await E(() => n(o), 2e3)), (A = window.scrollY));
          } catch (o) {
            (console.log(o), A && window.scrollTo(0, A));
            const l = await C({ fromIndex: i + 1, getList: t, getFocusableEl: n });
            return void (await D({ callback: e, getList: t, getFocusableEl: n, index: l }));
          }
          (o.focusableEl.focus(),
            await e(o, i),
            await D({ callback: e, getList: t, getFocusableEl: n, index: i + 1 }));
        }
      },
      q = async ({ callback: t, getList: n, getFocusableEl: i, index: o, milliseconds: l }) => {
        (await e(l), await D({ callback: t, getList: n, getFocusableEl: i, index: o }));
      }; /**
     * Prepare an index from the provided list provider and run the processing callback using that index.
     * @param {Object} args - Function dependencies and callbacks.
     * @param {Function} args.callback - Processing function invoked by the downstream runner.
     * @param {Function} args.getFocusableEl - Function that returns a focusable element for a given item.
     * @param {Function} args.getList - Function that returns the list to be processed.
     */
    async function U({ callback: e, getFocusableEl: t, getList: n }) {
      A = void 0;
      const i = await C({ getList: n, getFocusableEl: t });
      await D({ callback: e, getList: n, getFocusableEl: t, index: i });
    }
    const P = (e) => F(e.core, 'screen_name'); /**
     * Get the follower count from a user object.
     * @param {Object} e - User object with a `legacy.followers_count` property.
     * @returns {number} The user's follower count.
     * Uses the shared `getFollowerCount` helper for reuse across modules.
     */
    const j = getFollowerCount; /**
     * Determine whether the given object's relationship perspective marks it as followed.
     * @param {Object} e - Object containing a `relationship_perspectives` property with a `followed_by` flag.
     * @returns {boolean} `true` if `relationship_perspectives.followed_by` equals 1, `false` otherwise.
     * Uses the shared `isFollowedByPerspective` helper for consistency.
     */
    const B = isFollowedByPerspective; /**
     * Compute the follower-to-following ratio for a user.
     * @param {Object} e - User object; expected to have `legacy.followers_count` and `legacy.friends_count`.
     * @returns {number|undefined} The result of `followers_count / friends_count`, or `undefined` if either count is missing or not a number.
     * Uses the shared `followersToFollowingRatio` helper.
     */
    const W = followersToFollowingRatio; /**
     * Get the user's following count from a legacy user object.
     * @param {Object} e - A user object containing a `legacy` field.
     * @returns {number} The number of accounts the user is following.
     */
    const O = getFollowingCount; /**
     * Resolve an object's REST identifier from available fields.
     *
     * Attempts to extract a `rest_id`-style identifier from the provided object and returns it when present.
     * @param {any} e - The candidate object (e.g., entity or node) to extract the REST id from.
     * @returns {string|undefined} The resolved REST id if found, `undefined` otherwise.
     */
    function V(e) {
      const t = xfResolveRestId(e);
      if (t) return t;
      try {
        return F(e, 'rest_id');
      } catch {
        console.warn('[XF] rest_id unavailable', e?.__typename ?? typeof e);
        return void 0;
      }
    } /**
     * Determine whether a user account is protected.
     * @param {Object} e - User-like object containing a `privacy` object with a `protected` flag (numeric).
     * @returns {boolean} `true` if `e.privacy.protected` equals `1`, `false` otherwise.
     */
    function G(e) {
      return 1 == e.privacy.protected;
    } /**
     * Determines whether an account is blue-verified.
     * @param {Object} e - User-like object that may include verification flags.
     * @param {boolean} [e.is_blue_verified] - Flag indicating blue verification status.
     * @returns {boolean} `true` if the account is blue-verified, `false` otherwise.
     */
    function N(e) {
      return 1 == e.is_blue_verified;
    } /**
     * Get the legacy description string from an object.
     * @param {Object} e - Object that may contain a `legacy` property.
     * @returns {string|undefined} The value of `e.legacy.description` if present, `undefined` otherwise.
     */
    function X(e) {
      return F(e.legacy, 'description');
    } /**
     * Build a profile path by prefixing a user's handle with a forward slash.
     * @param {any} e - A username string or a user object from which the handle is resolved.
     * @returns {string} The profile path, e.g. "/handle".
     */
    function H(e) {
      return `/${P(e)}`;
    }
    const J = (e) => {
      const t = xfResolveRestId(e);
      if (t) return t;
      try {
        return F(e, 'rest_id');
      } catch {
        console.warn('[XF] rest_id unavailable', e?.__typename ?? typeof e);
        return void 0;
      }
    }; /**
     * Get the legacy language code from an object.
     * @param {Object} e - Object that may contain a `legacy` property with language info.
     * @returns {string|undefined} The value of `legacy.lang` if present, `undefined` otherwise.
     */
    function Q(e) {
      return F(e.legacy, 'lang');
    } /**
     * Retrieve the favorite (like) count from a tweet-like payload.
     * @param {Object} e - The tweet-like object containing legacy metrics.
     * @return {number|undefined} The `favorite_count` value, or `undefined` if not present.
     */
    function K(e) {
      return F(e.legacy, 'favorite_count');
    } /**
     * Check whether a tweet object is marked as favorited.
     * @param {Object} e - Tweet-like object containing a `legacy` field with a `favorited` property.
     * @returns {boolean} `true` if `e.legacy.favorited` is `1`, `false` otherwise.
     */
    function Y(e) {
      return 1 == e.legacy.favorited;
    } /**
     * Determines whether a tweet-like object represents a reply by inspecting its legacy reply ID.
     * @param {Object} e - Object expected to have a `legacy` property with `in_reply_to_status_id_str`.
     * @returns {boolean} `true` if `e.legacy.in_reply_to_status_id_str` is a string, `false` otherwise.
     */
    function z(e) {
      return 'string' == typeof e.legacy.in_reply_to_status_id_str;
    } /**
     * Check if a tweet-like payload includes a legacy `retweeted_status_result` object.
     * @param {object} e - Payload expected to include a `legacy` property.
     * @returns {boolean} `true` if `e.legacy.retweeted_status_result` is an object, `false` otherwise.
     */
    function Z(e) {
      return 'object' == typeof e.legacy.retweeted_status_result;
    } /**
     * Checks whether a tweet/status object has a string `quoted_status_id_str` in its legacy data.
     * @param {object} e - Tweet/status object expected to contain a `legacy` property.
     * @returns {boolean} `true` if `e.legacy.quoted_status_id_str` is a string, `false` otherwise.
     */
    function ee(e) {
      return 'string' == typeof e.legacy.quoted_status_id_str;
    } /**
     * Determines whether the provided tweet object is marked as retweeted.
     * @param {Object} e - Tweet-like object with a `legacy.retweeted` numeric flag.
     * @returns {boolean} `true` if `e.legacy.retweeted` is `1`, `false` otherwise.
     */
    function te(e) {
      return 1 == e.legacy.retweeted;
    } /**
     * Resolve the REST API identifier (`rest_id`) for a tweet-like object.
     *
     * @param {Object} e - The tweet-like object to resolve the identifier from.
     * @returns {string|undefined} The `rest_id` if present, otherwise `undefined`.
     */
    function ne(e) {
      return b(e.legacy, 'retweeted_status_result', 'result', 'rest_id') || J(e);
    } /**
     * Extracts the tweet text from a tweet object.
     * @param {Object} e - Tweet object that includes a `legacy.full_text` property.
     * @returns {string} The tweet's full text.
     */
    function ie(e) {
      return e.legacy.full_text;
    }
    const oe = (e) => e.core.user_results.result; /**
     * Resolve the REST identifier for the given entity.
     * @param {*} e - An entity object or identifier from which to derive a REST id.
     * @returns {string|undefined} The resolved REST id if available, `undefined` otherwise.
     */
    function le(e) {
      return V(oe(e));
    } /**
     * Locate the anchor element that links to a tweet's status page.
     * @param {string|object} tweetOrId - A tweet ID string or an object from which the tweet ID will be resolved.
     * @returns {Element|null} The first anchor element whose href ends with `/status/{tweetId}`, or `null` if none is found.
     */
    const resolveTweetStatusLink = (e) => findTweetStatusLink(ne(e)); /**
     * Locate the tweet container that contains the provided focusable element and return its last child element.
     * @param {{focusableEl: Element}} e - Object with a `focusableEl` DOM Element inside a tweet.
     * @returns {Element|null} The last child Element of the enclosing tweet container, or `null` if not found.
     */
    const resolveTweetFooter = (e) => getTweetFooter(e.focusableEl);
    window.addEventListener('message', (e) => {
      e.data.origin &&
        'string' == typeof e.data.response &&
        e.data.url &&
        e.data.status &&
        we(e.data);
    });
    const re = document.createElement('script');
    ((re.type = 'text/javascript'),
      (re.src = chrome.runtime.getURL('app.js')),
      document.documentElement.appendChild(re));
    const ce = {}; /**
     * Register a listener for the specified registry key so it will be invoked for that event.
     *
     * Multiple listeners may be registered for the same key; they are invoked in registration order.
     * @param {string} e - Registry key or event name to attach the listener to.
     * @param {Function} t - Listener function to register.
     */
    function ue(e, t) {
      ((ce[e] = ce[e] || []), ce[e].push(t));
    }
    const we = ({ body: e, origin: t, response: n, status: i, url: o }) => {
        Object.keys(ce).forEach((l) => {
          if (!o.includes(l)) return;
          let a = {};
          if (n.length > 0)
            try {
              a = JSON.parse(n);
            } catch (e) {
              console.error(e);
            }
          ce[l].forEach((n) => n({ body: e, origin: t, parsedResponse: a, status: i, url: o }));
        });
      },
      fe = {};
    ue('/Likes', ({ origin: e, parsedResponse: t }) =>
      ((e, t) => {
        !1 !== Array.isArray(t) &&
          0 !== t.length &&
          (fe[e] ? (fe[e] = fe[e].concat(t)) : (fe[e] = t));
      })(e, M(t)),
    );
    const de = () => fe[xfCurrentPageKey()];
    let Tn,
      _n,
      $n,
      Mn,
      In,
      En,
      An,
      Cn,
      Dn,
      qn,
      Un = false,
      Pn = false; /**
     * Run the shared action dispatcher using the provided per-item callback and built-in UI/list helpers.
     * @param {Function} e - Callback invoked by the dispatcher for each focused item; receives the current element and action context.
     */
    async function me(e) {
      await U({ callback: e, getFocusableEl: resolveTweetStatusLink, getList: de });
    } /**
     * Finds the follow button element for the specified user identifier.
     * @param {*} e - A user identifier or user-like object used to derive the element's test id.
     * @returns {Element|null} The matching follow button element, or `null` if none is found.
     */
    const resolveFollowButton = (e) => findUserFollowButton(V(e)); /**
     * Finds the profile link element for a given user on the page.
     * @param {*} e - User identifier or object from which the profile href is derived.
     * @returns {Element|null} The anchor element pointing to the user's profile if found, `null` otherwise.
     */
    const resolveProfileLink = (e) => findUserProfileLink(H(e)); /**
     * Finds the profile link element for a user inside an open modal UserCell.
     * @param {object|string} user - A user identifier or object used to derive the profile href.
     * @returns {HTMLAnchorElement|null} The matching anchor element, or null if no match is found.
     */
    const resolveModalProfileLink = (e) => findModalUserProfileLink(H(e)); /**
     * Locate the nearest user cell DOM element related to the given action item.
     * @param {{focusableEl: Element}} e - Object that contains the element used for focus/navigation.
     * @returns {Element|null} The closest ancestor with `data-testid="UserCell"`, or `null` if none is found.
     */
    function ke(e) {
      return e.focusableEl.closest('[data-testid="UserCell"]');
    }
    const be = {},
      Fe = (e, t) => {
        if (!t) return;
        if (0 == t.length) return;
        void 0 === be[e] && (be[e] = []);
        const n = be[e].map((e) => V(e));
        t.forEach((t) => {
          n.includes(V(t)) || be[e].push(t);
        });
      },
      he = (e, t) => {
        const n =
          b(t, 'data', 'user', 'followers_timeline', 'timeline', 'instructions') ||
          b(t, 'data', 'favoriters_timeline', 'timeline', 'instructions') ||
          b(t, 'data', 'user', 'following_timeline', 'timeline', 'instructions') ||
          b(t, 'data', 'user', 'result', 'timeline', 'timeline', 'instructions') ||
          b(t, 'data', 'list', 'members_timeline', 'timeline', 'instructions') ||
          b(t, 'data', 'list', 'subscribers_timeline', 'timeline', 'instructions') ||
          b(t, 'data', 'retweeters_timeline', 'timeline', 'instructions') ||
          b(t, 'data', 'search_by_raw_query', 'search_timeline', 'timeline', 'instructions');
        if (!n) return;
        const i = [];
        return (
          n.forEach((t) => {
            'TimelineAddEntries' == t.type
              ? t.entries.forEach((e) => {
                  const t = b(e, 'content', 'itemContent', 'user_results', 'result');
                  'object' == typeof t && i.push(t);
                })
              : 'TimelineClearCache' == t.type && (be[e] = void 0);
          }),
          i
        );
      };
    (ue('/lists/members.json', ({ origin: e, parsedResponse: t }) => Fe(e, t.users)),
      ue('/lists/subscribers.json', ({ origin: e, parsedResponse: t }) => Fe(e, t.users)),
      ue('followers/list.json', ({ origin: e, parsedResponse: t }) => Fe(e, t.users)),
      ue('friends/list.json', ({ origin: e, parsedResponse: t }) => Fe(e, t.users)),
      ue('/Favoriters', ({ origin: e, parsedResponse: t }) => Fe(e, he(e, t))),
      ue('/Followers', ({ origin: e, parsedResponse: t }) => Fe(e, he(e, t))),
      ue('/Following', ({ origin: e, parsedResponse: t }) => Fe(e, he(e, t))),
      ue('/ListMembers', ({ origin: e, parsedResponse: t }) => Fe(e, he(e, t))),
      ue('/ListSubscribers', ({ origin: e, parsedResponse: t }) => Fe(e, he(e, t))),
      ue('/Retweeters', ({ origin: e, parsedResponse: t }) => Fe(e, he(e, t))),
      ue('i/api/graphql', ({ origin: e, parsedResponse: t }) => Fe(e, he(e, t))));
    const xe = () => be[xfCurrentPageKey()]; /**
     * Invoke a callback for each item in the current focus/list processing context.
     * @param {Function} e - Callback invoked for each processed item; receives the current list item or its focusable element.
     * @param {Function} [t=resolveProfileLink] - Resolver that maps a list item to a focusable element; defaults to `resolveProfileLink`.
     */
    async function Re(e, t = resolveProfileLink) {
      await U({ callback: e, getFocusableEl: t, getList: xe });
    }
    const Le = {},
      Se = (e, t) => {
        if (!1 === Array.isArray(t)) return;
        if (0 === t.length) return;
        (Kn() && (e = _n.toUpperCase()), void 0 === Le[e] && (Le[e] = []));
        const n = Le[e].map((e) => J(e));
        t.forEach((t) => {
          n.includes(J(t)) || Le[e].push(t);
        });
      };
    (ue('/ListLatestTweetsTimeline', ({ origin: e, parsedResponse: t }) => Se(e, M(t))),
      ue('/CommunityTweetsTimeline', ({ origin: e, parsedResponse: t }) => Se(e, M(t))),
      ue('/TopicLandingPage', ({ origin: e, parsedResponse: t }) => Se(e, M(t))),
      ue('i/api/graphql', ({ origin: e, parsedResponse: t }) => Se(e, M(t))));
    const ve = () => Le[xfCurrentPageKey()]; /**
     * Execute a callback via the action executor, supplying the page focusable-element resolver and list provider.
     * @param {Function} e - Callback to invoke within the executor; its return value is not propagated by this wrapper.
     */
    async function Te(e) {
      await U({ callback: e, getFocusableEl: resolveTweetStatusLink, getList: ve });
    }
    const _e = {};
    ue('/HomeTimeline', ({ origin: e, parsedResponse: t }) =>
      ((e, t) => {
        if (!1 === Array.isArray(t)) return;
        if (0 === t.length) return;
        (Kn() && (e = _n.toUpperCase()), void 0 === _e[e] && (_e[e] = []));
        const n = _e[e].map((e) => J(e));
        t.forEach((t) => {
          n.includes(J(t)) || _e[e].push(t);
        });
      })(e, M(t)),
    );
    const $e = () => _e[xfCurrentPageKey()]; /**
     * Iterate over the page's focusable items and invoke the given callback for each one.
     *
     * @param {Function} e - Callback invoked for each focusable item; receives the item element and any item-specific context provided by the runner.
     */
    async function Me(e) {
      await U({ callback: e, getFocusableEl: resolveTweetStatusLink, getList: $e });
    }
    const Ie = {};
    ue('/UserTweets', ({ origin: e, parsedResponse: t }) =>
      ((e, t) => {
        if (!1 === Array.isArray(t)) return;
        if (0 === t.length) return;
        void 0 === Ie[e] && (Ie[e] = []);
        const n = Ie[e].map((e) => J(e));
        t.forEach((t) => {
          n.includes(J(t)) || Ie[e].push(t);
        });
      })(e, M(t)),
    );
    const Ee = () => Ie[xfCurrentPageKey()]; /**
     * Invoke a callback for each focusable tweet element using the module's list and focus helpers.
     * @param {Function} e - Callback invoked for each focusable element retrieved from the module list.
     */
    async function Ae(e) {
      await U({ callback: e, getFocusableEl: resolveTweetStatusLink, getList: Ee });
    }
    const Ce = document.createElement('div');
    ((Ce.innerText = 'Autopilot'),
      Ce.setAttribute('role', 'button'),
      Ce.classList.add('xf-button', 'xf-button--autopilot'));
    const De = () => {
      Ce.style.display = 'none';
    }; /**
     * Toggle visibility of the main control panel based on current path and initial-state readiness.
     *
     * If the current location pathname is "/home" and the page's initial state is available, the function makes the control panel visible; otherwise it invokes the fallback handler for the non-ready state.
     */
    const qe = async () => {
      await updateAutopilotButtonVisibility({
        isOnHomePath: location.pathname === '/home',
        hasTimelineEntries: Boolean(xe()),
        ensureInitialStateReady: async () => typeof (await ti()) === 'object',
        showButton: () => {
          Ce.style.display = 'initial';
        },
        hideButton: De,
      });
    };
    Ce.addEventListener('click', () => {
      (De(), mi());
    });
    const Ue = window.indexedDB.open('XFlow', 8);
    let Pe; /**
     * Add a record to the specified IndexedDB object store.
     * @param {string} storeName - The name of the object store to write to.
     * @param {*} record - The record to add to the store.
     */
    function je(e, t) {
      Pe.transaction([e], 'readwrite').objectStore(e).add(t);
    } /**
     * Retrieve a value by key from an IndexedDB object store.
     * @param {string} e - The name of the object store.
     * @param {*} t - The key to look up in the object store.
     * @returns {*} The stored value for the given key, or `undefined` if the store is missing or the key is not found.
     */
    function Be(e, t) {
      return new Promise((n) => {
        if (!Pe.objectStoreNames.contains(e)) return void n(void 0);
        const i = Pe.transaction([e]).objectStore(e).get(t);
        i.onsuccess = () => {
          n(i.result);
        };
      });
    }
    ((Ue.onupgradeneeded = (e) => {
      ((Pe = e.target.result),
        e.oldVersion < 3 &&
          Pe.createObjectStore('v2FollowRecord', { keyPath: ['creatorId', 'userId'] }),
        e.oldVersion < 4 &&
          Pe.createObjectStore('retweetRecord', { keyPath: ['creatorId', 'retweetedStatusId'] }),
        e.oldVersion < 5 &&
          Pe.createObjectStore('likeRecord', { keyPath: ['creatorId', 'tweetId'] }),
        e.oldVersion < 6 &&
          Ue.transaction.objectStore('likeRecord').createIndex('tweetUserId', 'tweetUserId'),
        e.oldVersion < 8 &&
          Ue.transaction
            .objectStore('v2FollowRecord')
            .createIndex('createdAt', ['creatorId', 'createdAt']));
    }),
      (Ue.onerror = (e) => {
        console.log(e);
      }),
      (Ue.onsuccess = (e) => {
        Pe = e.target.result;
      }));
    const We = 'likeRecord'; /**
     * Count persisted records for a tweet identifier in the IndexedDB store.
     * @param {string|number} e - The tweet identifier to count records for.
     * @returns {number} The number of records matching the tweet identifier.
     */
    function Oe(e) {
      return (function (e, t, n) {
        return new Promise((i) => {
          const o = Pe.transaction([e], 'readonly')
            .objectStore(e)
            .index(t)
            .count(IDBKeyRange.only(n));
          o.onsuccess = () => {
            i(o.result);
          };
        });
      })(We, 'tweetUserId', le(e));
    } /**
     * Determines whether `t` contains the value obtained by applying the transformation function `Q` to `e`.
     * @param {*} e - Input value that will be transformed by `Q`.
     * @param {string|Array} t - String or array to test for inclusion.
     * @returns {boolean} `true` if `t` contains `Q(e)`, `false` otherwise.
     */
    function Ge(e, t) {
      return t.includes(Q(e));
    } /**
     * Selects a random element from an array.
     * @param {Array} e - The array to pick an element from.
     * @returns {*} A randomly chosen element from `e`, or `undefined` if `e` is empty.
     */
    function Ne(e) {
      return e[Math.floor(Math.random() * e.length)];
    } /**
     * Resolve the REST id for the provided entity.
     * @param {*} e - The entity or value to resolve a REST id from.
     * @returns {string|undefined} The resolved REST id if available, otherwise `undefined`.
     */
    function He(e) {
      return Ne(e);
    }
    let Je;
    const Qe = () => {
        try {
          Je.scrollIntoView({ block: 'center' });
        } catch (e) {
          console.error(e);
        }
      },
      Ke = (e, t) => {
        const n = document.createElement('div');
        (n.classList.add('xf-notification', `xf-notification--${t}`), (n.textContent = e));
        try {
          Je.appendChild(n);
        } catch (e) {
          console.error(e);
        }
        Qe();
      }; /**
     * Log a value to the console and show it as a success notification.
     * @param {*} e - The message or payload to display in the console and notification.
     */
    function Ye(e) {
      (console.log(e), Ke(e, 'success'));
    } /**
     * Show a warning message in the UI and also log it to the console.
     * @param {any} e - The message or object to display and log as a warning.
     */
    function ze(e) {
      (console.log(e), Ke(e, 'warning'));
    } /**
     * Set the module's internal Je reference.
     * @param {*} e - The value to assign to the internal Je reference.
     */
    function Ze(e) {
      Je = e;
    } /**
     * Add a status entry derived from the given tweet data and show a transient notification.
     * @param {*} e - Tweet element or tweet data used to build the status log entry.
     * @param {string} t - Notification text to display transiently.
     */
    function et(e, t) {
      (Ze(resolveTweetFooter(e)), ze(t));
    } /**
     * Set the status label and display a notification message.
     * @param {string|any} e - Value to display as the status label; non-string values will be coerced to text.
     * @param {string} t - Notification message text to show to the user.
     */
    function tt(e, t) {
      (Ze(resolveTweetFooter(e)), Ye(t));
    }
    const nt = 'v2FollowRecord'; /**
     * Delete a record from the default IndexedDB object store using a composite key composed of the current session key and the provided identifier.
     * @param {*} e - The identifier used as the second element of the composite key ([currentSessionKey, e]).
     */
    function it(e) {
      return (function (e, t) {
        Pe.transaction([e], 'readwrite').objectStore(e).delete(t);
      })(nt, [L(), e]);
    } /**
     * Record and persist a follow action for the specified entity.
     *
     * Resolves the provided entity to a target REST ID and writes a follow-record to the follow store.
     *
     * @param {Object|string|number} e - Entity object or identifier used to resolve the target REST ID.
     * @returns {*} The result of writing the follow record to storage.
     */
    function ot(e) {
      return Be(nt, [L(), V(e)]);
    } /**
     * Get the stored follow record for a user or entity.
     * @param {*} e - A user object or identifier used to resolve the stored entity key.
     * @returns {*} The follow record for the resolved entity, or `undefined` if not found.
     */
    function lt(e) {
      return Be('followRecord', V(e));
    }
    let ft;
    /**
     * Create a case-insensitive regular expression that matches any term from a comma-separated list.
     * Trims whitespace and ignores empty items in the list.
     * @param {string} e - Comma-separated terms (e.g., "foo, bar, baz").
     * @returns {RegExp|undefined} A `RegExp` that matches any listed term (case-insensitive), or `undefined` if no terms are provided.
     */
    ft = async (e, t) => {
      const n = await (async function (e, t) {
        if (Y(e)) return 'already liked';
        if (t.minTweetLikes) {
          const n = K(e);
          if (n < t.minTweetLikes)
            return `${n} Tweet likes, but ${t.minTweetLikes} minimum required`;
        }
        if (t.maxTweetLikes) {
          const n = K(e);
          if (n > t.maxTweetLikes)
            return `${n} Tweet likes, but ${t.maxTweetLikes} maximum required`;
        }
        if (t.languageWhitelist && !Ge(e, t.languageWhitelist))
          return `language "${Q(e)}" not whitelisted`;
        if (t.tweetTextBlacklist instanceof RegExp && ie(e)) {
          const n = ie(e).match(t.tweetTextBlacklist);
          if (n) return `${n.join()} found in Tweet text, but is blacklisted`;
        }
        if (t.likeSkipReplies && z(e)) return 'is reply';
        if (t.likeSkipRetweets && Z(e)) return 'is Retweet';
        if (t.likeSkipRetweetsWithComment && ee(e)) return 'is Retweet with comment';
        if (t.minFollowing) {
          const n = O(oe(e));
          if ('number' == typeof n && n < t.minFollowing)
            return `${n} following, but ${t.minFollowing} minimum required`;
        }
        if (t.maxFollowing) {
          const n = O(oe(e));
          if ('number' == typeof n && n > t.maxFollowing)
            return `${n} following, but ${t.maxFollowing} maximum required`;
        }
        if (t.minFollowers) {
          const n = j(oe(e));
          if ('number' == typeof n && n < t.minFollowers)
            return `${n} followers, but ${t.minFollowers} minimum required`;
        }
        if (t.maxFollowers) {
          const n = j(oe(e));
          if ('number' == typeof n && n > t.maxFollowers)
            return `${n} followers, but ${t.maxFollowers} maximum required`;
        }
        if (t.minFollowersFollowingRatio) {
          const n = W(oe(e));
          if (n && n < t.minFollowersFollowingRatio)
            return `${n.toFixed(2)} followers/following ratio, but ${t.minFollowersFollowingRatio} minimum required`;
        }
        if (t.maxFollowersFollowingRatio) {
          const n = W(oe(e));
          if (n && n >= t.maxFollowersFollowingRatio)
            return `${n.toFixed(2)} followers/following ratio, but ${t.maxFollowersFollowingRatio} maximum required`;
        }
        if (t.likeSkipFollowed) {
          const t = oe(e);
          if (await ot(t)) return 'already followed once';
          if (await lt(t)) return 'already followed once';
        }
        if (t.skipLikedXTweetsFromUser) {
          const n = await Oe(e);
          if ('number' == typeof n && n >= t.skipLikedXTweetsFromUser)
            return `already liked ${n} Tweet(s) from user`;
        }
        return !0;
      })(e, t);
      if (1 == n) {
        const n = getTweetActionButton(e.focusableEl, 'like');
        if (!n) return !1;
        (n.click(),
          (function (e) {
            const t = { createdAt: Date.now(), creatorId: L(), tweetId: J(e), tweetUserId: le(e) };
            je(We, t);
          })(e),
          Qn(),
          tt(e, 'successfully liked'));
        const i = He(t.intervalDurationRange);
        (await Vn(i), Qe());
      } else n && et(e, n);
    }; /**
     * Start a mass-like operation using stored like settings, applying optional overrides.
     *
     * Applies normalized like configuration for the current page context and dispatches the context-specific
     * processor to perform like actions. Optional parameters override the stored like limit and per-action pause.
     *
     * @param {number} [limit] - Optional override for the maximum number of likes to perform.
     * @param {number} [pause] - Optional override for the per-action pause/delay (seconds).
     * @returns {Promise<void>} Completes when the mass-like operation finishes or is scheduled for the current context.
     */
    async function dt(e, t) {
      const n = await normalizeLikeConfig();
      (await Bn(),
        n.likeLimit && Hn(n.likeLimit),
        e && Hn(e),
        t && On(t),
        Nn(n.likePauseWhenUnableToLike),
        ve()
          ? await Te(async (e) => {
              await ft(e, n);
            })
          : $e()
            ? (delete n.likeSkipFollowed,
              delete n.likeSkipLikedXTweetsFromUser,
              delete n.maxFollowing,
              delete n.minFollowing,
              delete n.maxFollowers,
              delete n.minFollowers,
              delete n.maxFollowersFollowingRatio,
              delete n.minFollowersFollowingRatio,
              await Me(async (e) => {
                await ft(e, n);
              }))
            : de()
              ? await me(async (e) => {
                  await ft(e, n);
                })
              : Ee() &&
                (delete n.maxFollowing,
                delete n.minFollowing,
                delete n.maxFollowers,
                delete n.minFollowers,
                delete n.maxFollowersFollowingRatio,
                delete n.minFollowersFollowingRatio,
                await Ae(async (e) => {
                  await ft(e, n);
                })));
    }
    const mt = document.createElement('div');
    ((mt.innerText = 'Like all'),
      mt.setAttribute('role', 'button'),
      mt.classList.add('xf-button', 'xf-button--like'));
    const pt = () => {
      mt.style.display = 'none';
    };
    mt.addEventListener('click', async () => {
      (m(), De(), qt(), Rt(), pt(), await dt());
    });
    const yt = 'retweetRecord';
    let Ft;
    Ft = async (e, t) => {
      const n = await (async function (e, t) {
        if (te(e)) return 'already retweeted';
        if (t.languageWhitelist && !Ge(e, t.languageWhitelist))
          return `language "${Q(e)}" not whitelisted`;
        if (t.tweetTextBlacklist instanceof RegExp && ie(e)) {
          const n = ie(e).match(t.tweetTextBlacklist);
          if (n) return `${n.join()} found in Tweet text, but is blacklisted`;
        }
        if (t.retweetSkipFollowed) {
          const t = oe(e);
          if (await ot(t)) return 'already followed once';
          if (await lt(t)) return 'already followed once';
        }
        return t.retweetSkipReplies && z(e)
          ? 'is reply'
          : t.retweetSkipRetweets && Z(e)
            ? 'is Retweet'
            : !t.retweetSkipRetweetsWithComment || !ee(e) || 'is Retweet with comment';
      })(e, t);
      if (1 == n) {
        const n = getTweetActionButton(e.focusableEl, 'retweet');
        if (!n) return !1;
        (Jn('/compose/tweet'), n.click());
        ((await E(() => findRetweetConfirmButton(), 9999)).click(),
          (function (e) {
            const t = ne(e),
              n = { createdAt: Date.now(), creatorId: L(), retweetedStatusId: t };
            je(yt, n);
          })(e),
          Qn(),
          tt(e, 'successfully retweeted'));
        const i = He(t.intervalDurationRange);
        (await Vn(i), Qe());
      } else n && et(e, n);
    }; /**
     * Start a mass-retweet operation using stored settings and optional overrides.
     *
     * Loads the stored retweet configuration, applies the provided overrides (maximum retweets and inter-attempt delay),
     * configures pause behavior when unable to retweet, and initiates the mass-retweet runner appropriate for the current page context.
     *
     * @param {number} [limit] - Override for the maximum number of retweets to perform.
     * @param {number} [delay] - Override for the delay between retweet attempts, in milliseconds.
     */
    async function ht(e, t) {
      const n = await normalizeRetweetConfig();
      (await Bn(),
        n.retweetLimit && Hn(n.retweetLimit),
        e && Hn(e),
        t && On(t),
        Nn(n.retweetPauseWhenUnableToRetweet),
        ve()
          ? await Te(async (e) => {
              await Ft(e, n);
            })
          : $e()
            ? (delete n.retweetSkipFollowed,
              await Me(async (e) => {
                await Ft(e, n);
              }))
            : Ee() &&
              (await Ae(async (e) => {
                await Ft(e, n);
              })));
    }
    const xt = document.createElement('div');
    ((xt.innerText = 'Retweet all'),
      xt.setAttribute('role', 'button'),
      xt.classList.add('xf-button', 'xf-button--retweet'));
    const Rt = () => {
      xt.style.display = 'none';
    }; /**
     * Toggle visibility of the xt control based on the current page and application state.
     *
     * Sets the xt element's display to "initial" when the current location and app state permit actions;
     * otherwise updates the UI to hide or reset the control.
     */
    const Lt = () => {
      updateRetweetButtonVisibility({
        shouldShow:
          (ve() && !location.pathname.includes('/communities/')) || $e() || (Ee() && !_()),
        showButton: () => {
          xt.style.display = 'initial';
        },
        hideButton: Rt,
      });
    }; /**
     * Convert a comma-separated string into an array of trimmed, uppercase tokens.
     * @param {string} e - The comma-separated input string.
     * @returns {string[]} An array where each item is a token from the input, trimmed and converted to uppercase.
     */
    function St(e) {
      return e.split(',').map((e) => e.trim().toUpperCase());
    } /**
     * Determines whether a text contains the target user's @mention in uppercase.
     * @param {*} e - Value used to derive the username (e.g., a user object or username string).
     * @param {string} t - The text to search for the @mention.
     * @returns {boolean} `true` if `t` contains an `@` followed by the derived username converted to uppercase, `false` otherwise.
     */
    function vt(e, t) {
      return t.includes(`@${P(e).toUpperCase()}`);
    } /**
 * Record a timestamped action for the given entity and advance the autopilot flow.
 * 
 * Persists an object containing the current timestamp, the current creator id, and the user id resolved from the provided entity, then invokes the continuation handler.
 * @param {any} e - Entity object from which a user id is resolved.
function Tt(e){!function(e){const t={createdAt:Date.now(),creatorId:L(),userId:V(e)};je(nt,t)}(e),Qn()}/**
 * Determine whether a target user passes configured follow guards or return a reason to skip.
 *
 * Evaluates the provided user object against multiple follow-related rules in the options object (e.g., bio required, verified skip, protected requirements, follower/following thresholds, black/white lists, prior follow checks) and returns `true` when all checks allow following or a short string explaining the first failing condition.
 *
 * @param {Object} e - User record (state-derived user/object) to evaluate.
 * @param {Object} t - Follow rule options. Common fields used: `followBioRequired`, `followSkipVerified`, `blacklist` (array/set), `followProfileImageRequired`, `followSkipProtected`, `followProtectedRequired`, `followSkipFollower`, `minFollowing`, `maxFollowing`, `minFollowers`, `maxFollowers`, `minFollowersFollowingRatio`, `maxFollowersFollowingRatio`, `bioBlacklist` (RegExp), `bioWhitelist` (RegExp), and `followSkipFollowed`.
 * @returns {true|string} `true` if the user is allowed to be followed; otherwise a short string describing why the user should be skipped (e.g., "is verified", "has no biography", "already followed once").
 */
    async function _t(e, t) {
      if (
        !(function (e) {
          return P(e) == S();
        })(e) &&
        (function (e) {
          return 1 != e.relationship_perspectives.following && 1 != e.legacy.follow_request_sent;
        })(e)
      ) {
        if (
          (function (e) {
            return 1 == e.relationship_perspectives.blocked_by;
          })(e)
        )
          return 'is blocking you';
        if (
          t.followBioRequired &&
          (function (e) {
            return '' === F(e.legacy, 'description');
          })(e)
        )
          return 'has no biography';
        if (t.followSkipVerified && N(e)) return 'is verified';
        if (vt(e, t.blacklist)) return 'is blacklisted';
        if (
          t.followProfileImageRequired &&
          (function (e) {
            return 1 == e.legacy.default_profile_image;
          })(e)
        )
          return 'has default profile image';
        if (t.followSkipProtected && G(e)) return 'is protected';
        if (t.followProtectedRequired && !G(e)) return 'is not protected';
        if (t.followSkipFollower && B(e)) return 'is following you';
        if (t.minFollowing) {
          const n = O(e);
          if ('number' == typeof n && n < t.minFollowing)
            return `${n} following, but ${t.minFollowing} minimum required`;
        }
        if (t.maxFollowing) {
          const n = O(e);
          if ('number' == typeof n && n > t.maxFollowing)
            return `${n} following, but ${t.maxFollowing} maximum required`;
        }
        if (t.minFollowers) {
          const n = j(e);
          if ('number' == typeof n && n < t.minFollowers)
            return `${n} followers, but ${t.minFollowers} minimum required`;
        }
        if (t.maxFollowers) {
          const n = j(e);
          if ('number' == typeof n && n > t.maxFollowers)
            return `${n} followers, but ${t.maxFollowers} maximum required`;
        }
        if (t.minFollowersFollowingRatio) {
          const n = W(e);
          if (n && n < t.minFollowersFollowingRatio)
            return `${n.toFixed(2)} followers/following ratio, but ${t.minFollowersFollowingRatio} minimum required`;
        }
        if (t.maxFollowersFollowingRatio) {
          const n = W(e);
          if (n && n >= t.maxFollowersFollowingRatio)
            return `${n.toFixed(2)} followers/following ratio, but ${t.maxFollowersFollowingRatio} maximum required`;
        }
        if (t.bioBlacklist instanceof RegExp) {
          const n = X(e).match(t.bioBlacklist);
          if (n) return `${n.join()} found in bio, but is blacklisted`;
        }
        if (t.bioWhitelist instanceof RegExp) {
          const n = X(e);
          if (!1 === t.bioWhitelist.test(n)) return 'no whitelisted word found in bio';
        }
        if (t.followSkipFollowed) {
          if (await ot(e)) return 'already followed once';
          if (await lt(e)) return 'already followed once';
        }
        return !0;
      }
    } /**
     * Attempt to follow the account referenced by the provided tweet item when eligibility checks allow it.
     *
     * Performs necessary in-page interactions to locate and click the follow control, updates internal follow records on success, and waits for an interval or short backoff depending on outcome.
     *
     * @param {Object} e - Tweet item container; must include DOM references (e.g., `focusableEl`) and identifiers used to resolve the target account.
     * @param {Object} t - Options object.
     * @param {Array<string>} [t.tweetLanguageWhitelist] - Allowed tweet languages; when present, tweets whose language is not in this list are skipped.
     * @param {Array<number>} [t.intervalDurationRange] - Two-element range [minSeconds, maxSeconds] used to compute the delay after a successful follow.
     */
    async function $t(e, t) {
      let n;
      const i = oe(e);
      if (
        ((n =
          t.tweetLanguageWhitelist && !Ge(e, t.tweetLanguageWhitelist)
            ? `language "${Q(e)}" not whitelisted`
            : await _t(i, t)),
        1 == n)
      ) {
        let n;
        Jn(H(i));
        const userAnchor = findTweetUserAnchor(e.focusableEl, H(oe(e)));
        userAnchor && userAnchor.click();
        try {
          n = await E(() => resolveFollowButton(i), 2e3);
        } catch (e) {
          console.log(e);
        }
        if (
          (n && n.click(),
          window.history.back(),
          await E(() => Yn()),
          (e.focusableEl = await E(() => resolveTweetStatusLink(e))),
          e.focusableEl.focus(),
          Ze(resolveTweetFooter(e)),
          !n)
        )
          return ze('follow button not found');
        (Tt(i), Ye('successfully followed'));
        const o = He(t.intervalDurationRange);
        await Vn(o);
      } else (Ze(resolveTweetFooter(e)), n && (ze(n), await Vn(500)));
    }
    xt.addEventListener('click', async () => {
      (p(), qt(), Rt(), pt(), await ht());
    });
    const Mt = async (e) => {
      if (!Un) {
        for (let t = e; t >= 0; t--) {
          const n = xe()[t];
          if (((n.focusableEl = resolveModalProfileLink(n)), n.focusableEl)) {
            if ((n.focusableEl.scrollIntoView(), t === e)) return;
            break;
          }
        }
        (await Vn(40), await Mt(e));
      }
    };
    const It = {
        followBlacklist: '@username1,@username2',
        followBioBlacklist: '',
        followBioRequired: !1,
        followBioWhitelist: '',
        followDailyLimit: '',
        followIntervalMax: 8,
        followIntervalMin: 4,
        followLimit: 400,
        followMaxFollowers: '',
        followMaxFollowersFollowingRatio: '',
        followMaxFollowing: '',
        followMinFollowers: '',
        followMinFollowing: '',
        followMinFollowersFollowingRatio: '',
        followPauseAfterSkipMax: '',
        followPauseAfterSkipMin: '',
        followPauseWhenTwitterLimitExceeded: 5,
        followProfileImageRequired: !1,
        followProtectedRequired: !1,
        followSkipFollowed: !0,
        followSkipFollower: !1,
        followSkipProtected: !1,
        followSkipVerified: !1,
        followTweetLanguageWhitelist: '',
      },
      Et = () => mergeWithStoredConfig(It),
      At = async () => {
        const e = await Et();
        return (
          (e.blacklist = St(e.followBlacklist)),
          (e.bioBlacklist = compileCsvRegex(e.followBioBlacklist)),
          (e.bioWhitelist = compileCsvRegex(e.followBioWhitelist)),
          (e.tweetLanguageWhitelist = parseCsvList(e.followTweetLanguageWhitelist)),
          (e.intervalDurationRange = buildIntervalRange(e.followIntervalMin, e.followIntervalMax)),
          (e.maxFollowing = parseInt(e.followMaxFollowing)),
          (e.minFollowing = parseInt(e.followMinFollowing)),
          (e.maxFollowers = parseInt(e.followMaxFollowers)),
          (e.minFollowers = parseInt(e.followMinFollowers)),
          (e.maxFollowersFollowingRatio = parseFloat(e.followMaxFollowersFollowingRatio)),
          (e.minFollowersFollowingRatio = parseFloat(e.followMinFollowersFollowingRatio)),
          e.followPauseAfterSkipMin &&
            e.followPauseAfterSkipMax &&
            (e.pauseAfterSkipRange = buildIntervalRange(
              e.followPauseAfterSkipMin,
              e.followPauseAfterSkipMax,
            )),
          e
        );
      }; /**
     * Orchestrates a mass "follow" operation using stored settings and optional overrides.
     *
     * Applies per-run and daily follow limits, enforces pause/limit state, chooses the appropriate navigation and interaction strategy for the current page context, performs follow attempts with configured pacing, updates UI and persistence for each result, and honors pause-after-skip intervals when provided.
     *
     * @param {?number|Object} e - Follow limit override or an options object (may include `followLimit`, `intervalDurationRange`, `pauseAfterSkipRange`, etc.). When a number is provided it is treated as a follow limit.
     * @param {?any} t - Optional target or context hint (for example a specific item, element, or route marker) used to focus or scope the follow operation before actions begin.
     */
    async function Ct(e, t) {
      const n = await At();
      var o;
      (await Bn(),
        n.followLimit && Hn(n.followLimit),
        e && Hn(e),
        n.followDailyLimit &&
          ((o = await (async function () {
            const e = Pe.transaction([nt], 'readonly').objectStore(nt).index('createdAt'),
              t = IDBKeyRange.bound([L(), Date.now() - 864e5], [L(), Date.now()]);
            let n = 0;
            return new Promise((i) => {
              e.openCursor(t).onsuccess = (e) => {
                const t = e.target.result;
                t ? ((n += 1), t.continue()) : i(n);
              };
            });
          })()),
          (In = o),
          (function (e) {
            (($n = e), In >= $n && ((Un = !0), i(), hn()));
          })(n.followDailyLimit)),
        t && On(t),
        Nn(n.followPauseWhenTwitterLimitExceeded),
        $() && xe()
          ? await (async function (e) {
              await Re(async (t, n) => {
                const i = await _t(t, e);
                if (1 == i) {
                  let i = resolveFollowButton(t);
                  if (i) (i.click(), Tt(t));
                  else {
                    (Jn(H(t)), t.focusableEl.click());
                    try {
                      i = await E(() => resolveFollowButton(t), 4e3);
                    } catch (e) {
                      console.log(e);
                    }
                    (i && (i.click(), Tt(t)),
                      window.history.back(),
                      await E(() => Yn()),
                      await Mt(n));
                  }
                  if ((Ze(ke(t)), !i)) return ze('follow button not found');
                  Ye('successfully followed');
                  const o = He(e.intervalDurationRange);
                  await Vn(o);
                } else (Ze(ke(t)), i && (ze(i), await Vn(500)));
              }, resolveModalProfileLink);
            })(n)
          : ve()
            ? await (async function (e) {
                await Te(async (t) => {
                  await $t(t, e);
                });
              })(n)
            : de()
              ? await (async function (e) {
                  await me(async (t) => {
                    await $t(t, e);
                  });
                })(n)
              : await (async function (e) {
                  await Re(async (t) => {
                    const n = await _t(t, e);
                    if ((Ze(ke(t)), 1 == n)) {
                      const n = resolveFollowButton(t);
                      if (!n) return ze('follow button not found');
                      (n.click(), Tt(t), Ye('successfully followed'));
                      const i = He(e.intervalDurationRange);
                      await Vn(i);
                    } else if ((n && ze(n), e.pauseAfterSkipRange)) {
                      const t = He(e.pauseAfterSkipRange);
                      await Vn(t);
                    }
                  });
                })(n));
    }
    const Dt = document.createElement('div');
    ((Dt.innerText = 'Follow all'),
      Dt.setAttribute('role', 'button'),
      Dt.classList.add('xf-button', 'xf-button--follow'));
    const qt = () => {
      Dt.style.display = 'none';
    };
    Dt.addEventListener('click', async () => {
      (f(), qt(), pt(), Rt(), await Ct());
    });
    const Ut = 864e5; /**
     * Compute elapsed time since the given timestamp, expressed in the module's time unit.
     * @param {number} e - Start timestamp in milliseconds since the Unix epoch.
     * @returns {number} The elapsed time from `e` to now, measured in units of `Ut` (i.e. `(Date.now() - e) / Ut`).
     */
    function daysSince(e) {
      return (Date.now() - e) / Ut;
    }
    const jt = (e, t, n) => n.indexOf(e) == t,
      Bt = (e, t) => {
        const n = [];
        if (t.followingLessThan) {
          if (O(e) < t.followingLessThan) return !0;
          n.push(`${O(e)} Following`);
        }
        if (t.followingGreaterThan) {
          if (O(e) > t.followingGreaterThan) return !0;
          n.push(`${O(e)} Following`);
        }
        if (t.followersLessThan) {
          if (j(e) < t.followersLessThan) return !0;
          n.push(`${j(e)} Followers`);
        }
        if (t.followersGreaterThan) {
          if (j(e) > t.followersGreaterThan) return !0;
          n.push(`${j(e)} Followers`);
        }
        return 0 === n.length || n.filter(jt).join(', ');
      }; /**
     * Determine whether a user should be skipped during an unfollow action and provide the reason.
     *
     * @param {Object} e - User record/object from the app state to evaluate.
     * @param {Object} t - Unfollow policy/options.
     * @param {boolean} [t.unfollowSkipFollower] - Skip if the user follows the current account.
     * @param {boolean} [t.unfollowSkipVerified] - Skip if the user is verified.
     * @param {Array|string|RegExp} [t.blacklist] - Blacklist of usernames/ids to always skip.
     * @param {RegExp} [t.bioBlacklist] - Regular expression to test against the user's bio; match indicates a skip.
     * @param {boolean} [t.unfollowMassFollowedRequired] - Require that the user was previously mass-followed to allow unfollow.
     * @param {number} [t.minDaysFollowed] - Minimum number of days since follow required before allowing unfollow.
     * @returns {string|undefined} A human-readable reason explaining why the user should be skipped for unfollowing, or `undefined` if no skip reason was found.
     */
    async function Wt(e, t) {
      if (
        (function (e) {
          return F(e.relationship_perspectives, 'following');
        })(e)
      ) {
        if (t.unfollowSkipFollower && B(e)) return 'is following you';
        if (t.unfollowSkipVerified && N(e)) return 'is verified';
        if (vt(e, t.blacklist)) return 'is blacklisted';
        if (t.bioBlacklist instanceof RegExp) {
          const n = X(e).match(t.bioBlacklist);
          if (n) return `${n.join()} found in bio, but is blacklisted`;
        }
        if (t.unfollowMassFollowedRequired || t.minDaysFollowed) {
          const n = await ot(e),
            i = await lt(e);
          if (t.unfollowMassFollowedRequired && !n && !i) return 'has not been mass followed';
          if (t.minDaysFollowed && n) {
            const e = daysSince(n.createdAt);
            if (e < t.minDaysFollowed)
              return `${e.toFixed(2)} days followed, but ${t.minDaysFollowed} days minimum required`;
          }
          if (t.minDaysFollowed && i) {
            const e = daysSince(i.createdAt);
            if (e < t.minDaysFollowed)
              return `${e} days followed, but ${t.minDaysFollowed} days minimum required`;
          }
        }
        return Bt(e, t);
      }
    }
    const Ot = {
        unfollowBlacklist: '@username1,@username2',
        unfollowBioBlacklist: '',
        unfollowFollowersLessThan: '',
        unfollowFollowersGreaterThan: '',
        unfollowFollowingLessThan: '',
        unfollowFollowingGreaterThan: '',
        unfollowIntervalMax: 8,
        unfollowIntervalMin: 4,
        unfollowLimit: '',
        unfollowMassFollowedRequired: !1,
        unfollowMinDaysFollowed: 2,
        unfollowPauseAfterSkipMax: '',
        unfollowPauseAfterSkipMin: '',
        unfollowSkipFollower: !0,
        unfollowSkipVerified: !1,
      },
      Vt = () => mergeWithStoredConfig(Ot),
      Gt = () => findConfirmationSheetConfirmButton(),
      Nt = async () => {
        const e = await Vt();
        return (
          (e.blacklist = St(e.unfollowBlacklist)),
          (e.bioBlacklist = compileCsvRegex(e.unfollowBioBlacklist)),
          (e.followingLessThan = parseInt(e.unfollowFollowingLessThan)),
          (e.followingGreaterThan = parseInt(e.unfollowFollowingGreaterThan)),
          (e.followersLessThan = parseInt(e.unfollowFollowersLessThan)),
          (e.followersGreaterThan = parseInt(e.unfollowFollowersGreaterThan)),
          (e.intervalDurationRange = buildIntervalRange(
            e.unfollowIntervalMin,
            e.unfollowIntervalMax,
          )),
          (e.minDaysFollowed = parseFloat(e.unfollowMinDaysFollowed)),
          e.unfollowPauseAfterSkipMin &&
            e.unfollowPauseAfterSkipMax &&
            (e.pauseAfterSkipRange = buildIntervalRange(
              e.unfollowPauseAfterSkipMin,
              e.unfollowPauseAfterSkipMax,
            )),
          e
        );
      }; /**
     * Unfollow the specified target account while respecting configured limits, delays, and pause rules.
     *
     * Locates and clicks the account's unfollow control in the page UI, records progress, displays success or error notifications, and waits the configured interval after a successful unfollow or when a pause is required.
     *
     * @param {Object|string|number} e - Target account (user object, username, or id) used to locate the unfollow button.
     * @param {?number} [t] - Optional override that modifies pause/delay behavior for this operation.
     */
    async function Xt(e, t) {
      const n = await Nt();
      (await Bn(),
        n.unfollowLimit && Hn(n.unfollowLimit),
        e && Hn(e),
        t && On(t),
        await Re(async (e) => {
          Ze(ke(e));
          const t = await Wt(e, n);
          if (1 == t) {
            const t = findUserUnfollowButton(V(e));
            if (!t) return ze('unfollow button not found');
            t.click();
            ((await E(() => Gt(), 1e3)).click(), Qn(), Ye('successfully unfollowed'));
            const i = He(n.intervalDurationRange);
            await Vn(i);
          } else if ((t && ze(t), n.pauseAfterSkipRange)) {
            const e = He(n.pauseAfterSkipRange);
            await Vn(e);
          }
        }));
    }
    const Ht = document.createElement('div');
    ((Ht.innerText = 'Unfollow all'),
      Ht.setAttribute('role', 'button'),
      Ht.classList.add('xf-button', 'xf-button--unfollow'));
    const Jt = () => {
      Ht.style.display = 'none';
    }; /**
     * Determine whether a target item is eligible for mass-unlike actions based on configured rules.
     *
     * Performs an asynchronous lookup for the item's like record when needed and evaluates:
     * - whether the item was previously mass-liked (when `unlikeMassLikedRequired` is true)
     * - whether the time since it was liked meets `minDaysSinceLike` (when specified)
     *
     * @param {any} e - Identifier or object for the target item to evaluate (passed through internal resolvers).
     * @param {{unlikeMassLikedRequired?: boolean, minDaysSinceLike?: number}} t - Eligibility rules:
     *   - `unlikeMassLikedRequired`: require the item to have been mass-liked previously.
     *   - `minDaysSinceLike`: minimum number of days that must have elapsed since the like.
     * @returns {true|string} `true` if the item is eligible; otherwise a string describing the reason it is not eligible.
     */
    Ht.addEventListener('click', async () => {
      (d(), Jt(), await Xt());
    }); /**
     * Attempt to unlike a tweet action item, record the attempt, and enforce configured rate limits and pacing.
     *
     * Retrieves and applies the stored unlike configuration, checks eligibility based on prior mass-like records and configured rules, clicks the tweet's unlike control when eligible, updates UI state on success, and schedules the configured delay after the attempt. If the unlike control cannot be found or the item is ineligible, invokes the failure handler (passing the optional token) and applies a short backoff.
     *
     * @param {Object} e - Action item representing the tweet; must expose `focusableEl` used to locate the unlike control.
     * @param {*} [t] - Optional token forwarded to the failure handler when the unlike cannot be performed.
     */
    async function zt(e, t) {
      const n = await normalizeUnlikeConfig();
      (await Bn(),
        n.unlikeLimit && Hn(n.unlikeLimit),
        e && Hn(e),
        t && On(t),
        await me(async (e) => {
          const i = { isLiked: Y(e), massLikeRecordCreatedAt: void 0 };
          if (i.isLiked && (n.unlikeMassLikedRequired || n.minDaysSinceLike)) {
            const t = await (function (e) {
              return Be(We, [L(), J(e)]);
            })(e);
            i.massLikeRecordCreatedAt = t?.createdAt;
          }
          const o = evaluateUnlikeEligibility(i, n);
          if (!0 === o) {
            const t = getTweetActionButton(e.focusableEl, 'unlike');
            if (!t) return !1;
            (t.click(), Qn(), tt(e, 'successfully unliked'));
            const i = He(n.intervalDurationRange);
            await Vn(i);
          } else o && (et(e, o), await Vn(500));
        }));
    }
    const Zt = document.createElement('div');
    ((Zt.innerText = 'Unlike all'),
      Zt.setAttribute('role', 'button'),
      Zt.classList.add('xf-button', 'xf-button--unlike'));
    const en = () => {
      Zt.style.display = 'none';
    }; /**
     * Validate whether a tweet/item is eligible for unretweeting according to provided rules.
     *
     * Performs two checks when the item is a retweet: a minimum-age check based on retweet time
     * and, optionally, a membership check that verifies the item was previously mass-retweeted.
     *
     * @param {object} e - The tweet or item object to validate.
     * @param {object} t - Validation options.
     * @param {number} [t.minDaysSinceRetweet] - Minimum required days since the retweet; if provided and the item is younger, a failure reason is returned.
     * @param {boolean} [t.unretweetMassRetweetedRequired] - If true, requires that the item was previously mass-retweeted; if not found, a failure reason is returned.
     * @returns {true|string|undefined} `true` if the item passes all applicable checks, a string describing the first failing reason otherwise, or `undefined` if the input is not a retweet/applicable.
     */
    Zt.addEventListener('click', async () => {
      (g(), en(), await zt());
    });
    const on = () => findUnretweetConfirmButton(); /**
     * Execute a mass unretweet run using the current configuration, optionally overriding limits and skip-recording behavior.
     *
     * Runs through discovered timeline items and attempts to unretweet eligible tweets until the configured (or overridden) limit is reached, applying configured interval delays between actions. When `recordOnSkip` is truthy, items that are skipped or unavailable are recorded via the module's skip handler.
     *
     * @param {number} [limit] - Optional override for the maximum number of unretweets to perform this run.
     * @param {boolean|any} [recordOnSkip] - If truthy, record skipped/unavailable items (value may carry context used by the recorder).
     */
    async function an(e, t) {
      const n = await normalizeUnretweetConfig();
      (await Bn(),
        n.unretweetLimit && Hn(n.unretweetLimit),
        e && Hn(e),
        t && On(t),
        await Ae(async (e) => {
          const i = { isRetweeted: te(e), retweetCreatedAt: void 0, hasMassRetweetRecord: !0 };
          if (i.isRetweeted) {
            const t = F(e.legacy, 'created_at');
            i.retweetCreatedAt = Date.parse(t);
            if (n.unretweetMassRetweetedRequired) {
              const t = await (function (e) {
                const t = ne(e);
                return Be(yt, [L(), t]);
              })(e);
              i.hasMassRetweetRecord = Boolean(t);
            }
          }
          const o = evaluateUnretweetEligibility(i, n);
          if (!0 === o) {
            const t = getTweetActionButton(e.focusableEl, 'unretweet');
            if (!t) return !1;
            t.click();
            ((await E(() => on())).click(), Qn(), tt(e, 'successfully unretweeted'));
            const i = He(n.intervalDurationRange);
            await Vn(i);
          } else o && (et(e, o), await Vn(500));
        }));
    }
    const sn = document.createElement('div');
    ((sn.innerText = 'Unretweet all'),
      sn.setAttribute('role', 'button'),
      sn.classList.add('xf-button', 'xf-button--unretweet'));
    const rn = () => {
      sn.style.display = 'none';
    };
    sn.addEventListener('click', async () => {
      (y(), rn(), await an());
    });
    const cn = document.createElement('aside');
    (cn.setAttribute('role', 'complementary'),
      cn.classList.add('xf-panel'),
      document.body.appendChild(cn));
    const un = () => {
        cn.style.display = 'none';
      },
      wn = () => {
        cn.style.display = 'flex';
      }; /**
     * Update which action controls are shown and adjust the panel visibility based on current page state and guard conditions.
     *
     * Toggles the display of the UI action buttons and the status panel, and updates related panel classes and layout to reflect the current context and feature/guard checks. This function has side effects on DOM elements (display styles and panel class toggling).
     */
    const fn = async () => {
      await updateActionPanelVisibility({
        isBusy: Un,
        ensureAutopilotButton: qe,
        followButton: {
          shouldShow: (xe() && !v()) || (ve() && !$()) || de(),
          show: () => {
            Dt.style.display = 'initial';
          },
          hide: qt,
        },
        likeButton: {
          shouldShow: ve() || (Ee() && !_()) || (de() && !T()) || $e(),
          show: () => {
            mt.style.display = 'initial';
          },
          hide: pt,
        },
        retweetButton: {
          shouldShow:
            (ve() && !location.pathname.includes('/communities/')) || $e() || (Ee() && !_()),
          show: () => {
            xt.style.display = 'initial';
          },
          hide: Rt,
        },
        unfollowButton: {
          shouldShow: xe() && v(),
          show: () => {
            Ht.style.display = 'initial';
          },
          hide: Jt,
        },
        unlikeButton: {
          shouldShow: de() && T(),
          show: () => {
            Zt.style.display = 'initial';
          },
          hide: en,
        },
        unretweetButton: {
          shouldShow: Ee() && _(),
          show: () => {
            sn.style.display = 'initial';
          },
          hide: rn,
        },
        statusBar: {
          hide: () => {
            dn.style.display = 'none';
          },
        },
        panel: {
          element: cn,
        },
        showPanel: wn,
        hidePanel: un,
        isSearchPath: location.pathname === '/search',
      });
    };
    const dn = document.createElement('div');
    dn.classList.add('xf-status-bar');
    const mn = document.createElement('div');
    ((mn.innerText = 'Skip'),
      mn.setAttribute('role', 'button'),
      mn.classList.add('xf-status-bar__button'),
      dn.append(mn),
      mn.addEventListener('click', async () => {
        ((mn.style.display = 'none'), await ki());
      }));
    const pn = document.createElement('div');
    ((pn.innerText = 'Cancel'),
      pn.setAttribute('role', 'button'),
      pn.classList.add('xf-status-bar__button'),
      dn.append(pn),
      pn.addEventListener('click', () => {
        (jn(), pi(), un(), s());
      }));
    const yn = document.createElement('div'); /**
     * Show the pause UI and set a retry message appropriate to the current action.
     *
     * Reveals the pause panel (pn), hides the active/progress panels (yn, mn),
     * and updates the status text (u) with a message for the current action (`w`)
     * using shared helpers to format the retry delay and action label.
     */
    const gn = () => {
      showPauseState({
        pausePanel: pn,
        activePanel: yn,
        skipButton: mn,
        statusLabel: u,
        action: w,
        waitSeconds: Pn,
      });
    }; /**
     * Show the repeating-autopilot countdown and update the status label.
     *
     * Displays the repeating-autopilot UI (shows the countdown element, hides other controls)
     * and sets the status text to indicate how long until autopilot repeats.
     *
     * @param {number} e - Time remaining in seconds until autopilot repeats.
     */
    const kn = (e) => {
      showRepeatCountdown({
        pausePanel: pn,
        activePanel: yn,
        skipButton: mn,
        statusLabel: u,
        seconds: e,
      });
    }; /**
     * Update the autopilot UI to show progress and toggle related controls.
     *
     * Makes the primary autopilot controls visible, hides the idle/status element, and updates the progress label to "Autopilot {current}/{total} ...".
     * @param {number} e - Current progress count (completed actions).
     * @param {number} t - Total number of actions to perform.
     */
    const bn = (e, t) => {
      showProgressState({
        pausePanel: pn,
        activePanel: yn,
        skipButton: mn,
        statusLabel: u,
        current: e,
        total: t,
      });
    }; /**
     * Update UI visibility and display a success message summarizing the completed mass action.
     *
     * Sets the visibility of panel elements (hides `pn` and `mn`, shows `yn`) and updates `u.textContent`
     * with a success message based on the current action `w` and the count `Tn`.
     *
     * Possible `w` values and resulting messages:
     * - "follow": "Successfully followed {Tn} users"
     * - "unfollow": "Successfully unfollowed {Tn} users"
     * - "like": "Successfully liked {Tn} Tweets"
     * - "retweet": "Successfully retweeted {Tn} Tweets"
     * - "unretweet": "Successfully unretweeted {Tn} Tweets"
     * - "unlike": "Successfully unliked {Tn} Tweets"
     */
    const Fn = () => {
      showSuccessState({
        pausePanel: pn,
        activePanel: yn,
        skipButton: mn,
        statusLabel: u,
        action: w,
        count: Tn,
      });
    }; /**
     * Display the "daily limit reached" UI state by toggling visibility of relevant panels, setting the status message, and logging it.
     *
     * Sets the status text to "You have reached the daily limit of <number>" where `<number>` is the current daily limit value.
     */
    const hn = () => {
      showLimitReachedState({
        pausePanel: pn,
        activePanel: yn,
        skipButton: mn,
        statusLabel: u,
        limit: $n,
      });
      console.log(u.textContent);
    }; /**
     * Update the UI to show the action panel and set the status message for the current mass action.
     *
     * Shows the primary panel, hides the secondary panel, toggles an auxiliary element based on hi(),
     * and updates the status label to indicate the current action (follow, unfollow, like, retweet, unretweet, unlike)
     * and its target identifier (uses Tn and optional Mn when present).
     */
    const xn = () => {
      showActiveActionState({
        pausePanel: pn,
        activePanel: yn,
        skipButton: mn,
        statusLabel: u,
        action: w,
        progress: Tn,
        total: Mn,
        showSkipButton: hi(),
      });
    }; /**
     * Show the status bar and initialize its interactive controls and state.
     *
     * Makes the status container visible and performs the layout, event-handler,
     * and state initializations required for the status bar UI.
     */
    function Rn() {
      ((dn.style.display = 'flex'), qt(), pt(), Rt(), Jt());
    } /**
     * Retrieve stored Pro activation fields from Chrome sync storage.
     * @returns {{proActivationKey?: string, proExpiresAt?: number}} An object containing `proActivationKey` (string) and `proExpiresAt` (number) when available.
     */
    function Ln() {
      return new Promise((e) => {
        chrome.storage.sync.get(['proActivationKey', 'proExpiresAt'], (t) => e(t));
      });
    } /**
     * Determine whether the given record's pro subscription is still valid.
     * @param {{proExpiresAt:number}|undefined} e - Object containing `proExpiresAt`, a millisecond Unix timestamp; may be undefined.
     * @returns {boolean} `true` if `e` is defined and `proExpiresAt` is greater than or equal to the current time, `false` otherwise.
     */
    function Sn(e) {
      return void 0 !== e && e.proExpiresAt >= Date.now();
    }
    ((yn.innerText = 'Close'),
      yn.setAttribute('role', 'button'),
      yn.classList.add('xf-status-bar__button'),
      dn.append(yn),
      yn.addEventListener('click', () => un()));
    const vn = 50; /**
     * Activate the autopilot mode for the content script.
     *
     * Sets the internal flag that marks autopilot as running.
     */
    function jn() {
      Un = !0;
    } /**
     * Reset autopilot runtime state for the current page and reinitialize page-specific data.
     *
     * Clears transient counters and flags, refreshes the current page key, loads stored page
     * configuration/state, updates cached values, and invokes follow-up startup handlers
     * (including the no-cache handler when applicable).
     */
    async function Bn() {
      ((Tn = 0),
        (In = void 0),
        ($n = void 0),
        (Pn = !1),
        (_n = xfCurrentPageKey()),
        (En = void 0),
        (An = void 0),
        (Dn = void 0));
      const e = await Ln();
      ((Cn = Sn(e)), Cn || ((Mn = vn), r()), xn(), Rn());
    }
    const Wn = () => {
      An = En ? Date.now() + En : void 0;
    }; /**
     * Update the module timing used for paced actions from a seconds value and apply the change.
     * @param {string|number} e - Time in seconds (number or numeric string); fractional values allowed.
     */
    function On(e) {
      ((En = 1e3 * parseFloat(e)), Wn());
    } /**
     * Pause execution for the given duration and add that duration to the global `An` accumulator when present.
     * @param {number} t - Duration in milliseconds to wait.
     */
    async function Vn(t) {
      (An && (An += t), await e(t));
    } /**
     * Checks whether the current idle deadline has passed and, if so, clears it and marks the system as idle.
     *
     * When the stored idle deadline is at or before the current time, this clears the deadline, sets the idle flag,
     * and emits an "Idle timeout" log message.
     */
    function Gn() {
      An && An <= Date.now() && (console.log('Idle timeout'), (An = void 0), (Un = !0));
    } /**
     * Update the global delay value `qn` to the number of seconds represented by the provided minutes.
     * @param {string|number} e - Minutes as a number or numeric string; fractional minutes are allowed and will be parsed as a float.
     */
    function Nn(e) {
      qn = 60 * parseFloat(e);
    } /**
     * Start a one-second countdown that updates the global `Pn` and calls `gn` on each tick.
     *
     * Initializes `Pn` from `qn`, decrements `Pn` once per second, and invokes `gn()` after each decrement.
     * The countdown stops when `Pn` reaches zero or the global `Un` flag becomes truthy; when stopped, `Pn` is set to `false`.
     */
    function Xn() {
      Pn = qn;
      const e = setInterval(() => {
        ((Pn -= 1), gn(), (Pn <= 0 || Un) && (clearInterval(e), (Pn = !1)));
      }, 1e3);
    } /**
     * Update the internal minimum marker with a candidate value and trigger the update handler.
     *
     * If `Cn` is truthy or `Mn` is already set and `e` is less than `Mn`, assigns `e` to `Mn`.
     * Always invokes `xn()` after the potential update.
     *
     * @param {number} e - Candidate numeric value (typically a timestamp or counter) to consider as the new minimum.
     */
    function Hn(e) {
      ((Cn || (Mn && e < Mn)) && (Mn = e), xn());
    } /**
     * Set the current autopilot action handler or value.
     *
     * Assigns the provided handler or value to the internal `Dn` variable that determines the active action.
     * @param {*} e - The handler or value to use as the current action; pass `null` to clear the current action.
     */
    function Jn(e) {
      Dn = e;
    } /**
     * Advance the internal action attempt counter and enforce autopilot stop or continuation rules.
     *
     * Increments the internal attempt counter. If a per-session attempt limit is reached, pauses autopilot and invokes the session-finalization handler. If a daily or aggregate limit is reached, pauses autopilot and invokes the daily-finalization handlers. Otherwise continues with the normal iteration routine. Always invokes the progress/timing updater after making the decision.
     */
    function Qn() {
      ((Tn += 1),
        Mn && Mn <= Tn ? ((Un = !0), Fn()) : $n && Tn + In >= $n ? ((Un = !0), i(), hn()) : xn(),
        Wn());
    } /**
     * Check whether the current page matches the stored page key or the configured pathname.
     *
     * If the page does not match, clears the `Un` active flag as a side effect.
     * @returns {boolean} `true` if `xfCurrentPageKey()` equals `_n` or `location.pathname` equals `Dn`, `false` otherwise.
     */
    function Kn() {
      return xfCurrentPageKey() == _n || location.pathname == Dn || ((Un = !1), !1);
    } /**
     * Check whether the current page key matches the predefined page key `_n`.
     * @returns {boolean} `true` if the current page key equals `_n`, `false` otherwise.
     */
    function Yn() {
      return xfCurrentPageKey() == _n;
    }
    const zn = 'autopilotActions';
    const Zn = (e) => {
        switch (e.type) {
          case 'mass_follow':
          case 'mass_like':
          case 'mass_retweet':
            return e.url;
          case 'mass_unfollow':
          case 'mass_unlike':
          case 'mass_unretweet':
            return !0;
          default:
            return !1;
        }
      },
      ei = async () => {
        const e = await (async function () {
          return (await getStoredConfigValues([zn]))[zn];
        })();
        return Array.isArray(e) ? e.filter(Zn) : [];
      }; /**
     * Retrieve the first element from an array produced by the internal async provider.
     *
     * @returns {any} The first element of the resolved array, or `undefined` if the array is empty.
     */
    const ti = () => loadFirstAutopilotAction(ei);
    const ni = (e) => `https://www.x.com${e}`;
    const ii = 'XFlowAutopilotActionId'; /**
     * Consume a session-stored identifier and resolve it to the corresponding record.
     *
     * Reads the string value stored at the session key represented by `ii`, removes that entry,
     * then looks up and returns the record whose `id` matches the consumed value.
     *
     * @returns {Object|undefined} The record whose `id` matches the consumed session value, or `undefined` if no session value existed or no matching record was found.
     */
    async function oi() {
      const e = sessionStorage.getItem(ii);
      if ('string' != typeof e) return;
      sessionStorage.removeItem(ii);
      const t = await (async function (e) {
        return (await ei()).find((t) => t.id === e);
      })(e);
      return t;
    } /**
     * Store the provided action ID in sessionStorage and navigate to the page appropriate for the action type.
     *
     * Navigates using `e.url` for "mass_follow", "mass_like", and "mass_retweet". For "mass_unfollow", "mass_unlike",
     * and "mass_unretweet" the function computes the target page based on the current user context.
     *
     * @param {Object} e - Action descriptor.
     * @param {string} e.id - Identifier saved to sessionStorage.
     * @param {string} e.type - Action type; expected values: "mass_follow", "mass_like", "mass_retweet", "mass_unfollow", "mass_unlike", or "mass_unretweet".
     * @param {string} [e.url] - Destination URL used for follow/like/retweet actions.
     */
    const li = (e) => {
      navigateToAutopilotAction(e, {
        setCurrentActionId: (id) => sessionStorage.setItem(ii, id),
        buildProfileUrl: ni,
        getCurrentUserScreenName: S,
        navigate: (url) => {
          location.href = url;
        },
      });
    };
    const ai = 2; /**
     * Compute the current item count and apply the configured cap unless a gating check allows the full count.
     *
     * If the measured count is less than or equal to the configured limit, that count is returned.
     * When the measured count exceeds the configured limit, the gating check is evaluated:
     * - if the check passes, the measured count is returned;
     * - otherwise the configured limit is returned.
     *
     * @returns {number} The resulting count after applying the cap and gating logic.
     */
    async function si() {
      const e = await (async function () {
        return (await ei()).length;
      })();
      if (e <= ai) return e;
      return Sn(await Ln()) ? e : ai;
    }
    const ri = async (e, t) => {
      try {
        return await E(() => (t && console.log(t), e()), 9e3);
      } catch (e) {
        return (console.log(e), console.log('Skipping action ...'), void ki());
      }
    };
    const ci = {
      autopilotPauseAfterActionMax: '',
      autopilotPauseAfterActionMin: '',
      autopilotRepeatAfter: 60,
      autopilotRepeatAfterMax: 60,
    }; /**
     * Retrieve the UI configuration merged with any stored settings.
     * @returns {Object} The UI configuration object produced by merging the default UI config with stored config values.
     */
    function ui() {
      return mergeWithStoredConfig(ci);
    }
    let wi,
      fi,
      di = !1;
    const mi = async () => {
        const result = await beginAutopilotAction({
          clearSuspendedActions: () => sessionStorage.removeItem(t),
          loadNextAction: ti,
          setPaused: (value) => {
            di = value;
          },
          onActionLoaded: (action) => {
            wi = action;
          },
          computeBatchSize: si,
          renderProgress: (current, limit) => bn(current, limit),
          showPanel: wn,
          setupStatusBar: Rn,
          navigateAction: li,
        });
        return result?.action;
      },
      pi = () => {
        di = !0;
      },
      yi = async () => {
        const timerId = await scheduleAutopilotRepeat({
          loadConfig: ui,
          isProEnabled: async () => Sn(await Ln()),
          selectDelaySeconds: (min, max) => pickRandomDelaySeconds(min, max, Ne),
          showCountdown: kn,
          runAction: mi,
          isPaused: () => di,
        });
        if (null === timerId) pi();
      },
      gi = async (t) => {
        await advanceAutopilotQueue({
          currentAction: wi,
          limit: t,
          fetchActions: ei,
          getSuspendedTypes: n,
          loadConfig: ui,
          selectRandomValue: He,
          sleep: e,
          showPauseTick: (o) => {
            ((pn.style.display = 'initial'),
              (yn.style.display = 'none'),
              (mn.style.display = 'none'),
              k(o));
          },
          isPaused: () => di,
          showProgress: (e, n) => bn(e, n),
          navigateAction: li,
          scheduleRepeat: yi,
        });
      }; /**
     * Bootstrap the content script by marking it started, running initial startup handlers, obtaining the page's initial state, and initiating processing of that state.
     */
    async function ki() {
      ((fi = !0), jn());
      const e = await si();
      gi(e);
    } /**
     * Execute the next pending autopilot action and manage its lifecycle.
     *
     * Loads the next job, initializes runtime state, verifies preconditions, delegates to the appropriate mass-action handler (follow, like, retweet, unfollow, unlike, or unretweet), and advances or aborts the autopilot flow based on runtime guards and completion.
     */
    async function bi() {
      if (((wi = await oi()), wi)) {
        fi = !1;
        const e = await si();
        if (
          (bn(wi.number, e),
          wn(),
          Rn(),
          await (async function (e) {
            switch (e.type) {
              case 'mass_follow':
                if (
                  (await ri(() => ve() || xe() || de(), 'Find Tweets, users or likes ...'), !hi())
                )
                  return;
                if (Fi()) return;
                (f(), await Ct(e.limit, e.idleTimeout));
                break;
              case 'mass_like':
                if (
                  (await ri(() => ve() || de() || Ee() || $e(), 'Find Tweets or likes ...'), !hi())
                )
                  return;
                if (Fi()) return;
                (m(), await dt(e.limit, e.idleTimeout));
                break;
              case 'mass_retweet':
                if ((await ri(() => ve() || Ee(), 'Find Tweets ...'), !hi())) return;
                if (Fi()) return;
                (p(), await ht(e.limit, e.idleTimeout));
                break;
              case 'mass_unfollow':
                if ((await ri(() => xe() && v(), 'Find users ...'), !hi())) return;
                if (Fi()) return;
                (d(), await Xt(e.limit, e.idleTimeout));
                break;
              case 'mass_unlike':
                if ((await ri(() => de() && T(), 'Find likes ...'), !hi())) return;
                if (Fi()) return;
                (g(), await zt(e.limit, e.idleTimeout));
                break;
              case 'mass_unretweet':
                if ((await ri(() => Ee() && _(), 'Find Tweets ...'), !hi())) return;
                if (Fi()) return;
                (y(), await an(e.limit, e.idleTimeout));
            }
          })(wi),
          di)
        )
          return;
        if (fi) return;
        await gi(e);
      }
    } /**
     * Check whether the internal `fi` flag is enabled.
     * @returns {boolean} `true` if the internal `fi` value is strictly `true`, `false` otherwise.
     */
    function Fi() {
      return !0 === fi;
    } /**
     * Check if a module reference is present while its disable flag is unset.
     *
     * @returns {boolean} `true` if `wi` is an object and `di` is `false`, `false` otherwise.
     */
    function hi() {
      return 'object' == typeof wi && !1 === di;
    }
    (dn.prepend(u),
      cn.append(dn, Ce, Dt, Ht, xt, mt, sn, Zt),
      ue('friendships/create.json', ({ body: e, parsedResponse: t, status: n }) => {
        200 != n &&
          (it(e.match(/&user_id=(\d+)/)[1]),
          ((e) => {
            if ('object' != typeof e) return;
            const t = e.errors;
            if (!Array.isArray(t)) return;
            const n = t[0];
            return 'object' == typeof n ? 162 === n.code : void 0;
          })(t) || (Xn(), hi() ? (i(), jn()) : Xn()));
      }),
      ue('favorites/create.json', ({ status: e }) => {
        200 != e && (hi() ? (i(), jn()) : Xn());
      }),
      ue('statuses/retweet.json', ({ status: e }) => {
        200 != e && (hi() ? (i(), jn()) : Xn());
      }));
    (async () => {
      (await bi(),
        setInterval(async () => {
          hi() || Kn() || (await fn(), s());
        }, 200));
    })();
  })();
})();
