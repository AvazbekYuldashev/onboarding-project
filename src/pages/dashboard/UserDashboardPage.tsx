import { useAuthStore } from "@/features/auth/authStore";
import { RoleDashboardView } from "@/components/dashboard/RoleDashboardView";

export function UserDashboardPage() {
  const session = useAuthStore((state) => state.session)!;

  return (
    <RoleDashboardView
      role="ROLE_USER"
      title="User Overview Dashboard"
      description="General access panel with account-level KPI summary and activity feed."
      session={session}
      panels={[
        { title: "My Activity Score", value: "72%", hint: "Engagement trend" },
        { title: "Unread Notifications", value: "5", hint: "Recent updates" },
        { title: "Profile Completion", value: "91%", hint: "Account readiness" },
      ]}
    />
  );
}
