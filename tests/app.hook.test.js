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
    XMLHttpRequest.prototype.open = originalOpen;

    expect(XMLHttpRequest.prototype.open).toBe(originalOpen);

    vi.advanceTimersByTime(150);

    expect(XMLHttpRequest.prototype.open).not.toBe(originalOpen);

    const request = new XMLHttpRequest();
    request.open('GET', '/resource');

    expect(request.origin).toBe(window.location.href.toUpperCase());
    expect(request.url).toBe('/resource');
  });
});
