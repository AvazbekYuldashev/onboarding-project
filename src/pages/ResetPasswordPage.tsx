import { ArrowUpDown, RotateCcwKey, UserRoundSearch } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordRequestForm } from "@/components/auth/ResetPasswordRequestForm";
import { useI18n } from "@/features/i18n/messages";

export function ResetPasswordPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr("Request password reset", "Parolni tiklashni so'rash", "Запрос сброса пароля")}
      description={tr(
        "Start reset flow by sending username to backend reset-password endpoint.",
        "Reset oqimini username ni backend reset-password endpointiga yuborishdan boshlang.",
        "Начните flow сброса, отправив username в backend reset-password endpoint.",
      )}
      nextStep={tr("enter confirmation code", "tasdiqlash kodini kiriting", "введите код подтверждения")}
      points={[
        {
          icon: UserRoundSearch,
          title: tr("ResetPasswordDTO compatible", "ResetPasswordDTO mos", "Совместимо с ResetPasswordDTO"),
          description: tr(
            "Payload field is exactly: username.",
            "Payload maydoni aniq: username.",
            "Поле payload строго: username.",
          ),
        },
        {
          icon: RotateCcwKey,
          title: tr("Controller mapped", "Controller ulanishi tayyor", "Controller подключен"),
          description: tr(
            "Uses POST /api/v1/auth/reset-password with global header language.",
            "Global header tili bilan POST /api/v1/auth/reset-password dan foydalanadi.",
            "Использует POST /api/v1/auth/reset-password с глобальным языком в header.",
          ),
        },
        {
          icon: ArrowUpDown,
          title: tr("Flow continuity", "Flow davomiyligi", "Непрерывность flow"),
          description: tr(
            "Username is reused automatically in reset confirmation page.",
            "Username reset tasdiqlash sahifasida avtomatik qayta ishlatiladi.",
            "Username автоматически переиспользуется на странице подтверждения сброса.",
          ),
        },
      ]}
    >
      <ResetPasswordRequestForm />
    </AuthShell>
  );
}
