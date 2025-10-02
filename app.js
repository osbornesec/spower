/**
 * @fileoverview Instruments XMLHttpRequest in the page context and relays
 * network activity to extension consumers via window.postMessage.
 */
(()=>{
  const HOME_TAB_SELECTOR = '[role="tab"][aria-selected="true"]';
  const resolveHomeTab = () => {
    const focused = document.activeElement;
    if (
      focused &&
      focused.getAttribute('role') === 'tab' &&
      focused.parentElement &&
      focused.parentElement.getAttribute('role') === 'tablist'
    ) {
      return focused;
    }
    return document.querySelector(HOME_TAB_SELECTOR);
  };

  const computeOriginKey = () => {
    const hrefKey = location.href.toUpperCase();
    if (location.pathname !== '/home') {
      return hrefKey;
    }
    const tabEl = resolveHomeTab();
    if (!tabEl) {
      return hrefKey;
    }
    const label = tabEl.textContent && tabEl.textContent.trim();
    if (!label) {
      return hrefKey;
    }
    const normalizedLabel = label.replace(/\s+/g, ' ');
    return `${hrefKey}::${normalizedLabel.toUpperCase()}`;
  };

  const instrumentOpen = () => {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.url = url;
      this.origin = computeOriginKey();
      return originalOpen.apply(this, arguments);
    };
  };
  instrumentOpen();

  const instrumentSend = () => {
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener(
        'load',
        () => {
          if (this.responseType === 'document') return;
          window.postMessage(
            { body, origin: this.origin, response: this.response, status: this.status, url: this.url },
            window.location.origin,
          );
        },
        { passive: !0 /* SPW_PASSIVE_LISTENERS */ },
      );
      return originalSend.apply(this, arguments);
    };
  };
  instrumentSend();

  const startedAt = Date.now();
  const watchdog = setInterval(() => {
    if (Date.now() - startedAt > 6e3) {
      clearInterval(watchdog);
      return;
    }
    XMLHttpRequest.prototype.open.toString().includes('this.origin = computeOriginKey()') || instrumentOpen();
    XMLHttpRequest.prototype.send.toString().includes('origin: this.origin') || instrumentSend();
  }, 100);
})();
