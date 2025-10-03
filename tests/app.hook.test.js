import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

class FakeXMLHttpRequest {
  constructor() {
    this._listeners = new Map();
    this.response = { ok: true };
    this.responseType = 'json';
    this.status = 200;
  }

  addEventListener(event, callback) {
    const handlers = this._listeners.get(event) || [];
    handlers.push(callback);
    this._listeners.set(event, handlers);
  }

  trigger(event) {
    const handlers = this._listeners.get(event) || [];
    handlers.forEach((handler) => handler.call(this));
  }
}

FakeXMLHttpRequest.prototype.open = function open(method, url) {
  this._opened = { method, url };
  return 'opened';
};

FakeXMLHttpRequest.prototype.send = function send(body) {
  this._sentBody = body;
  this.trigger('load');
  return 'sent';
};

describe('app.js XMLHttpRequest instrumentation', () => {
  let originalXHR;
  let originalPostMessage;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    originalXHR = global.XMLHttpRequest;
    global.XMLHttpRequest = FakeXMLHttpRequest;

    originalPostMessage = window.postMessage;
    window.postMessage = vi.fn();

    await import('../app.js');
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();

    if (originalXHR) {
      global.XMLHttpRequest = originalXHR;
    } else {
      delete global.XMLHttpRequest;
    }

    window.postMessage = originalPostMessage;
  });

  it('decorates open/send to capture request metadata and post responses', () => {
    const request = new XMLHttpRequest();
    request.response = { data: 'ok' };

    request.open('POST', 'https://api.example.test/users');
    request.send('payload');

    expect(request.url).toBe('https://api.example.test/users');
    expect(request.origin).toBe(window.location.href.toUpperCase());

    expect(window.postMessage).toHaveBeenCalledTimes(1);
    const [message, target] = window.postMessage.mock.calls[0];
    expect(target).toBe(window.location.origin);
    expect(message).toEqual({
      body: 'payload',
      origin: window.location.href.toUpperCase(),
      response: { data: 'ok' },
      status: 200,
      url: 'https://api.example.test/users',
    });
  });

  it('reapplies instrumentation if the open method is overwritten', () => {
    const originalOpen = FakeXMLHttpRequest.prototype.open;
    const hijackedOpen = function hijackedOpen() {
      return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.open = hijackedOpen;

    expect(XMLHttpRequest.prototype.open).toBe(hijackedOpen);

    vi.advanceTimersByTime(150);

    expect(XMLHttpRequest.prototype.open).not.toBe(hijackedOpen);

    const request = new XMLHttpRequest();
    request.open('GET', '/resource');

    expect(request.origin).toBe(window.location.href.toUpperCase());
    expect(request.url).toBe('/resource');
  });

  it('includes the active home tab label in the origin key', () => {
    const originalLocation = global.location;
    global.location = { href: 'https://x.com/home', pathname: '/home' };

    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    const tab = document.createElement('button');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'true');
    tab.textContent = 'Vibe Coding';
    tablist.appendChild(tab);
    document.body.appendChild(tablist);

    const request = new XMLHttpRequest();
    request.open('GET', '/resource');

    expect(request.origin).toBe('HTTPS://X.COM/HOME::VIBE CODING');

    document.body.removeChild(tablist);
    global.location = originalLocation;
  });

  it('resolves the home tab from the active element', () => {
    const originalLocation = global.location;
    global.location = { href: 'https://x.com/home', pathname: '/home' };
    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    const tab = document.createElement('button');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = 'Vibe Coding';
    tablist.appendChild(tab);
    document.body.appendChild(tablist);
    tab.focus();

    const request = new XMLHttpRequest();
    request.open('GET', '/resource');

    expect(request.origin).toBe('HTTPS://X.COM/HOME::VIBE CODING');

    document.body.removeChild(tablist);
    global.location = originalLocation;
  });

  it('handles cases where the home tab cannot be resolved', () => {
    const originalLocation = global.location;
    global.location = { href: 'https://x.com/home', pathname: '/home' };

    const request = new XMLHttpRequest();
    request.open('GET', '/resource');

    expect(request.origin).toBe('HTTPS://X.COM/HOME');
    global.location = originalLocation;
  });

  it('handles cases where the home tab has no label', () => {
    const originalLocation = global.location;
    global.location = { href: 'https://x.com/home', pathname: '/home' };

    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    const tab = document.createElement('button');
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'true');
    tablist.appendChild(tab);
    document.body.appendChild(tablist);

    const request = new XMLHttpRequest();
    request.open('GET', '/resource');

    expect(request.origin).toBe('HTTPS://X.COM/HOME');

    document.body.removeChild(tablist);
    global.location = originalLocation;
  });

  it('should not post a message if responseType is "document"', () => {
    const request = new XMLHttpRequest();
    request.responseType = 'document';

    request.open('GET', 'https://example.com');
    request.send();

    expect(window.postMessage).not.toHaveBeenCalled();
  });

  it('should handle DataCloneError when posting a message', () => {
    const error = new DOMException('DataCloneError', 'DataCloneError');
    window.postMessage.mockImplementationOnce(() => {
      throw error;
    });

    const request = new XMLHttpRequest();
    request.open('POST', 'https://api.example.test/users');
    request.send('payload');

    expect(window.postMessage).toHaveBeenCalledTimes(2);
    const [message] = window.postMessage.mock.calls[1];
    expect(message.body).toBeNull();
  });

  it('should re-throw errors that are not DataCloneError', () => {
    const error = new Error('Some other error');
    window.postMessage.mockImplementationOnce(() => {
      throw error;
    });

    const request = new XMLHttpRequest();
    request.open('POST', 'https://api.example.test/users');

    expect(() => request.send('payload')).toThrow(error);
  });

  it('should stop the watchdog after 6 seconds', () => {
    // Let the watchdog run for over 6 seconds, so it clears itself.
    vi.advanceTimersByTime(6001);

    // Now, hijack the open method.
    const originalOpen = XMLHttpRequest.prototype.open;
    const hijackedOpen = function hijackedOpen() {
      return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.open = hijackedOpen;
    expect(XMLHttpRequest.prototype.open).toBe(hijackedOpen);

    // Advance the timers again. If the watchdog were still active, it would
    // re-instrument the open method.
    vi.advanceTimersByTime(200);

    // The watchdog should have been cleared, so our hijacked method should
    // still be in place.
    expect(XMLHttpRequest.prototype.open).toBe(hijackedOpen);
  });

  it('falls back to querySelector when focused tab parent is not a tablist', () => {
    const originalLocation = global.location;
    global.location = { href: 'https://x.com/home', pathname: '/home' };

    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    const tab1 = document.createElement('button');
    tab1.setAttribute('role', 'tab');
    tab1.setAttribute('aria-selected', 'true');
    tab1.textContent = 'Correct Tab';
    tablist.appendChild(tab1);
    document.body.appendChild(tablist);

    const nonTablistParent = document.createElement('div');
    const tab2 = document.createElement('button');
    tab2.setAttribute('role', 'tab');
    tab2.textContent = 'Focused Tab';
    nonTablistParent.appendChild(tab2);
    document.body.appendChild(nonTablistParent);
    tab2.focus();

    const request = new XMLHttpRequest();
    request.open('GET', '/resource');

    expect(request.origin).toBe('HTTPS://X.COM/HOME::CORRECT TAB');

    document.body.removeChild(tablist);
    document.body.removeChild(nonTablistParent);
    global.location = originalLocation;
  });

  it('should use fallback instrumentation when Object.defineProperty fails', async () => {
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = (obj, prop, desc) => {
      if (prop === '__xfInstrumentedOpen__' || prop === '__xfInstrumentedSend__') {
        throw new Error('Cannot define property');
      }
      return originalDefineProperty(obj, prop, desc);
    };

    vi.resetModules();
    await import('../app.js');

    expect(XMLHttpRequest.prototype.open.__xfInstrumentedOpen__).toBe(true);
    expect(XMLHttpRequest.prototype.send.__xfInstrumentedSend__).toBe(true);

    Object.defineProperty = originalDefineProperty;
  });
});
