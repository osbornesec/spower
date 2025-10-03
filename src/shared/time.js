export const formatDuration = (seconds) => {
  if (seconds < 60) return String(seconds);

  const hoursFloat = seconds / 60 / 60;
  const wholeHours = Math.floor(hoursFloat);
  const minutesFloat = 60 * (hoursFloat - wholeHours);
  const wholeMinutes = Math.floor(minutesFloat);
  const secondsFloat = 60 * (minutesFloat - wholeMinutes);
  const wholeSeconds = Math.round(secondsFloat);

  let result;
  if (wholeHours > 0) {
    result = String(wholeHours);
    result += ':';
    result += String(wholeMinutes).padStart(2, '0');
  } else {
    result = String(wholeMinutes);
  }

  result += ':';
  result += String(wholeSeconds).padStart(2, '0');
  return result;
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
