/**
 * @fileoverview Content script entry for Superpowers; handles autopilot
 * actions, timeline parsing, and UI prompts on x.com pages.
 */
(()=>{"use strict";(()=>{/**
 * Pause execution for the given duration.
 * @param {number} e - Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the specified delay.
 */
function e(e){return new Promise((t=>{console.log(`Sleeping ${e} ms ...`),setTimeout((()=>t()),e)}))}const t="SuperpowersForTwitterSuspendedAutopilotActionTypes";const n=()=>{const e=sessionStorage.getItem(t);return"string"!=typeof e?[]:JSON.parse(e)};/**
 * Appends the current autopilot action type to the session storage history.
 *
 * If the global `wi` object is defined, its `type` is appended to the array read from the module's sessionStorage key and the updated array is saved as JSON.
 */
function i(){if("object"!=typeof wi)return;const e=n().concat(wi.type);sessionStorage.setItem(t,JSON.stringify(e))}const o=[{title:"Superpowers for LinkedIn",text:"Mass connect, mass withdraw invitation and mass view profile on LinkedIn with powerful options.",action:{text:"Learn more",url:"https://www.clemensteichmann.com/superpowers-for-linkedin"}},{title:"Superpowers for Instagram",text:"Mass follow, mass unfollow and mass like on Instagram with powerful options.",action:{text:"Learn more",url:"https://www.clemensteichmann.com/superpowers-for-instagram"}},{title:"Superpowers for Twitter PRO",text:"Unlimited and ad-free",action:{text:"Get PRO",url:"https://www.clemensteichmann.com/superpowers-for-twitter/pro"}}],l=({text:e,title:t,action:n})=>`\n    <div class="sft-ad animated fadeInRight">\n      <div class="sft-ad__title">${t}</div>\n      <div class="sft-ad__text">${e}</div>\n      <a class="sft-ad__action" href="${n.url}" target="_blank">${n.text}</a>\n    </div>\n  `,a=document.createElement("div");/**
 * Hide the ad container inserted by the script.
 *
 * Sets the ad container's display style so the container is not visible.
 */
function s(){a.style.display="none"}/**
 * Populate the ad container with up to three randomly selected ads and show the container.
 *
 * Selects up to three unique items from the global ad array, renders each item using the
 * global renderer, assigns the concatenated HTML to the global container's innerHTML,
 * and sets the container's display to "flex".
 */
function r(){a.innerHTML=function(e,t){t=null==t?1:t;const n=null==e?0:e.length;if(!n||t<1)return[];t=t>n?n:t;let i=-1;const o=n-1,l=[...e];for(;++i<t;){const e=i+Math.floor(Math.random()*(o-i+1)),t=l[e];l[e]=l[i],l[i]=t}return l.slice(0,t)}(o,3).map((e=>l(e))).join(""),a.style.display="flex"}a.classList.add("sft-ads"),document.body.appendChild(a);const c=e=>{if(e<60)return String(e);const t=e/60/60,n=Math.floor(t),i=60*(t-n),o=Math.floor(i),l=60*(i-o),a=Math.round(l);let s;return n>0?(s=String(n),s+=":",s+=String(o).padStart(2,0)):s=String(o),s+=":",s+=String(a).padStart(2,0),s};const u=document.createElement("div");let w;/**
 * Set the module's current autopilot action type to "follow".
 */
function f(){w="follow"}/**
 * Set the current autopilot action to "unfollow".
 *
 * Updates the internal action type so subsequent autopilot operations perform unfollow actions.
 */
function d(){w="unfollow"}/**
 * Set the current autopilot action to "like".
 *
 * Updates the module-level action identifier so subsequent autopilot routines treat the active action as a like.
 */
function m(){w="like"}/**
 * Selects "retweet" as the active autopilot action.
 *
 * Sets the current autopilot action to retweet so subsequent workflows operate on retweet targets.
 */
function p(){w="retweet"}/**
 * Set the current autopilot action to "unretweet".
 */
function y(){w="unretweet"}/**
 * Set the current autopilot action to "unlike".
 *
 * Updates the module-level action selector so subsequent autopilot workflows operate on unlike actions.
 */
function g(){w="unlike"}/**
 * Update the autopilot status bar to show a continuing countdown with milliseconds.
 *
 * Formats the provided duration (in milliseconds) into a seconds string (using the file's time formatter for the integer seconds portion) plus a three-digit milliseconds suffix, and sets that text into the global status element.
 *
 * @param {number} e - Time remaining in milliseconds to display (integer).
 */
function k(e){u.innerHTML=`Continuing autopilot in ${function(e){const t=e%1e3;let n=c((e-t)/1e3);return n+=".",n+=String(t).padStart(3,0),n}(e)} ...`}/**
 * Safely accesses nested properties on an object following a sequence of keys.
 * @param {any} e - The initial object to traverse.
 * @param {...(string|number|symbol)} t - Sequence of property keys to follow.
 * @returns {any|undefined} The value at the nested path, or `undefined` if any key is missing.
 */
function b(e,...t){for(let n=0;n<t.length;n++)if(void 0===(e=e[t[n]]))return;return e}/**
 * Retrieve a property value from an object, throwing if the property is absent.
 * @param {Object} e - Object to read the property from.
 * @param {string} t - Property name to retrieve.
 * @returns {*} The value of the requested property.
 * @throws {string} If the property `t` does not exist on `e`.
 */
function F(e,t){if(Object.prototype.hasOwnProperty.call(e,t))return e[t];throw`${t} missing on ${JSON.stringify(e)}`}u.classList.add("sft-status-bar__label");let h;document.querySelectorAll("script").forEach((e=>{if(e.innerHTML.includes("__INITIAL_STATE__")){const t=/window.__INITIAL_STATE__=(.*);window.__META_DATA__/,n=e.innerHTML.match(t);h=JSON.parse(n[1])}}));const x=h.session,R=b(h,"entities","users","entities"),L=()=>F(x,"user_id");/**
 * Get the current session user's screen name.
 *
 * @returns {string} The current user's `screen_name`.
 * @throws {Error} If session user data or the `screen_name` property is missing.
 */
function S(){const e=R?F(R,L()):F(x,"user");return F(e,"screen_name")}/**
 * Determine whether the browser is on the current user's "following" page.
 * @returns {boolean} `true` if the current location path equals "/{currentUser}/following" (case-insensitive), `false` otherwise.
 */
function v(){return location.pathname.toUpperCase()==`/${S()}/following`.toUpperCase()}/**
 * Determine whether the current page is the signed-in user's Likes page.
 *
 * @returns {boolean} `true` if the location pathname equals "/<username>/likes" for the current user, `false` otherwise.
 */
function T(){return location.pathname.toUpperCase()==`/${S()}/likes`.toUpperCase()}/**
 * Determines whether the current location pathname matches the signed-in user's main profile path.
 * @returns {boolean} `true` if the pathname equals `/<username>` for the current session user (case-insensitive), `false` otherwise.
 */
function _(){return location.pathname.toUpperCase()==`/${S()}`.toUpperCase()}/**
 * Detects whether the current page is a lists page based on the URL path.
 * @returns {boolean} `true` if the current location pathname contains "/lists/", `false` otherwise.
 */
function $(){return location.pathname.includes("/lists/")}/**
 * Extracts tweet-like entries from a Twitter timeline response payload.
 *
 * Scans known timeline instruction locations in the provided GraphQL/renderer payload and returns an array of tweet result objects found within timeline entries.
 *
 * @param {object} e - Response payload object that may contain timeline instructions.
 * @returns {Array<object>|undefined} An array of tweet result objects when found; `undefined` if no timeline instructions are present.
 */
function M(e){const t=b(e,"data","list","tweets_timeline","timeline","instructions")||b(e,"data","user","result","timeline","timeline","instructions")||b(e,"data","user","result","timeline_v2","timeline","instructions")||b(e,"data","community","community_timeline","timeline","instructions")||b(e,"data","topic_by_rest_id","topic_page","body","timeline","instructions")||b(e,"data","home","home_timeline_urt","instructions")||b(e,"data","search_by_raw_query","search_timeline","timeline","instructions");if(!t)return;const n=[];return t.forEach((e=>{"TimelineAddEntries"==e.type&&e.entries.forEach((e=>{const t=b(e,"content","itemContent","tweet_results","result");if("object"!=typeof t)return;let i;i="TweetWithVisibilityResults"===t.__typename?t.tweet:t,"object"==typeof i&&n.push(i)}))})),n}const I=(e,t,n,i)=>{const o=e();if(o)n(o);else{if("number"==typeof t){if(t<=0)return void i("time limit exceeded");t-=100}setTimeout((()=>I(e,t,n,i)),100)}};/**
 * Adapt a callback-style operation into a Promise.
 * @param {Function} e - Primary operation function supplied to the runner.
 * @param {*} t - Configuration or context forwarded to the runner.
 * @returns {*} The resolved value from the operation on success; the rejection reason on failure.
 */
function E(e,t){return new Promise(((n,i)=>{I(e,t,n,i)}))}let A;const C=async({fromIndex:t=0,getList:n,getFocusableEl:i})=>{if(!Un){Gn(),console.log("Scan list for usable index ...");for(let e=t;e<n().length;e++){if(i(n()[e]))return e}return window.scrollBy(0,300),await e(500),await C({fromIndex:t,getList:n,getFocusableEl:i})}},D=async({callback:e,getList:t,getFocusableEl:n,index:i})=>{if(Un)return;if(Gn(),Pn)return void await q({callback:e,getList:t,getFocusableEl:n,index:i,milliseconds:500});if(void 0===t())return;const o=t()[i];if(void 0===o)await q({callback:e,getList:t,getFocusableEl:n,index:i,milliseconds:100});else{try{o.focusableEl=await E((()=>n(o)),2e3),A=window.scrollY}catch(o){console.log(o),A&&window.scrollTo(0,A);const l=await C({fromIndex:i+1,getList:t,getFocusableEl:n});return void await D({callback:e,getList:t,getFocusableEl:n,index:l})}o.focusableEl.focus(),await e(o,i),await D({callback:e,getList:t,getFocusableEl:n,index:i+1})}},q=async({callback:t,getList:n,getFocusableEl:i,index:o,milliseconds:l})=>{await e(l),await D({callback:t,getList:n,getFocusableEl:i,index:o})};/**
 * Orchestrates traversal of a focusable list and invokes a callback for each focused item.
 * @param {Object} args - Function arguments.
 * @param {Function} args.callback - Called for each item once its focusable element is obtained; receives the focused element and its index.
 * @param {Function} args.getFocusableEl - Returns the focusable element for a given list item or index.
 * @param {Function} args.getList - Returns the current list of items to traverse.
 */
async function U({callback:e,getFocusableEl:t,getList:n}){A=void 0;const i=await C({getList:n,getFocusableEl:t});await D({callback:e,getList:n,getFocusableEl:t,index:i})}const P=e=>F(e.core,"screen_name");/**
 * Get a user's follower count from a user object.
 * @param {Object} e - User object with a `legacy.followers_count` numeric field.
 * @returns {number} The value of `e.legacy.followers_count`.
 */
function j(e){return e.legacy.followers_count}/**
 * Determine whether the subject represented by the relationship object follows the current session user.
 * @param {Object} e - Relationship object containing a `relationship_perspectives` field.
 * @param {number|boolean} [e.relationship_perspectives.followed_by] - Indicator (1 or truthy) that the subject follows the current user.
 * @returns {boolean} `true` if the subject follows the current session user, `false` otherwise.
 */
function B(e){return 1==e.relationship_perspectives.followed_by}/**
 * Compute the followers-to-following ratio for a user object.
 * @param {object} e - User entity expected to contain a `legacy` object with `followers_count` and `friends_count`.
 * @returns {number|undefined} The followers-to-following ratio (followers_count divided by friends_count), or `undefined` if either count is missing or not a number.
 */
function W(e){const t=e.legacy.followers_count;if("number"!=typeof t)return;const n=e.legacy.friends_count;return"number"==typeof n?t/n:void 0}/**
 * Get the user's following count from their legacy profile data.
 * @param {Object} e - User object containing a `legacy` field with profile metrics.
 * @returns {number} The number of accounts the user is following (legacy `friends_count`).
 */
function O(e){return e.legacy.friends_count}/**
 * Retrieve the `rest_id` property from the given entity.
 * @param {object} e - Object expected to contain a `rest_id` property (e.g., tweet or user payload).
 * @returns {string} The value of the `rest_id` property.
 * @throws {Error} If the `rest_id` property is missing on the provided object.
 */
function V(e){return F(e,"rest_id")}/**
 * Determines whether a user profile is protected.
 * @param {Object} e - User object containing privacy information (expects `e.privacy.protected`).
 * @returns {boolean} `true` if the user's profile is protected, `false` otherwise.
 */
function G(e){return 1==e.privacy.protected}/**
 * Determines whether the given entity is verified by Twitter Blue.
 * @param {Object} e - User/account object expected to include the `is_blue_verified` property.
 * @returns {boolean} `true` if `e.is_blue_verified` is 1, `false` otherwise.
 */
function N(e){return 1==e.is_blue_verified}/**
 * Retrieve the legacy `description` value from the provided entity object.
 * @param {Object} e - Object expected to have a `legacy` property containing a `description`.
 * @returns {string} The legacy `description` value.
 * @throws {Error} If the `legacy.description` property is missing.
 */
function X(e){return F(e.legacy,"description")}/**
 * Constructs a path string by prefixing the entity identifier with a leading slash.
 * @param {Object} e - Entity object from which the identifier will be taken.
 * @returns {string} The path string starting with '/' followed by the entity identifier.
 */
function H(e){return`/${P(e)}`}const J=e=>F(e,"rest_id");/**
 * Retrieve the language code from an object's legacy field.
 * @param {Object} e - Object expected to have a `legacy` property containing metadata.
 * @returns {string|undefined} The language code found at `e.legacy.lang`, or `undefined` if not present.
 */
function Q(e){return F(e.legacy,"lang")}/**
 * Get the tweet's favorite (like) count from its legacy payload.
 * @param {object} e - Tweet object containing a `legacy` field.
 * @returns {number} The favorite (like) count.
 */
function K(e){return F(e.legacy,"favorite_count")}/**
 * Determines whether a tweet object is favorited (liked).
 * @param {Object} e - Tweet object containing a `legacy.favorited` boolean flag.
 * @returns {boolean} `true` if the tweet is favorited (liked), `false` otherwise.
 */
function Y(e){return 1==e.legacy.favorited}/**
 * Check whether the given tweet object represents a reply by having a legacy.in_reply_to_status_id_str property.
 * @param {object} e - Tweet-like object that may contain a `legacy` field.
 * @returns {boolean} `true` if the tweet is a reply (has a `legacy.in_reply_to_status_id_str`), `false` otherwise.
 */
function z(e){return"string"==typeof e.legacy.in_reply_to_status_id_str}/**
 * Determine whether a tweet payload includes a legacy `retweeted_status_result` object.
 * @param {Object} e - Tweet-like payload to inspect.
 * @returns {boolean} `true` if `e.legacy.retweeted_status_result` is an object, `false` otherwise.
 */
function Z(e){return"object"==typeof e.legacy.retweeted_status_result}/**
 * Check whether the tweet contains a quoted status id.
 * @param {object} e - Tweet-like object expected to have a `legacy` property.
 * @returns {boolean} `true` if `e.legacy.quoted_status_id_str` is a string, `false` otherwise.
 */
function ee(e){return"string"==typeof e.legacy.quoted_status_id_str}/**
 * Determines whether the tweet has been retweeted by the current user.
 * @param {object} e - Tweet object containing a `legacy` property.
 * @returns {boolean} `true` if `e.legacy.retweeted` is `1`, `false` otherwise.
 */
function te(e){return 1==e.legacy.retweeted}/**
 * Get the REST id of a retweeted status from a tweet-like object.
 *
 * @param {Object} e - The tweet-like object to extract the id from.
 * @returns {string|undefined} The `rest_id` of the retweeted status when present; otherwise the input object's `rest_id`, or `undefined` if none found.
 */
function ne(e){return b(e.legacy,"retweeted_status_result","result","rest_id")||J(e)}/**
 * Retrieve the tweet's full text from its legacy payload.
 * @param {object} e - Tweet-like object containing a `legacy.full_text` property.
 * @returns {string} The value of `e.legacy.full_text`.
 */
function ie(e){return e.legacy.full_text}const oe=e=>e.core.user_results.result;/**
 * Derives the canonical user identifier from the provided entity.
 * @param {*} e - A user-related entity (user object, tweet-like object, DOM element, or identifier) to derive the identifier from.
 * @returns {string|undefined} The canonical user identifier if one can be derived, otherwise `undefined`.
 */
function le(e){return V(oe(e))}/**
 * Locate the tweet's status link element within the DOM.
 *
 * Builds a selector for an anchor whose href ends with `/status/{tweetId}` inside a `[data-testid="tweet"]` container and returns the matched element.
 * @param {Object|string} e - A tweet object or tweet id used to derive the status id.
 * @returns {Element|null} The anchor element for the tweet's status link if found, otherwise `null`.
 */
function ae(e){const t=`[data-testid="tweet"] a[href$="/status/${ne(e)}"][role="link"]`;return console.log(`Querying tweet link with ${t}`),document.querySelector(t)}/**
 * Get the tweet's container element associated with a focusable item.
 * @param {{focusableEl: Element}} e - Object containing a focusable element inside a tweet wrapper.
 * @returns {Element|null} The tweet element's last child element (often the action/controls or content container), or `null` if the tweet wrapper is not found.
 */
function se(e){return e.focusableEl.closest('[data-testid="tweet"]').lastElementChild}window.addEventListener("message",(e=>{e.data.origin&&"string"==typeof e.data.response&&e.data.url&&e.data.status&&we(e.data)}));const re=document.createElement("script");re.type="text/javascript",re.src=chrome.runtime.getURL("app.js"),document.documentElement.appendChild(re);const ce={};/**
 * Register a callback for the given event key.
 *
 * Stores the callback in the internal `ce` map under the provided key, creating an array if needed.
 * @param {string} e - Event key or name used to group callbacks.
 * @param {Function} t - Callback to invoke for the event.
 */
function ue(e,t){ce[e]=ce[e]||[],ce[e].push(t)}const we=({body:e,origin:t,response:n,status:i,url:o})=>{Object.keys(ce).forEach((l=>{if(!o.includes(l))return;let a={};if(n.length>0)try{a=JSON.parse(n)}catch(e){console.error(e)}ce[l].forEach((n=>n({body:e,origin:t,parsedResponse:a,status:i,url:o})))}))},fe={};ue("/Likes",(({origin:e,parsedResponse:t})=>((e,t)=>{!1!==Array.isArray(t)&&0!==t.length&&(fe[e]?fe[e]=fe[e].concat(t):fe[e]=t)})(e,M(t))));const de=()=>fe[location.href.toUpperCase()];/**
 * Execute a single autopilot scan that focuses timeline items and invokes the provided callback for each focusable element.
 * @param {function} e - Callback invoked for each focusable element; receives the focused element as its sole argument.
 */
async function me(e){await U({callback:e,getFocusableEl:ae,getList:de})}/**
 * Finds the follow button element for the given entity on the page.
 * @param {Object} e - Entity used to derive the button's data-testid (must be compatible with the page-specific id extractor).
 * @returns {Element|null} The matched follow button element, or `null` if not found.
 */
function pe(e){const t=`[data-testid="${V(e)}-follow"]`;return console.log(`Querying follow button of ${P(e)} with ${t}`),document.querySelector(t)}/**
 * Finds the profile link anchor element for a given user within the page DOM.
 * @param {Object|string} e - User object or username string used to derive the user's profile URL.
 * @returns {Element|null} The anchor element pointing to the user's profile if found, `null` otherwise.
 */
function ye(e){const t=`[data-testid="cellInnerDiv"] a[href="${H(e)}"][role="link"]`,n=`[data-testid="UserCell"] a[href="${H(e)}"][role="link"]`;return console.log(`Querying profile link of ${P(e)} with ${t}`),document.querySelector(t)||document.querySelector(n)}/**
 * Finds the profile anchor element for a given user inside the currently open modal user cell.
 * @param {Object} e - User object used to derive the profile href.
 * @returns {Element|null} The matching anchor element if found, or `null` if not present.
 */
function ge(e){const t=`[aria-modal="true"] [data-testid="UserCell"] a[href="${H(e)}"][role="link"]:not([dir])`;return console.log(`Querying profile link of ${P(e)} with ${t}`),document.querySelector(t)}/**
 * Find the nearest ancestor UserCell element for a focusable item.
 * @param {{focusableEl: Element}} e - Object containing the focusable element.
 * @returns {Element|null} The closest ancestor matching '[data-testid="UserCell"]', or null if none.
 */
function ke(e){return e.focusableEl.closest('[data-testid="UserCell"]')}const be={},Fe=(e,t)=>{if(!t)return;if(0==t.length)return;void 0===be[e]&&(be[e]=[]);const n=be[e].map((e=>V(e)));t.forEach((t=>{n.includes(V(t))||be[e].push(t)}))},he=(e,t)=>{const n=b(t,"data","user","followers_timeline","timeline","instructions")||b(t,"data","favoriters_timeline","timeline","instructions")||b(t,"data","user","following_timeline","timeline","instructions")||b(t,"data","user","result","timeline","timeline","instructions")||b(t,"data","list","members_timeline","timeline","instructions")||b(t,"data","list","subscribers_timeline","timeline","instructions")||b(t,"data","retweeters_timeline","timeline","instructions")||b(t,"data","search_by_raw_query","search_timeline","timeline","instructions");if(!n)return;const i=[];return n.forEach((t=>{"TimelineAddEntries"==t.type?t.entries.forEach((e=>{const t=b(e,"content","itemContent","user_results","result");"object"==typeof t&&i.push(t)})):"TimelineClearCache"==t.type&&(be[e]=void 0)})),i};ue("/lists/members.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("/lists/subscribers.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("followers/list.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("friends/list.json",(({origin:e,parsedResponse:t})=>Fe(e,t.users))),ue("/Favoriters",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/Followers",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/Following",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/ListMembers",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/ListSubscribers",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("/Retweeters",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t)))),ue("i/api/graphql",(({origin:e,parsedResponse:t})=>Fe(e,he(e,t))));const xe=()=>be[location.href.toUpperCase()];/**
 * Traverse the active list and invoke a callback for each focusable item.
 * 
 * @param {function} e - Callback to run for each focused item; receives the focused element or item context.
 * @param {function} [t=ye] - Function that, given an item, returns its focusable element.
 */
async function Re(e,t=ye){await U({callback:e,getFocusableEl:t,getList:xe})}const Le={},Se=(e,t)=>{if(!1===Array.isArray(t))return;if(0===t.length)return;Kn()&&(e=_n.toUpperCase()),void 0===Le[e]&&(Le[e]=[]);const n=Le[e].map((e=>J(e)));t.forEach((t=>{n.includes(J(t))||Le[e].push(t)}))};ue("/ListLatestTweetsTimeline",(({origin:e,parsedResponse:t})=>Se(e,M(t)))),ue("/CommunityTweetsTimeline",(({origin:e,parsedResponse:t})=>Se(e,M(t)))),ue("/TopicLandingPage",(({origin:e,parsedResponse:t})=>Se(e,M(t)))),ue("i/api/graphql",(({origin:e,parsedResponse:t})=>Se(e,M(t))));const ve=()=>Le[location.href.toUpperCase()];/**
 * Scan the current timeline or list, focus each focusable item, and invoke the provided callback for each focused element.
 * @param {Function} e - Callback invoked for each focused item; may be async and can perform actions using the focused element.
 */
async function Te(e){await U({callback:e,getFocusableEl:ae,getList:ve})}const _e={};ue("/HomeTimeline",(({origin:e,parsedResponse:t})=>((e,t)=>{if(!1===Array.isArray(t))return;if(0===t.length)return;Kn()&&(e=_n.toUpperCase()),void 0===_e[e]&&(_e[e]=[]);const n=_e[e].map((e=>J(e)));t.forEach((t=>{n.includes(J(t))||_e[e].push(t)}))})(e,M(t))));const $e=()=>_e[location.href.toUpperCase()];/**
 * Traverse focusable items in the current list and run the provided callback for each.
 * @param {Function} e - Callback invoked for each focusable item during traversal.
 * @returns {Promise<void>} Resolves when the traversal and all callbacks have completed.
 */
async function Me(e){await U({callback:e,getFocusableEl:ae,getList:$e})}const Ie={};ue("/UserTweets",(({origin:e,parsedResponse:t})=>((e,t)=>{if(!1===Array.isArray(t))return;if(0===t.length)return;void 0===Ie[e]&&(Ie[e]=[]);const n=Ie[e].map((e=>J(e)));t.forEach((t=>{n.includes(J(t))||Ie[e].push(t)}))})(e,M(t))));const Ee=()=>Ie[location.href.toUpperCase()];/**
 * Start a focused scan of the current list and invoke the provided callback for each focusable element.
 * @param {Function} e - Callback invoked for each focused element; receives the focused element (or related context) as its argument.
 */
async function Ae(e){await U({callback:e,getFocusableEl:ae,getList:Ee})}const Ce=document.createElement("div");Ce.innerText="Autopilot",Ce.setAttribute("role","button"),Ce.classList.add("sft-button","sft-button--autopilot");const De=()=>{Ce.style.display="none"};/**
 * Ensure the Autopilot control is shown on the home timeline when the page is "/home", a session object is available, and Autopilot is not already active; otherwise hide or disable the Autopilot UI.
 */
async function qe(){"/home"==location.pathname&&!xe()&&await async function(){return"object"==typeof await ti()}()?Ce.style.display="initial":De()}Ce.addEventListener("click",(()=>{De(),mi()}));const Ue=window.indexedDB.open("MassFollowForTwitter",8);let Pe;/**
 * Adds a record to the given IndexedDB object store using a readwrite transaction.
 * @param {string} e - The name of the object store to write to.
 * @param {any} t - The record to add to the object store.
 */
function je(e,t){Pe.transaction([e],"readwrite").objectStore(e).add(t)}/**
 * Retrieve a record by key from an IndexedDB object store if the store exists.
 * @param {string} e - The name of the object store.
 * @param {IDBValidKey|Array} t - The key of the record to retrieve.
 * @returns {*} The value stored for the given key, or `undefined` if the record is not found or the object store does not exist.
 */
function Be(e,t){return new Promise((n=>{if(!Pe.objectStoreNames.contains(e))return void n(void 0);const i=Pe.transaction([e]).objectStore(e).get(t);i.onsuccess=()=>{n(i.result)}}))}Ue.onupgradeneeded=e=>{Pe=e.target.result,e.oldVersion<3&&Pe.createObjectStore("v2FollowRecord",{keyPath:["creatorId","userId"]}),e.oldVersion<4&&Pe.createObjectStore("retweetRecord",{keyPath:["creatorId","retweetedStatusId"]}),e.oldVersion<5&&Pe.createObjectStore("likeRecord",{keyPath:["creatorId","tweetId"]}),e.oldVersion<6&&Ue.transaction.objectStore("likeRecord").createIndex("tweetUserId","tweetUserId"),e.oldVersion<8&&Ue.transaction.objectStore("v2FollowRecord").createIndex("createdAt",["creatorId","createdAt"])},Ue.onerror=e=>{console.log(e)},Ue.onsuccess=e=>{Pe=e.target.result};const We="likeRecord";/**
 * Get the number of records in the `We` object store whose `tweetUserId` index matches the provided key.
 *
 * @param {*} e - Value converted by `le` to the key used for the `tweetUserId` index (commonly a tweet id or an object containing a tweet id).
 * @returns {number} The count of matching records in the index.
 */
function Oe(e){return function(e,t,n){return new Promise((i=>{const o=Pe.transaction([e],"readonly").objectStore(e).index(t).count(IDBKeyRange.only(n));o.onsuccess=()=>{i(o.result)}}))}(We,"tweetUserId",le(e))}/**
 * Parse a comma-separated string into an array of trimmed values.
 * @param {string} e - Comma-separated input; may contain surrounding whitespace.
 * @returns {string[]|undefined} An array of trimmed entries when input contains text, `undefined` when input is empty or only whitespace.
 */
function Ve(e){if(!(e=>0===e.trim().length)(e))return e.split(",").map((e=>e.trim()))}/**
 * Check if the identifier extracted from `e` exists in the array `t`.
 *
 * @param {*} e - Input value from which an identifier is derived.
 * @param {Array} t - Array of identifiers to check against.
 * @returns {boolean} `true` if the extracted identifier is present in `t`, `false` otherwise.
 */
function Ge(e,t){return t.includes(Q(e))}/**
 * Selects a random element from an array.
 * @param {Array} e - The array to select from.
 * @returns {*} A randomly chosen element from `e`, or `undefined` if `e` is empty.
 */
function Ne(e){return e[Math.floor(Math.random()*e.length)]}/**
 * Produce an array of millisecond timestamps from a start to an end value at 100ms increments.
 *
 * @param {string|number} e - Start time in seconds (may be a numeric string); fractional seconds allowed.
 * @param {string|number} t - End time in seconds (may be a numeric string); fractional seconds allowed.
 * @returns {number[]} An array of timestamps in milliseconds beginning with the parsed start time and increasing by 100ms up to (and including the first value >= end time).
function Xe(e,t){let n=1e3*parseFloat(e);const i=1e3*parseFloat(t),o=[n];for(;n<i;)n+=100,o.push(n);return o}function He(e){return Ne(e)}let Je;const Qe=()=>{try{Je.scrollIntoView({block:"center"})}catch(e){console.error(e)}},Ke=(e,t)=>{const n=document.createElement("div");n.classList.add("sft-notification",`sft-notification--${t}`),n.textContent=e;try{Je.appendChild(n)}catch(e){console.error(e)}Qe()};/**
 * Display a success notification with the provided text.
 * @param {string} e - Message text to display in the success notification.
 */
function Ye(e){console.log(e),Ke(e,"success")}/**
 * Display a warning message to the user and log it to the console.
 * @param {string} e - Warning text to show.
 */
function ze(e){console.log(e),Ke(e,"warning")}/**
 * Set the global notification container element.
 * @param {HTMLElement | null} e - The DOM element to use as the notification container, or `null` to clear it.
 */
function Ze(e){Je=e}/**
 * Perform the element-level action for a tweet target and show a notification.
 *
 * @param {string|Element} e - Tweet identifier or DOM element used to locate the target tweet.
 * @param {string} t - Message to display in the notification.
 */
function et(e,t){Ze(se(e)),ze(t)}/**
 * Focuses the tweet identified by `e` and displays `t` in the notification area.
 * @param {Element|string} e - Tweet element or tweet identifier used to locate the focusable tweet wrapper.
 * @param {string} t - Message text to show in the notification area.
 */
function tt(e,t){Ze(se(e)),Ye(t)}const nt="v2FollowRecord";/**
 * Delete a record from the `nt` IndexedDB object store using the current user id and the provided key.
 * @param {*} e - The secondary key value to delete; combined with the current user id (from `L()`) to form the compound key.
 */
function it(e){return function(e,t){Pe.transaction([e],"readwrite").objectStore(e).delete(t)}(nt,[L(),e])}/**
 * Create a mapping between the current session user and the target derived from the input.
 *
 * @param {*} e - Target entity (user object, tweet, or identifier) from which the target identifier is extracted.
 * @returns {*} A mapped result combining the current session user and the target identifier derived from `e`.
 */
function ot(e){return Be(nt,[L(),V(e)])}/**
 * Retrieve the stored follow record for a given user identifier or user object.
 * @param {string|object} e - A user id string or a user object containing an identifier.
 * @returns {object|undefined} The follow record for the specified user if present, `undefined` otherwise.
 */
function lt(e){return Be("followRecord",V(e))}/**
 * Create a case-insensitive RegExp that matches any term from a comma-separated list.
 * @param {string} e - Comma-separated terms; whitespace around terms is ignored.
 * @returns {RegExp|undefined} `RegExp` that matches any listed term (case-insensitive); `undefined` if `e` is empty or contains no terms.
 */
function at(e){if(0===e.length)return;const t=e.split(",").map((e=>e.trim())).filter((e=>e.length));return new RegExp(t.join("|"),"i")}/**
 * Retrieve values for the specified keys from chrome.storage.sync and chrome.storage.local, merging results.
 * @param {string|string[]|Object} e - Key, list of keys, or default object accepted by chrome.storage.get.
 * @returns {Promise<Object>} An object mapping keys to values where entries from chrome.storage.local override those from chrome.storage.sync.
 */
function st(e){return new Promise((t=>{chrome.storage.sync.get(e,(n=>{chrome.storage.local.get(e,(e=>{const i={...n,...e};t(i)}))}))}))}/**
 * Merge provided defaults with stored values for the same keys, preferring stored values.
 * @param {Object.<string,*>} e - Object whose keys are used to read stored values; values act as defaults.
 * @returns {Object.<string,*>} An object containing the same keys with values taken from storage when present, otherwise the originals from `e`.
 */
async function rt(e){const t=Object.keys(e),n=await st(t);return{...e,...n}}const ct={likeMaxFollowers:"",likeMaxFollowersFollowingRatio:"",likeMaxFollowing:"",likeMaxTweetLikes:"",likeMinFollowers:"",likeMinFollowing:"",likeMinFollowersFollowingRatio:"",likeMinTweetLikes:"",likeIntervalMax:8,likeIntervalMin:4,likeLanguageWhitelist:"",likeLimit:1e3,likePauseWhenUnableToLike:10,likeSkipFollowed:!1,likeSkipReplies:!1,likeSkipRetweets:!1,likeSkipRetweetsWithComment:!1,likeSkipLikedXTweetsFromUser:"",likeTweetTextBlacklist:""},ut=()=>rt(ct),wt=async()=>{const e=await ut();return e.languageWhitelist=Ve(e.likeLanguageWhitelist),e.intervalDurationRange=Xe(e.likeIntervalMin,e.likeIntervalMax),e.skipLikedXTweetsFromUser=parseInt(e.likeSkipLikedXTweetsFromUser),e.tweetTextBlacklist=at(e.likeTweetTextBlacklist),e.maxFollowing=parseInt(e.likeMaxFollowing),e.minFollowing=parseInt(e.likeMinFollowing),e.maxFollowers=parseInt(e.likeMaxFollowers),e.minFollowers=parseInt(e.likeMinFollowers),e.maxFollowersFollowingRatio=parseFloat(e.likeMaxFollowersFollowingRatio),e.minFollowersFollowingRatio=parseFloat(e.likeMinFollowersFollowingRatio),e.maxTweetLikes=parseInt(e.likeMaxTweetLikes),e.minTweetLikes=parseInt(e.likeMinTweetLikes),e},ft=async(e,t)=>{const n=await async function(e,t){if(Y(e))return"already liked";if(t.minTweetLikes){const n=K(e);if(n<t.minTweetLikes)return`${n} Tweet likes, but ${t.minTweetLikes} minimum required`}if(t.maxTweetLikes){const n=K(e);if(n>t.maxTweetLikes)return`${n} Tweet likes, but ${t.maxTweetLikes} maximum required`}if(t.languageWhitelist&&!Ge(e,t.languageWhitelist))return`language "${Q(e)}" not whitelisted`;if(t.tweetTextBlacklist instanceof RegExp&&ie(e)){const n=ie(e).match(t.tweetTextBlacklist);if(n)return`${n.join()} found in Tweet text, but is blacklisted`}if(t.likeSkipReplies&&z(e))return"is reply";if(t.likeSkipRetweets&&Z(e))return"is Retweet";if(t.likeSkipRetweetsWithComment&&ee(e))return"is Retweet with comment";if(t.minFollowing){const n=O(oe(e));if("number"==typeof n&&n<t.minFollowing)return`${n} following, but ${t.minFollowing} minimum required`}if(t.maxFollowing){const n=O(oe(e));if("number"==typeof n&&n>t.maxFollowing)return`${n} following, but ${t.maxFollowing} maximum required`}if(t.minFollowers){const n=j(oe(e));if("number"==typeof n&&n<t.minFollowers)return`${n} followers, but ${t.minFollowers} minimum required`}if(t.maxFollowers){const n=j(oe(e));if("number"==typeof n&&n>t.maxFollowers)return`${n} followers, but ${t.maxFollowers} maximum required`}if(t.minFollowersFollowingRatio){const n=W(oe(e));if(n&&n<t.minFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.minFollowersFollowingRatio} minimum required`}if(t.maxFollowersFollowingRatio){const n=W(oe(e));if(n&&n>=t.maxFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.maxFollowersFollowingRatio} maximum required`}if(t.likeSkipFollowed){const t=oe(e);if(await ot(t))return"already followed once";if(await lt(t))return"already followed once"}if(t.skipLikedXTweetsFromUser){const n=await Oe(e);if("number"==typeof n&&n>=t.skipLikedXTweetsFromUser)return`already liked ${n} Tweet(s) from user`}return!0}(e,t);if(1==n){const n=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="like"]')}(e);if(!n)return!1;n.click(),function(e){const t={createdAt:Date.now(),creatorId:L(),tweetId:J(e),tweetUserId:le(e)};je(We,t)}(e),Qn(),tt(e,"successfully liked");const i=He(t.intervalDurationRange);await Vn(i),Qe()}else n&&et(e,n)};/**
 * Start the bulk "like" autopilot using the stored configuration, optionally overriding limits and pause settings.
 *
 * Prepares and normalizes the like configuration, applies the provided overrides, removes filters that are not
 * applicable to the current page context, and then kicks off the appropriate traversal to perform likes.
 *
 * @param {?number} e - Optional like limit to override the stored configuration.
 * @param {?number|object} t - Optional pause/delay override (type may be a number or settings object) used while liking.
 */
async function dt(e,t){const n=await wt();await Bn(),n.likeLimit&&Hn(n.likeLimit),e&&Hn(e),t&&On(t),Nn(n.likePauseWhenUnableToLike),ve()?await Te((async e=>{await ft(e,n)})):$e()?(delete n.likeSkipFollowed,delete n.likeSkipLikedXTweetsFromUser,delete n.maxFollowing,delete n.minFollowing,delete n.maxFollowers,delete n.minFollowers,delete n.maxFollowersFollowingRatio,delete n.minFollowersFollowingRatio,await Me((async e=>{await ft(e,n)}))):de()?await me((async e=>{await ft(e,n)})):Ee()&&(delete n.maxFollowing,delete n.minFollowing,delete n.maxFollowers,delete n.minFollowers,delete n.maxFollowersFollowingRatio,delete n.minFollowersFollowingRatio,await Ae((async e=>{await ft(e,n)})))}const mt=document.createElement("div");mt.innerText="Like all",mt.setAttribute("role","button"),mt.classList.add("sft-button","sft-button--like");const pt=()=>{mt.style.display="none"};mt.addEventListener("click",(async()=>{m(),De(),qt(),Rt(),pt(),await dt()}));const yt="retweetRecord";const gt={retweetIntervalMax:8,retweetIntervalMin:4,retweetLanguageWhitelist:"",retweetLimit:1e3,retweetPauseWhenUnableToRetweet:10,retweetSkipFollowed:!1,retweetSkipReplies:!1,retweetSkipRetweets:!1,retweetSkipRetweetsWithComment:!1,retweetTweetTextBlacklist:""},kt=()=>rt(gt),bt=async()=>{const e=await kt();return e.languageWhitelist=Ve(e.retweetLanguageWhitelist),e.intervalDurationRange=Xe(e.retweetIntervalMin,e.retweetIntervalMax),e.tweetTextBlacklist=at(e.retweetTweetTextBlacklist),e},Ft=async(e,t)=>{const n=await async function(e,t){if(te(e))return"already retweeted";if(t.languageWhitelist&&!Ge(e,t.languageWhitelist))return`language "${Q(e)}" not whitelisted`;if(t.tweetTextBlacklist instanceof RegExp&&ie(e)){const n=ie(e).match(t.tweetTextBlacklist);if(n)return`${n.join()} found in Tweet text, but is blacklisted`}if(t.retweetSkipFollowed){const t=oe(e);if(await ot(t))return"already followed once";if(await lt(t))return"already followed once"}return t.retweetSkipReplies&&z(e)?"is reply":t.retweetSkipRetweets&&Z(e)?"is Retweet":!t.retweetSkipRetweetsWithComment||!ee(e)||"is Retweet with comment"}(e,t);if(1==n){const n=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="retweet"]')}(e);if(!n)return!1;Jn("/compose/tweet"),n.click();(await E((()=>document.querySelector('div[data-testid="retweetConfirm"]')||document.querySelector('[aria-modal="true"] [data-testid="toolBar"] [data-testid="tweetButton"]')),9999)).click(),function(e){const t=ne(e),n={createdAt:Date.now(),creatorId:L(),retweetedStatusId:t};je(yt,n)}(e),Qn(),tt(e,"successfully retweeted");const i=He(t.intervalDurationRange);await Vn(i),Qe()}else n&&et(e,n)};/**
 * Start the mass-retweet autopilot using stored configuration and optional overrides.
 *
 * Reads the saved retweet configuration, applies the configured and any provided overrides (limit and pause settings), and then runs the appropriate retweet workflow for the current page context.
 *
 * @param {number} [limit] - Optional override for the maximum number of retweets to perform.
 * @param {*} [pauseConfig] - Optional pause/delay configuration to apply before or between retweet actions.
 */
async function ht(e,t){const n=await bt();await Bn(),n.retweetLimit&&Hn(n.retweetLimit),e&&Hn(e),t&&On(t),Nn(n.retweetPauseWhenUnableToRetweet),ve()?await Te((async e=>{await Ft(e,n)})):$e()?(delete n.retweetSkipFollowed,await Me((async e=>{await Ft(e,n)}))):Ee()&&await Ae((async e=>{await Ft(e,n)}))}const xt=document.createElement("div");xt.innerText="Retweet all",xt.setAttribute("role","button"),xt.classList.add("sft-button","sft-button--retweet");const Rt=()=>{xt.style.display="none"};/**
 * Conditionally shows the "Retweet all" control when the current page supports retweeting, otherwise invokes the fallback handler.
 *
 * When the page context permits mass retweets this function sets the retweet control's display to "initial"; in all other contexts it calls the fallback routine to handle the absent control.
 */
function Lt(){ve()&&!location.pathname.includes("/communities/")||$e()||Ee()&&!_()?xt.style.display="initial":Rt()}/**
 * Convert a comma-separated string into an array of trimmed, uppercase tokens.
 * @param {string} e - Comma-separated input string.
 * @returns {string[]} An array where each element is a token from the input, trimmed of surrounding whitespace and converted to uppercase.
 */
function St(e){return e.split(",").map((e=>e.trim().toUpperCase()))}/**
 * Determines whether the array contains the username derived from `e`, prefixed with `@` and uppercased.
 * @param {any} e - Source value used to obtain a username.
 * @param {string[]} t - Array of strings to search.
 * @returns {boolean} `true` if `t` includes the uppercased `@`-prefixed username derived from `e`, `false` otherwise.
 */
function vt(e,t){return t.includes(`@${P(e).toUpperCase()}`)}/**
 * Persist a timestamped record linking the current creator to the provided entity, then trigger an update.
 *
 * The record includes `createdAt` (current time), `creatorId` (current session user), and `userId` (derived from `e`), and is persisted before invoking a refresh/update routine.
 * @param {*} e - Target entity or identifier from which the user ID will be derived and recorded.
 */
function Tt(e){!function(e){const t={createdAt:Date.now(),creatorId:L(),userId:V(e)};je(nt,t)}(e),Qn()}/**
 * Determine whether a given user meets the configured follow eligibility rules.
 *
 * @param {Object} e - User object (Twitter API / timeline user shape) to evaluate.
 * @param {Object} t - Follow rule configuration containing flags, thresholds, and patterns
 *                     (examples: followBioRequired, followSkipVerified, followProfileImageRequired,
 *                     followSkipProtected, followProtectedRequired, followSkipFollower,
 *                     minFollowing, maxFollowing, minFollowers, maxFollowers,
 *                     minFollowersFollowingRatio, maxFollowersFollowingRatio,
 *                     bioWhitelist (RegExp), bioBlacklist (RegExp), followSkipFollowed, blacklist).
 * @returns {true|string} `true` if the user satisfies all follow rules; otherwise a short string
 *                       describing the single reason the user is disqualified (for example
 *                       "is verified", "has no biography", or "123 followers, but 500 minimum required").
 */
async function _t(e,t){if(!function(e){return P(e)==S()}(e)&&function(e){return 1!=e.relationship_perspectives.following&&1!=e.legacy.follow_request_sent}(e)){if(function(e){return 1==e.relationship_perspectives.blocked_by}(e))return"is blocking you";if(t.followBioRequired&&function(e){return""===F(e.legacy,"description")}(e))return"has no biography";if(t.followSkipVerified&&N(e))return"is verified";if(vt(e,t.blacklist))return"is blacklisted";if(t.followProfileImageRequired&&function(e){return 1==e.legacy.default_profile_image}(e))return"has default profile image";if(t.followSkipProtected&&G(e))return"is protected";if(t.followProtectedRequired&&!G(e))return"is not protected";if(t.followSkipFollower&&B(e))return"is following you";if(t.minFollowing){const n=O(e);if("number"==typeof n&&n<t.minFollowing)return`${n} following, but ${t.minFollowing} minimum required`}if(t.maxFollowing){const n=O(e);if("number"==typeof n&&n>t.maxFollowing)return`${n} following, but ${t.maxFollowing} maximum required`}if(t.minFollowers){const n=j(e);if("number"==typeof n&&n<t.minFollowers)return`${n} followers, but ${t.minFollowers} minimum required`}if(t.maxFollowers){const n=j(e);if("number"==typeof n&&n>t.maxFollowers)return`${n} followers, but ${t.maxFollowers} maximum required`}if(t.minFollowersFollowingRatio){const n=W(e);if(n&&n<t.minFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.minFollowersFollowingRatio} minimum required`}if(t.maxFollowersFollowingRatio){const n=W(e);if(n&&n>=t.maxFollowersFollowingRatio)return`${n.toFixed(2)} followers/following ratio, but ${t.maxFollowersFollowingRatio} maximum required`}if(t.bioBlacklist instanceof RegExp){const n=X(e).match(t.bioBlacklist);if(n)return`${n.join()} found in bio, but is blacklisted`}if(t.bioWhitelist instanceof RegExp){const n=X(e);if(!1===t.bioWhitelist.test(n))return"no whitelisted word found in bio"}if(t.followSkipFollowed){if(await ot(e))return"already followed once";if(await lt(e))return"already followed once"}return!0}}/**
 * Attempts to follow the account associated with the given tweet entry according to the provided autopilot configuration.
 *
 * Performs language whitelist and eligibility checks, triggers the UI follow flow (opening the profile, clicking follow, returning to the timeline), records the follow action, displays success or error notifications, and waits the configured interval before returning.
 *
 * @param {Object} e - Tweet-like entry object; must include UI references (e.g., `focusableEl`) and identifiers used to locate the tweet/profile elements.
 * @param {Object} t - Autopilot configuration for the follow action (e.g., `tweetLanguageWhitelist`, `intervalDurationRange`) that controls eligibility and pacing.
 */
async function $t(e,t){let n;const i=oe(e);if(n=t.tweetLanguageWhitelist&&!Ge(e,t.tweetLanguageWhitelist)?`language "${Q(e)}" not whitelisted`:await _t(i,t),1==n){let n;Jn(H(i)),function(e){const t=`a[href="${H(oe(e))}"][role="link"]`;return e.focusableEl.closest('[data-testid="tweet"]').querySelector(t)}(e).click();try{n=await E((()=>pe(i)),2e3)}catch(e){console.log(e)}if(n&&n.click(),window.history.back(),await E((()=>Yn())),e.focusableEl=await E((()=>ae(e))),e.focusableEl.focus(),Ze(se(e)),!n)return ze("follow button not found");Tt(i),Ye("successfully followed");const o=He(t.intervalDurationRange);await Vn(o)}else Ze(se(e)),n&&(ze(n),await Vn(500))}xt.addEventListener("click",(async()=>{p(),qt(),Rt(),pt(),await ht()}));const Mt=async e=>{if(!Un){for(let t=e;t>=0;t--){const n=xe()[t];if(n.focusableEl=ge(n),n.focusableEl){if(n.focusableEl.scrollIntoView(),t===e)return;break}}await Vn(40),await Mt(e)}};const It={followBlacklist:"@username1,@username2",followBioBlacklist:"",followBioRequired:!1,followBioWhitelist:"",followDailyLimit:"",followIntervalMax:8,followIntervalMin:4,followLimit:400,followMaxFollowers:"",followMaxFollowersFollowingRatio:"",followMaxFollowing:"",followMinFollowers:"",followMinFollowing:"",followMinFollowersFollowingRatio:"",followPauseAfterSkipMax:"",followPauseAfterSkipMin:"",followPauseWhenTwitterLimitExceeded:5,followProfileImageRequired:!1,followProtectedRequired:!1,followSkipFollowed:!0,followSkipFollower:!1,followSkipProtected:!1,followSkipVerified:!1,followTweetLanguageWhitelist:""},Et=()=>rt(It),At=async()=>{const e=await Et();return e.blacklist=St(e.followBlacklist),e.bioBlacklist=at(e.followBioBlacklist),e.bioWhitelist=at(e.followBioWhitelist),e.tweetLanguageWhitelist=Ve(e.followTweetLanguageWhitelist),e.intervalDurationRange=Xe(e.followIntervalMin,e.followIntervalMax),e.maxFollowing=parseInt(e.followMaxFollowing),e.minFollowing=parseInt(e.followMinFollowing),e.maxFollowers=parseInt(e.followMaxFollowers),e.minFollowers=parseInt(e.followMinFollowers),e.maxFollowersFollowingRatio=parseFloat(e.followMaxFollowersFollowingRatio),e.minFollowersFollowingRatio=parseFloat(e.followMinFollowersFollowingRatio),e.followPauseAfterSkipMin&&e.followPauseAfterSkipMax&&(e.pauseAfterSkipRange=Xe(e.followPauseAfterSkipMin,e.followPauseAfterSkipMax)),e};/**
 * Execute a bulk "follow" autopilot sequence using the current follow configuration.
 *
 * Initializes required state and UI, applies configured limits (and an optional override),
 * respects daily limits and pause conditions, selects the appropriate follow workflow for
 * the current page context, and performs paced follow actions while updating UI and persistence.
 *
 * @param {number} [e] - Optional maximum number of follows to perform for this run; overrides the stored follow limit when provided.
 * @param {*} [t] - Optional parameter forwarded to On(...) to control per-target behavior during the follow workflow.
 */
async function Ct(e,t){const n=await At();var o;await Bn(),n.followLimit&&Hn(n.followLimit),e&&Hn(e),n.followDailyLimit&&(o=await async function(){const e=Pe.transaction([nt],"readonly").objectStore(nt).index("createdAt"),t=IDBKeyRange.bound([L(),Date.now()-864e5],[L(),Date.now()]);let n=0;return new Promise((i=>{e.openCursor(t).onsuccess=e=>{const t=e.target.result;t?(n+=1,t.continue()):i(n)}}))}(),In=o,function(e){$n=e,In>=$n&&(Un=!0,i(),hn())}(n.followDailyLimit)),t&&On(t),Nn(n.followPauseWhenTwitterLimitExceeded),$()&&xe()?await async function(e){await Re((async(t,n)=>{const i=await _t(t,e);if(1==i){let i=pe(t);if(i)i.click(),Tt(t);else{Jn(H(t)),t.focusableEl.click();try{i=await E((()=>pe(t)),4e3)}catch(e){console.log(e)}i&&(i.click(),Tt(t)),window.history.back(),await E((()=>Yn())),await Mt(n)}if(Ze(ke(t)),!i)return ze("follow button not found");Ye("successfully followed");const o=He(e.intervalDurationRange);await Vn(o)}else Ze(ke(t)),i&&(ze(i),await Vn(500))}),ge)}(n):ve()?await async function(e){await Te((async t=>{await $t(t,e)}))}(n):de()?await async function(e){await me((async t=>{await $t(t,e)}))}(n):await async function(e){await Re((async t=>{const n=await _t(t,e);if(Ze(ke(t)),1==n){const n=pe(t);if(!n)return ze("follow button not found");n.click(),Tt(t),Ye("successfully followed");const i=He(e.intervalDurationRange);await Vn(i)}else if(n&&ze(n),e.pauseAfterSkipRange){const t=He(e.pauseAfterSkipRange);await Vn(t)}}))}(n)}const Dt=document.createElement("div");Dt.innerText="Follow all",Dt.setAttribute("role","button"),Dt.classList.add("sft-button","sft-button--follow");const qt=()=>{Dt.style.display="none"};Dt.addEventListener("click",(async()=>{f(),qt(),pt(),Rt(),await Ct()}));const Ut=864e5;/**
 * Compute the elapsed time, measured in units defined by `Ut`, since the provided timestamp.
 * @param {number} e - Origin timestamp in milliseconds (typically from Date.now()).
 * @returns {number} Elapsed time as a numeric value in units where 1 unit equals `Ut` milliseconds.
 */
function Pt(e){return(Date.now()-e)/Ut}const jt=(e,t,n)=>n.indexOf(e)==t,Bt=(e,t)=>{const n=[];if(t.followingLessThan){if(O(e)<t.followingLessThan)return!0;n.push(`${O(e)} Following`)}if(t.followingGreaterThan){if(O(e)>t.followingGreaterThan)return!0;n.push(`${O(e)} Following`)}if(t.followersLessThan){if(j(e)<t.followersLessThan)return!0;n.push(`${j(e)} Followers`)}if(t.followersGreaterThan){if(j(e)>t.followersGreaterThan)return!0;n.push(`${j(e)} Followers`)}return 0===n.length||n.filter(jt).join(", ")};/**
 * Determine whether a user should be skipped for an unfollow action and provide a human-readable reason when applicable.
 * @param {Object} user - The user object representing the target account (expected to contain relationship, profile, and id fields used by checks).
 * @param {Object} opts - Unfollow options and filters (e.g., unfollowSkipFollower, unfollowSkipVerified, blacklist, bioBlacklist (RegExp), unfollowMassFollowedRequired, minDaysFollowed).
 * @returns {string|undefined} A descriptive reason why the user should be skipped (for display/logging), or `undefined` when the user is eligible for unfollow. 
 */
async function Wt(e,t){if(function(e){return F(e.relationship_perspectives,"following")}(e)){if(t.unfollowSkipFollower&&B(e))return"is following you";if(t.unfollowSkipVerified&&N(e))return"is verified";if(vt(e,t.blacklist))return"is blacklisted";if(t.bioBlacklist instanceof RegExp){const n=X(e).match(t.bioBlacklist);if(n)return`${n.join()} found in bio, but is blacklisted`}if(t.unfollowMassFollowedRequired||t.minDaysFollowed){const n=await ot(e),i=await lt(e);if(t.unfollowMassFollowedRequired&&!n&&!i)return"has not been mass followed";if(t.minDaysFollowed&&n){const e=Pt(n.createdAt);if(e<t.minDaysFollowed)return`${e.toFixed(2)} days followed, but ${t.minDaysFollowed} days minimum required`}if(t.minDaysFollowed&&i){const e=Pt(i.createdAt);if(e<t.minDaysFollowed)return`${e} days followed, but ${t.minDaysFollowed} days minimum required`}}return Bt(e,t)}}const Ot={unfollowBlacklist:"@username1,@username2",unfollowBioBlacklist:"",unfollowFollowersLessThan:"",unfollowFollowersGreaterThan:"",unfollowFollowingLessThan:"",unfollowFollowingGreaterThan:"",unfollowIntervalMax:8,unfollowIntervalMin:4,unfollowLimit:"",unfollowMassFollowedRequired:!1,unfollowMinDaysFollowed:2,unfollowPauseAfterSkipMax:"",unfollowPauseAfterSkipMin:"",unfollowSkipFollower:!0,unfollowSkipVerified:!1},Vt=()=>rt(Ot),Gt=()=>document.querySelector('[data-testid="confirmationSheetConfirm"]'),Nt=async()=>{const e=await Vt();return e.blacklist=St(e.unfollowBlacklist),e.bioBlacklist=at(e.unfollowBioBlacklist),e.followingLessThan=parseInt(e.unfollowFollowingLessThan),e.followingGreaterThan=parseInt(e.unfollowFollowingGreaterThan),e.followersLessThan=parseInt(e.unfollowFollowersLessThan),e.followersGreaterThan=parseInt(e.unfollowFollowersGreaterThan),e.intervalDurationRange=Xe(e.unfollowIntervalMin,e.unfollowIntervalMax),e.minDaysFollowed=parseFloat(e.unfollowMinDaysFollowed),e.unfollowPauseAfterSkipMin&&e.unfollowPauseAfterSkipMax&&(e.pauseAfterSkipRange=Xe(e.unfollowPauseAfterSkipMin,e.unfollowPauseAfterSkipMax)),e};/**
 * Perform an unfollow operation for a given target, handling configuration limits, UI confirmation, notifications, and pacing.
 *
 * Attempts to locate and click the target's unfollow control, confirm the unfollow action, update visible status/notifications, and wait according to configured interval or pause ranges; applies any provided unfollow limits before acting.
 *
 * @param {Object|string|Element} e - Target to unfollow; may be a user object, user identifier, or DOM element used to locate the unfollow button.
 * @param {string} [t] - Optional status or message to display while processing this unfollow action.
 */
async function Xt(e,t){const n=await Nt();await Bn(),n.unfollowLimit&&Hn(n.unfollowLimit),e&&Hn(e),t&&On(t),await Re((async e=>{Ze(ke(e));const t=await Wt(e,n);if(1==t){const t=function(e){const t=`[data-testid="${V(e)}-unfollow"]`;return console.log(`Querying unfollow button of ${P(e)} with ${t}`),document.querySelector(t)}(e);if(!t)return ze("unfollow button not found");t.click();(await E((()=>Gt()),1e3)).click(),Qn(),Ye("successfully unfollowed");const i=He(n.intervalDurationRange);await Vn(i)}else if(t&&ze(t),n.pauseAfterSkipRange){const e=He(n.pauseAfterSkipRange);await Vn(e)}}))}const Ht=document.createElement("div");Ht.innerText="Unfollow all",Ht.setAttribute("role","button"),Ht.classList.add("sft-button","sft-button--unfollow");const Jt=()=>{Ht.style.display="none"};/**
 * Determine whether a target passes "unlike" preconditions based on mass-like and minimum-age rules.
 *
 * @param {*} e - Target identifier or object to evaluate; function will skip checks if the target is not applicable.
 * @param {{ unlikeMassLikedRequired?: boolean, minDaysSinceLike?: number }} t - Validation options:
 *   - unlikeMassLikedRequired: require that the target was previously recorded as mass-liked.
 *   - minDaysSinceLike: minimum number of days that must have passed since the like.
 * @returns {true|string|undefined} `true` if the target meets the configured requirements; a rejection reason string when a requirement is not met; `undefined` if the target is not applicable for these checks.
 */
async function Qt(e,t){if(Y(e)){if(t.unlikeMassLikedRequired||t.minDaysSinceLike){const n=await function(e){return Be(We,[L(),J(e)])}(e);if(t.unlikeMassLikedRequired&&!n)return"has not been mass liked";if(t.minDaysSinceLike&&n){const e=Pt(n.createdAt);if(e<t.minDaysSinceLike)return`${e.toFixed(2)} days since like, but ${t.minDaysSinceLike} minimum required`}}return!0}}Ht.addEventListener("click",(async()=>{d(),Jt(),await Xt()}));const Kt={unlikeIntervalMax:8,unlikeIntervalMin:4,unlikeLimit:"",unlikeMassLikedRequired:!1,unlikeMinDaysSinceLike:2};const Yt=async()=>{const e=await rt(Kt);return e.intervalDurationRange=Xe(e.unlikeIntervalMin,e.unlikeIntervalMax),e.minDaysSinceLike=parseFloat(e.unlikeMinDaysSinceLike),e};/**
 * Perform an "unlike" action for a specific tweet element, applying limits and pacing, and updating UI/state.
 *
 * Reads user settings and enforces configured unlike limits and pacing; locates the tweet's unlike button from the provided focusable element, clicks it when eligible, updates internal counters/UI, and waits the configured interval before returning. If the tweet is not eligible for unlike, an optional fallback handler will be invoked.
 *
 * @param {Element} e - The focusable element inside a tweet used to locate the corresponding unlike button.
 * @param {any} [t] - Optional fallback value passed to the skip handler when the unlike action is not performed.
 */
async function zt(e,t){const n=await Yt();await Bn(),n.unlikeLimit&&Hn(n.unlikeLimit),e&&Hn(e),t&&On(t),await me((async e=>{const t=await Qt(e,n);if(1==t){const t=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="unlike"]')}(e);if(!t)return!1;t.click(),Qn(),tt(e,"successfully unliked");const i=He(n.intervalDurationRange);await Vn(i)}else t&&(et(e,t),await Vn(500))}))}const Zt=document.createElement("div");Zt.innerText="Unlike all",Zt.setAttribute("role","button"),Zt.classList.add("sft-button","sft-button--unlike");const en=()=>{Zt.style.display="none"};/**
 * Validate whether a tweet meets configured criteria for unretweeting.
 *
 * Performs checks only when the tweet is applicable (te(e) is true). If `t.minDaysSinceRetweet`
 * is provided, verifies the tweet's retweet age meets the minimum days requirement. If
 * `t.unretweetMassRetweetedRequired` is true, verifies the tweet was part of a mass-retweet set.
 *
 * @param {object} e - Tweet object to validate (expects legacy.created_at and identifiers).
 * @param {object} t - Validation options.
 * @param {number} [t.minDaysSinceRetweet] - Minimum number of days that must have passed since the retweet.
 * @param {boolean} [t.unretweetMassRetweetedRequired] - If true, require the tweet to have been mass-retweeted.
 * @returns {true|string|undefined} `true` if the tweet is eligible; a reason string when ineligible; `undefined` when the tweet is not applicable for these checks.
 */
async function tn(e,t){if(te(e)){if(t.minDaysSinceRetweet){const n=Pt(function(e){const t=F(e.legacy,"created_at");return Date.parse(t)}(e));if(n<t.minDaysSinceRetweet)return`${n.toFixed(2)} days since retweet, but ${t.minDaysSinceRetweet} minimum required`}if(t.unretweetMassRetweetedRequired){const t=await function(e){const t=ne(e);return Be(yt,[L(),t])}(e);if(!t)return"has not been mass retweeted"}return!0}}Zt.addEventListener("click",(async()=>{g(),en(),await zt()}));const nn={unretweetIntervalMax:8,unretweetIntervalMin:4,unretweetLimit:"",unretweetMassRetweetedRequired:!1,unretweetMinDaysSinceRetweet:2};const on=()=>document.querySelector('div[data-testid="unretweetConfirm"]'),ln=async()=>{const e=await rt(nn);return e.intervalDurationRange=Xe(e.unretweetIntervalMin,e.unretweetIntervalMax),e.minDaysSinceRetweet=parseFloat(e.unretweetMinDaysSinceRetweet),e};/**
 * Perform an unretweet for a given focused tweet element, enforce limits, update UI, and wait the configured interval.
 *
 * Applies configured unretweet limits (from stored config and the optional parameters), locates and clicks the tweet's unretweet control, confirms the action, records success in the UI, and then waits a randomized interval before returning. If the unretweet control is not available or the action fails, records the failure and waits 500 ms.
 *
 * @param {HTMLElement} e - The focusable element representing the tweet (used to locate the enclosing tweet node and its unretweet control).
 * @param {?any} [t] - Optional context or error token used for failure handling; when provided, failure handling will be invoked with this value.
 */
async function an(e,t){const n=await ln();await Bn(),n.unretweetLimit&&Hn(n.unretweetLimit),e&&Hn(e),t&&On(t),await Ae((async e=>{const t=await tn(e,n);if(1==t){const t=function(e){return e.focusableEl.closest('[data-testid="tweet"]').querySelector('[data-testid="unretweet"]')}(e);if(!t)return!1;t.click();(await E((()=>on()))).click(),Qn(),tt(e,"successfully unretweeted");const i=He(n.intervalDurationRange);await Vn(i)}else t&&(et(e,t),await Vn(500))}))}const sn=document.createElement("div");sn.innerText="Unretweet all",sn.setAttribute("role","button"),sn.classList.add("sft-button","sft-button--unretweet");const rn=()=>{sn.style.display="none"};sn.addEventListener("click",(async()=>{y(),rn(),await an()}));const cn=document.createElement("aside");cn.setAttribute("role","complementary"),cn.classList.add("sft-panel"),document.body.appendChild(cn);const un=()=>{cn.style.display="none"},wn=()=>{cn.style.display="flex"};/**
 * Update which autopilot action buttons and the action panel are visible based on page context and feature availability.
 *
 * Sets individual action button elements (follow, like, retweet, unfollow, unlike, unretweet) to visible when their
 * corresponding page/context checks pass; otherwise hides or resets them. If the global `Un` flag is set, the function
 * is a no-op. After adjusting buttons it updates the containing panel visibility and CSS state and triggers either the
 * panel-show handler or the panel-hide handler.
 */
function fn(){Un||(qe(),xe()&&!v()||ve()&&!$()||de()?Dt.style.display="initial":qt(),ve()||Ee()&&!_()||de()&&!T()||$e()?mt.style.display="initial":pt(),Lt(),xe()&&v()?Ht.style.display="initial":Jt(),de()&&T()?Zt.style.display="initial":en(),Ee()&&_()?sn.style.display="initial":rn(),"initial"==Ce.style.display||"initial"==Dt.style.display||"initial"==mt.style.display||"initial"==xt.style.display||"initial"==Ht.style.display||"initial"==Zt.style.display||"initial"==sn.style.display?(dn.style.display="none",cn.classList.toggle("sft-panel--search-page","/search"==location.pathname),wn()):un())}const dn=document.createElement("div");dn.classList.add("sft-status-bar");const mn=document.createElement("div");mn.innerText="Skip",mn.setAttribute("role","button"),mn.classList.add("sft-status-bar__button"),dn.append(mn),mn.addEventListener("click",(async()=>{mn.style.display="none",await ki()}));const pn=document.createElement("div");pn.innerText="Cancel",pn.setAttribute("role","button"),pn.classList.add("sft-status-bar__button"),dn.append(pn),pn.addEventListener("click",(()=>{jn(),pi(),un(),s()}));const yn=document.createElement("div");/**
 * Show the paused-autopilot UI and update the status message with the action-specific resume timer.
 *
 * Displays the pause panel (makes pn visible, hides yn and mn) and sets the status text to indicate
 * which autopilot action (follow, like, or retweet) was blocked and how long until autopilot continues.
 */
function gn(){pn.style.display="initial",yn.style.display="none",mn.style.display="none",function(){switch(w){case"follow":u.textContent=`Twitter follow limit exceeded. Continuing in ${c(Pn)} ...`;break;case"like":u.textContent=`Unable to like. Continuing in ${c(Pn)} ...`;break;case"retweet":u.textContent=`Unable to retweet. Continuing in ${c(Pn)} ...`}}()}/**
 * Show the repeating-autopilot UI and set the status countdown.
 *
 * Makes the primary autopilot panel visible, hides secondary panels, and updates the status element
 * to "Repeating autopilot in HH:MM:SS ..." using the provided delay.
 * @param {number} e - Delay in seconds until the autopilot repeats; displayed as `HH:MM:SS`.
 */
function kn(e){pn.style.display="initial",yn.style.display="none",mn.style.display="none",function(e){u.textContent=`Repeating autopilot in ${c(e)} ...`}(e)}/**
 * Update the UI to indicate autopilot is continuing and show progress.
 * @param {number} e - The current progress count.
 * @param {number} t - The total count to reach.
 */
function bn(e,t){pn.style.display="initial",yn.style.display="none",mn.style.display="initial",function(e,t){u.textContent=`Autopilot ${e}/${t} ...`}(e,t)}/**
 * Update the autopilot UI to the completion state and display a success message.
 *
 * Hides the primary panel, shows the completion panel, hides the progress panel, and sets the status text to indicate how many users or Tweets were processed for the current autopilot action (`follow`, `unfollow`, `like`, `retweet`, `unretweet`, `unlike`).
 */
function Fn(){pn.style.display="none",yn.style.display="initial",mn.style.display="none",function(){switch(w){case"follow":u.textContent=`Successfully followed ${Tn} users`;break;case"unfollow":u.textContent=`Successfully unfollowed ${Tn} users`;break;case"like":u.textContent=`Successfully liked ${Tn} Tweets`;break;case"retweet":u.textContent=`Successfully retweeted ${Tn} Tweets`;break;case"unretweet":u.textContent=`Successfully unretweeted ${Tn} Tweets`;break;case"unlike":u.textContent=`Successfully unliked ${Tn} Tweets`}}()}/**
 * Display the daily-limit state in the UI and update the status message.
 *
 * Hides the elements `pn` and `mn`, shows `yn`, sets the status element `u` text to "You have reached the daily limit of ${$n}", and logs that message to the console.
 */
function hn(){pn.style.display="none",yn.style.display="initial",mn.style.display="none",u.textContent=`You have reached the daily limit of ${$n}`,console.log(u.textContent)}/**
 * Update the autopilot UI to show the active action and target, and toggle visibility of related controls.
 *
 * Updates the display of global UI elements (pn, yn, mn) and sets the status text (u) to indicate the current action
 * (based on the global `w`) and its target path (using `Tn` and optional `Mn`).
 */
function xn(){pn.style.display="initial",yn.style.display="none",mn.style.display=hi()?"initial":"none",function(){const e=Mn?`${Tn}/${Mn}`:Tn;switch(w){case"follow":u.textContent=`Following ${e} ...`;break;case"unfollow":u.textContent=`Unfollowing ${e} ...`;break;case"like":u.textContent=`Liking ${e} ...`;break;case"retweet":u.textContent=`Retweeting ${e} ...`;break;case"unretweet":u.textContent=`Unretweeting ${e} ...`;break;case"unlike":u.textContent=`Unliking ${e} ...`}}()}/**
 * Show the autopilot status bar and initialize its controls.
 *
 * Makes the status container visible and initializes the progress display,
 * pro activation state, and related control buttons.
 */
function Rn(){dn.style.display="flex",qt(),pt(),Rt(),Jt()}/**
 * Retrieve the stored Pro activation key and its expiration timestamp from chrome.storage.sync.
 * @returns {{proActivationKey: (string|undefined), proExpiresAt: (number|undefined)}} Object containing `proActivationKey` and `proExpiresAt`; properties are `undefined` if not present.
 */
function Ln(){return new Promise((e=>{chrome.storage.sync.get(["proActivationKey","proExpiresAt"],(t=>e(t)))}))}/**
 * Checks whether a pro subscription is currently active.
 * @param {object|undefined} e - Object containing pro subscription info. Expected to have a numeric `proExpiresAt` timestamp (milliseconds since epoch).
 * @returns {boolean} `true` if `e.proExpiresAt` is greater than or equal to the current time, `false` otherwise.
 */
function Sn(e){return void 0!==e&&e.proExpiresAt>=Date.now()}yn.innerText="Close",yn.setAttribute("role","button"),yn.classList.add("sft-status-bar__button"),dn.append(yn),yn.addEventListener("click",(()=>un()));const vn=50;let Tn,_n,$n,Mn,In,En,An,Cn,Dn,qn,Un=!1,Pn=!1;/**
 * Set the `Un` flag to true.
 */
function jn(){Un=!0}/**
 * Reset internal autopilot state, load current configuration, and reinitialize UI and background routines.
 *
 * Clears runtime counters and cached values, captures the current URL, awaits loading of configuration,
 * applies the configuration state, conditionally triggers startup behavior, and updates UI/status handlers.
 */
async function Bn(){Tn=0,In=void 0,$n=void 0,Pn=!1,_n=location.href,En=void 0,An=void 0,Dn=void 0;const e=await Ln();Cn=Sn(e),Cn||(Mn=vn,r()),xn(),Rn()}const Wn=()=>{An=En?Date.now()+En:void 0};/**
 * Update the global interval used by autopilot and apply the new value.
 * @param {string|number} e - Interval in seconds (fractional values allowed); the value is parsed and stored internally as milliseconds.
 */
function On(e){En=1e3*parseFloat(e),Wn()}/**
 * Pause execution for the specified number of milliseconds and add that duration to the global accumulator `An` when defined.
 * @param {number} t - The delay in milliseconds to wait (and to add to `An` if `An` exists).
 */
async function Vn(t){An&&(An+=t),await e(t)}/**
 * Handle the idle timeout: if a deadline exists and is in the past, clear it and mark the autopilot as idle.
 *
 * If the stored timeout timestamp has been reached, this function clears the timeout value (sets `An` to undefined),
 * sets the idle flag (`Un`) to `true`, and logs "Idle timeout" to the console.
 */
function Gn(){An&&An<=Date.now()&&(console.log("Idle timeout"),An=void 0,Un=!0)}/**
 * Configure the global qn timeout by interpreting the provided value as minutes and converting it to seconds.
 * @param {string|number} e - Timeout value in minutes; may be a number or numeric string.
 */
function Nn(e){qn=60*parseFloat(e)}/**
 * Start a one-second countdown stored in the global `Pn`, invoking `gn()` each second until `Pn` reaches zero or `Un` becomes truthy.
 *
 * When the countdown stops, the interval is cleared and `Pn` is set to `false`.
 */
function Xn(){Pn=qn;const e=setInterval((()=>{Pn-=1,gn(),(Pn<=0||Un)&&(clearInterval(e),Pn=!1)}),1e3)}/**
 * Update the recorded minimum time value when the provided value is smaller or when forced, then refresh the status.
 * @param {number} e - Candidate numeric time value to consider for updating the stored minimum.
 */
function Hn(e){(Cn||Mn&&e<Mn)&&(Mn=e),xn()}/**
 * Assigns the provided value to the internal variable `Dn`.
 * @param {*} e - Value to store in the internal `Dn` variable.
 */
function Jn(e){Dn=e}/**
 * Advance the internal action counter and handle end-of-run, rate-limit pauses, or continuation.
 *
 * Increments the current action counter; if the counter reaches the configured maximum it marks
 * autopilot as finished and triggers completion handling. If the counter approaches the configured
 * limit (taking the pacing interval into account) it marks autopilot as paused and triggers pause
 * handling and a UI warning. Otherwise it continues to the next target. Always refreshes the
 * progress/status UI after updating state.
 */
function Qn(){Tn+=1,Mn&&Mn<=Tn?(Un=!0,Fn()):$n&&Tn+In>=$n?(Un=!0,i(),hn()):xn(),Wn()}/**
 * Determines whether the current URL matches the stored full href or pathname; resets Un when not matching.
 *
 * If neither the full href equals `_n` nor the pathname equals `Dn`, this function sets `Un` to `false`.
 * @returns {boolean} `true` if `location.href === _n` or `location.pathname === Dn`, `false` otherwise.
 */
function Kn(){return location.href==_n||(location.pathname==Dn||(Un=!1,!1))}/**
 * Checks whether the current page URL matches the stored reference URL.
 * @returns {boolean} `true` if `location.href` equals `_n`, `false` otherwise.
 */
function Yn(){return location.href==_n}const zn="autopilotActions";const Zn=e=>{switch(e.type){case"mass_follow":case"mass_like":case"mass_retweet":return e.url;case"mass_unfollow":case"mass_unlike":case"mass_unretweet":return!0;default:return!1}},ei=async()=>{const e=await async function(){return(await st([zn]))[zn]}();return Array.isArray(e)?e.filter(Zn):[]};/**
 * Retrieve the first element from the array produced by `ei()`.
 * @returns {any|undefined} The first element of the array returned by `ei()`, or `undefined` if that array is empty.
 */
async function ti(){return(await ei())[0]}const ni=e=>`https://www.x.com${e}`;const ii="SuperpowersForTwitterAutopilotActionId";/**
 * Retrieve and remove a pending autopilot action id from sessionStorage and return the matching action object.
 *
 * This function reads an action id from sessionStorage, removes that stored id, then looks up and returns
 * the corresponding action object from the available actions.
 *
 * @returns {Object|undefined} The action object whose `id` matched the stored id, or `undefined` if there was no stored id or no matching action.
 */
async function oi(){const e=sessionStorage.getItem(ii);if("string"!=typeof e)return;sessionStorage.removeItem(ii);const t=await async function(e){return(await ei()).find((t=>t.id===e))}(e);return t}/**
 * Persist the given autopilot action id and navigate the browser to the page appropriate for that action.
 *
 * Stores the action id in sessionStorage (under the extension's autopilot key) and then changes location.href:
 * - For "mass_follow", "mass_like", and "mass_retweet" navigates to the action's provided URL.
 * - For "mass_unfollow", "mass_unlike", and "mass_unretweet" navigates to the corresponding user page (following, likes, or profile).
 *
 * @param {Object} e - Autopilot action configuration.
 * @param {string|number} e.id - Identifier for the action; persisted to sessionStorage.
 * @param {string} e.type - Action type (e.g., "mass_follow", "mass_like", "mass_retweet", "mass_unfollow", "mass_unlike", "mass_unretweet").
 * @param {string} [e.url] - Destination URL used for some action types.
 */
function li(e){switch(sessionStorage.setItem(ii,e.id),e.type){case"mass_follow":case"mass_like":case"mass_retweet":location.href=e.url;break;case"mass_unfollow":location.href=function(e){return ni(`/${e}/following`)}(S());break;case"mass_unlike":location.href=function(e){return ni(`/${e}/likes`)}(S());break;case"mass_unretweet":location.href=function(e){return ni(`/${e}`)}(S())}}const ai=2;/**
 * Compute the effective item count, applying the configured cap when appropriate.
 *
 * @returns {number} The observed item count, or the cap value `ai` when the observed count exceeds `ai` and the unlock condition is not satisfied; otherwise the full observed count.
 */
async function si(){const e=await async function(){return(await ei()).length}();if(e<=ai)return e;return Sn(await Ln())?e:ai}const ri=async(e,t)=>{try{return await E((()=>(t&&console.log(t),e())),9e3)}catch(e){return console.log(e),console.log("Skipping action ..."),void ki()}};const ci={autopilotPauseAfterActionMax:"",autopilotPauseAfterActionMin:"",autopilotRepeatAfter:60,autopilotRepeatAfterMax:60};/**
 * Access the extension's root UI element.
 * @returns {Element} The root DOM element used by the extension's UI.
 */
function ui(){return rt(ci)}let wi,fi,di=!1;const mi=async()=>{sessionStorage.removeItem(t),wi=await ti(),di=!1;const e=await si();bn(wi.number,e),wn(),Rn(),li(wi)},pi=()=>{di=!0},yi=async()=>{const e=await ui();if(!e.autopilotRepeatAfter)return void pi();if(!Sn(await Ln()))return void pi();let t=((e,t)=>{let n=60*parseFloat(e);const i=60*parseFloat(t),o=[n];for(;n<i;)n+=60,o.push(n);return Ne(o)})(e.autopilotRepeatAfter,e.autopilotRepeatAfterMax);kn(t);const n=setInterval((()=>{di?clearInterval(n):(t-=1,kn(t),t<=0&&(clearInterval(n),mi()))}),1e3)},gi=async t=>{const i=await async function(e){const t=await ei(),i=n(),o=t.filter((t=>t.id==e||!i.includes(t.type))),l=o.map((e=>e.id)),a=l.indexOf(e);if(-1===a)return;return o[a+1]}(wi.id);if(i&&i.number<=t){if(await(async()=>{const{autopilotPauseAfterActionMin:t,autopilotPauseAfterActionMax:n}=await ui();if(!t)return;if(!n)return;let i=He(Xe(t,n));for(;i>0;){if(di)return;o=i,pn.style.display="initial",yn.style.display="none",mn.style.display="none",k(o),i-=100,await e(100)}var o})(),di)return;bn(i.number,t),li(i)}else await yi()};/**
 * Starts the autopilot workflow.
 *
 * Enables the autopilot flag, initializes UI state, loads the autopilot configuration, and begins processing using that configuration.
 */
async function ki(){fi=!0,jn();const e=await si();gi(e)}/**
 * Starts and runs the configured autopilot action sequence.
 *
 * Loads the current autopilot configuration, initializes UI and run state, executes the configured bulk action
 * (follow, like, retweet, unfollow, unlike, or unretweet) with its configured limits and pacing, and performs
 * post-run finalization. The run will abort early if autopilot is suspended or cancelled.
 */
async function bi(){if(wi=await oi(),wi){fi=!1;const e=await si();if(bn(wi.number,e),wn(),Rn(),await async function(e){switch(e.type){case"mass_follow":if(await ri((()=>ve()||xe()||de()),"Find Tweets, users or likes ..."),!hi())return;if(Fi())return;f(),await Ct(e.limit,e.idleTimeout);break;case"mass_like":if(await ri((()=>ve()||de()||Ee()||$e()),"Find Tweets or likes ..."),!hi())return;if(Fi())return;m(),await dt(e.limit,e.idleTimeout);break;case"mass_retweet":if(await ri((()=>ve()||Ee()),"Find Tweets ..."),!hi())return;if(Fi())return;p(),await ht(e.limit,e.idleTimeout);break;case"mass_unfollow":if(await ri((()=>xe()&&v()),"Find users ..."),!hi())return;if(Fi())return;d(),await Xt(e.limit,e.idleTimeout);break;case"mass_unlike":if(await ri((()=>de()&&T()),"Find likes ..."),!hi())return;if(Fi())return;g(),await zt(e.limit,e.idleTimeout);break;case"mass_unretweet":if(await ri((()=>Ee()&&_()),"Find Tweets ..."),!hi())return;if(Fi())return;y(),await an(e.limit,e.idleTimeout)}}(wi),di)return;if(fi)return;await gi(e)}}/**
 * Check whether the module's internal `fi` flag is set.
 * @returns {boolean} `true` if the internal `fi` flag is `true`, `false` otherwise.
 */
function Fi(){return!0===fi}/**
 * Determine whether an autopilot configuration exists and autopilot is active.
 * @returns {boolean} `true` if a configuration object is present and the autopilot is not idle, `false` otherwise.
 */
function hi(){return"object"==typeof wi&&!1===di}dn.prepend(u),cn.append(dn,Ce,Dt,Ht,xt,mt,sn,Zt),ue("friendships/create.json",(({body:e,parsedResponse:t,status:n})=>{200!=n&&(it(e.match(/&user_id=(\d+)/)[1]),(e=>{if("object"!=typeof e)return;const t=e.errors;if(!Array.isArray(t))return;const n=t[0];return"object"==typeof n?162===n.code:void 0})(t)||(Xn(),hi()?(i(),jn()):Xn()))})),ue("favorites/create.json",(({status:e})=>{200!=e&&(hi()?(i(),jn()):Xn())})),ue("statuses/retweet.json",(({status:e})=>{200!=e&&(hi()?(i(),jn()):Xn())}));(async()=>{await bi(),setInterval((async()=>{hi()||Kn()||(await fn(),s())}),200)})()})()})();