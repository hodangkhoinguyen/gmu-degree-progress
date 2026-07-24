const KEY = "gmu-degree-progress:state";

const DEFAULT_STATE = {
  transcript: null,
  selectedProgramId: null,
  selectedConcentrationKey: null,
};

export function getState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function updateState(partial) {
  const next = { ...getState(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearState() {
  localStorage.removeItem(KEY);
}
