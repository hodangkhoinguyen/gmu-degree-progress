import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { getState, updateState } from "../lib/stateStore.js";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, setState] = useState(getState);

  const patch = useCallback((partial) => {
    setState(updateState(partial));
  }, []);

  const setTranscript = useCallback((transcript) => patch({ transcript }), [patch]);
  const setSelectedProgramId = useCallback(
    (selectedProgramId) => patch({ selectedProgramId, selectedConcentrationKey: null }),
    [patch]
  );
  const setSelectedConcentrationKey = useCallback(
    (selectedConcentrationKey) => patch({ selectedConcentrationKey }),
    [patch]
  );

  const value = useMemo(
    () => ({ ...state, setTranscript, setSelectedProgramId, setSelectedConcentrationKey }),
    [state, setTranscript, setSelectedProgramId, setSelectedConcentrationKey]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
