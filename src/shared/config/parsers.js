const isBlank = (value) => typeof value === 'string' && value.trim().length === 0;

export const parseCsvList = (value) => {
  if (isBlank(value)) return undefined;
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const buildIntervalRange = (minSeconds, maxSeconds) => {
  let startMillis = 1_000 * Number.parseFloat(minSeconds);
  const endMillis = 1_000 * Number.parseFloat(maxSeconds);
  if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis)) {
    return [];
  }
  const values = [startMillis];

  while (startMillis < endMillis) {
    startMillis += 100;
    values.push(startMillis);
  }

  return values;
};

export const compileCsvRegex = (value) => {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const tokens = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (tokens.length === 0) return undefined;
  return new RegExp(tokens.join('|'), 'i');
};
