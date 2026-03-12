import { KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { useI18n } from "@/features/i18n/messages";

export function LoginPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr("Secure login", "Xavfsiz kirish", "Безопасный вход")}
      description={tr(
        "Sign in to access your dashboard and features.",
        "Dashboard va funksiyalarga kirish uchun tizimga kiring.",
        "Войдите, чтобы получить доступ к вашему кабинету и функциям.",
      )}
      nextStep={tr("open protected modules", "himoyalangan modullarni ochish", "открыть защищённые модули")}
      points={[
        {
          icon: UserCheck,
          title: tr("Quick access", "Tezkor kirish", "Быстрый доступ"),
          description: tr(
            "Use your username and password to sign in.",
            "Username va parol bilan kiring.",
            "Используйте username и пароль для входа.",
          ),
        },
        {
          icon: ShieldCheck,
          title: tr("Secure session", "Xavfsiz sessiya", "Безопасная сессия"),
          description: tr(
            "We keep you signed in while you use the app.",
            "Ilovadan foydalanganda sizni tizimda ushlab turamiz.",
            "Мы сохраняем вход, пока вы пользуетесь приложением.",
          ),
        },
        {
          icon: KeyRound,
          title: tr("Your language", "Sizning tilingiz", "Ваш язык"),
          description: tr(
            "Switch language anytime from the top bar.",
            "Tilni istalgan payt yuqori paneldan o'zgartiring.",
            "Меняйте язык в любой момент в верхней панели.",
          ),
        },
      ]}
    >
      <LoginForm />
    </AuthShell>
  );
}
