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
      title={tr(
        "Confirm password reset",
        "Parol tiklashni tasdiqlash",
        "Подтверждение сброса пароля",
      )}
      description={tr(
        "Enter the code and set a new password.",
        "Kod va yangi parolni kiriting.",
        "Введите код и задайте новый пароль.",
      )}
      nextStep={tr(
        "login with new password",
        "yangi parol bilan kirish",
        "войти с новым паролем",
      )}
      points={[
        {
          icon: KeySquare,
          title: tr("Use your code", "Kodni kiriting", "Введите код"),
          description: tr(
            "Enter the confirmation code you received.",
            "Olingan tasdiqlash kodini kiriting.",
            "Введите полученный код подтверждения.",
          ),
        },
        {
          icon: CheckCheck,
          title: tr("Set a new password", "Yangi parol o'rnating", "Задайте новый пароль"),
          description: tr(
            "Choose a strong password you can remember.",
            "Eslab qolish oson, kuchli parol tanlang.",
            "Выберите надёжный пароль, который запомните.",
          ),
        },
        {
          icon: ShieldAlert,
          title: tr("Stay protected", "Xavfsiz qoling", "Будьте в безопасности"),
          description: tr(
            "Keep your password private and secure.",
            "Parolingizni hech kimga bermang.",
            "Не сообщайте пароль другим.",
          ),
        },
      ]}
    >
      <ResetPasswordConfirmForm />
    </AuthShell>
  );
}
