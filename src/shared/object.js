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
  const description =
    typeof value === 'object' && value !== null
      ? `[object ${value.constructor?.name || 'Object'}]`
      : String(value);
  throw new Error(`${key} missing on ${description}`);
};
