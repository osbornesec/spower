const SUSPENDED_KEY = 'SuperpowersForTwitterSuspendedAutopilotActionTypes';

export const getSuspendedAutopilotActions = (storage = globalThis.sessionStorage) => {
  const raw = storage.getItem(SUSPENDED_KEY);
  if (typeof raw !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const appendSuspendedAutopilotAction = (actionType, storage = globalThis.sessionStorage) => {
  const current = getSuspendedAutopilotActions(storage);
  const next = current.concat(actionType);
  try {
    storage.setItem(SUSPENDED_KEY, JSON.stringify(next));
  } catch {}
};

export const SUSPENDED_AUTOPILOT_KEY = SUSPENDED_KEY;
