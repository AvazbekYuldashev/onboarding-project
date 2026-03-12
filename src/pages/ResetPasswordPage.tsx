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
        "Enter your username to receive a reset code.",
        "Reset kodini olish uchun username ni kiriting.",
        "Введите username, чтобы получить код сброса.",
      )}
      nextStep={tr(
        "enter confirmation code",
        "tasdiqlash kodini kiriting",
        "введите код подтверждения",
      )}
      points={[
        {
          icon: UserRoundSearch,
          title: tr("Find your account", "Akkauntni topish", "Найдите аккаунт"),
          description: tr(
            "Use the same username you registered with.",
            "Ro'yxatdan o'tgan username bilan kiriting.",
            "Введите username, который использовали при регистрации.",
          ),
        },
        {
          icon: RotateCcwKey,
          title: tr("Get reset code", "Reset kodi oling", "Получите код"),
          description: tr(
            "We will send a code to help you reset your password.",
            "Parolni tiklash uchun kod yuboramiz.",
            "Мы отправим код для сброса пароля.",
          ),
        },
        {
          icon: ArrowUpDown,
          title: tr("Continue to next step", "Keyingi bosqich", "Следующий шаг"),
          description: tr(
            "Use the code on the confirmation page.",
            "Kodni tasdiqlash sahifasida ishlating.",
            "Используйте код на странице подтверждения.",
          ),
        },
      ]}
    >
      <ResetPasswordRequestForm />
    </AuthShell>
  );
}
