import { RoleDashboardView } from "@/components/dashboard/RoleDashboardView";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

export function AdminDashboardPage() {
  const session = useAuthStore((state) => state.session)!;
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <RoleDashboardView
      role="ROLE_ADMIN"
      title={tr("Admin Overview Dashboard", "Admin umumiy dashboard", "Панель обзора администратора")}
      description={tr(
        "General access panel with account-level KPI summary and activity feed.",
        "Hisob darajasidagi KPI va faollik ko'rsatkichlari bilan umumiy panel.",
        "Общая панель с KPI на уровне аккаунта и лентой активности.",
      )}
      session={session}
      panels={[
        { title: tr("My Activity Score", "Mening faollik reytingim", "Мой рейтинг активности"), value: "72%", hint: tr("Engagement trend", "Faollik trendi", "Тренд активности") },
        { title: tr("Unread Notifications", "O'qilmagan bildirishnomalar", "Непрочитанные уведомления"), value: "5", hint: tr("Recent updates", "So'nggi yangilanishlar", "Последние обновления") },
        { title: tr("Profile Completion", "Profil to'liqligi", "Заполненность профиля"), value: "91%", hint: tr("Account readiness", "Hisob tayyorligi", "Готовность аккаунта") },
      ]}
    />
  );
}
