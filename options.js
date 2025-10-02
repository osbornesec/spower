(() => {
  "use strict";
  (() => {
    const perfModuleUrl = chrome.runtime?.getURL?.('utils/perf.js');
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
    if (perfModuleUrl) {
      import(perfModuleUrl)
        .then((mod) => {
          if (!mod) return;
          if (mod.spwDebounce) spwDebounce = mod.spwDebounce;
          if (mod.spwIdleInit) spwIdleInit = mod.spwIdleInit;
        })
        .catch(() => {});
    }
    function e(e, t) {
      return new Promise((n) => {
        const i = {};
        ((i[e] = t),
          chrome.storage.sync.set(i, () => {
            chrome.runtime.lastError
              ? (console.log(chrome.runtime.lastError.message),
                chrome.storage.local.set(i, () => n()))
              : (chrome.storage.local.remove(e), n());
          }));
      });
    }
    function t(e) {
      return new Promise((t) => {
        chrome.storage.sync.get(e, (n) => {
          chrome.storage.local.get(e, (e) => {
            const i = { ...n, ...e };
            t(i);
          });
        });
      });
    }
    const n = "autopilotActions";
    let i = [];
    function o() {
      const e = {
        number: i.length + 1,
        id: ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (e) =>
          (
            e ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (e / 4)))
          ).toString(16),
        ),
      };
      return (i.push(e), e);
    }
    async function a() {
      const e = await (async function () {
        return (await t([n]))[n];
      })();
      return (Array.isArray(e) && (i = e), i);
    }
    async function l() {
      await e(n, i);
    }
    const elementCache = new Map();
    const getCachedElement = (id) => {
      if (!elementCache.has(id)) {
        elementCache.set(id, document.getElementById(id));
      }
      return elementCache.get(id);
    };
    const s = {},
      r = {},
      c = {},
      u = (e, t) => {
        const n = document.createElement("img");
        return (
          n.classList.add("icon"),
          n.setAttribute("alt", t),
          n.setAttribute("src", e),
          n.setAttribute("title", t),
          (n.style.display = "none"),
          n
        );
      },
      d = {
        addAlias: (e, t) => {
          s[e] = t;
        },
        hide: (e) => {
          (s[e] && (e = s[e]),
            (r[e].style.display = "none"),
            (c[e].style.display = "none"));
        },
        animateProcess: (e) => {
          (s[e] && (e = s[e]),
            (r[e].style.display = "none"),
            (c[e].style.display = "initial"));
        },
        animateSuccess: (e) => {
          (s[e] && (e = s[e]),
            (c[e].style.display = "none"),
            (r[e].style.display = "initial"));
        },
        create: (e) => {
          if (s[e]) return;
          const t = document.querySelector(`label[for="${e}"]`);
          ((t.textContent = `${t.textContent} `),
            (r[e] = u("check.svg", "Successfully updated")),
            t.appendChild(r[e]),
            (c[e] = u("spinner.svg", "Updating...")),
            c[e].classList.add("icon--spin"),
            t.appendChild(c[e]));
        },
      };
    const pendingFieldIds = new Set();
    const persistQueuedFields = spwDebounce(async () => {
      await l();
      pendingFieldIds.forEach((fieldId) => {
        d.animateSuccess(fieldId);
      });
      pendingFieldIds.clear();
    });
    const queuePersist = (fieldId) => {
      pendingFieldIds.add(fieldId);
      persistQueuedFields();
    };
    const settingUpdates = new Map();
    const persistSettings = spwDebounce(async () => {
      const entries = Array.from(settingUpdates.entries());
      settingUpdates.clear();
      for (const [fieldId, value] of entries) {
        await e(fieldId, value);
        d.animateSuccess(fieldId);
      }
    });
    const queueSettingUpdate = (fieldId, value) => {
      settingUpdates.set(fieldId, value);
      persistSettings();
    };
    const p = ({ id: e }) => `action_${e}_url`;
    const m = (e) => {
      const t = getCachedElement(p(e));
      ["mass_follow", "mass_like", "mass_retweet"].includes(e.type)
        ? (t.style.display = "initial")
        : (t.style.display = "none");
    };
    const f = ({ id: e }) => `action_${e}_type`;
    const k = (e) => `${f(e)}_label`;
    const y = ({ id: e }) => `action_${e}_idle_timeout`;
    const v = ({ id: e }) => `action_${e}_limit`;
    const M = ({ id: e }) => `action_${e}_remove`;
    function g(e) {
      const t = getCachedElement(M(e));
      if (t) {
        t.dataset.actionId = e.id;
      }
    }
    const h = document.getElementById("actions");
    const getActionFromTarget = (target) => {
      const actionId = target?.dataset?.actionId;
      if (!actionId) return;
      return i.find((action) => action.id === actionId);
    };
    const handleActionInput = (event) => {
      const target = event.target;
      const action = getActionFromTarget(target);
      if (!action) return;
      const fieldId = target.id;
      if (fieldId === p(action)) {
        action.url = target.value;
        d.animateProcess(fieldId);
        m(action);
        queuePersist(fieldId);
      } else if (fieldId === v(action)) {
        action.limit = target.value;
        d.animateProcess(fieldId);
        queuePersist(fieldId);
      } else if (fieldId === y(action)) {
        action.idleTimeout = target.value;
        d.animateProcess(fieldId);
        queuePersist(fieldId);
      }
    };
    const handleActionChange = (event) => {
      const target = event.target;
      const action = getActionFromTarget(target);
      if (!action) return;
      const fieldId = target.id;
      if (fieldId === f(action)) {
        action.type = target.value;
        d.animateProcess(fieldId);
        m(action);
        queuePersist(fieldId);
      }
    };
    const handleActionClick = async (event) => {
      const button = event.target.closest('.button--remove');
      if (!button) return;
      const action = getActionFromTarget(button);
      if (!action) return;
      event.preventDefault();
      d.animateProcess(f(action));
      button.disabled = true;
      i = i.filter((candidate) => candidate.id !== action.id);
      i.forEach((entry, index) => {
        entry.number = index + 1;
        const label = getCachedElement(k(entry));
        if (label) {
          label.textContent = `#${entry.number}`;
        }
      });
      pendingFieldIds.clear();
      await l();
      const row = button.closest('.action');
      if (row) {
        row.remove();
      }
    };
    if (h) {
      // SPW_EVENT_DELEGATION centralizes listeners to reduce handler churn per row
      h.addEventListener('input', handleActionInput);
      h.addEventListener('change', handleActionChange);
      h.addEventListener('click', handleActionClick);
    }
    function A(e) {
      const t = document.createElement("tr");
      (t.classList.add("action"),
        (t.innerHTML = `\n    <td>${(function (e) {
          return `<label id="${k(e)}" for="${f(e)}">#${e.number}</label>`;
        })(e)}</td>\n    <td>${(function (e) {
          return `\n    <select id="${f(e)}" required>\n      <option value="" disabled selected>Select action</option>\n      <option value="mass_follow">Mass follow</option>\n      <option value="mass_unfollow">Mass unfollow</option>\n      <option value="mass_like">Mass like</option>\n      <option value="mass_unlike">Mass unlike</option>\n      <option value="mass_retweet">Mass retweet</option>\n      <option value="mass_unretweet">Mass unretweet</option>\n    </select>\n  `;
        })(e)}</td>\n    <td>${(function (e) {
          return `<input class="action__url-field" type="text" id="${p(e)}" placeholder="URL">`;
        })(e)}</td>\n    <td>${(function (e) {
          return `<input type="number" step="1" id="${v(e)}" placeholder="Limit">`;
        })(e)}</td>\n    <td>${(function (e) {
          return `<input type="number" step="0.1" id="${y(e)}" placeholder="Idle timeout">`;
        })(e)}</td>\n    <td>${(function (e) {
          return `<button id="${M(e)}" class="button button--remove">Remove</a>`;
        })(e)}</td>\n  `),
        h.append(t),
        (function (e) {
          d.create(f(e));
        })(e),
        (function (e) {
          const t = getCachedElement(f(e));
          if (t) {
            e.type && (t.value = e.type);
            t.dataset.actionId = e.id;
            m(e);
          }
        })(e),
        (function (e) {
          const t = getCachedElement(p(e));
          if (t) {
            e.url && (t.value = e.url);
            d.addAlias(p(e), f(e));
            t.dataset.actionId = e.id;
            m(e);
          }
        })(e),
        (function (e) {
          const t = getCachedElement(v(e));
          if (t) {
            e.limit && (t.value = e.limit);
            d.addAlias(v(e), f(e));
            t.dataset.actionId = e.id;
          }
        })(e),
        (function (e) {
          const t = getCachedElement(y(e));
          if (t) {
            e.idleTimeout && (t.value = e.idleTimeout);
            d.addAlias(y(e), f(e));
            t.dataset.actionId = e.id;
          }
        })(e),
        g(e));
    }
    async function S() {
      const e = await a();
      for (let t = e.length; t < 3; t++) o();
      (e.forEach((e) => A(e)),
        (function (e) {
          e.addEventListener("click", () => {
            A(o());
          });
        })(document.getElementById("add_action")));
    }
    const H = () => {
      document.body.classList.add("is-pro");
      const e = document.getElementById("proActivationKey");
      if (e) {
        e.value = "All features unlocked";
        e.readOnly = !0;
        const t = e.nextElementSibling;
        t &&
          ((t.textContent =
            "All automation features are available without an activation key."),
          (t.style.color = "#28a745"));
      }
    };
    async function $(e) {
      const n = Object.keys(e),
        i = await t(n);
      return { ...e, ...i };
    }
    const T = {
        followBlacklist: "@username1,@username2",
        followBioBlacklist: "",
        followBioRequired: !1,
        followBioWhitelist: "",
        followDailyLimit: "",
        followIntervalMax: 8,
        followIntervalMin: 4,
        followLimit: 400,
        followMaxFollowers: "",
        followMaxFollowersFollowingRatio: "",
        followMaxFollowing: "",
        followMinFollowers: "",
        followMinFollowing: "",
        followMinFollowersFollowingRatio: "",
        followPauseAfterSkipMax: "",
        followPauseAfterSkipMin: "",
        followPauseWhenTwitterLimitExceeded: 5,
        followProfileImageRequired: !1,
        followProtectedRequired: !1,
        followSkipFollowed: !0,
        followSkipFollower: !1,
        followSkipProtected: !1,
        followSkipVerified: !1,
        followTweetLanguageWhitelist: "",
      },
      B = () => $(T),
      C = {
        likeMaxFollowers: "",
        likeMaxFollowersFollowingRatio: "",
        likeMaxFollowing: "",
        likeMaxTweetLikes: "",
        likeMinFollowers: "",
        likeMinFollowing: "",
        likeMinFollowersFollowingRatio: "",
        likeMinTweetLikes: "",
        likeIntervalMax: 8,
        likeIntervalMin: 4,
        likeLanguageWhitelist: "",
        likeLimit: 1e3,
        likePauseWhenUnableToLike: 10,
        likeSkipFollowed: !1,
        likeSkipReplies: !1,
        likeSkipRetweets: !1,
        likeSkipRetweetsWithComment: !1,
        likeSkipLikedXTweetsFromUser: "",
        likeTweetTextBlacklist: "",
      },
      W = () => $(C),
      q = {
        retweetIntervalMax: 8,
        retweetIntervalMin: 4,
        retweetLanguageWhitelist: "",
        retweetLimit: 1e3,
        retweetPauseWhenUnableToRetweet: 10,
        retweetSkipFollowed: !1,
        retweetSkipReplies: !1,
        retweetSkipRetweets: !1,
        retweetSkipRetweetsWithComment: !1,
        retweetTweetTextBlacklist: "",
      },
      j = () => $(q),
      D = {
        unfollowBlacklist: "@username1,@username2",
        unfollowBioBlacklist: "",
        unfollowFollowersLessThan: "",
        unfollowFollowersGreaterThan: "",
        unfollowFollowingLessThan: "",
        unfollowFollowingGreaterThan: "",
        unfollowIntervalMax: 8,
        unfollowIntervalMin: 4,
        unfollowLimit: "",
        unfollowMassFollowedRequired: !1,
        unfollowMinDaysFollowed: 2,
        unfollowPauseAfterSkipMax: "",
        unfollowPauseAfterSkipMin: "",
        unfollowSkipFollower: !0,
        unfollowSkipVerified: !1,
      },
      K = () => $(D),
      U = {
        unretweetIntervalMax: 8,
        unretweetIntervalMin: 4,
        unretweetLimit: "",
        unretweetMassRetweetedRequired: !1,
        unretweetMinDaysSinceRetweet: 2,
      };
    const O = {
      unlikeIntervalMax: 8,
      unlikeIntervalMin: 4,
      unlikeLimit: "",
      unlikeMassLikedRequired: !1,
      unlikeMinDaysSinceLike: 2,
    };
    const V = {
      autopilotPauseAfterActionMax: "",
      autopilotPauseAfterActionMin: "",
      autopilotRepeatAfter: 60,
      autopilotRepeatAfterMax: 60,
    };
    (d.addAlias("followIntervalMax", "followIntervalMin"),
      d.addAlias("unfollowIntervalMax", "unfollowIntervalMin"),
      d.addAlias("likeIntervalMax", "likeIntervalMin"),
      d.addAlias("retweetIntervalMax", "retweetIntervalMin"),
      d.addAlias("unretweetIntervalMax", "unretweetIntervalMin"),
      d.addAlias("unlikeIntervalMax", "unlikeIntervalMin"),
      d.addAlias(
        "autopilotPauseAfterActionMax",
        "autopilotPauseAfterActionMin",
      ),
      d.addAlias("likeSkipRetweetsWithComment", "likeSkipRetweets"),
      d.addAlias("likeSkipReplies", "likeSkipRetweets"),
      d.addAlias("autopilotRepeatAfterMax", "autopilotRepeatAfter"),
      d.addAlias("retweetSkipRetweetsWithComment", "retweetSkipRetweets"),
      d.addAlias("retweetSkipReplies", "retweetSkipRetweets"),
      d.addAlias("unfollowPauseAfterSkipMax", "unfollowPauseAfterSkipMin"),
      d.addAlias("followPauseAfterSkipMax", "followPauseAfterSkipMin"));
    const spwBootOptions = async () => {
      H();
      let e = await B();
      ((e = { ...e, ...(await W()) }),
        (e = { ...e, ...(await j()) }),
        (e = { ...e, ...(await K()) }),
        (e = { ...e, ...(await $(O)) }),
        (e = { ...e, ...(await $(U)) }),
        (e = { ...e, ...(await $(V)) }),
        Object.keys(e).forEach((t) => {
          const n = document.getElementById(t);
          if (!n) return;
          d.create(t);
          if ("checkbox" === n.type) {
            n.checked = e[t];
            n.addEventListener('change', () => {
              d.animateProcess(t);
              queueSettingUpdate(t, n.checked);
            });
          } else {
            n.value = e[t];
            n.addEventListener('input', () => {
              d.animateProcess(t);
              queueSettingUpdate(t, n.value);
            });
          }
        }),
        await S());
    };

    if (typeof window !== 'undefined' && typeof window.__SPW_TEST_HARNESS__ === 'function') {
      window.__SPW_TEST_HARNESS__({
        boot: spwBootOptions,
        handleActionInput,
        handleActionChange,
        handleActionClick,
        getActionFromTarget,
        queueSettingUpdate,
        queuePersist,
        pendingFieldIds,
        actions: i,
      });
    } else {
      spwIdleInit(() => {
        spwBootOptions();
      });
    }
  })();
})();
