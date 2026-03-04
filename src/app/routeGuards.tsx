import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboardPath, resolveProfileRole } from "@/features/auth/roles";
import type { ProfileRole } from "@/types/auth";

interface GuardProps {
  children: ReactElement;
}

interface RoleGuardProps extends GuardProps {
  allowed: ProfileRole[];
}

export function RequireAuth({ children }: GuardProps) {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

export function RequireRole({ children, allowed }: RoleGuardProps) {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  const role = resolveProfileRole(session.role);
  if (!allowed.includes(role)) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }

  return children;
}

export function GuestOnly({ children }: GuardProps) {
  const session = useAuthStore((state) => state.session);

  if (session) {
    return <Navigate to={getRoleDashboardPath(session.role)} replace />;
  }

  return children;
}

export function RootRedirect() {
  const session = useAuthStore((state) => state.session);
  return <Navigate to={session ? getRoleDashboardPath(session.role) : "/auth/login"} replace />;
}

export function DashboardHomeRedirect() {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Navigate to={getRoleDashboardPath(session.role)} replace />;
}
