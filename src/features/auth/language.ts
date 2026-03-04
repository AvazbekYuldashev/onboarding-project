import { create } from "zustand";
import type { AppLanguage } from "@/types/auth";

const LANGUAGE_STORAGE_KEY = "pulseboard-language";

export const APP_LANGUAGES: AppLanguage[] = ["UZ", "RU", "EN"];

export function isAppLanguage(value: string): value is AppLanguage {
  return APP_LANGUAGES.includes(value as AppLanguage);
}

function resolveNavigatorLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return "UZ";
  }

  const raw = navigator.language.split("-")[0]?.toUpperCase() ?? "UZ";
  return isAppLanguage(raw) ? raw : "UZ";
}

function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return "UZ";
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)?.toUpperCase() ?? "";
  if (isAppLanguage(stored)) {
    return stored;
  }

  return resolveNavigatorLanguage();
}

function writeStoredLanguage(language: AppLanguage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

interface LanguageStore {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  cycleLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: readStoredLanguage(),
  setLanguage: (language) => {
    writeStoredLanguage(language);
    set({ language });
  },
  cycleLanguage: () => {
    const current = get().language;
    const currentIndex = APP_LANGUAGES.indexOf(current);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % APP_LANGUAGES.length;
    const nextLanguage = APP_LANGUAGES[nextIndex];

    writeStoredLanguage(nextLanguage);
    set({ language: nextLanguage });
  },
}));

export function getAppLanguage(): AppLanguage {
  return useLanguageStore.getState().language;
}
