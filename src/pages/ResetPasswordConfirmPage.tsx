import { CheckCheck, KeySquare, ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordConfirmForm } from "@/components/auth/ResetPasswordConfirmForm";
import { useI18n } from "@/features/i18n/messages";

export function ResetPasswordConfirmPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr("Confirm password reset", "Parol tiklashni tasdiqlash", "Подтверждение сброса пароля")}
      description={tr(
        "Finalize reset flow with username, confirmation code, and new password.",
        "Reset oqimini username, tasdiqlash kodi va yangi parol bilan yakunlang.",
        "Завершите flow сброса с username, кодом подтверждения и новым паролем.",
      )}
      nextStep={tr("login with new password", "yangi parol bilan kirish", "войти с новым паролем")}
      points={[
        {
          icon: KeySquare,
          title: tr("ResetPasswordConfirmDTO compatible", "ResetPasswordConfirmDTO mos", "Совместимо с ResetPasswordConfirmDTO"),
          description: tr(
            "Payload fields: username, confirmCode, password.",
            "Payload maydonlari: username, confirmCode, password.",
            "Поля payload: username, confirmCode, password.",
          ),
        },
        {
          icon: CheckCheck,
          title: tr("Controller mapped", "Controller ulanishi tayyor", "Controller подключен"),
          description: tr(
            "Uses POST /api/v1/auth/reset-password-confirm endpoint.",
            "POST /api/v1/auth/reset-password-confirm endpointidan foydalanadi.",
            "Использует endpoint POST /api/v1/auth/reset-password-confirm.",
          ),
        },
        {
          icon: ShieldAlert,
          title: tr("Validation included", "Validatsiya kiritilgan", "Валидация включена"),
          description: tr(
            "Strong password and confirm match checks are handled client-side.",
            "Kuchli parol va tasdiq mosligi tekshiruvi client tomonda bajariladi.",
            "Проверки сильного пароля и совпадения подтверждения выполняются на клиенте.",
          ),
        },
      ]}
    >
      <ResetPasswordConfirmForm />
    </AuthShell>
  );
}
