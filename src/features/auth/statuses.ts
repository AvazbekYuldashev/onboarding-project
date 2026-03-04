import type { GeneralStatus } from "@/types/status";
import { getAppLanguage } from "@/features/auth/language";
import { tByLang } from "@/features/i18n/messages";

export const GENERAL_STATUSES: GeneralStatus[] = ["IN_REGISTRATION", "ACTIVE", "BLOCK"];

export const GENERAL_STATUS_LABELS: Record<GeneralStatus, string> = {
  IN_REGISTRATION: "In registration",
  ACTIVE: "Active",
  BLOCK: "Block",
};

export function isGeneralStatus(value: string): value is GeneralStatus {
  return GENERAL_STATUSES.includes(value as GeneralStatus);
}

export function resolveGeneralStatus(value?: string): GeneralStatus | undefined {
  if (!value) {
    return undefined;
  }

  return isGeneralStatus(value) ? value : undefined;
}

export function getGeneralStatusLabel(status: GeneralStatus): string {
  const language = getAppLanguage();
  if (status === "IN_REGISTRATION") return tByLang("inRegistration", language);
  if (status === "ACTIVE") return tByLang("active", language);
  return tByLang("block", language);
}
