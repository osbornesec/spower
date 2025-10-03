const SUSPENDED_KEY = 'XFlowSuspendedAutopilotActionTypes';
const LEGACY_SUSPENDED_KEY = 'SuperpowersForTwitterSuspendedAutopilotActionTypes';

export const getSuspendedAutopilotActions = (storage = globalThis.sessionStorage) => {
  const raw = storage.getItem(SUSPENDED_KEY);
  const legacyRaw =
    typeof raw === 'string' ? null : storage.getItem(LEGACY_SUSPENDED_KEY);

  if (typeof raw !== 'string' && typeof legacyRaw !== 'string') {
    return [];
  }
  try {
    const serialized = typeof raw === 'string' ? raw : legacyRaw;
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return [];
    }

    if (typeof raw !== 'string') {
      try {
        storage.setItem(SUSPENDED_KEY, serialized);
        storage.removeItem(LEGACY_SUSPENDED_KEY);
      } catch {}
    }

    return parsed;
  } catch {
    return [];
  }
};

export const appendSuspendedAutopilotAction = (actionType, storage = globalThis.sessionStorage) => {
  const current = getSuspendedAutopilotActions(storage);
  const next = current.concat(actionType);
  try {
    storage.setItem(SUSPENDED_KEY, JSON.stringify(next));
    storage.removeItem(LEGACY_SUSPENDED_KEY);
  } catch {}
};

export const SUSPENDED_AUTOPILOT_KEY = SUSPENDED_KEY;
