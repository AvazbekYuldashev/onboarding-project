import { KeyRound, MailCheck, UserRoundPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useI18n } from "@/features/i18n/messages";

export function RegisterPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr(
        "Start with account registration",
        "Akkaunt ro'yxatdan o'tkazishdan boshlang",
        "Начните с регистрации аккаунта",
      )}
      description={tr(
        "Create a new account in a few quick steps.",
        "Yangi akkauntni bir necha qadamda yarating.",
        "Создайте новый аккаунт за несколько шагов.",
      )}
      nextStep={tr("code verification", "kodni tasdiqlash", "подтверждение кода")}
      points={[
        {
          icon: UserRoundPlus,
          title: tr("Basic details", "Asosiy ma'lumotlar", "Основные данные"),
          description: tr(
            "Tell us your name and choose a username.",
            "Ismingizni kiriting va username tanlang.",
            "Введите имя и выберите username.",
          ),
        },
        {
          icon: MailCheck,
          title: tr("Confirm your account", "Akkauntni tasdiqlang", "Подтвердите аккаунт"),
          description: tr(
            "After registration, enter the code we send you.",
            "Ro'yxatdan o'tgach, yuborilgan kodni kiriting.",
            "После регистрации введите присланный код.",
          ),
        },
        {
          icon: KeyRound,
          title: tr("Ready to log in", "Kirishga tayyor", "Готово ко входу"),
          description: tr(
            "Once verified, you can sign in.",
            "Tasdiqlangach, tizimga kirishingiz mumkin.",
            "После подтверждения можно войти.",
          ),
        },
      ]}
    >
      <RegisterForm />
    </AuthShell>
  );
}
