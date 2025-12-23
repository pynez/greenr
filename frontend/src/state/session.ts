import type { CalculateRequest, CalculateResponse, Mode } from "../api/greenr";

const KEY = "greenr_session_v2";

export type Snapshot = {
  id: string;
  label: string;
  createdAt: string; // ISO
  request: CalculateRequest;
  response: CalculateResponse;

  note?: string;
  tags?: string[];
};
export type SessionState = {
  mode: Mode | null;
  requestDraft: CalculateRequest;
  lastResult: CalculateResponse | null;

  snapshots: Snapshot[];
  baselineId: string | null;
  scenarioId: string | null;
};

const defaultState: SessionState = {
  mode: null,
  requestDraft: { mode: "quick", household_size: 1 },
  lastResult: null,

  snapshots: [],
  baselineId: null,
  scenarioId: null,
};

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<SessionState>;

    return {
      ...defaultState,
      ...parsed,
      requestDraft: { ...defaultState.requestDraft, ...(parsed.requestDraft ?? {}) },
      snapshots: parsed.snapshots ?? [],
      baselineId: parsed.baselineId ?? null,
      scenarioId: parsed.scenarioId ?? null,
    };
  } catch {
    return defaultState;
  }
}

export function saveSession(state: SessionState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
}

export function createSnapshot(label: string, request: CalculateRequest, response: CalculateResponse): Snapshot {
  return {
    id: newId(),
    label,
    createdAt: new Date().toISOString(),
    request,
    response,
  };
}

export function upsertSnapshot(state: SessionState, snap: Snapshot): SessionState {
  const idx = state.snapshots.findIndex((s) => s.id === snap.id);
  const snapshots =
    idx >= 0
      ? state.snapshots.map((s) => (s.id === snap.id ? snap : s))
      : [snap, ...state.snapshots];
  return { ...state, snapshots };
}

export function getSnapshot(state: SessionState, id: string | null): Snapshot | null {
  if (!id) return null;
  return state.snapshots.find((s) => s.id === id) ?? null;
}

export function updateSnapshotMeta(state: SessionState, id: string, patch: Partial<Pick<Snapshot, "label" | "note" | "tags">>): SessionState {
  const snapshots = state.snapshots.map((s) => (s.id === id ? { ...s, ...patch } : s));
  return { ...state, snapshots };
}

export function deleteSnapshot(state: SessionState, id: string): SessionState {
  const snapshots = state.snapshots.filter((s) => s.id !== id);
  const baselineId = state.baselineId === id ? null : state.baselineId;
  const scenarioId = state.scenarioId === id ? null : state.scenarioId;
  return { ...state, snapshots, baselineId, scenarioId };
}