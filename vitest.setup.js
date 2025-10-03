import '@testing-library/jest-dom';

// Basic chrome API stub so extension modules can run in tests
if (!global.chrome) {
  global.chrome = {
    storage: {
      sync: {
        get: (_keys, callback) => callback({}),
        set: (_items, callback) => callback && callback(),
        remove: (_keys, callback) => callback && callback(),
      },
      local: {
        get: (_keys, callback) => callback({}),
        set: (_items, callback) => callback && callback(),
        remove: (_keys, callback) => callback && callback(),
      },
    },
    runtime: {
      lastError: null,
    },
  };
}

// Provide a minimal crypto stub for uuid creation code paths
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (typedArray) => {
      for (let i = 0; i < typedArray.length; i += 1) {
        typedArray[i] = Math.floor(Math.random() * 256);
      }
      return typedArray;
    },
  };
}

if (!global.localStorage) {
  const store = new Map();
  global.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}
