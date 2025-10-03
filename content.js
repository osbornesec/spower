/**
 * @fileoverview Content script entry for Superpowers; handles autopilot
 * actions, timeline parsing, and UI prompts on x.com pages.
 */
(()=>{"use strict";
const SPW_INITIAL_DEV = (() => {
  try {
    return globalThis.localStorage?.getItem('spw_dev') === '1';
  } catch {
    return false;
  }
})();
let spwMark = (label) => {
  if (SPW_INITIAL_DEV && globalThis.performance) {
    performance.mark(label);
  }
};
let spwMeasure = (name, start, end) => {
  if (!SPW_INITIAL_DEV || !globalThis.performance) return;
  try {
    performance.measure(name, start, end);
    const entry = performance.getEntriesByName(name).pop();
    if (entry) {
      console.log(`[SPW_PERF] ${name}: ${entry.duration.toFixed(1)}ms`);
    }
  } catch {}
};
let spwDebounce = (fn, wait = 150) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
};
let spwIdleInit = (fn) =>
  ('requestIdleCallback' in globalThis)
    ? requestIdleCallback(fn, { timeout: 100 })
    : setTimeout(fn, 0);
const spwPerfModuleURL = chrome.runtime?.getURL?.('utils/perf.js');
if (spwPerfModuleURL) {
  import(spwPerfModuleURL)
    .then((mod) => {
      if (!mod) return;
      if (mod.spwMark) spwMark = mod.spwMark;
      if (mod.spwMeasure) spwMeasure = mod.spwMeasure;
      if (mod.spwDebounce) spwDebounce = mod.spwDebounce;
      if (mod.spwIdleInit) spwIdleInit = mod.spwIdleInit;
    })
    .catch(() => {});
}
spwMark('SPW_PERF_START');
const spwFinalize = () => {
  spwMark('SPW_PERF_END');
  spwMeasure('SPW_PERF_CONTENT_INIT', 'SPW_PERF_START', 'SPW_PERF_END');
};
spwIdleInit(spwFinalize);(()=>{/**
 * Pause for the given number of milliseconds.
 * @param {number} ms - Milliseconds to wait before resolving.
 * @returns {Promise<void>} Resolves after the specified delay.
 */
function e(e){return new Promise((t=>{console.log(`Sleeping ${e} ms ...`),setTimeout((()=>t()),e)}))}const t="SuperpowersForTwitterSuspendedAutopilotActionTypes";const n=()=>{const e=sessionStorage.getItem(t);return"string"!=typeof e?[]:JSON.parse(e)};/**
 * Appends the current global `wi.type` to the array returned by `n()` and persists the result to sessionStorage under the key `t`.
 *
 * If the global `wi` is not an object, the function is a no-op.
 */
function i(){if("object"!=typeof wi)return;const e=n().concat(wi.type);sessionStorage.setItem(t,JSON.stringify(e))}const o=[],l=({text:e,title:t,action:n})=>`\n    <div class="sft-ad animated fadeInRight">\n      <div class="sft-ad__title">${t}</div>\n      <div class="sft-ad__text">${e}</div>\n      <a class="sft-ad__action" href="${n.url}" target="_blank">${n.text}</a>\n    </div>\n  `,a=document.createElement("div");/**
 * Hide the DOM element referenced by `a`.
 *
 * Sets the element's display style to `"none"`, removing it from layout and visual rendering.
 */
function s(){a.style.display="none"}/**
 * Clears the global UI container and hides it from layout.
 *
 * Removes all child markup from the element referenced by `a` and sets its `display` style to `"none"`.
 */
function r(){a.innerHTML="",a.style.display="none"}const spwBody=document.body;/* SPW_OPTIMIZED_QUERY */a.classList.add("sft-ads"),spwIdleInit(()=>spwBody.appendChild(a));const c=e=>{if(e<60)return String(e);const t=e/60/60,n=Math.floor(t),i=60*(t-n),o=Math.floor(i),l=60*(i-o),a=Math.round(l);let s;return n>0?(s=String(n),s+=":",s+=String(o).padStart(2,0)):s=String(o),s+=":",s+=String(a).padStart(2,0),s};const u=document.createElement("div");let w;/**
 * Set the global variable `w` to "follow".
 */
function f(){w="follow"}/**
 * Set the current mass-action mode to unfollow.
 *
 * Sets the global action-mode variable `w` to the string `"unfollow"`.
 */
function d(){w="unfollow"}/**
 * Set the global action flag to "like".
 *
 * Sets the global variable `w` to the string `"like"`.
 */
function m(){w="like"}/**
 * Set the global action flag to "retweet".
 *
 * Sets the global variable `w` to the string `"retweet"`.
 */
function p(){w="retweet"}/**
 * Set the global action mode to "unretweet".
 *
 * This assigns the global variable `w` the value `"unretweet"`, selecting the unretweet action for subsequent logic.
 */
function y(){w="unretweet"}/**
 * Set the global action marker to "unlike".
 *
 * This assigns the string "unlike" to the global variable `w`.
 */
function g(){w="unlike"}/**
 * Update the status element to show a countdown message for resuming the autopilot.
 * @param {number} e - Remaining time in milliseconds to display in the countdown.
 */
function k(e){u.innerHTML=`Continuing autopilot in ${function(e){const t=e%1e3;let n=c((e-t)/1e3);return n+=".",n+=String(t).padStart(3,0),n}(e)} ...`}/**
 * Retrieve a nested property by following a sequence of property keys.
 * @param {object} e - The root object to traverse.
 * @param {...(string|number|symbol)} t - A sequence of property keys to descend into `e`.
 * @returns {*} The value found at the nested path, or `undefined` if any intermediate property is `undefined`.
 */
function b(e,...t){for(let n=0;n<t.length;n++)if(void 0===(e=e[t[n]]))return;return e}/**
 * Retrieve a required property from an object or throw if it is missing.
 * @param {Object} e - The object to read the property from.
 * @param {string} t - The property key to retrieve.
 * @returns {*} The value of the property `t` on object `e`.
 * @throws {string} Throws a message `${t} missing on ${JSON.stringify(e)}` if `e` does not have own property `t`.
 */
function F(e,t){if(Object.prototype.hasOwnProperty.call(e,t))return e[t];throw`${t} missing on ${JSON.stringify(e)}`}const spwResolveRestId=(e,t=0)=>{if(!e||"object"!=typeof e||t>5)return;const n=e.rest_id;if("string"==typeof n&&n.length)return n;const i=e.tweet&&spwResolveRestId(e.tweet,t+1);if(i)return i;const o=e.result&&spwResolveRestId(e.result,t+1);if(o)return o;const l=e.tweet_results&&spwResolveRestId(e.tweet_results.result||e.tweet_results,t+1);return l};
const SPW_HOME_TAB_SELECTOR='[role="tab"][aria-selected="true"]';
const SPW_TABLIST_ROLE='tablist';
const spwNormalizeKey=(e)=>"string"==typeof e?e.toUpperCase():e;
const spwResolveHomeTab=()=>{
  const focused=document.activeElement;
  if(focused&&focused.getAttribute('role')==='tab'&&focused.parentElement?.getAttribute('role')===SPW_TABLIST_ROLE){
    return focused;
  }
  return document.querySelector(SPW_HOME_TAB_SELECTOR);
};
const spwCurrentPageKey = () => {
  const hrefKey = spwNormalizeKey(location.href);
  if (location.pathname !== '/home') {
    return hrefKey;
  }
  const tabEl = spwResolveHomeTab();
  if (!tabEl) {
    return hrefKey;
  }
  const rawLabel = tabEl.textContent?.trim();
  if (!rawLabel) {
    return hrefKey;
  }
  const normalizedLabel = rawLabel.replace(/\s+/g, ' ');
  return `${hrefKey}::${spwNormalizeKey(normalizedLabel)}`;
};
u.classList.add("sft-status-bar__label");const spwInitialStatePattern=/window.__INITIAL_STATE__=({[\s\S]*?});window.__META_DATA__/;let h=globalThis.__INITIAL_STATE__&&"object"==typeof globalThis.__INITIAL_STATE__?globalThis.__INITIAL_STATE__:void 0;if(!h){document.querySelectorAll("script").forEach((e=>{if(h)return;const t=e.textContent||"";if(!t.includes("__INITIAL_STATE__"))return;const n=t.match(spwInitialStatePattern);if(n&&n[1])try{h=JSON.parse(n[1])}catch(e){console.warn("[SPW] failed to parse __INITIAL_STATE__ payload",e)}}))}if(!h){console.warn("[SPW] initial state unavailable; skipping bootstrap");return}const x=h.session,R=b(h,"entities","users","entities"),L=()=>F(x,"user_id");/**
 * Get the current user's screen name.
 * @returns {string|undefined} The user's screen_name if available, otherwise `undefined`.
 */
function S(){const e=R?F(R,L()):F(x,"user");return F(e,"screen_name")}/**
 * Determine whether the current page is the user's "following" page.
 * @returns {boolean} `true` if the current pathname equals `/<username>/following` (case-insensitive), `false` otherwise.
 */
function v(){return location.pathname.toUpperCase()==`/${S()}/following`.toUpperCase()}/**
 * Determines whether the current location path is the user's likes page.
 * @returns {boolean} `true` if the current pathname equals "/{user}/likes" (case-insensitive), `false` otherwise.
 */
function T(){return location.pathname.toUpperCase()==`/${S()}/likes`.toUpperCase()}/**
 * Determines whether the current location path matches the configured home route.
 * @returns {boolean} `true` if the current pathname equals the configured home route (case-insensitive), `false` otherwise.
 */
function _(){return location.pathname.toUpperCase()==`/${S()}`.toUpperCase()}/**
 * Checks whether the current page path corresponds to a lists page.
 * @returns {boolean} `true` if the location pathname contains "/lists/", `false` otherwise.
 */
function $(){return location.pathname.includes("/lists/")}/**
 * Extracts tweet objects from timeline-related instruction arrays in a GraphQL/REST response payload.
 *
 * Traverses several possible instruction paths and collects tweet result objects found under
 * "TimelineAddEntries" entries. If an entry's result has `__typename` equal to
 * "TweetWithVisibilityResults", the nested `tweet` object is returned; otherwise the result
 * object itself is returned.
 *
 * @param {object} e - Response payload potentially containing timeline instruction arrays.
 * @returns {object[]|undefined} An array of tweet objects when timeline instructions are present, `undefined` otherwise.
 */
function M(e){const t=b(e,"data","list","tweets_timeline","timeline","instructions")||b(e,"data","user","result","timeline","timeline","instructions")||b(e,"data","user","result","timeline_v2","timeline","instructions")||b(e,"data","community","community_timeline","timeline","instructions")||b(e,"data","topic_by_rest_id","topic_page","body","timeline","instructions")||b(e,"data","home","home_timeline_urt","instructions")||b(e,"data","search_by_raw_query","search_timeline","timeline","instructions");if(!t)return;const n=[];return t.forEach((e=>{"TimelineAddEntries"==e.type&&e.entries.forEach((e=>{const t=b(e,"content","itemContent","tweet_results","result");if("object"!=typeof t)return;let i;i="TweetWithVisibilityResults"===t.__typename?t.tweet:t,"object"==typeof i&&n.push(i)}))})),n}const I=(e,t,n,i)=>{const o=e();if(o)n(o);else{if("number"==typeof t){if(t<=0)return void i("time limit exceeded");t-=100}setTimeout((()=>I(e,t,n,i)),100)}};/**
 * Create a Promise and invoke I with the provided arguments plus the promise's resolve and reject callbacks.
 * @param {*} e - First value forwarded to I.
 * @param {*} t - Second value forwarded to I.
 * @returns {Promise<*>} A promise that resolves or rejects via the callbacks passed to I.
 */
function E(e,t){return new Promise(((n,i)=>{I(e,t,n,i)}))}let A;const C=async({fromIndex:t=0,getList:n,getFocusableEl:i})=>{if(!Un){Gn(),console.log("Scan list for usable index ...");for(let e=t;e<n().length;e++){if(i(n()[e]))return e}return window.scrollBy(0,300),await e(500),await C({fromIndex:t,getList:n,getFocusableEl:i})}},D=async({callback:e,getList:t,getFocusableEl:n,index:i})=>{if(Un)return;if(Gn(),Pn)return void await q({callback:e,getList:t,getFocusableEl:n,index:i,milliseconds:500});if(void 0===t())return;const o=t()[i];if(void 0===o)await q({callback:e,getList:t,getFocusableEl:n,index:i,milliseconds:100});else{try{o.focusableEl=await E((()=>n(o)),2e3),A=window.scrollY}catch(o){console.log(o),A&&window.scrollTo(0,A);const l=await C({fromIndex:i+1,getList:t,getFocusableEl:n});return void await D({callback:e,getList:t,getFocusableEl:n,index:l})}o.focusableEl.focus(),await e(o,i),await D({callback:e,getList:t,getFocusableEl:n,index:i+1})}},q=async({callback:t,getList:n,getFocusableEl:i,index:o,milliseconds:l})=>{await e(l),await D({callback:t,getList:n,getFocusableEl:i,index:o})};/**
 * Prepare an index from the provided list provider and run the processing callback using that index.
 * @param {Object} args - Function dependencies and callbacks.
 * @param {Function} args.callback - Processing function invoked by the downstream runner.
 * @param {Function} args.getFocusableEl - Function that returns a focusable element for a given item.
 * @param {Function} args.getList - Function that returns the list to be processed.
 */
async function U({callback:e,getFocusableEl:t,getList:n}){A=void 0;const i=await C({getList:n,getFocusableEl:t});await D({callback:e,getList:n,getFocusableEl:t,index:i})}const P=e=>F(e.core,"screen_name");/**
 * Get the follower count from a user object.
 * @param {Object} e - User object with a `legacy.followers_count` property.
 * @returns {number} The user's follower count.
 */
function j(e){return e.legacy.followers_count}/**
 * Determine whether the given object's relationship perspective marks it as followed.
 * @param {Object} e - Object containing a `relationship_perspectives` property with a `followed_by` flag.
 * @returns {boolean} `true` if `relationship_perspectives.followed_by` equals 1, `false` otherwise.
 */
function B(e){return 1==e.relationship_perspectives.followed_by}/ **
 * Compute the follower-to-following ratio for a user.
 * @param {Object} e - User object; expected to have `legacy.followers_count` and `legacy.friends_count`.
 * @returns {number|undefined} The result of `followers_count / friends_count`, or `undefined` if either count is missing or not a number.
 */
function W(e){const t=e.legacy.followers_count;if("number"!=typeof t)return;const n=e.legacy.friends_count;return"number"==typeof n?t/n:void 0}/**
 * Get the user's following count from a legacy user object.
 * @param {Object} e - A user object containing a `legacy` field.
 * @returns {number} The number of accounts the user is following.
 */
function O(e){return e.legacy.friends_count}/**
 * Resolve an object's REST identifier from available fields.
 *
 * Attempts to extract a `rest_id`-style identifier from the provided object and returns it when present.
 * @param {any} e - The candidate object (e.g., entity or node) to extract the REST id from.
 * @returns {string|undefined} The resolved REST id if found, `undefined` otherwise.
 */
function V(e){const t=spwResolveRestId(e);if(t)return t;try{return F(e,"rest_id")}catch{console.warn("[SPW] rest_id unavailable",e?.__typename??typeof e);return void 0}}/**
 * Determine whether a user account is protected.
 * @param {Object} e - User-like object containing a `privacy` object with a `protected` flag (numeric).
 * @returns {boolean} `true` if `e.privacy.protected` equals `1`, `false` otherwise.
 */
function G(e){return 1==e.privacy.protected}/**
 * Determines whether an account is blue-verified.
 * @param {Object} e - User-like object that may include verification flags.
 * @param {boolean} [e.is_blue_verified] - Flag indicating blue verification status.
 * @returns {boolean} `true` if the account is blue-verified, `false` otherwise.
 */
function N(e){return 1==e.is_blue_verified}/**
 * Retrieve the description from an object's legacy field.
 * @param {Object} e - Source object containing a `legacy` object with description data.
 * @returns {string|undefined} The legacy description string if present, `undefined` otherwise.
 */
function X(e){return F(e.legacy,"description")}/**
 * Create a profile path by prefixing the user's handle with a '/'.
 * @param {any} e - User object or username string from which the handle will be derived.
 * @returns {string} The profile path in the form '/handle'.
 */
function H(e){return`/${P(e)}`}const J=e=>{const t=spwResolveRestId(e);if(t)return t;try{return F(e,"rest_id")}catch{console.warn("[SPW] rest_id unavailable",e?.__typename??typeof e);return void 0}};/**
 * Retrieve the legacy "lang" value from an object.
 * @param {Object} e - Object expected to contain a `legacy` property.
 * @returns {string|undefined} The `legacy.lang` value if present, otherwise `undefined`.
 */
function Q(e){return F(e.legacy,"lang")}/**
 * Retrieve the favorite (like) count from a tweet-like payload.
 * @param {Object} e - The tweet-like object containing legacy metrics.
 * @return {number|undefined} The `favorite_count` value, or `undefined` if not present.
 */
function K(e){return F(e.legacy,"favorite_count")}/**
 * Determine whether a tweet object is marked as favorited.
 * @param {Object} e - Tweet-like object containing a `legacy` field with `favorited`.
 * @returns {boolean} `true` if `e.legacy.favorited` equals 1, `false` otherwise.
 */
function Y(e){return 1==e.legacy.favorited}/**
 * Determines whether a tweet-like object represents a reply by inspecting its legacy reply ID.
 * @param {Object} e - Object expected to have a `legacy` property with `in_reply_to_status_id_str`.
 * @returns {boolean} `true` if `e.legacy.in_reply_to_status_id_str` is a string, `false` otherwise.
 */
function z(e){return"string"==typeof e.legacy.in_reply_to_status_id_str}/**
 * Determines whether a tweet-like payload contains a legacy `retweeted_status_result` object.
 * @param {object} e - Payload expected to include a `legacy` property.
 * @returns {boolean} `true` if `e.legacy.retweeted_status_result` is an object, `false` otherwise.
 */
function Z(e){return"object"==typeof e.legacy.retweeted_status_result}/**
 * Checks whether a tweet/status object has a string `quoted_status_id_str` in its legacy data.
 * @param {object} e - Tweet/status object expected to contain a `legacy` property.
 * @returns {boolean} `true` if `e.legacy.quoted_status_id_str` is a string, `false` otherwise.
 */
function ee(e){return"string"==typeof e.legacy.quoted_status_id_str}/**
 * Determines whether the provided tweet object is marked as retweeted.
 * @param {Object} e - Tweet-like object with a `legacy.retweeted` numeric flag.
 * @returns {boolean} `true` if `e.legacy.retweeted` is `1`, `false` otherwise.
 */
function te(e){return 1==e.legacy.retweeted}/**
 * Resolve the REST API identifier (`rest_id`) for a tweet-like object.
 *
 * @param {Object} e - The tweet-like object to resolve the identifier from.
 * @returns {string|undefined} The `rest_id` if present, otherwise `undefined`.
 */
function ne(e){return b(e.legacy,"retweeted_status_result","result","rest_id")||J(e)}/**
 * Extracts the tweet text from a tweet object.
 * @param {Object} e - Tweet object that includes a `legacy.full_text` property.
 * @returns {string} The tweet's full text.
 */
function ie(e){return e.legacy.full_text}const oe=e=>e.core.user_results.result;/**
 * Resolve the REST identifier for the given entity.
 * @param {*} e - An entity object or identifier from which to derive a REST id.
 * @returns {string|undefined} The resolved REST id if available, `undefined` otherwise.
 */
function le(e){return V(oe(e))}/**
 * Locate the anchor element that links to a tweet's status page.
 * @param {string|object} tweetOrId - A tweet ID string or an object from which the tweet ID will be resolved.
 * @returns {Element|null} The first anchor element whose href ends with `/status/{tweetId}`, or `null` if none is found.
 */
function ae(e){const t=`[data-testid="tweet"] a[href$="/status/${ne(e)}"][role="link"]`;return console.log(`Querying tweet link with ${t}`),document.querySelector(t)}/**
 * Locate the tweet container that contains the provided focusable element and return its last child element.
 * @param {{focusableEl: Element}} e - Object with a `focusableEl` DOM Element inside a tweet.
 * @returns {Element|null} The last child Element of the enclosing tweet container, or `null` if not found.
 */
function se(e){return e.focusableEl.closest('[data-testid="tweet"]').lastElementChild}window.addEventListener("message",(e=>{e.data.origin&&"string"==typeof e.data.response&&e.data.url&&e.data.status&&we(e.data)}));const re=document.createElement("script");re.type="text/javascript",re.src=chrome.runtime.getURL("app.js"),document.documentElement.appendChild(re);const ce={};/**
 * Registers a listener for a given key in the internal registry.
 * @param {string} e - The registry key or event name.
 * @param {Function} t - The listener or handler to register for the key.
 */
function ue(e,t){ce[e]=ce[e]||[],ce[e].push(t)}const we=({body:e,origin:t,response:n,status:i,url:o})=>{Object.keys(ce).forEach((l=>{if(!o.includes(l))return;let a={};if(n.length>0)try{a=JSON.parse(n)}catch(e){console.error(e)}ce[l].forEach((n=>n({body:e,origin:t,parsedResponse:a,status:i,url:o})))}))},fe={};ue("/Likes",(({origin:e,parsedResponse:t})=>((e,t)=>{!1!==Array.isArray(t)&&0!==t.length&&(fe[e]?fe[e]=fe[e].concat(t):fe[e]=t)})(e,M(t))));const de=()=>fe[spwCurrentPageKey()];/**
 * Invoke the shared action dispatcher with the provided callback.
 * @param {Function} e - Callback passed to the dispatcher.
 * @returns {*} The value returned by the dispatcher `U` when invoked with the callback and UI helpers.
 */
async function me(e){await U({callback:e,getFocusableEl:ae,getList:de})}/**
 * Finds the follow button element for the specified user identifier.
 * @param {*} e - A user identifier or user-like object used to derive the element's test id.
 * @returns {Element|null} The matching follow button element, or `null` if none is found.
 */
function pe(e){const t=`[data-testid="${V(e)}-follow"]`;return console.log(`Querying follow button of ${P(e)} with ${t}`),document.querySelector(t)}/**
 * Finds the profile link element for a given user on the page.
 * @param {*} e - User identifier or object from which the profile href is derived.
 * @returns {Element|null} The anchor element pointing to the user's profile if found, `null` otherwise.
 */
function ye(e){const t=`[data-testid="cellInnerDiv"] a[href="${H(e)}"][role="link"]`,n=`[data-testid="UserCell"] a[href="${H(e)}"][role="link"]`;return console.log(`Querying profile link of ${P(e)} with ${t}`),document.querySelector(t)||document.querySelector(n)}/**
 * Finds the profile link element for a user inside an open modal UserCell.
 * @param {object|string} user - A user identifier or object used to derive the profile href.
 * @returns {HTMLAnchorElement|null} The matching anchor element, or null if no match is found.
 */
function ge(e){const t=`[aria-modal="true"] [data-testid="UserCell"] a[href="${H(e)}"][role="link"]:not([dir])`;return console.log(`Querying profile link of ${P(e)} with ${t}`),document.querySelector(t)}/**
 * Locate the nearest user cell DOM element related to the given action item.
 * @param {{focusableEl: Element}} e - Object that contains the element used for focus/navigation.
 * @returns {Element|null} The closest ancestor with `data-testid="UserCell"`, or `null` if none is found.
 */
function ke(e){return e.focusableEl.closest('[data-testid="UserCell"]')}const be={},Fe=(e,t)=>{if(!t)return;if(0==t.length)return;void 0===be[e]&&(be[e]=[]);const n=be[e].map((e=>V(e)));t.forEach((t=>{n.includes(V(t))||be[e].push(t)}))},he=(e,t)=>{const n=b(t,"data","user","followers_timeline","timeline","instructions")||b(t,"data","favoriters_timeline","timeline","instructions")||b(t,"data","user","following_timeline","timeline","instructions")||b(t,"data","user","result","timeline","timeline","instructions")||b(t,"data","list","members_timeline","timeline","instructions")||b(t,"data","list","subscribers_timeline","timeline","instructions")||b(t,"data","retweeters_timeline","timeline","instructions")||b(t,"data","search_by_raw_query","search_timeline","timeline","instructions");if(!n)return;const i=[];return n.forEach((t=>{"TimelineAddEntries"==t.type?t.entries.forEach((e=>{const t=b(e,"content","itemContent","user_results","result");"object"==typeof t&&i.push(t)})):"TimelineClearCache"==t.type&&(be[e]=void 0)})),i};ue("/lists/members.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("/lists/subscribers.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("followers/list.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("friends/list.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("/Favoriters",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/Followers",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/Following",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/ListMembers",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/ListSubscribers",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/Retweeters",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("i/api/graphql",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t))));const xe=()=>be[spwCurrentPageKey()];/**
 * Execute a callback within the focus/list processing context.
 * @param {Function} e - Callback invoked for each processed item; receives the current list item or its focusable element.
 * @param {Function} [t=ye] - Function that resolves a focusable element for a given item.
 * @returns {*} The value produced by executing the callback in the current focus/list context.
 */
async function Re(e,t=ye){await U({callback:e,getFocusableEl:t,getList:xe})}const Le={},Se=(e,t)=>{if(!1===Array.isArray(t))return;if(0===t.length)return;Kn()&&(e=_n.toUpperCase()),void 0===Le[e]&&(Le[e]=[]);const n=Le[e].map((e=>J(e)));t.forEach((t=>{n.includes(J(t))||Le[e].push(t)}))};ue("/ListLatestTweetsTimeline",(({origin:e,parsedResponse:t})=>Se(e,M(t)))),ue("/CommunityTweetsTimeline",(({origin:e,parsedResponse:t})=>Se(e,M(t)))),ue("/TopicLandingPage",(({origin:e,parsedResponse:t})=>Se(e,M(t)))),ue("i/api/graphql",(({origin:e,parsedResponse:t})=>Se(e,M(t))));const ve=()=>Le[spwCurrentPageKey()];/**
 * Invoke the provided callback through the action executor, giving it access to the page's focusable element and list providers.
 *
 * @param {Function} e - Callback to execute; its return value is propagated back to the caller.
 * @returns {Promise<*>} The value returned by the callback, or `undefined` if the callback does not return a value.
 */
async function Te(e){await U({callback:e,getFocusableEl:ae,getList:ve})}const _e={};ue("/HomeTimeline",(({origin:e,parsedResponse:t})=>((e,t)=>{if(!1===Array.isArray(t))return;if(0===t.length)return;Kn()&&(e=_n.toUpperCase()),void 0===_e[e]&&(_e[e]=[]);const n=_e[e].map((e=>J(e)));t.forEach((t=>{n.includes(J(t))||_e[e].push(t)}))})(e,M(t))));const $e=()=>_e[spwCurrentPageKey()];/**
 * Execute the generic item-iteration routine using the provided callback.
 * @param {Function} e - Callback invoked for each retrieved focusable item; receives the item-specific arguments required by the caller.
 */
async function Me(e){await U({callback:e,getFocusableEl:ae,getList:$e})}const Ie={};ue("/UserTweets",(({origin:e,parsedResponse:t})=>((e,t)=>{if(!1===Array.isArray(t))return;if(0===t.length)return;void 0===Ie[e]&&(Ie[e]=[]);const n=Ie[e].map((e=>J(e)));t.forEach((t=>{n.includes(J(t))||Ie[e].push(t)}))})(e,M(t))));const Ee=()=>Ie[spwCurrentPageKey()];/**
 * Execute a callback using the module's list and focus helpers.
 * @param {Function} e - Callback to execute; called by the underlying operation for each relevant item.
 * @returns {*} The value returned by the underlying operation.
 */
async function Ae(e){await U({callback:e,getFocusableEl:ae,getList:Ee})}const Ce=document.createElement("div");Ce.innerText="Autopilot",Ce.setAttribute("role","button"),Ce.classList.add("sft-button","sft-button--autopilot");const De=()=>{Ce.style.display="none"};/**
 * Toggle visibility of the main control panel based on current path and initial-state readiness.
 *
 * If the current location pathname is "/home" and the page's initial state is available, the function makes the control panel visible; otherwise it invokes the fallback handler for the non-ready state.
 */
async function qe(){"/home"==location.pathname&&!xe()&&await async function(){return"object"==typeof await ti()}()?Ce.style.display="initial":De()}Ce.addEventListener("click",(()=>{De(),mi()}));const Ue=window.indexedDB.open("MassFollowForTwitter",8);let Pe;/**
 * Add a record to the specified IndexedDB object store.
 * @param {string} storeName - Name of the object store to write to.
 * @param {*} record - The record to add to the store.
 */
function je(e,t){Pe.transaction([e],"readwrite").objectStore(e).add(t)}/**
 * Retrieve a value by key from an IndexedDB object store.
 * @param {string} e - The name of the object store.
 * @param {*} t - The key to look up in the object store.
 * @returns {*} The stored value for the given key, or `undefined` if the store is missing or the key is not found.
 */
function Be(e,t){return new Promise((n=>{if(!Pe.objectStoreNames.contains(e))return void n(void 0);const i=Pe.transaction([e]).objectStore(e).get(t);i.onsuccess=()=>{n(i.result)}}))}Ue.onupgradeneeded=e=>{Pe=e.target.result,e.oldVersion<3&&Pe.createObjectStore("v2FollowRecord",{keyPath:["creatorId","userId"]}),e.oldVersion<4&&Pe.createObjectStore("retweetRecord",{keyPath:["creatorId","retweetedStatusId"]}),e.oldVersion<5&&Pe.createObjectStore("likeRecord",{keyPath:["creatorId","tweetId"]}),e.oldVersion<6&&Ue.transaction.objectStore("likeRecord").createIndex("tweetUserId","tweetUserId"),e.oldVersion<8&&Ue.transaction.objectStore("v2FollowRecord").createIndex("createdAt",["creatorId","createdAt"])},Ue.onerror=e=>{console.log(e)},Ue.onsuccess=e=>{Pe=e.target.result};const We="likeRecord";/**
 * Get how many records exist for the given tweet identifier in the IndexedDB store.
 *
 * @param {string|number} e - The tweet identifier to count records for.
 * @returns {number} The count of records that match the provided tweet identifier.
 */
function Oe(e){return function(e,t,n){return new Promise((i=>{const o=Pe.transaction([e],"readonly").objectStore(e).index(t).count(IDBKeyRange.only(n));o.onsuccess=()=>{i(o.result)}}))}(We,"tweetUserId",le(e))}/**
 * Split a comma-separated string into trimmed segments.
 * @param {string} e - The input string containing comma-separated values.
 * @returns {string[]|undefined} An array of trimmed segments, or `undefined` if the input is empty or contains only whitespace.
 */
function Ve(e){if(!(e=>0===e.trim().length)(e))return e.split(",").map((e=>e.trim()))}/**
 * Checks whether `t` includes the value produced by calling `Q` with `e`.
 * @param {*} e - Value passed to `Q`.
 * @param {string|Array} t - String or array to test for inclusion.
 * @returns {boolean} `true` if `t` includes `Q(e)`, `false` otherwise.
 */
function Ge(e,t){return t.includes(Q(e))}/**
 * Selects a random element from an array.
 * @param {Array} e - The array to pick an element from.
 * @returns {*} A randomly chosen element from `e`, or `undefined` if `e` is empty.
 */
function Ne(e){return e[Math.floor(Math.random()*e.length)]}/**
 * Generate a sequence of timestamps in milliseconds from a start time to an end time in 100ms steps.
 *
 * The sequence begins with `startSec` converted to milliseconds and appends values increased by 100ms
 * until a value reaches or exceeds `endSec` converted to milliseconds. The final value may be greater
 * than `endSec` if the range is not an exact multiple of 100ms.
 *
 * @param {string|number} startSec - Start time in seconds (parsed as float).
 * @param {string|number} endSec - End time in seconds (parsed as float).
 * @returns {number[]} An array of timestamps in milliseconds, starting at `startSec * 1000` and
 *                     incremented by 100 until reaching or exceeding `endSec * 1000`.
 */
function Xe(e,t){let n=1e3*parseFloat(e);const i=1e3*parseFloat(t),o=[n];for(;n<i;)n+=100,o.push(n);return o}/**
 * Resolve the REST id for the provided entity.
 * @param {*} e - The entity or value to resolve a REST id from.
 * @returns {string|undefined} The resolved REST id if available, otherwise `undefined`.
 */
function He(e){return Ne(e)}let Je;const Qe=()=>{try{Je.scrollIntoView({block:"center"})}catch(e){console.error(e)}},Ke=(e,t)=>{const n=document.createElement("div");n.classList.add("sft-notification",`sft-notification--${t}`),n.textContent=e;try{Je.appendChild(n)}catch(e){console.error(e)}Qe()};/**
 * Log a value to the console and emit a success notification for it.
 * @param {*} e - The message or payload to log and notify as a successful event.
 */
function Ye(e){console.log(e),Ke(e,"success")}/**
 * Display a warning message and log it to the console.
 * @param {any} e - The warning content to log and present in the UI. 
 */
function ze(e){console.log(e),Ke(e,"warning")}/**
 * Set the internal `Je` reference to the provided value.
 * @param {*} e - The value to assign to the internal `Je` variable.
 */
function Ze(e){Je=e}/**
 * Adds a status entry derived from `e` to the status log and displays `t` as a transient notification.
 * @param {*} e - Data used to build the status entry.
 * @param {string} t - Text to display as a notification.
 */
function et(e,t){Ze(se(e)),ze(t)}/**
 * Update the status display with a formatted value and show a notification message.
 * @param {string|any} e - Value to format and set as the current status label.
 * @param {string} t - Message to display as a user notification.
 */
function tt(e,t){Ze(se(e)),Ye(t)}const nt="v2FollowRecord";/**
 * Delete a record from the default IndexedDB object store using a composite key.
 * @param {*} e - The record identifier used as the second element of the composite key ([L(), e]).
 */
function it(e){return function(e,t){Pe.transaction([e],"readwrite").objectStore(e).delete(t)}(nt,[L(),e])}/**
 * Create and persist a follow-record entry for the given entity.
 *
 * @param {Object|string|number} e - Entity or identifier used to resolve the target restId.
 * @returns {*} The result of writing the follow record to the database.
 */
function ot(e){return Be(nt,[L(),V(e)])}/**
 * Retrieve the stored follow record for a user or entity.
 * @param {*} e - A user object or identifier; the function will resolve the entity's stored key.
 * @returns {*} The follow record for the resolved entity, or `undefined` if none exists.
 */
function lt(e){return Be("followRecord",V(e))}/**
 * Create a case-insensitive regular expression that matches any term from a comma-separated list.
 * Trims whitespace and ignores empty items in the list.
 * @param {string} e - Comma-separated terms (e.g., "foo, bar, baz").
 * @returns {RegExp|undefined} A `RegExp` that matches any listed term (case-insensitive), or `undefined` if no terms are provided.
 */
function at(e){if(0===e.length)return;const t=e.split(",").map((e=>e.trim())).filter((e=>e.length));return new RegExp(t.join("|"),"i")}/**
 * Retrieve entries from chrome.storage.sync and chrome.storage.local and merge them, with local values taking precedence.
 * @param {string|string[]|Object} e - Key, array of keys, or object specifying items to retrieve.
 * @returns {Object} Merged storage items where properties from local override those from sync.
 */
function st(e){return new Promise((t=>{chrome.storage.sync.get(e,(n=>{chrome.storage.local.get(e,(e=>{const i={...n,...e};t(i)}))}))}))}/**
 * Fetches data for the keys of the given object and merges the fetched results into it.
 * @param {Object} e - Source object whose own enumerable property names will be requested.
 * @returns {Object} The source object merged with the fetched results; properties from the fetched results override those in the source when keys conflict.
 */
async function rt(e){const t=Object.keys(e),n=await st(t);return{...e,...n}}const ct={likeMaxFollowers:"",likeMaxFollowersFollowingRatio:"",likeMaxFollowing:"",likeMaxTweetLikes:"",likeMinFollowers:"",likeMinFollowing:"",likeMinFollowersFollowingRatio:"",likeMinTweetLikes:"",likeIntervalMax:8,likeIntervalMin:4,likeLanguageWhitelist:"",likeLimit:1e3,likePauseWhenUnableToLike:10,likeSkipFollowed:!1,likeSkipReplies:!1,likeSkipRetweets:!1,likeSkipRetweetsWithComment:!1,likeSkipLikedXTweetsFromUser:"",likeTweetTextBlacklist:""},ut=()=>rt(ct),wt=async()=>{const e=await ut();return e.languageWhitelist=Ve(e.likeLanguageWhitelist),e.intervalDurationRange=Xe(e.likeIntervalMin,e.likeIntervalMax),e.skipLikedXTweetsFromUser=parseInt(e.likeSkipLikedXTweetsFromUser),e.tweetTextBlacklist=at(e.likeTweetTextBlacklist),e.maxFollowing=parseInt(e.likeMaxFollowing),e.minFollowing=parseInt(e.likeMinFollowing),e.maxFollowers=parseInt(e.likeMaxFollowers),e.minFollowers=parseInt(e.likeMinFollowers),e.maxFollowersFollowingRatio=parseFloat(e.likeMaxFollowersFollowingRatio),e.minFollowersFollowingRatio=parseFloat(e.likeMinFollowersFollowingRatio),e.maxTweetLikes=parseInt(e.likeMaxTweetLikes),e.minTweetLikes=parseInt(e.likeMinTweetLikes),e},ft=async(e,t)=>{const n=await async function(e,t){if(Y(e))return"already liked";if(t.minTweetLikes){const n=K(e);if(n<t.minTweetLikes)return`${n} Tweet likes, but ${t.minTweetLikes} minimum required`}if(t.maxTweetLikes){const n=K(e);if(n>t.maxTweetLikes)return`${n} Tweet likes, but ${t.maxTweetLikes} maximum required`}if(t.languageWhitelist&&!Ge(e,t.languageWhitelist))return`language "${Q(e)}" not whitelisted`;if(t.tweetTextBlacklist instanceof RegExp&&ie(e)){const n=ie(e).match(t.tweetTextBlacklist);if(n)return`${n.join()} found in Tweet text, but is blacklisted`}if(t.likeSkipReplies&&z(e))return"is reply";if(t.likeSkipRetweets&&Z(e))return"is Retweet";if(t.likeSkipRetweetsWithComment&&ee(e))return"is Retweet with comment";if(t.minFollowing){const n=O(oe(e));if("number"==typeof n&&n<t.minFollowing)return`${n} following, but ${t.minFollowing} minimum required`}if(t.maxFollowing){const n=O(oe(e));if("number"==typeof n&&n>t.maxFollowing)return`${n} following, but ${t.maxFollowing} maximum required`}if(t.minFollowers){const n=j(oe(e));if("number"==typeof n&&n<t.minFollowers)return`${n} followers, but ${t.minFollowers} minimum required`}if(t.maxFollowers){const n=j(oe(e));if("number"==typeof n&&n>t.maxFollowers)return`${n} followers, but ${t.maxFollowers} maximum required`}if(t.minFollowersFollowingRatio){const n=W(oe(e));if(n&&n<t.minFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.minFollowersFollowingRatio} minimum required`}if(t.maxFollowersFollowingRatio){const n=W(oe(e));if(n&&n>=t.maxFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.maxFollowersFollowingRatio} maximum required`}if(t.likeSkipFollowed){const t=oe(e);if(await ot(t))return"already followed once";if(await lt(t))return"already followed once"}if(t.skipLikedXTweetsFromUser){const n=await Oe(e);if("number"==typeof n&&n>=t.skipLikedXTweetsFromUser)return`already liked ${n} Tweet(s) from user`}return!0}(e,t);if(1==n){const n=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="like"]')}(e);if(!n)return!1;n.click(),function(e){const t={createdAt:Date.now(),creatorId:L(),tweetId:J(e),tweetUserId:le(e)};je(We,t)}(e),Qn(),tt(e,"successfully liked");const i=He(t.intervalDurationRange);await Vn(i),Qe()}else n&&et(e,n)};/**
 * Start a mass "like" operation using current saved settings, applying optional overrides.
 *
 * Applies saved like-related configuration, accepts optional overrides for the like limit and pacing,
 * adapts the configuration for the active page/context, and dispatches the appropriate context-specific
 * processor to perform the like actions.
 *
 * @param {number} [limit] - Optional override for the maximum number of likes to perform.
 * @param {number} [pause] - Optional override for the per-action pause/delay value.
 * @returns {Promise<void>} Resolves when the mass-like operation completes or is scheduled for the current context.
 */
async function dt(e,t){const n=await wt();await Bn(),n.likeLimit&&Hn(n.likeLimit),e&&Hn(e),t&&On(t),Nn(n.likePauseWhenUnableToLike),ve()?await Te((async e=>{await ft(e,n)})):$e()?(delete n.likeSkipFollowed,delete n.likeSkipLikedXTweetsFromUser,delete n.maxFollowing,delete n.minFollowing,delete n.maxFollowers,delete n.minFollowers,delete n.maxFollowersFollowingRatio,delete n.minFollowersFollowingRatio,await Me((async e=>{await ft(e,n)}))):de()?await me((async e=>{await ft(e,n)})):Ee()&&(delete n.maxFollowing,delete n.minFollowing,delete n.maxFollowers,delete n.minFollowers,delete n.maxFollowersFollowingRatio,delete n.minFollowersFollowingRatio,await Ae((async e=>{await ft(e,n)})))}const mt=document.createElement("div");mt.innerText="Like all",mt.setAttribute("role","button"),mt.classList.add("sft-button","sft-button--like");const pt=()=>{mt.style.display="none"};mt.addEventListener("click",(async()=>{m(),De(),qt(),Rt(),pt(),await dt()}));const yt="retweetRecord";const gt={retweetIntervalMax:8,retweetIntervalMin:4,retweetLanguageWhitelist:"",retweetLimit:1e3,retweetPauseWhenUnableToRetweet:10,retweetSkipFollowed:!1,retweetSkipReplies:!1,retweetSkipRetweets:!1,retweetSkipRetweetsWithComment:!1,retweetTweetTextBlacklist:""},kt=()=>rt(gt),bt=async()=>{const e=await kt();return e.languageWhitelist=Ve(e.retweetLanguageWhitelist),e.intervalDurationRange=Xe(e.retweetIntervalMin,e.retweetIntervalMax),e.tweetTextBlacklist=at(e.retweetTweetTextBlacklist),e},Ft=async(e,t)=>{const n=await async function(e,t){if(te(e))return"already retweeted";if(t.languageWhitelist&&!Ge(e,t.languageWhitelist))return`language "${Q(e)}" not whitelisted`;if(t.tweetTextBlacklist instanceof RegExp&&ie(e)){const n=ie(e).match(t.tweetTextBlacklist);if(n)return`${n.join()} found in Tweet text, but is blacklisted`}if(t.retweetSkipFollowed){const t=oe(e);if(await ot(t))return"already followed once";if(await lt(t))return"already followed once"}return t.retweetSkipReplies&&z(e)?"is reply":t.retweetSkipRetweets&&Z(e)?"is Retweet":!t.retweetSkipRetweetsWithComment||!ee(e)||"is Retweet with comment"}(e,t);if(1==n){const n=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="retweet"]')}(e);if(!n)return!1;Jn("/compose/tweet"),n.click();(await E((()=>document.querySelector('div[data-testid="retweetConfirm"]')||document.querySelector('[aria-modal="true"] [data-testid="toolBar"] [data-testid="tweetButton"]')),9999)).click(),function(e){const t=ne(e),n={createdAt:Date.now(),creatorId:L(),retweetedStatusId:t};je(yt,n)}(e),Qn(),tt(e,"successfully retweeted");const i=He(t.intervalDurationRange);await Vn(i),Qe()}else n&&et(e,n)};/**
 * Configure and start a mass-retweet operation using stored settings and optional overrides.
 * @param {number} [limit] - Optional override for the maximum number of retweets to perform.
 * @param {number} [delay] - Optional override for the delay/pause between retweet attempts (milliseconds).
 * @returns {Promise<void>} Resolves when the configured retweet operation has finished initializing and any scheduled processing completes.
 */
async function ht(e,t){const n=await bt();await Bn(),n.retweetLimit&&Hn(n.retweetLimit),e&&Hn(e),t&&On(t),Nn(n.retweetPauseWhenUnableToRetweet),ve()?await Te((async e=>{await Ft(e,n)})):$e()?(delete n.retweetSkipFollowed,await Me((async e=>{await Ft(e,n)}))):Ee()&&await Ae((async e=>{await Ft(e,n)}))}const xt=document.createElement("div");xt.innerText="Retweet all",xt.setAttribute("role","button"),xt.classList.add("sft-button","sft-button--retweet");const Rt=()=>{xt.style.display="none"};/**
 * Toggle visibility of the xt control based on the current page and application state.
 *
 * Sets the xt element's display to "initial" when the current location and app state permit actions;
 * otherwise updates the UI to hide or reset the control.
 */
function Lt(){ve()&&!location.pathname.includes("/communities/")||$e()||Ee()&&!_()?xt.style.display="initial":Rt()}/**
 * Convert a comma-separated string into an array of trimmed, uppercase tokens.
 * @param {string} e - The comma-separated input string.
 * @returns {string[]} An array where each item is a token from the input, trimmed and converted to uppercase.
 */
function St(e){return e.split(",").map((e=>e.trim().toUpperCase()))}/**
 * Checks whether a text contains the target user's uppercase @mention.
 * @param {*} e - Source value from which the username is derived (e.g., a user object or identifier).
 * @param {string} t - The text to search for the @mention.
 * @returns {boolean} `true` if `t` contains an `@` followed by the derived username converted to uppercase, `false` otherwise.
 */
function vt(e,t){return t.includes(`@${P(e).toUpperCase()}`)}/**
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
async function _t(e,t){if(!function(e){return P(e)==S()}(e)&&function(e){return 1!=e.relationship_perspectives.following&&1!=e.legacy.follow_request_sent}(e)){if(function(e){return 1==e.relationship_perspectives.blocked_by}(e))return"is blocking you";if(t.followBioRequired&&function(e){return""===F(e.legacy,"description")}(e))return"has no biography";if(t.followSkipVerified&&N(e))return"is verified";if(vt(e,t.blacklist))return"is blacklisted";if(t.followProfileImageRequired&&function(e){return 1==e.legacy.default_profile_image}(e))return"has default profile image";if(t.followSkipProtected&&G(e))return"is protected";if(t.followProtectedRequired&&!G(e))return"is not protected";if(t.followSkipFollower&&B(e))return"is following you";if(t.minFollowing){const n=O(e);if("number"==typeof n&&n<t.minFollowing)return`${n} following, but ${t.minFollowing} minimum required`}if(t.maxFollowing){const n=O(e);if("number"==typeof n&&n>t.maxFollowing)return`${n} following, but ${t.maxFollowing} maximum required`}if(t.minFollowers){const n=j(e);if("number"==typeof n&&n<t.minFollowers)return`${n} followers, but ${t.minFollowers} minimum required`}if(t.maxFollowers){const n=j(e);if("number"==typeof n&&n>t.maxFollowers)return`${n} followers, but ${t.maxFollowers} maximum required`}if(t.minFollowersFollowingRatio){const n=W(e);if(n&&n<t.minFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.minFollowersFollowingRatio} minimum required`}if(t.maxFollowersFollowingRatio){const n=W(e);if(n&&n>=t.maxFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.maxFollowersFollowingRatio} maximum required`}if(t.bioBlacklist instanceof RegExp){const n=X(e).match(t.bioBlacklist);if(n)return`${n.join()} found in bio, but is blacklisted`}if(t.bioWhitelist instanceof RegExp){const n=X(e);if(!1===t.bioWhitelist.test(n))return"no whitelisted word found in bio"}if(t.followSkipFollowed){if(await ot(e))return"already followed once";if(await lt(e))return"already followed once"}return!0}}/**
 * Attempts to follow the account associated with the provided tweet item when allowed by language and action guards.
 *
 * Performs in-page interactions to locate and click the follow control, updates internal follow state, and delays according to the configured interval. If the tweet's language is not whitelisted or other guard checks fail, records the reason and waits a short backoff.
 *
 * @param {Object} e - Tweet item container object; expected to include DOM references (e.g., `focusableEl`) and identifiers used to resolve the target account.
 * @param {Object} t - Options object. Recognized properties include `tweetLanguageWhitelist` (allowed languages) and `intervalDurationRange` (used to compute follow delay).
 */
async function $t(e,t){let n;const i=oe(e);if(n=t.tweetLanguageWhitelist&&!Ge(e,t.tweetLanguageWhitelist)?`language "${Q(e)}" not whitelisted`:await _t(i,t),1==n){let n;Jn(H(i)),function(e){const t=`a[href="${H(oe(e))}"][role="link"]`;return e.focusableEl.closest('[data-testid="tweet"]').querySelector(t)}(e).click();try{n=await E((()=>pe(i)),2e3)}catch(e){console.log(e)}if(n&&n.click(),window.history.back(),await E((()=>Yn())),e.focusableEl=await E((()=>ae(e))),e.focusableEl.focus(),Ze(se(e)),!n)return ze("follow button not found");Tt(i),Ye("successfully followed");const o=He(t.intervalDurationRange);await Vn(o)}else Ze(se(e)),n&&(ze(n),await Vn(500))}xt.addEventListener("click",(async()=>{p(),qt(),Rt(),pt(),await ht()}));const Mt=async e=>{if(!Un){for(let t=e;t>=0;t--){const n=xe()[t];if(n.focusableEl=ge(n),n.focusableEl){if(n.focusableEl.scrollIntoView(),t===e)return;break}}await Vn(40),await Mt(e)}};const It={followBlacklist:"@username1,@username2",followBioBlacklist:"",followBioRequired:!1,followBioWhitelist:"",followDailyLimit:"",followIntervalMax:8,followIntervalMin:4,followLimit:400,followMaxFollowers:"",followMaxFollowersFollowingRatio:"",followMaxFollowing:"",followMinFollowers:"",followMinFollowing:"",followMinFollowersFollowingRatio:"",followPauseAfterSkipMax:"",followPauseAfterSkipMin:"",followPauseWhenTwitterLimitExceeded:5,followProfileImageRequired:!1,followProtectedRequired:!1,followSkipFollowed:!0,followSkipFollower:!1,followSkipProtected:!1,followSkipVerified:!1,followTweetLanguageWhitelist:""},Et=()=>rt(It),At=async()=>{const e=await Et();return e.blacklist=St(e.followBlacklist),e.bioBlacklist=at(e.followBioBlacklist),e.bioWhitelist=at(e.followBioWhitelist),e.tweetLanguageWhitelist=Ve(e.followTweetLanguageWhitelist),e.intervalDurationRange=Xe(e.followIntervalMin,e.followIntervalMax),e.maxFollowing=parseInt(e.followMaxFollowing),e.minFollowing=parseInt(e.followMinFollowing),e.maxFollowers=parseInt(e.followMaxFollowers),e.minFollowers=parseInt(e.followMinFollowers),e.maxFollowersFollowingRatio=parseFloat(e.followMaxFollowersFollowingRatio),e.minFollowersFollowingRatio=parseFloat(e.followMinFollowersFollowingRatio),e.followPauseAfterSkipMin&&e.followPauseAfterSkipMax&&(e.pauseAfterSkipRange=Xe(e.followPauseAfterSkipMin,e.followPauseAfterSkipMax)),e};/**
 * Starts and orchestrates the "follow all" mass-follow operation using current settings and optional overrides.
 *
 * Applies configured follow limits and daily limits, checks and sets pause/limit flags, chooses the appropriate navigation/interact strategy based on the current page/context, performs follow actions with pacing, and emits UI notifications and persistence updates for each result.
 *
 * @param {?number|Object} e - Optional override for follow limits or an options object that can modify follow behavior (e.g., follow limit, interval ranges, pause-after-skip). If a number is provided it is treated as a follow limit.
 * @param {?any} t - Optional target or context hint used to focus or scope the follow operation (for example a specific item, element, or route marker); when present it is applied to the operation before actions begin.
 */
async function Ct(e,t){const n=await At();var o;await Bn(),n.followLimit&&Hn(n.followLimit),e&&Hn(e),n.followDailyLimit&&(o=await async function(){const e=Pe.transaction([nt],"readonly").objectStore(nt).index("createdAt"),t=IDBKeyRange.bound([L(),Date.now()-864e5],[L(),Date.now()]);let n=0;return new Promise((i=>{e.openCursor(t).onsuccess=e=>{const t=e.target.result;t?(n+=1,t.continue()):i(n)}}))}(),In=o,function(e){$n=e,In>=$n&&(Un=!0,i(),hn())}(n.followDailyLimit)),t&&On(t),Nn(n.followPauseWhenTwitterLimitExceeded),$()&&xe()?await async function(e){await Re((async(t,n)=>{const i=await _t(t,e);if(1==i){let i=pe(t);if(i)i.click(),Tt(t);else{Jn(H(t)),t.focusableEl.click();try{i=await E((()=>pe(t)),4e3)}catch(e){console.log(e)}i&&(i.click(),Tt(t)),window.history.back(),await E((()=>Yn())),await Mt(n)}if(Ze(ke(t)),!i)return ze("follow button not found");Ye("successfully followed");const o=He(e.intervalDurationRange);await Vn(o)}else Ze(ke(t)),i&&(ze(i),await Vn(500))}),ge)}(n):ve()?await async function(e){await Te((async t=>{await $t(t,e)}))}(n):de()?await async function(e){await me((async t=>{await $t(t,e)}))}(n):await async function(e){await Re((async t=>{const n=await _t(t,e);if(Ze(ke(t)),1==n){const n=pe(t);if(!n)return ze("follow button not found");n.click(),Tt(t),Ye("successfully followed");const i=He(e.intervalDurationRange);await Vn(i)}else if(n&&ze(n),e.pauseAfterSkipRange){const t=He(e.pauseAfterSkipRange);await Vn(t)}}))}(n)}const Dt=document.createElement("div");Dt.innerText="Follow all",Dt.setAttribute("role","button"),Dt.classList.add("sft-button","sft-button--follow");const qt=()=>{Dt.style.display="none"};Dt.addEventListener("click",(async()=>{f(),qt(),pt(),Rt(),await Ct()}));const Ut=864e5;/**
 * Compute the elapsed time since a given timestamp, expressed in the module's time units.
 * @param {number} e - Start timestamp (milliseconds since epoch).
 * @returns {number} The elapsed time from `e` to now, divided by `Ut`.
 */
function Pt(e){return(Date.now()-e)/Ut}const jt=(e,t,n)=>n.indexOf(e)==t,Bt=(e,t)=>{const n=[];if(t.followingLessThan){if(O(e)<t.followingLessThan)return!0;n.push(`${O(e)} Following`)}if(t.followingGreaterThan){if(O(e)>t.followingGreaterThan)return!0;n.push(`${O(e)} Following`)}if(t.followersLessThan){if(j(e)<t.followersLessThan)return!0;n.push(`${j(e)} Followers`)}if(t.followersGreaterThan){if(j(e)>t.followersGreaterThan)return!0;n.push(`${j(e)} Followers`)}return 0===n.length||n.filter(jt).join(", ")};/**
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
async function Wt(e,t){if(function(e){return F(e.relationship_perspectives,"following")}(e)){if(t.unfollowSkipFollower&&B(e))return"is following you";if(t.unfollowSkipVerified&&N(e))return"is verified";if(vt(e,t.blacklist))return"is blacklisted";if(t.bioBlacklist instanceof RegExp){const n=X(e).match(t.bioBlacklist);if(n)return`${n.join()} found in bio, but is blacklisted`}if(t.unfollowMassFollowedRequired||t.minDaysFollowed){const n=await ot(e),i=await lt(e);if(t.unfollowMassFollowedRequired&&!n&&!i)return"has not been mass followed";if(t.minDaysFollowed&&n){const e=Pt(n.createdAt);if(e<t.minDaysFollowed)return`${e.toFixed(2)} days followed, but ${t.minDaysFollowed} days minimum required`}if(t.minDaysFollowed&&i){const e=Pt(i.createdAt);if(e<t.minDaysFollowed)return`${e} days followed, but ${t.minDaysFollowed} days minimum required`}}return Bt(e,t)}}const Ot={unfollowBlacklist:"@username1,@username2",unfollowBioBlacklist:"",unfollowFollowersLessThan:"",unfollowFollowersGreaterThan:"",unfollowFollowingLessThan:"",unfollowFollowingGreaterThan:"",unfollowIntervalMax:8,unfollowIntervalMin:4,unfollowLimit:"",unfollowMassFollowedRequired:!1,unfollowMinDaysFollowed:2,unfollowPauseAfterSkipMax:"",unfollowPauseAfterSkipMin:"",unfollowSkipFollower:!0,unfollowSkipVerified:!1},Vt=()=>rt(Ot),Gt=()=>document.querySelector('[data-testid="confirmationSheetConfirm"]'),Nt=async()=>{const e=await Vt();return e.blacklist=St(e.unfollowBlacklist),e.bioBlacklist=at(e.unfollowBioBlacklist),e.followingLessThan=parseInt(e.unfollowFollowingLessThan),e.followingGreaterThan=parseInt(e.unfollowFollowingGreaterThan),e.followersLessThan=parseInt(e.unfollowFollowersLessThan),e.followersGreaterThan=parseInt(e.unfollowFollowersGreaterThan),e.intervalDurationRange=Xe(e.unfollowIntervalMin,e.unfollowIntervalMax),e.minDaysFollowed=parseFloat(e.unfollowMinDaysFollowed),e.unfollowPauseAfterSkipMin&&e.unfollowPauseAfterSkipMax&&(e.pauseAfterSkipRange=Xe(e.unfollowPauseAfterSkipMin,e.unfollowPauseAfterSkipMax)),e};/**
 * Unfollow the specified target account, honoring configured limits, delays, and pause rules.
 *
 * Finds and clicks the target's unfollow control in the page UI, records progress, shows success
 * or error notifications, and waits a randomized interval after a successful unfollow or when a
 * configured pause is required.
 *
 * @param {Object|string|number} e - Target account (user object, username, or id) used to locate the unfollow button.
 * @param {?number} [t] - Optional override value affecting pause/delay behavior for this operation.
 */
async function Xt(e,t){const n=await Nt();await Bn(),n.unfollowLimit&&Hn(n.unfollowLimit),e&&Hn(e),t&&On(t),await Re((async e=>{Ze(ke(e));const t=await Wt(e,n);if(1==t){const t=function(e){const t=`[data-testid="${V(e)}-unfollow"]`;return console.log(`Querying unfollow button of ${P(e)} with ${t}`),document.querySelector(t)}(e);if(!t)return ze("unfollow button not found");t.click();(await E((()=>Gt()),1e3)).click(),Qn(),Ye("successfully unfollowed");const i=He(n.intervalDurationRange);await Vn(i)}else if(t&&ze(t),n.pauseAfterSkipRange){const e=He(n.pauseAfterSkipRange);await Vn(e)}}))}const Ht=document.createElement("div");Ht.innerText="Unfollow all",Ht.setAttribute("role","button"),Ht.classList.add("sft-button","sft-button--unfollow");const Jt=()=>{Ht.style.display="none"};/**
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
async function Qt(e,t){if(Y(e)){if(t.unlikeMassLikedRequired||t.minDaysSinceLike){const n=await function(e){return Be(We,[L(),J(e)])}(e);if(t.unlikeMassLikedRequired&&!n)return"has not been mass liked";if(t.minDaysSinceLike&&n){const e=Pt(n.createdAt);if(e<t.minDaysSinceLike)return`${e.toFixed(2)} days since like, but ${t.minDaysSinceLike} minimum required`}}return!0}}Ht.addEventListener("click",(async()=>{d(),Jt(),await Xt()}));const Kt={unlikeIntervalMax:8,unlikeIntervalMin:4,unlikeLimit:"",unlikeMassLikedRequired:!1,unlikeMinDaysSinceLike:2};const Yt=async()=>{const e=await rt(Kt);return e.intervalDurationRange=Xe(e.unlikeIntervalMin,e.unlikeIntervalMax),e.minDaysSinceLike=parseFloat(e.unlikeMinDaysSinceLike),e};/**
 * Attempt to unlike the given tweet action item, record the result, and apply rate limiting and pacing.
 *
 * @param {Object} e - The action item representing a tweet; must expose `focusableEl` used to locate the tweet and its unlike control.
 * @param {*} [t] - Optional token passed to the failure handler when the unlike cannot be performed.
 */
async function zt(e,t){const n=await Yt();await Bn(),n.unlikeLimit&&Hn(n.unlikeLimit),e&&Hn(e),t&&On(t),await me((async e=>{const t=await Qt(e,n);if(1==t){const t=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="unlike"]')}(e);if(!t)return!1;t.click(),Qn(),tt(e,"successfully unliked");const i=He(n.intervalDurationRange);await Vn(i)}else t&&(et(e,t),await Vn(500))}))}const Zt=document.createElement("div");Zt.innerText="Unlike all",Zt.setAttribute("role","button"),Zt.classList.add("sft-button","sft-button--unlike");const en=()=>{Zt.style.display="none"};/**
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
async function tn(e,t){if(te(e)){if(t.minDaysSinceRetweet){const n=Pt(function(e){const t=F(e.legacy,"created_at");return Date.parse(t)}(e));if(n<t.minDaysSinceRetweet)return`${n.toFixed(2)} days since retweet, but ${t.minDaysSinceRetweet} minimum required`}if(t.unretweetMassRetweetedRequired){const t=await function(e){const t=ne(e);return Be(yt,[L(),t])}(e);if(!t)return"has not been mass retweeted"}return!0}}Zt.addEventListener("click",(async()=>{g(),en(),await zt()}));const nn={unretweetIntervalMax:8,unretweetIntervalMin:4,unretweetLimit:"",unretweetMassRetweetedRequired:!1,unretweetMinDaysSinceRetweet:2};const on=()=>document.querySelector('div[data-testid="unretweetConfirm"]'),ln=async()=>{const e=await rt(nn);return e.intervalDurationRange=Xe(e.unretweetIntervalMin,e.unretweetIntervalMax),e.minDaysSinceRetweet=parseFloat(e.unretweetMinDaysSinceRetweet),e};/**
 * Performs a mass unretweet operation using current configuration, applying optional overrides.
 *
 * Attempts to unretweet items discovered by the internal iterator, updates action counters and status,
 * and respects configured limits and interval delays. When an item cannot be unretweeted and the
 * fallback flag is provided, the item is recorded/skipped and the routine continues.
 *
 * @param {number} [limit] - Optional maximum number of unretweets to perform for this run (overrides configured limit).
 * @param {boolean|any} [recordOnSkip] - Optional flag or context used when an item is skipped/unavailable; when truthy the skip is recorded via the module's skip handler.
 */
async function an(e,t){const n=await ln();await Bn(),n.unretweetLimit&&Hn(n.unretweetLimit),e&&Hn(e),t&&On(t),await Ae((async e=>{const t=await tn(e,n);if(1==t){const t=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="unretweet"]')}(e);if(!t)return!1;t.click();(await E((()=>on()))).click(),Qn(),tt(e,"successfully unretweeted");const i=He(n.intervalDurationRange);await Vn(i)}else t&&(et(e,t),await Vn(500))}))}const sn=document.createElement("div");sn.innerText="Unretweet all",sn.setAttribute("role","button"),sn.classList.add("sft-button","sft-button--unretweet");const rn=()=>{sn.style.display="none"};sn.addEventListener("click",(async()=>{y(),rn(),await an()}));const cn=document.createElement("aside");cn.setAttribute("role","complementary"),cn.classList.add("sft-panel"),document.body.appendChild(cn);const un=()=>{cn.style.display="none"},wn=()=>{cn.style.display="flex"};/**
 * Update which action controls are shown and adjust the panel visibility based on current page state and guard conditions.
 *
 * Toggles the display of the UI action buttons and the status panel, and updates related panel classes and layout to reflect the current context and feature/guard checks. This function has side effects on DOM elements (display styles and panel class toggling).
 */
function fn(){Un||(qe(),xe()&&!v()||ve()&&!$()||de()?Dt.style.display="initial":qt(),ve()||Ee()&&!_()||de()&&!T()||$e()?mt.style.display="initial":pt(),Lt(),xe()&&v()?Ht.style.display="initial":Jt(),de()&&T()?Zt.style.display="initial":en(),Ee()&&_()?sn.style.display="initial":rn(),"initial"==Ce.style.display||"initial"==Dt.style.display||"initial"==mt.style.display||"initial"==xt.style.display||"initial"==Ht.style.display||"initial"==Zt.style.display||"initial"==sn.style.display?(dn.style.display="none",cn.classList.toggle("sft-panel--search-page","/search"==location.pathname),wn()):un())}const dn=document.createElement("div");dn.classList.add("sft-status-bar");const mn=document.createElement("div");mn.innerText="Skip",mn.setAttribute("role","button"),mn.classList.add("sft-status-bar__button"),dn.append(mn),mn.addEventListener("click",(async()=>{mn.style.display="none",await ki()}));const pn=document.createElement("div");pn.innerText="Cancel",pn.setAttribute("role","button"),pn.classList.add("sft-status-bar__button"),dn.append(pn),pn.addEventListener("click",(()=>{jn(),pi(),un(),s()}));const yn=document.createElement("div");/**
 * Show the pause UI and set a retry message appropriate to the current action.
 *
 * Reveals the pause panel (pn), hides the active/progress panels (yn, mn),
 * and updates the status text (u) with a message for the current action (`w`)
 * including the formatted retry delay produced by `c(Pn)`.
 */
function gn(){pn.style.display="initial",yn.style.display="none",mn.style.display="none",function(){switch(w){case"follow":u.textContent=`Twitter follow limit exceeded. Continuing in ${c(Pn)} ...`;break;case"like":u.textContent=`Unable to like. Continuing in ${c(Pn)} ...`;break;case"retweet":u.textContent=`Unable to retweet. Continuing in ${c(Pn)} ...`}}()}/**
 * Show the repeating-autopilot countdown and update the status label.
 *
 * Displays the repeating-autopilot UI (shows the countdown element, hides other controls)
 * and sets the status text to indicate how long until autopilot repeats.
 *
 * @param {number} e - Time remaining in milliseconds until autopilot repeats.
 */
function kn(e){pn.style.display="initial",yn.style.display="none",mn.style.display="none",function(e){u.textContent=`Repeating autopilot in ${c(e)} ...`}(e)}/**
 * Update the autopilot UI to show progress and toggle related controls.
 * 
 * Makes the primary autopilot controls visible, hides the idle/status element, and updates the progress label to "Autopilot {current}/{total} ...".
 * @param {number} e - Current progress count (completed actions).
 * @param {number} t - Total number of actions to perform.
 */
function bn(e,t){pn.style.display="initial",yn.style.display="none",mn.style.display="initial",function(e,t){u.textContent=`Autopilot ${e}/${t} ...`}(e,t)}/**
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
function Fn(){pn.style.display="none",yn.style.display="initial",mn.style.display="none",function(){switch(w){case"follow":u.textContent=`Successfully followed ${Tn} users`;break;case"unfollow":u.textContent=`Successfully unfollowed ${Tn} users`;break;case"like":u.textContent=`Successfully liked ${Tn} Tweets`;break;case"retweet":u.textContent=`Successfully retweeted ${Tn} Tweets`;break;case"unretweet":u.textContent=`Successfully unretweeted ${Tn} Tweets`;break;case"unlike":u.textContent=`Successfully unliked ${Tn} Tweets`}}()}/**
 * Display the "daily limit reached" UI state by toggling visibility of relevant panels, setting the status message, and logging it.
 *
 * Sets the status text to "You have reached the daily limit of <number>" where `<number>` is the current daily limit value.
 */
function hn(){pn.style.display="none",yn.style.display="initial",mn.style.display="none",u.textContent=`You have reached the daily limit of ${$n}`,console.log(u.textContent)}/**
 * Update the UI to show the action panel and set the status message for the current mass action.
 *
 * Shows the primary panel, hides the secondary panel, toggles an auxiliary element based on hi(),
 * and updates the status label to indicate the current action (follow, unfollow, like, retweet, unretweet, unlike)
 * and its target identifier (uses Tn and optional Mn when present).
 */
function xn(){pn.style.display="initial",yn.style.display="none",mn.style.display=hi()?"initial":"none",function(){const e=Mn?`${Tn}/${Mn}`:Tn;switch(w){case"follow":u.textContent=`Following ${e} ...`;break;case"unfollow":u.textContent=`Unfollowing ${e} ...`;break;case"like":u.textContent=`Liking ${e} ...`;break;case"retweet":u.textContent=`Retweeting ${e} ...`;break;case"unretweet":u.textContent=`Unretweeting ${e} ...`;break;case"unlike":u.textContent=`Unliking ${e} ...`}}()}/**
 * Show the status bar and initialize its interactive controls and state.
 *
 * Makes the status container visible and performs the layout, event-handler,
 * and state initializations required for the status bar UI.
 */
function Rn(){dn.style.display="flex",qt(),pt(),Rt(),Jt()}/**
 * Load Pro activation data from chrome.storage.sync.
 * @returns {{proActivationKey?: string, proExpiresAt?: number}} Object containing the stored `proActivationKey` and `proExpiresAt` fields when available.
 */
function Ln(){return new Promise((e=>{chrome.storage.sync.get(["proActivationKey","proExpiresAt"],(t=>e(t)))}))}/**
 * Determine whether the given record's pro subscription is still valid.
 * @param {{proExpiresAt:number}|undefined} e - Object containing `proExpiresAt`, a millisecond Unix timestamp; may be undefined.
 * @returns {boolean} `true` if `e` is defined and `proExpiresAt` is greater than or equal to the current time, `false` otherwise.
 */
function Sn(e){return void 0!==e&&e.proExpiresAt>=Date.now()}yn.innerText="Close",yn.setAttribute("role","button"),yn.classList.add("sft-status-bar__button"),dn.append(yn),yn.addEventListener("click",(()=>un()));const vn=50;let Tn,_n,$n,Mn,In,En,An,Cn,Dn,qn,Un=!1,Pn=!1;/**
 * Set the global `Un` flag to `true` to mark autopilot as active.
 */
function jn(){Un=!0}/**
 * Reset internal autopilot state for the current page and bootstrap page-specific data.
 *
 * Clears transient counters and flags, updates the current page key, awaits retrieval
 * of page data, updates the cached state accordingly, and invokes follow-up startup
 * handlers (including the no-cache handler when applicable).
 */
async function Bn(){Tn=0,In=void 0,$n=void 0,Pn=!1,_n=spwCurrentPageKey(),En=void 0,An=void 0,Dn=void 0;const e=await Ln();Cn=Sn(e),Cn||(Mn=vn,r()),xn(),Rn()}const Wn=()=>{An=En?Date.now()+En:void 0};/**
 * Update the global timing value from the provided seconds value and apply the change.
 *
 * Sets the module-level variable `En` to the numeric value of `e` converted from seconds to milliseconds,
 * then invokes `Wn()` to react to the updated timing.
 *
 * @param {string|number} e - A numeric value (or numeric string) expressing time in seconds.
 */
function On(e){En=1e3*parseFloat(e),Wn()}/**
 * Pause execution for the given duration and add that duration to the global `An` accumulator when present.
 * @param {number} t - Duration in milliseconds to wait.
 */
async function Vn(t){An&&(An+=t),await e(t)}/**
 * Checks whether the current idle deadline has passed and, if so, clears it and marks the system as idle.
 *
 * When the stored idle deadline is at or before the current time, this clears the deadline, sets the idle flag,
 * and emits an "Idle timeout" log message.
 */
function Gn(){An&&An<=Date.now()&&(console.log("Idle timeout"),An=void 0,Un=!0)}/**
 * Set the global `qn` value to the number of seconds represented by the given minutes input.
 * @param {string|number} e - Minutes value (numeric or string) to parse and convert to seconds.
 */
function Nn(e){qn=60*parseFloat(e)}/**
 * Start a one-second countdown that updates the global `Pn` and invokes `gn` on each tick.
 *
 * Initializes `Pn` from `qn`, then decrements `Pn` every second and calls `gn()`. If `Pn` reaches
 * zero or the global `Un` flag becomes truthy, the interval is cleared and `Pn` is set to `false`.
 */
function Xn(){Pn=qn;const e=setInterval((()=>{Pn-=1,gn(),(Pn<=0||Un)&&(clearInterval(e),Pn=!1)}),1e3)}/**
 * Update the internal minimum marker with a candidate value and trigger the update handler.
 *
 * If `Cn` is truthy or `Mn` is already set and `e` is less than `Mn`, assigns `e` to `Mn`.
 * Always invokes `xn()` after the potential update.
 *
 * @param {number} e - Candidate numeric value (typically a timestamp or counter) to consider as the new minimum.
 */
function Hn(e){(Cn||Mn&&e<Mn)&&(Mn=e),xn()}/**
 * Set the internal Dn handler/value used to control the current action.
 * @param {*} e - The value or handler to assign to the internal `Dn` variable.
 */
function Jn(e){Dn=e}/**
 * Advance the internal action counter and enforce stop/resume conditions for the autopilot loop.
 *
 * Increments the global attempt counter. If a per-session limit is reached the autopilot is marked
 * paused and the session-finalization handler is invoked. If a daily (or aggregate) limit is reached
 * the autopilot is marked paused and the daily-finalization handlers are invoked. If no limits are
 * met, the routine for continuing normal iteration is called. In all cases, the progress/timing
 * updater is invoked after the decision.
 */
function Qn(){Tn+=1,Mn&&Mn<=Tn?(Un=!0,Fn()):$n&&Tn+In>=$n?(Un=!0,i(),hn()):xn(),Wn()}/**
 * Determine whether the current page matches the stored page key or a specific pathname, clearing the `Un` flag when it does not.
 *
 * @returns {boolean} `true` if `spwCurrentPageKey()` equals `_n` or `location.pathname` equals `Dn`, `false` otherwise (clears `Un` when returning `false`).
 */
function Kn(){return spwCurrentPageKey()==_n||(location.pathname==Dn||(Un=!1,!1))}/**
 * Check whether the current page key matches the predefined page key `_n`.
 * @returns {boolean} `true` if the current page key equals `_n`, `false` otherwise.
 */
function Yn(){return spwCurrentPageKey()==_n}const zn="autopilotActions";const Zn=e=>{switch(e.type){case"mass_follow":case"mass_like":case"mass_retweet":return e.url;case"mass_unfollow":case"mass_unlike":case"mass_unretweet":return!0;default:return!1}},ei=async()=>{const e=await async function(){return(await st([zn]))[zn]}();return Array.isArray(e)?e.filter(Zn):[]};/**
 * Retrieve the first element from an array produced by the internal async provider.
 *
 * @returns {any} The first element of the resolved array, or `undefined` if the array is empty.
 */
async function ti(){return(await ei())[0]}const ni=e=>`https://www.x.com${e}`;const ii="SuperpowersForTwitterAutopilotActionId";/**
 * Consume a session-stored identifier and resolve it to the corresponding record.
 *
 * Reads the string value stored at the session key represented by `ii`, removes that entry,
 * then looks up and returns the record whose `id` matches the consumed value.
 *
 * @returns {Object|undefined} The record whose `id` matches the consumed session value, or `undefined` if no session value existed or no matching record was found.
 */
async function oi(){const e=sessionStorage.getItem(ii);if("string"!=typeof e)return;sessionStorage.removeItem(ii);const t=await async function(e){return(await ei()).find((t=>t.id===e))}(e);return t}/**
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
function li(e){switch(sessionStorage.setItem(ii,e.id),e.type){case"mass_follow":case"mass_like":case"mass_retweet":location.href=e.url;break;case"mass_unfollow":location.href=function(e){return ni(`/${e}/following`)}(S());break;case"mass_unlike":location.href=function(e){return ni(`/${e}/likes`)}(S());break;case"mass_unretweet":location.href=function(e){return ni(`/${e}`)}(S())}}const ai=2;/**
 * Compute the current item count and apply the configured cap unless a gating check allows the full count.
 *
 * If the measured count is less than or equal to the configured limit, that count is returned.
 * When the measured count exceeds the configured limit, the gating check is evaluated:
 * - if the check passes, the measured count is returned;
 * - otherwise the configured limit is returned.
 *
 * @returns {number} The resulting count after applying the cap and gating logic.
 */
async function si(){const e=await async function(){return(await ei()).length}();if(e<=ai)return e;return Sn(await Ln())?e:ai}const ri=async(e,t)=>{try{return await E((()=>(t&&console.log(t),e())),9e3)}catch(e){return console.log(e),console.log("Skipping action ..."),void ki()}};const ci={autopilotPauseAfterActionMax:"",autopilotPauseAfterActionMin:"",autopilotRepeatAfter:60,autopilotRepeatAfterMax:60};/**
 * Get the application's root UI container.
 * @returns {HTMLElement} The root DOM element for the UI.
 */
function ui(){return rt(ci)}let wi,fi,di=!1;const mi=async()=>{sessionStorage.removeItem(t),wi=await ti(),di=!1;const e=await si();bn(wi.number,e),wn(),Rn(),li(wi)},pi=()=>{di=!0},yi=async()=>{const e=await ui();if(!e.autopilotRepeatAfter)return void pi();if(!Sn(await Ln()))return void pi();let t=((e,t)=>{let n=60*parseFloat(e);const i=60*parseFloat(t),o=[n];for(;n<i;)n+=60,o.push(n);return Ne(o)})(e.autopilotRepeatAfter,e.autopilotRepeatAfterMax);kn(t);const n=setInterval((()=>{di?clearInterval(n):(t-=1,kn(t),t<=0&&(clearInterval(n),mi()))}),1e3)},gi=async t=>{const i=await async function(e){const t=await ei(),i=n(),o=t.filter((t=>t.id==e||!i.includes(t.type))),l=o.map((e=>e.id)),a=l.indexOf(e);if(-1===a)return;return o[a+1]}(wi.id);if(i&&i.number<=t){if(await(async()=>{const{autopilotPauseAfterActionMin:t,autopilotPauseAfterActionMax:n}=await ui();if(!t)return;if(!n)return;let i=He(Xe(t,n));for(;i>0;){if(di)return;o=i,pn.style.display="initial",yn.style.display="none",mn.style.display="none",k(o),i-=100,await e(100)}var o})(),di)return;bn(i.number,t),li(i)}else await yi()};/**
 * Start the content bootstrap sequence and process the initial state.
 *
 * Marks the module as started, runs initial startup handlers, obtains the page's initial
 * state, and processes that state.
 * @returns {any} The value produced by processing the initial state.
 */
async function ki(){fi=!0,jn();const e=await si();gi(e)}/**
 * Orchestrates and executes a pending autopilot instruction by loading the next job, preparing runtime state, running precondition checks, dispatching the matching mass-action handler (follow, like, retweet, unfollow, unlike, or unretweet), and performing finalization or aborting when runtime guards trigger.
 */
async function bi(){if(wi=await oi(),wi){fi=!1;const e=await si();if(bn(wi.number,e),wn(),Rn(),await async function(e){switch(e.type){case"mass_follow":if(await ri((()=>ve()||xe()||de()),"Find Tweets, users or likes ..."),!hi())return;if(Fi())return;f(),await Ct(e.limit,e.idleTimeout);break;case"mass_like":if(await ri((()=>ve()||de()||Ee()||$e()),"Find Tweets or likes ..."),!hi())return;if(Fi())return;m(),await dt(e.limit,e.idleTimeout);break;case"mass_retweet":if(await ri((()=>ve()||Ee()),"Find Tweets ..."),!hi())return;if(Fi())return;p(),await ht(e.limit,e.idleTimeout);break;case"mass_unfollow":if(await ri((()=>xe()&&v()),"Find users ..."),!hi())return;if(Fi())return;d(),await Xt(e.limit,e.idleTimeout);break;case"mass_unlike":if(await ri((()=>de()&&T()),"Find likes ..."),!hi())return;if(Fi())return;g(),await zt(e.limit,e.idleTimeout);break;case"mass_unretweet":if(await ri((()=>Ee()&&_()),"Find Tweets ..."),!hi())return;if(Fi())return;y(),await an(e.limit,e.idleTimeout)}}(wi),di)return;if(fi)return;await gi(e)}}/**
 * Check whether the internal `fi` flag is enabled.
 * @returns {boolean} `true` if the internal `fi` value is strictly `true`, `false` otherwise.
 */
function Fi(){return!0===fi}/**
 * Check if a module reference is present while its disable flag is unset.
 *
 * @returns {boolean} `true` if `wi` is an object and `di` is `false`, `false` otherwise.
 */
function hi(){return"object"==typeof wi&&!1===di}dn.prepend(u),cn.append(dn,Ce,Dt,Ht,xt,mt,sn,Zt),ue("friendships/create.json",(({body:e,parsedResponse:t,status:n})=>{200!=n&&(it(e.match(/&user_id=(\d+)/)[1]),(e=>{if("object"!=typeof e)return;const t=e.errors;if(!Array.isArray(t))return;const n=t[0];return"object"==typeof n?162===n.code:void 0})(t)||(Xn(),hi()?(i(),jn()):Xn()))})),ue("favorites/create.json",(({status:e})=>{200!=e&&(hi()?(i(),jn()):Xn())})),ue("statuses/retweet.json",(({status:e})=>{200!=e&&(hi()?(i(),jn()):Xn())}));(async()=>{await bi(),setInterval((async()=>{hi()||Kn()||(await fn(),s())}),200)})()})()})();
