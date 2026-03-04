import { NavLink, Outlet } from "react-router-dom";
import { LanguageToggle } from "@/components/theme/LanguageToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/cn";

const AUTH_NAV_LINKS = [
  { to: "/auth/register", label: "Register" },
  { to: "/auth/login", label: "Login" },
  { to: "/auth/verification/resend", label: "Resend Verify" },
  { to: "/auth/password/reset", label: "Reset Password" },
  { to: "/auth/password/confirm", label: "Confirm Reset" },
];

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-4 top-1/2 h-64 w-64 rounded-full bg-chart-2/15 blur-3xl" />
        <div className="bg-dot-pattern absolute inset-0 opacity-25" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="container flex flex-col gap-3 py-4 md:h-24 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Onboarding Platform
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              PulseBoard Auth
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Authentication navigation">
            {AUTH_NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="container py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
