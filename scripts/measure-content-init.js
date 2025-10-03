#!/usr/bin/env node

const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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
  script.innerHTML = 'window.__INITIAL_STATE__={"session":{"user_id":"1","user":{"screen_name":"tester","id_str":"1"}},"entities":{"users":{"entities":{"1":{"legacy":{"description":"","followers_count":0,"friends_count":0,"protected":false,"screen_name":"tester"},"core":{"user_id":"1"},"relationship_perspectives":{"followed_by":0},"affiliates_highlight":{"label":{"badge":{"description":""}}}}}}}};window.__META_DATA__={};';
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
  window.localStorage.setItem('spw_dev', '1');
  window.requestIdleCallback = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 16 }), 1));
  window.cancelIdleCallback = window.cancelIdleCallback || ((id) => clearTimeout(id));
  window.requestAnimationFrame = window.requestAnimationFrame || ((fn) => setTimeout(fn, 16));
  const extensionOrigin = 'chrome-extension://spower-perf-harness';
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
    const id = originalWindowSetTimeout(...args);
    trackedTimeouts.push(id);
    return id;
  };

  window.setInterval = (...args) => {
    const id = originalWindowSetInterval(...args);
    trackedIntervals.push(id);
    return id;
  };

  global.setTimeout = (...args) => {
    const id = realSetTimeout(...args);
    trackedTimeouts.push(id);
    return id;
  };

  global.setInterval = (...args) => {
    const id = realSetInterval(...args);
    trackedIntervals.push(id);
    return id;
  };

  const context = vm.createContext(window);
  const start = performance.now();

  try {
    vm.runInContext(source, context, { filename: absolutePath });
  } catch (error) {
    console.error('Execution error:', error.message);
  }

  await new Promise((resolve) => realSetTimeout(resolve, 20));

  const end = performance.now();
  trackedIntervals.forEach((id) => clearInterval(id));
  trackedTimeouts.forEach((id) => clearTimeout(id));

  global.setTimeout = realSetTimeout;
  global.setInterval = realSetInterval;

  dom.window.close();

  return end - start;
};

const run = async () => {
  for (let i = 0; i < runs; i += 1) {
    const duration = await measureOnce();
    results.push(duration);
  }

  results.sort((a, b) => a - b);
  const median = results[Math.floor(results.length / 2)];
  const average = results.reduce((sum, value) => sum + value, 0) / results.length;

  console.log(`Measured ${runs} runs for ${filePath}`);
  console.log(`Durations (ms): ${results.map((v) => v.toFixed(2)).join(', ')}`);
  console.log(`Average: ${average.toFixed(2)}ms`);
  console.log(`Median: ${median.toFixed(2)}ms`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
