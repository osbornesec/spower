export const formatDuration = (seconds) => {
  const roundedSeconds = Math.round(seconds);
  if (roundedSeconds < 60) return String(roundedSeconds);

  const totalMinutes = Math.floor(roundedSeconds / 60);
  const wholeSeconds = roundedSeconds % 60;
  const wholeHours = Math.floor(totalMinutes / 60);
  const wholeMinutes = totalMinutes % 60;

  const prefix =
    wholeHours > 0
      ? `${wholeHours}:${String(wholeMinutes).padStart(2, '0')}`
      : String(wholeMinutes);

  return `${prefix}:${String(wholeSeconds).padStart(2, '0')}`;
};

export const formatDurationWithMillis = (milliseconds) => {
  const remainingMillis = milliseconds % 1_000;
  let formatted = formatDuration((milliseconds - remainingMillis) / 1_000);
  formatted += '.';
  formatted += String(remainingMillis).padStart(3, '0');
  return formatted;
};

const ONE_DAY_MILLIS = 24 * 60 * 60 * 1_000;

export const daysSince = (timestampMillis, now = Date.now()) =>
  (now - timestampMillis) / ONE_DAY_MILLIS;
