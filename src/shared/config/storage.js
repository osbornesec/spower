const getFromStorageArea = (area, keys) => {
  const storageArea = chrome?.storage?.[area];
  if (!storageArea) {
    return Promise.resolve({});
  }

  return new Promise((resolve, reject) => {
    storageArea.get(keys, (values) => {
      const lastError = chrome?.runtime?.lastError;
      if (lastError) {
        reject(lastError);
        return;
      }
      resolve(values);
    });
  });
};

export const getStoredConfigValues = async (keys) => {
  const [syncValues, localValues] = await Promise.all([
    getFromStorageArea('sync', keys),
    getFromStorageArea('local', keys),
  ]);
  return { ...syncValues, ...localValues };
};

export const mergeWithStoredConfig = async (defaults) => {
  const keys = Object.keys(defaults);
  const overrides = await getStoredConfigValues(keys);
  return { ...defaults, ...overrides };
};
