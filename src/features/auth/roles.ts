import type { ProfileRole } from "@/types/auth";
import { getAppLanguage } from "@/features/auth/language";
import { tByLang } from "@/features/i18n/messages";

export const PROFILE_ROLES: ProfileRole[] = [
  "ROLE_OWNER",
  "ROLE_ADMIN",
  "ROLE_MANAGER",
  "ROLE_EMPLOYEE",
  "ROLE_USER",
];

export const ROLE_DASHBOARD_PATHS: Record<ProfileRole, string> = {
  ROLE_OWNER: "/dashboard/owner",
  ROLE_ADMIN: "/dashboard/admin",
  ROLE_MANAGER: "/dashboard/manager",
  ROLE_EMPLOYEE: "/dashboard/employee",
  ROLE_USER: "/dashboard/user",
};

export const ROLE_LABELS: Record<ProfileRole, string> = {
  ROLE_OWNER: "Owner",
  ROLE_ADMIN: "Admin",
  ROLE_MANAGER: "Manager",
  ROLE_EMPLOYEE: "Employee",
  ROLE_USER: "User",
};

export function isProfileRole(value: string): value is ProfileRole {
  return PROFILE_ROLES.includes(value as ProfileRole);
}

export function resolveProfileRole(value?: string): ProfileRole {
  if (value) {
    const raw = value.trim().toUpperCase();
    if (isProfileRole(raw)) return raw;
    const withPrefix = raw.startsWith("ROLE_") ? raw : `ROLE_${raw}`;
    if (isProfileRole(withPrefix)) return withPrefix;
  }

  return "ROLE_USER";
}

export function getRoleDashboardPath(role?: string): string {
  return ROLE_DASHBOARD_PATHS[resolveProfileRole(role)];
}

export function getRoleLabel(role?: string): string {
  const resolved = resolveProfileRole(role);
  const language = getAppLanguage();
  if (resolved === "ROLE_OWNER") return tByLang("owner", language);
  if (resolved === "ROLE_ADMIN") return tByLang("admin", language);
  if (resolved === "ROLE_MANAGER") return tByLang("manager", language);
  if (resolved === "ROLE_EMPLOYEE") return tByLang("employee", language);
  return tByLang("user", language);
}
