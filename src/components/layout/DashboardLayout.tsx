import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building, Building2, FileText, Home, LogOut, Package, Tags, UserRound, Users } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/api/client";
import { getMyProfile } from "@/api/profileApi";
import { LanguageToggle } from "@/components/theme/LanguageToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboardPath, getRoleLabel, resolveProfileRole } from "@/features/auth/roles";
import { useI18n } from "@/features/i18n/messages";
import { cn } from "@/lib/cn";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const rolePath = getRoleDashboardPath(session?.role);
  const roleLabel = getRoleLabel(session?.role);
  const role = resolveProfileRole(session?.role);
  const isOwner = role === "ROLE_OWNER";
  const isAdmin = role === "ROLE_ADMIN";
  const isManager = role === "ROLE_MANAGER";
  const usersPath = isOwner ? "/dashboard/owner/users" : isManager ? "/dashboard/manager/users" : "";
  const managerDepartmentPath = isManager ? "/dashboard/manager/my-department" : "";
  const adminDepartmentPath = isAdmin ? "/dashboard/admin/my-department" : "";
  const employeeDepartmentPath = role === "ROLE_EMPLOYEE" ? "/dashboard/employee/my-department" : "";
  const departmentsPath = isOwner ? "/dashboard/owner/departments" : "";
  const buildingsPath = isOwner
    ? "/dashboard/owner/buildings"
    : isAdmin
      ? "/dashboard/admin/building"
      : isManager
        ? "/dashboard/manager/buildings"
        : role === "ROLE_EMPLOYEE"
          ? "/dashboard/employee/building"
        : "";
  const categoriesPath = isOwner
    ? "/dashboard/owner/categories"
    : isAdmin
      ? "/dashboard/admin/categories"
    : isManager
      ? "/dashboard/manager/categories"
      : role === "ROLE_EMPLOYEE"
        ? "/dashboard/employee/categories"
      : "";
  const kpiPath = isOwner
    ? "/dashboard/owner/kpi"
    : isAdmin
      ? "/dashboard/admin/kpi"
    : isManager
      ? "/dashboard/manager/kpi"
      : role === "ROLE_EMPLOYEE"
        ? "/dashboard/employee/kpi"
      : "";
  const offeringsPath = isOwner ? "/dashboard/owner/offerings" : isAdmin ? "/dashboard/admin/offerings" : role === "ROLE_EMPLOYEE" ? "/dashboard/employee/offerings" : "";
  const managerOfferingsPath = isManager ? "/dashboard/manager/offerings" : "";
  const userOfferingsPath = role === "ROLE_USER" ? "/dashboard/user/offerings" : "";
  const applicationsPath = isOwner ? "/dashboard/owner/applications" : isAdmin ? "/dashboard/admin/applications" : role === "ROLE_EMPLOYEE" ? "/dashboard/employee/applications" : "";
  const managerApplicationsPath = isManager ? "/dashboard/manager/applications" : "";
  const userApplicationsPath = role === "ROLE_USER" ? "/dashboard/user/applications" : "";
  const isAccountRoute = location.pathname === "/dashboard/account";
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const title = isAccountRoute ? `PulseBoard ${t("accountSettings")}` : `PulseBoard ${roleLabel} ${t("dashboard")}`;
  const homeLabel = isAccountRoute ? t("dashboard") : `${roleLabel} ${t("home")}`;
  const profileQuery = useQuery({
    queryKey: ["profile", "me", "header-avatar"],
    queryFn: getMyProfile,
    staleTime: 60_000,
    enabled: Boolean(session),
  });
  const photo = profileQuery.data?.photo;
  const profilePhotoSrc = (() => {
    const url = photo?.url?.trim();
    if (url) {
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return `${API_BASE_URL.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
    }
    if (photo?.originName) {
      return `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/attach/open/${encodeURIComponent(photo.originName)}`;
    }
    if (photo?.id) {
      return `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/attach/open/${encodeURIComponent(photo.id)}`;
    }
    return null;
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="container flex flex-col gap-3 py-4 md:h-20 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("kpiPlatform")}
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {title}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <ThemeToggle />
            <LanguageToggle />
            <NavLink
              to="/dashboard/account"
              className={({ isActive }) =>
                cn(
                  "inline-flex size-9 items-center justify-center overflow-hidden rounded-full border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/80 bg-card hover:bg-muted/70",
                )
              }
              aria-label="Open account settings"
              title="Account settings"
            >
              {profilePhotoSrc ? (
                <img src={profilePhotoSrc} alt={session?.username ?? "Profile"} className="size-full object-cover" />
              ) : (
                <UserRound className="size-4 text-muted-foreground" aria-hidden />
              )}
            </NavLink>
          </div>
        </div>
      </header>

      <div className="container grid gap-6 py-6 md:grid-cols-[260px_minmax(0,1fr)] md:py-8">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-border/80 bg-card/95 p-3 shadow-sm backdrop-blur">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("sidebar")}
            </p>
            <nav className="space-y-1" aria-label="Dashboard sidebar navigation">
              <NavLink
                to={rolePath}
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )
                }
              >
                <Home className="size-4" aria-hidden />
                {homeLabel}
              </NavLink>
              {usersPath ? (
                <NavLink
                  to={usersPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <Users className="size-4" aria-hidden />
                  {t("users")}
                </NavLink>
              ) : null}
              {managerDepartmentPath || adminDepartmentPath || employeeDepartmentPath ? (
                <NavLink
                  to={managerDepartmentPath || adminDepartmentPath || employeeDepartmentPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <Building2 className="size-4" aria-hidden />
                  {t("myDepartment")}
                </NavLink>
              ) : null}
              {departmentsPath ? (
                <NavLink
                  to={departmentsPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <Building2 className="size-4" aria-hidden />
                  {t("departments")}
                </NavLink>
              ) : null}
              {buildingsPath ? (
                <NavLink
                  to={buildingsPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <Building className="size-4" aria-hidden />
                  {isAdmin ? tr("Building", "Bino", "Здание") : t("buildings")}
                </NavLink>
              ) : null}
              {categoriesPath ? (
                <NavLink
                  to={categoriesPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <Tags className="size-4" aria-hidden />
                  {t("categories")}
                </NavLink>
              ) : null}
              {kpiPath ? (
                <NavLink
                  to={kpiPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <BarChart3 className="size-4" aria-hidden />
                  {t("kpi")}
                </NavLink>
              ) : null}
              {offeringsPath || managerOfferingsPath || userOfferingsPath ? (
                <NavLink
                  to={offeringsPath || managerOfferingsPath || userOfferingsPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <Package className="size-4" aria-hidden />
                  {t("offerings")}
                </NavLink>
              ) : null}
              {applicationsPath || managerApplicationsPath || userApplicationsPath ? (
                <NavLink
                  to={applicationsPath || managerApplicationsPath || userApplicationsPath}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <FileText className="size-4" aria-hidden />
                  {t("applications")}
                </NavLink>
              ) : null}
            </nav>
            <div className="mt-3 border-t border-border/80 pt-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  clearSession();
                  navigate("/auth/login", { replace: true });
                }}
              >
                <LogOut className="size-4" aria-hidden />
                {t("logout")}
              </Button>
            </div>
          </div>
        </aside>

        <main id="main-content" className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

