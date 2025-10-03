export const getStoredConfigValues = (keys) =>
  new Promise((resolve) => {
    chrome.storage.sync.get(keys, (syncValues) => {
      chrome.storage.local.get(keys, (localValues) => {
        resolve({ ...syncValues, ...localValues });
      });
    });
  });

export const mergeWithStoredConfig = async (defaults) => {
  const keys = Object.keys(defaults);
  const overrides = await getStoredConfigValues(keys);
  return { ...defaults, ...overrides };
};
