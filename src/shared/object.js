export const deepGet = (value, ...keys) => {
  let current = value;
  for (const key of keys) {
    if (current == null) {
      return undefined;
    }
    current = current[key];
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
};

export const requireKey = (value, key) => {
  if (Object.prototype.hasOwnProperty.call(value, key)) {
    return value[key];
  }
  throw new Error(`${key} missing on ${JSON.stringify(value)}`);
};
