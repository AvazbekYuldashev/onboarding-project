import { create } from "zustand";
import { resolveProfileRole } from "@/features/auth/roles";
import type { AuthSession } from "@/types/auth";

const SESSION_STORAGE_KEY = "pulseboard-session";
const PENDING_REGISTRATION_STORAGE_KEY = "pulseboard-pending-registration";

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!parsed.id || !parsed.username) {
      return null;
    }

    return {
      id: parsed.id,
      username: parsed.username,
      departmentId: parsed.departmentId,
      buildingId: parsed.buildingId,
      role: resolveProfileRole(parsed.role),
      jwt: parsed.jwt,
      isEmployee: parsed.isEmployee,
    };
  } catch {
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function readPendingRegistrationUsername(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(PENDING_REGISTRATION_STORAGE_KEY);
  return value?.trim() ? value : null;
}

function writePendingRegistrationUsername(username: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!username) {
    window.localStorage.removeItem(PENDING_REGISTRATION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(PENDING_REGISTRATION_STORAGE_KEY, username);
}

interface AuthStore {
  session: AuthSession | null;
  pendingRegistrationUsername: string | null;
  setSession: (session: AuthSession) => void;
  patchSession: (updates: Partial<AuthSession>) => void;
  clearSession: () => void;
  setPendingRegistrationUsername: (username: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: readStoredSession(),
  pendingRegistrationUsername: readPendingRegistrationUsername(),
  setSession: (session) => {
    writeStoredSession(session);
    set({ session });
  },
  patchSession: (updates) =>
    set((state) => {
      if (!state.session) {
        return state;
      }

      const nextSession: AuthSession = {
        ...state.session,
        ...updates,
        role: resolveProfileRole(updates.role ?? state.session.role),
      };
      writeStoredSession(nextSession);
      return { session: nextSession };
    }),
  clearSession: () => {
    writeStoredSession(null);
    set({ session: null });
  },
  setPendingRegistrationUsername: (username) => {
    writePendingRegistrationUsername(username);
    set({ pendingRegistrationUsername: username });
  },
}));
