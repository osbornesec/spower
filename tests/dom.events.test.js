import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('options.js delegated events', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();

    document.body.innerHTML = `
      <table><tbody id="actions"></tbody></table>
      <button id="add_action"></button>
    `;

    const originalQuerySelector = document.querySelector.bind(document);
    const labelCache = new Map();
    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      const match = typeof selector === 'string' && selector.match(/^label\[for=['"](.+)['"]\]$/);
      if (match) {
        const id = match[1];
        if (!labelCache.has(id)) {
          const label = document.createElement('label');
          label.setAttribute('for', id);
          labelCache.set(id, label);
          document.body.appendChild(label);
        }
        return labelCache.get(id);
      }
      return originalQuerySelector(selector);
    });

    chrome.storage.sync.set = vi.fn((_items, callback) => {
      callback && callback();
    });
    chrome.storage.local.set = vi.fn((_items, callback) => {
      callback && callback();
    });

    global.__XF_TEST_HARNESS__ = (exports) => {
      global.__XF_TEST_EXPORTS__ = exports;
    };
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    delete global.__XF_TEST_HARNESS__;
    delete global.__XF_TEST_EXPORTS__;
  });

  const bootstrapOptions = async () => {
    await import('../options.js');
    const harness = global.__XF_TEST_EXPORTS__;
    expect(harness).toBeTruthy();
    await harness.boot();
    vi.runAllTimers();
    await Promise.resolve();
  };

  it('persists debounced autopilot updates through delegated input handlers', async () => {
    await bootstrapOptions();

    const limitInput = document.querySelector('input[id$="_limit"]');
    expect(limitInput).toBeTruthy();

    limitInput.value = '42';
    limitInput.dispatchEvent(new Event('input', { bubbles: true }));

    vi.advanceTimersByTime(200);
    await Promise.resolve();

    expect(chrome.storage.sync.set).toHaveBeenCalled();
    const [payload] = chrome.storage.sync.set.mock.calls.pop();
    expect(payload).toHaveProperty('autopilotActions');
  });

  it('removes action rows via delegated click handler', async () => {
    await bootstrapOptions();

    const initialRows = document.querySelectorAll('#actions .action');
    expect(initialRows.length).toBeGreaterThan(0);

    const removeButton = document.querySelector('button.button--remove');
    expect(removeButton).toBeTruthy();

    removeButton.dispatchEvent(new Event('click', { bubbles: true }));
    vi.runAllTimers();
    await Promise.resolve();
    await Promise.resolve();

    const remainingRows = document.querySelectorAll('#actions .action');
    expect(remainingRows.length).toBe(initialRows.length - 1);
    expect(chrome.storage.sync.set).toHaveBeenCalled();
  });
});
