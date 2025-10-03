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

  const OPEN_FLAG = '__spwInstrumentedOpen__';
  const SEND_FLAG = '__spwInstrumentedSend__';

  const markInstrumented = (fn, flag) => {
    try {
      Object.defineProperty(fn, flag, { value: true, configurable: true });
    } catch (_e) {
      fn[flag] = true;
    }
  };

  const instrumentOpen = () => {
    if (XMLHttpRequest.prototype.open[OPEN_FLAG]) return;
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.url = url;
      this.origin = computeOriginKey();
      return originalOpen.apply(this, arguments);
    };
    markInstrumented(XMLHttpRequest.prototype.open, OPEN_FLAG);
  };
  instrumentOpen();

  const instrumentSend = () => {
    if (XMLHttpRequest.prototype.send[SEND_FLAG]) return;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener(
        'load',
        () => {
          if (this.responseType === 'document') return;
          const payload = {
            body,
            origin: this.origin,
            response: this.response,
            status: this.status,
            url: this.url,
          };
          try {
            window.postMessage(payload, window.location.origin);
          } catch (error) {
            if (error && error.name === 'DataCloneError') {
              payload.body = null;
              window.postMessage(payload, window.location.origin);
              return;
            }
            throw error;
          }
        },
        { passive: !0 /* SPW_PASSIVE_LISTENERS */ },
      );
      return originalSend.apply(this, arguments);
    };
    markInstrumented(XMLHttpRequest.prototype.send, SEND_FLAG);
  };
  instrumentSend();

  const startedAt = Date.now();
  const watchdog = setInterval(() => {
    if (Date.now() - startedAt > 6e3) {
      clearInterval(watchdog);
      return;
    }
    instrumentOpen();
    instrumentSend();
  }, 100);
})();
