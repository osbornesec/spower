#!/usr/bin/env node

const { readFileSync } = require('node:fs');
const path = require('node:path');
const vmModule = require('node:vm');
const { performance } = require('node:perf_hooks');
const { JSDOM } = require('jsdom');

const [, , filePath, runCountArg] = process.argv;

if (!filePath) {
  console.error('Usage: node scripts/measure-content-init.js <content.js path> [runs=5]');
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), filePath);
const source = readFileSync(absolutePath, 'utf8');
const runs = Number.parseInt(runCountArg ?? '5', 10);

const createInitialStateScript = (window) => {
  const script = window.document.createElement('script');
  script.innerHTML =
    'window.__INITIAL_STATE__={"session":{"user_id":"1","user":{"screen_name":"tester","id_str":"1"}},"entities":{"users":{"entities":{"1":{"legacy":{"description":"","followers_count":0,"friends_count":0,"protected":false,"screen_name":"tester"},"core":{"user_id":"1"},"relationship_perspectives":{"followed_by":0},"affiliates_highlight":{"label":{"badge":{"description":""}}}}}}}};window.__META_DATA__={};';
  window.document.body.appendChild(script);
  return script;
};

const results = [];

const measureOnce = async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://x.com/home',
    pretendToBeVisual: true,
  });

  const { window } = dom;

  window.performance = performance;
  window.console = console;
  window.localStorage.setItem('xf_dev', '1');
  window.requestIdleCallback =
    window.requestIdleCallback ||
    ((callback) => setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 16 }), 1));
  window.cancelIdleCallback = window.cancelIdleCallback || ((timeoutId) => clearTimeout(timeoutId));
  window.requestAnimationFrame =
    window.requestAnimationFrame || ((callback) => setTimeout(callback, 16));
  const extensionOrigin = 'chrome-extension://xflow-perf-harness';
  window.chrome = {
    runtime: {
      getURL: (resourcePath = '') => new URL(resourcePath, `${extensionOrigin}/`).toString(),
    },
  };

  window.XMLHttpRequest = function XMLHttpRequest() {};
  window.XMLHttpRequest.prototype = {
    open: () => {},
    send: () => {},
    addEventListener: () => {},
  };

  const stateScript = createInitialStateScript(window);
  const originalQuerySelectorAll = window.document.querySelectorAll.bind(window.document);
  window.document.querySelectorAll = (selector) => {
    if (selector === 'script') {
      return [stateScript];
    }
    return originalQuerySelectorAll(selector);
  };

  const trackedTimeouts = [];
  const trackedIntervals = [];
  const realSetTimeout = global.setTimeout;
  const realSetInterval = global.setInterval;
  const originalWindowSetTimeout = window.setTimeout.bind(window);
  const originalWindowSetInterval = window.setInterval.bind(window);

  window.setTimeout = (...args) => {
    const timeoutIdentifier = originalWindowSetTimeout(...args);
    trackedTimeouts.push(timeoutIdentifier);
    return timeoutIdentifier;
  };

  window.setInterval = (...args) => {
    const intervalIdentifier = originalWindowSetInterval(...args);
    trackedIntervals.push(intervalIdentifier);
    return intervalIdentifier;
  };

  global.setTimeout = (...args) => {
    const timeoutIdentifier = realSetTimeout(...args);
    trackedTimeouts.push(timeoutIdentifier);
    return timeoutIdentifier;
  };

  global.setInterval = (...args) => {
    const intervalIdentifier = realSetInterval(...args);
    trackedIntervals.push(intervalIdentifier);
    return intervalIdentifier;
  };

  const context = vmModule.createContext(window);
  const start = performance.now();

  try {
    vmModule.runInContext(source, context, { filename: absolutePath });
  } catch (error) {
    console.error('Execution error:', error.message);
  }

  await new Promise((resolve) => {
    realSetTimeout(resolve, 20);
  });

  const end = performance.now();
  trackedIntervals.forEach((intervalIdentifier) => clearInterval(intervalIdentifier));
  trackedTimeouts.forEach((timeoutIdentifier) => clearTimeout(timeoutIdentifier));

  global.setTimeout = realSetTimeout;
  global.setInterval = realSetInterval;

  dom.window.close();

  return end - start;
};

const run = async () => {
  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    const duration = await measureOnce();
    results.push(duration);
  }

  results.sort((firstDuration, secondDuration) => firstDuration - secondDuration);
  const median = results[Math.floor(results.length / 2)];
  const average = results.reduce((sum, durationValue) => sum + durationValue, 0) / results.length;

  console.log(`Measured ${runs} runs for ${filePath}`);
  console.log(
    `Durations (ms): ${results.map((durationValue) => durationValue.toFixed(2)).join(', ')}`,
  );
  console.log(`Average: ${average.toFixed(2)}ms`);
  console.log(`Median: ${median.toFixed(2)}ms`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
